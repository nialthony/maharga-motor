// Supabase Edge Function: verify-pin
// Melakukan verifikasi faktor kedua (4-digit PIN) di sisi server dengan bcrypt
// Dilengkapi Rate Limiting: Lockout 15 menit setelah 5 kali gagal

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verifikasi User Token JWT
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const action = body.action;
    const pin = body.factor_code || body.pin || body.code;
    const targetUserId = (body.target_user_id && (user.app_metadata?.role === 'owner' || user.user_metadata?.role === 'owner')) 
      ? body.target_user_id 
      : user.id;

    // 2. Baca Record Faktor PIN dari Tabel employee_pin_factors
    const { data: factor, error: factorError } = await supabaseClient
      .from("employee_pin_factors")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    // 3. Aksi: SET / UPDATE PIN (Diperkenankan untuk user saat setup awal)
    if (action === "set_pin") {
      if (!pin || pin.length < 4 || pin.length > 6) {
        return new Response(
          JSON.stringify({ error: "PIN harus berupa 4-6 digit angka" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const salt = await bcrypt.genSalt(10);
      const pinHash = await bcrypt.hash(pin, salt);

      const { error: upsertErr } = await supabaseClient
        .from("employee_pin_factors")
        .upsert({
          user_id: user.id,
          pin_hash: pinHash,
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        });

      if (upsertErr) throw upsertErr;

      return new Response(
        JSON.stringify({ success: true, message: "PIN faktor kedua berhasil diperbarui" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Aksi: VERIFY PIN
    if (!factor) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          hasPinConfigured: false, 
          error: "PIN keamanan belum dikonfigurasi untuk akun ini. Hubungi administrator untuk mengatur PIN." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();

    // Periksa status Lockout
    if (factor.locked_until && new Date(factor.locked_until) > now) {
      const remainingMinutes = Math.ceil(
        (new Date(factor.locked_until).getTime() - now.getTime()) / (60 * 1000)
      );
      return new Response(
        JSON.stringify({ 
          verified: false,
          isLocked: true,
          error: `Akun terkunci karena 5 kali percobaan PIN salah. Coba lagi dalam ${remainingMinutes} menit.`,
          lockedUntil: factor.locked_until
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Perbandingan Bcrypt Hash
    const isMatch = await bcrypt.compare(String(pin || ""), factor.pin_hash);

    if (!isMatch) {
      const nextFailedAttempts = (factor.failed_attempts || 0) + 1;
      let lockedUntil: string | null = null;

      if (nextFailedAttempts >= 5) {
        // Lockout 15 menit
        const lockDate = new Date(now.getTime() + 15 * 60 * 1000);
        lockedUntil = lockDate.toISOString();
      }

      await supabaseClient
        .from("employee_pin_factors")
        .update({
          failed_attempts: nextFailedAttempts,
          locked_until: lockedUntil,
          updated_at: now.toISOString()
        })
        .eq("user_id", targetUserId);

      if (nextFailedAttempts >= 5) {
        return new Response(
          JSON.stringify({
            verified: false,
            isLocked: true,
            error: "PIN salah 5 kali. Akun Anda dikunci selama 15 menit demi keamanan.",
            lockedUntil
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const remainingAttempts = 5 - nextFailedAttempts;
      return new Response(
        JSON.stringify({
          verified: false,
          isLocked: false,
          error: `PIN salah. Sisa kesempatan: ${remainingAttempts} kali sebelum akun dikunci.`,
          remainingAttempts
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PIN Benar: Reset failed attempts & unlock
    await supabaseClient
      .from("employee_pin_factors")
      .update({
        failed_attempts: 0,
        locked_until: null,
        updated_at: now.toISOString()
      })
      .eq("user_id", targetUserId);

    return new Response(
      JSON.stringify({ verified: true, hasPinConfigured: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
