import { supabase, isSupabaseConfigured } from './supabaseClient';


// ==============================================================================
// MAHARGA MOTOR CLOUD DATA SYNCHRONIZER (SECURE ARCHITECTURE)
// Menyimpan dan menyinkronkan data langsung ke tabel-tabel relasional PostgreSQL
// (Bukan global dump blob di maharga_master_state)
// ==============================================================================

/**
 * Konversi unit dari format UI (camelCase) ke Supabase (snake_case)
 */
export const unitToDb = (u) => ({
  id: u.id,
  brand: u.brand,
  model: u.model,
  year: Number(u.year) || 2022,
  plate: u.plate,
  color: u.color || '',
  odometer: Number(u.odometer) || 0,
  engine_no: u.engineNo || u.engine_no || '',
  frame_no: u.frameNo || u.frame_no || '',
  tax_status: u.taxStatus || u.tax_status || 'Hidup',
  tax_valid_until: u.taxValidUntil || u.tax_valid_until || null,
  tax_dead_years: Number(u.taxDeadYears || u.tax_dead_years) || 0,
  documents: u.documents || ['STNK', 'BPKB', 'Faktur'],
  condition: u.condition || '',
  buy_price: Math.max(0, Number(u.buyPrice || u.buy_price) || 0),
  repair_cost: Math.max(0, Number(u.repairCost || u.repair_cost) || 0),
  min_margin_percent: Math.min(100, Math.max(0, Number(u.minMarginPercent || u.min_margin_percent) || 10)),
  display_price: Math.max(0, Number(u.displayPrice || u.display_price) || 0),
  status: u.status || 'Tersedia',
  images: u.images || [],
  entry_date: u.entryDate || u.entry_date || new Date().toISOString().split('T')[0]
});

/**
 * Konversi unit dari format Supabase (snake_case) ke format UI (camelCase)
 */
export const unitFromDb = (row, repairs = []) => ({
  id: row.id,
  brand: row.brand,
  model: row.model,
  year: row.year,
  plate: row.plate,
  color: row.color,
  odometer: row.odometer,
  engineNo: row.engine_no,
  frameNo: row.frame_no,
  taxStatus: row.tax_status,
  taxValidUntil: row.tax_valid_until,
  taxDeadYears: row.tax_dead_years,
  documents: row.documents || [],
  condition: row.condition,
  buyPrice: Number(row.buy_price) || 0,
  repairCost: Number(row.repair_cost) || 0,
  minMarginPercent: Number(row.min_margin_percent) || 10,
  displayPrice: Number(row.display_price) || 0,
  status: row.status,
  images: row.images || [],
  entryDate: row.entry_date,
  repairs: repairs.filter(r => r.unit_id === row.id).map(r => ({
    id: r.id,
    date: r.repair_date,
    item: r.item,
    mechanic: r.mechanic_name,
    cost: Number(r.cost) || 0
  }))
});

/**
 * Konversi karyawan dari UI (camelCase) ke Supabase (snake_case)
 */
export const employeeToDb = (emp) => ({
  id: emp.id || Date.now(),
  user_id: emp.userId || emp.user_id || null,
  username: emp.username.toLowerCase().replace(/\s+/g, '_'),
  name: emp.name,
  role: emp.role || 'sales',
  email: emp.email || '',
  phone: emp.phone || '',
  avatar: emp.avatar || '',
  status: emp.status === 'suspended' ? 'inactive' : (emp.status || 'active'),
  joined_date: emp.joinedDate || new Date().toISOString().split('T')[0]
});

/**
 * Konversi karyawan dari Supabase (snake_case) ke UI (camelCase)
 */
export const employeeFromDb = (row) => ({
  id: row.id,
  userId: row.user_id || null,
  username: row.username,
  name: row.name,
  role: row.role,
  email: row.email || '',
  phone: row.phone || '',
  avatar: row.avatar || '',
  status: row.status === 'inactive' ? 'suspended' : (row.status || 'active'),
  joinedDate: row.joined_date || '',
  permissions: row.role === 'owner' 
    ? ['all_access'] 
    : row.role === 'admin' 
    ? ['inventory_manage', 'pos_access', 'file_manager'] 
    : ['pos_access', 'view_catalog']
});

/**
 * Muat data dari Supabase Cloud (Menggunakan Tabel-Tabel Relasional Terautentikasi)
 */
