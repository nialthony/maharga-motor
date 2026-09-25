// Supabase Edge Function: verify-pin
// Melakukan verifikasi faktor kedua (4-digit PIN) di sisi server menggunakan pure JavaScript bcryptjs
// Dilengkapi proteksi Brute-Force: Lockout 15 menit setelah 5 kali percobaan gagal

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || supabaseAnonKey;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ verified: false, error: "Header autentikasi (Authorization) tidak ditemukan." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verifikasi User Token JWT menggunakan authClient resmi
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: "Sesi login tidak valid atau telah kedaluwarsa. Silakan login kembali." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "verify";
    const pin = String(body.factor_code || body.pin || body.code || "").trim();

    // Inisialisasi Admin Client (Service Role) untuk akses tabel aman employee_pin_factors
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // -------------------------------------------------------------------------
    // AKSI 1: SET / UPDATE PIN
    // -------------------------------------------------------------------------
    if (action === "set_pin") {
      if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
        return new Response(
          JSON.stringify({ success: false, error: "PIN harus berupa 4-6 digit angka." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pinHash = bcrypt.hashSync(pin, 10);

      const { error: upsertErr } = await adminClient
        .from("employee_pin_factors")
        .upsert({
          user_id: user.id,
          pin_hash: pinHash,
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        });

      if (upsertErr) {
        console.error("Gagal upsert pin factor:", upsertErr);
        return new Response(
          JSON.stringify({ success: false, error: `Gagal menyimpan PIN ke database: ${upsertErr.message}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "PIN faktor kedua berhasil diperbarui." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------------------
    // AKSI 2: VERIFY PIN
    // -------------------------------------------------------------------------
    const { data: factor, error: factorError } = await adminClient
      .from("employee_pin_factors")
      .select("user_id, pin_hash, failed_attempts, locked_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (factorError) {
      console.error("Error query employee_pin_factors:", factorError);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: `Gagal membaca data faktor keamanan: ${factorError.message}` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Jika belum ada PIN terdaftar untuk user ini
    if (!factor || !factor.pin_hash) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          hasPinConfigured: false, 
          error: "PIN keamanan belum dikonfigurasi untuk akun ini. Hubungi administrator atau atur PIN melalui profil." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();

    // Periksa status Lockout akun
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

    // Bandingkan PIN dengan bcrypt hash
    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(pin, factor.pin_hash);
    } catch (cmpErr) {
      console.error("Bcrypt compare error:", cmpErr);
      isMatch = false;
    }

    if (!isMatch) {
      const nextFailedAttempts = (factor.failed_attempts || 0) + 1;
      let lockedUntil: string | null = null;

      if (nextFailedAttempts >= 5) {
        // Kunci selama 15 menit
        const lockDate = new Date(now.getTime() + 15 * 60 * 1000);
        lockedUntil = lockDate.toISOString();
      }

      await adminClient
        .from("employee_pin_factors")
        .update({
          failed_attempts: nextFailedAttempts,
          locked_until: lockedUntil,
          updated_at: now.toISOString()
        })
        .eq("user_id", user.id);

      if (nextFailedAttempts >= 5) {
        return new Response(
          JSON.stringify({ 
            verified: false, 
            isLocked: true, 
            error: "PIN salah 5 kali berturut-turut. Akun Anda dikunci selama 15 menit demi keamanan.",
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

    // PIN BENAR: Reset counter kegagalan & unlock akun
    await adminClient
      .from("employee_pin_factors")
      .update({
        failed_attempts: 0,
        locked_until: null,
        updated_at: now.toISOString()
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ verified: true, hasPinConfigured: true, message: "Verifikasi PIN berhasil." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan sistem internal.";
    console.error("Unhandled Edge Function error:", err);
    return new Response(
      JSON.stringify({ verified: false, error: `Kesalahan server: ${message}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