export const fetchCloudData = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // 1. Baca tabel employees terautentikasi
    const { data: dbEmployees } = await supabase
      .from('employees')
      .select('id, user_id, username, name, role, email, phone, avatar, status, joined_date')
      .order('id', { ascending: true });

    const finalEmployees = (dbEmployees && dbEmployees.length > 0)
      ? dbEmployees.map(employeeFromDb)
      : [];

    // 2. Baca tabel units & repairs
    const { data: dbUnits, error: unitErr } = await supabase
      .from('units')
      .select('*')
      .order('id', { ascending: false });

    const { data: dbRepairs } = await supabase
      .from('repairs')
      .select('*');

    const formattedUnits = (!unitErr && dbUnits)
      ? dbUnits.map(u => unitFromDb(u, dbRepairs || []))
      : [];

    // 3. Baca tabel sales_transactions
    const { data: dbSales } = await supabase
      .from('sales_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    const formattedSales = (dbSales || []).map(s => ({
      id: s.id,
      date: s.tx_date,
      unitId: s.unit_id,
      unitName: s.unit_name,
      plate: s.plate,
      buyerName: s.buyer_name,
      buyerPhone: s.buyer_phone,
      buyerNik: '',
      buyerAddress: s.buyer_address || '',
      dealPrice: Number(s.deal_price) || 0,
      paymentType: s.payment_method === 'dp-tempo' ? 'Tempo DP' : 'Cash Lunas',
      dpAmount: Number(s.dp_amount) || 0,
      remainingPayment: Number(s.remaining_amount) || 0,
      dueDate: s.due_date || '',
      salesName: s.sales_name,
      commission: Number(s.commission) || 200000,
      status: s.status
    }));

    // 4. Baca pengaturan sistem terdekomposisi (showroom_profile, bank_accounts, financial_rules)
    const { data: settingsRows } = await supabase
      .from('system_settings')
      .select('key, value');

    const settingsMap = {};
    (settingsRows || []).forEach(row => {
      settingsMap[row.key] = row.value;
    });

    return {
      units: formattedUnits,
      salesList: formattedSales,
      employees: finalEmployees,
      settings: settingsMap,
      source: 'supabase_cloud'
    };
  } catch (err) {
    console.warn('Gagal memuat data cloud Supabase:', err);
    return null;
  }
};

/**
 * Simpan data units dan employees ke tabel-tabel Supabase Cloud
 */
export const syncAllToCloud = async (units, salesList, employees) => {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const validEmployees = Array.isArray(employees) ? employees : [];
    const validUnits = Array.isArray(units) ? units : [];

    // 1. Simpan tabel units individual
    if (validUnits.length > 0) {
      const dbRows = validUnits.map(unitToDb);
      await supabase.from('units').upsert(dbRows, { onConflict: 'id' });
    }

    // 2. Simpan tabel employees individual
    if (validEmployees.length > 0) {
      const empRows = validEmployees.map(employeeToDb);
      await supabase.from('employees').upsert(empRows, { onConflict: 'username' });
    }

    return true;
  } catch (err) {
    console.error('Error sinkronisasi ke Supabase:', err);
    return false;
  }
};

/**
 * Hapus stok motor dan riwayat transaksi di Supabase Cloud (Admin Fresh Start)
 */
export const clearShowroomDataInCloud = async () => {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    await supabase.from('repairs').delete().neq('id', -999999);
    await supabase.from('sales_transactions').delete().neq('id', '___empty___');
    await supabase.from('units').delete().neq('id', -999999);
    return true;
  } catch (err) {
    console.error('Gagal reset data showroom di cloud:', err);
    return false;
  }
};

/**
 * Simpan akun staf baru langsung ke Supabase Cloud
 */
export const saveNewEmployeeToCloud = async (newEmp) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const dbRow = employeeToDb(newEmp);
    const { error } = await supabase.from('employees').upsert([dbRow], { onConflict: 'username' });
    if (error) {
      console.warn('Gagal upsert tabel employees:', error);
    }
  } catch (e) {
    console.warn('Gagal menyimpan karyawan ke cloud:', e);
  }
};

/**
 * Simpan update profil karyawan ke Supabase Cloud
 */
export const saveEmployeeProfileToCloud = async (updatedEmp) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const dbRow = employeeToDb(updatedEmp);
    
    try {
      const { error: fullUpdateErr } = await supabase
        .from('employees')
        .update({
          name: dbRow.name,
          email: dbRow.email,
          phone: dbRow.phone,
          avatar: dbRow.avatar
        })
        .eq('id', updatedEmp.id);

      if (fullUpdateErr) {
        await supabase
          .from('employees')
          .update({
            name: dbRow.name,
            email: dbRow.email,
            phone: dbRow.phone
          })
          .eq('id', updatedEmp.id);
      }
    } catch (colErr) {
      console.warn('Fallback update employee table:', colErr);
    }
  } catch (e) {
    console.warn('Gagal simpan profil ke cloud:', e);
  }
};

/**
 * Hapus akun staf dari Supabase Cloud
 */
export const deleteEmployeeFromCloud = async (empId) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('employees').delete().eq('id', empId);
  } catch (e) {
    console.warn('Gagal menghapus karyawan dari cloud:', e);
  }
};

/**
 * Tambah unit motor baru ke Supabase Cloud
 */
export const saveNewUnitToCloud = async (newUnit) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('units').upsert([unitToDb(newUnit)], { onConflict: 'id' });
  } catch (e) {
    console.warn('Gagal upload unit baru ke cloud:', e);
  }
};

/**
 * Hapus unit motor secara satuan dari Supabase Cloud
 */
export const deleteUnitFromCloud = async (unitId) => {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    await supabase.from('repairs').delete().eq('unit_id', unitId);
    await supabase.from('units').delete().eq('id', unitId);
    return true;
  } catch (e) {
    console.warn('Gagal menghapus unit dari cloud:', e);
    return false;
  }
};

/**
 * Simpan transaksi penjualan ke Supabase Cloud
 */
export const saveTransactionToCloud = async (tx, unitId, newStatus) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('units').update({ status: newStatus }).eq('id', unitId);
    
    await supabase.from('sales_transactions').upsert([{
      id: tx.id,
      unit_id: unitId,
      unit_name: tx.unitName,
      plate: tx.plate,
      sales_name: tx.salesName,
      buyer_name: tx.buyerName,
      buyer_phone: tx.buyerPhone || '',
      buyer_address: tx.buyerAddress || '',
      deal_price: Math.max(1, Number(tx.dealPrice) || 0),
      payment_method: tx.paymentType === 'Tempo DP' ? 'dp-tempo' : 'cash',
      dp_amount: Math.max(0, Number(tx.dpAmount) || 0),
      remaining_amount: Math.max(0, Number(tx.remainingPayment) || 0),
      due_date: tx.dueDate || null,
      commission: Math.max(0, Number(tx.commission) || 200000),
      status: tx.status || 'Lunas',
      tx_date: tx.date || new Date().toISOString().split('T')[0]
    }], { onConflict: 'id' });
  } catch (e) {
    console.warn('Gagal upload transaksi ke cloud:', e);
  }
};

/**
 * Simpan pelunasan transaksi titip DP / tempo ke Supabase Cloud
 */
export const saveSettlementToCloud = async (txId, unitId) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    if (unitId) {
      await supabase.from('units').update({ status: 'Terjual' }).eq('id', unitId);
    }
    await supabase.from('sales_transactions').update({
      status: 'Lunas',
      remaining_amount: 0
    }).eq('id', txId);
  } catch (e) {
    console.warn('Gagal simpan pelunasan ke cloud:', e);
  }
};

/**
 * Langganan (Subscribe) perubahan realtime dari Supabase langsung ke tabel-tabel relasional
 */
export const subscribeToCloudRealtime = (onRemoteUpdate) => {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  const channel = supabase
    .channel('maharga-realtime-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'units' },
      async () => {
        const { data: dbUnits } = await supabase.from('units').select('*').order('id', { ascending: false });
        const { data: dbRepairs } = await supabase.from('repairs').select('*');
        if (dbUnits) {
          onRemoteUpdate({ units: dbUnits.map(u => unitFromDb(u, dbRepairs || [])) });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales_transactions' },
      async () => {
        const { data: dbSales } = await supabase.from('sales_transactions').select('*').order('created_at', { ascending: false });
        if (dbSales) {
          onRemoteUpdate({
            salesList: dbSales.map(s => ({
              id: s.id,
              date: s.tx_date,
              unitId: s.unit_id,
              unitName: s.unit_name,
              plate: s.plate,
              buyerName: s.buyer_name,
              buyerPhone: s.buyer_phone,
              buyerNik: '',
              buyerAddress: s.buyer_address || '',
              dealPrice: Number(s.deal_price) || 0,
              paymentType: s.payment_method === 'dp-tempo' ? 'Tempo DP' : 'Cash Lunas',
              dpAmount: Number(s.dp_amount) || 0,
              remainingPayment: Number(s.remaining_amount) || 0,
              dueDate: s.due_date || '',
              salesName: s.sales_name,
              commission: Number(s.commission) || 200000,
              status: s.status
            }))
          });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      async () => {
        const { data } = await supabase
          .from('employees')
          .select('id, user_id, username, name, role, email, phone, avatar, status, joined_date')
          .order('id', { ascending: true });
        if (data && data.length > 0) {
          onRemoteUpdate({ employees: data.map(employeeFromDb) });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
