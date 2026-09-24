import { supabase, isSupabaseConfigured } from './supabaseClient';
import { initialUnits, initialSalesList, initialEmployees } from '../data/mockData';

// ==============================================================================
// MAHARGA MOTOR CLOUD DATA SYNCHRONIZER
// Memastikan data sinkron 100% di semua perangkat melalui Supabase Cloud
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
  buy_price: Number(u.buyPrice || u.buy_price) || 0,
  repair_cost: Number(u.repairCost || u.repair_cost) || 0,
  min_margin_percent: Number(u.minMarginPercent || u.min_margin_percent) || 10,
  display_price: Number(u.displayPrice || u.display_price) || 0,
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
  username: emp.username.toLowerCase().replace(/\s+/g, '_'),
  name: emp.name,
  role: emp.role || 'sales',
  email: emp.email || '',
  phone: emp.phone || '',
  pin: String(emp.pin || '1234'),
  status: emp.status === 'suspended' ? 'inactive' : (emp.status || 'active'),
  joined_date: emp.joinedDate || new Date().toISOString().split('T')[0]
});

/**
 * Konversi karyawan dari Supabase (snake_case) ke UI (camelCase)
 */
export const employeeFromDb = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name,
  role: row.role,
  email: row.email || '',
  phone: row.phone || '',
  pin: String(row.pin || '1234'),
  status: row.status === 'inactive' ? 'suspended' : (row.status || 'active'),
  joinedDate: row.joined_date || '',
  permissions: row.role === 'owner' 
    ? ['all_access'] 
    : row.role === 'admin' 
    ? ['inventory_manage', 'pos_access', 'file_manager'] 
    : ['pos_access', 'view_catalog']
});

/**
 * Muat seluruh data dari Supabase Cloud (Units, Sales, Employees)
 */
export const fetchCloudData = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // 1. Cek master snapshot di system_settings
    const { data: snapshotData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maharga_master_state')
      .single();

    // 2. Baca tabel employees langsung dari Supabase
    const { data: dbEmployees } = await supabase
      .from('employees')
      .select('*')
      .order('id', { ascending: true });

    let finalEmployees = initialEmployees;
    if (dbEmployees && dbEmployees.length > 0) {
      finalEmployees = dbEmployees.map(employeeFromDb);
    } else if (snapshotData?.value?.employees?.length) {
      finalEmployees = snapshotData.value.employees;
    }

    // Jika master snapshot sudah ada di system_settings (meskipun units: [] atau salesList: []), gunakan data snapshot resmi
    if (snapshotData?.value && Array.isArray(snapshotData.value.units)) {
      return {
        units: snapshotData.value.units,
        salesList: Array.isArray(snapshotData.value.salesList) ? snapshotData.value.salesList : [],
        employees: finalEmployees,
        source: 'supabase_cloud'
      };
    }

    // 3. Jika belum ada snapshot, baca dari tabel units
    const { data: dbUnits, error: unitErr } = await supabase
      .from('units')
      .select('*')
      .order('id', { ascending: false });

    const { data: dbRepairs } = await supabase
      .from('repairs')
      .select('*');

    if (!unitErr && dbUnits && dbUnits.length > 0) {
      const formattedUnits = dbUnits.map(u => unitFromDb(u, dbRepairs || []));
      
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

      return {
        units: formattedUnits,
        salesList: formattedSales,
        employees: finalEmployees,
        source: 'supabase_cloud'
      };
    }

    // 4. Jika database Supabase benar-benar kosong pertama kali, lakukan initial seed
    await syncAllToCloud(initialUnits, initialSalesList, initialEmployees);
    return {
      units: initialUnits,
      salesList: initialSalesList,
      employees: initialEmployees,
      source: 'supabase_seeded'
    };
  } catch (err) {
    console.warn('Gagal memuat data cloud Supabase:', err);
    return null;
  }
};

/**
 * Simpan seluruh state (Master Snapshot & Tables) ke Supabase Cloud
 */
export const syncAllToCloud = async (units, salesList, employees) => {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const validEmployees = Array.isArray(employees) ? employees : [];
    const validUnits = Array.isArray(units) ? units : [];
    const validSales = Array.isArray(salesList) ? salesList : [];

    // 1. Simpan Master State Snapshot di system_settings
    await supabase.from('system_settings').upsert({
      key: 'maharga_master_state',
      value: {
        units: validUnits,
        salesList: validSales,
        employees: validEmployees,
        isInitialized: true,
        lastUpdated: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    });

    // 2. Simpan atau kosongkan tabel units individual
    if (validUnits.length > 0) {
      const dbRows = validUnits.map(unitToDb);
      await supabase.from('units').upsert(dbRows, { onConflict: 'id' });
    } else {
      // Jika memang sengaja dikosongkan, hapus semua row di tabel units
      await supabase.from('units').delete().neq('id', -999999);
    }

    // 3. Simpan atau kosongkan tabel sales_transactions
    if (validSales.length === 0) {
      await supabase.from('sales_transactions').delete().neq('id', '___empty___');
    }

    // 4. Simpan ke tabel employees individual
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
 * Hapus seluruh stok motor dan riwayat transaksi/keuangan di Supabase Cloud (Fresh Start)
 * Tetap mempertahankan data akun staf/karyawan
 */
export const clearShowroomDataInCloud = async (employees) => {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const validEmployees = Array.isArray(employees) ? employees : [];

    // 1. Hapus isi tabel fisik di Supabase
    await supabase.from('repairs').delete().neq('id', -999999);
    await supabase.from('sales_transactions').delete().neq('id', '___empty___');
    await supabase.from('units').delete().neq('id', -999999);

    // 2. Simpan master snapshot dengan units: [] dan salesList: []
    await supabase.from('system_settings').upsert({
      key: 'maharga_master_state',
      value: {
        units: [],
        salesList: [],
        employees: validEmployees,
        isInitialized: true,
        lastUpdated: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.error('Gagal reset data showroom di cloud:', err);
    return false;
  }
};

/**
 * Simpan akun staf / karyawan baru langsung ke Supabase Cloud
 */
export const saveNewEmployeeToCloud = async (newEmp, allEmployees, allUnits, allSales) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    // 1. Insert ke tabel employees
    const dbRow = employeeToDb(newEmp);
    const { error } = await supabase.from('employees').upsert([dbRow], { onConflict: 'username' });
    if (error) {
      console.warn('Gagal upsert tabel employees, menggunakan master state fallback:', error);
    }
    // 2. Update master snapshot agar device lain langsung dapat
    await syncAllToCloud(allUnits, allSales, allEmployees);
  } catch (e) {
    console.warn('Gagal menyimpan karyawan ke cloud:', e);
  }
};

/**
 * Hapus akun staf dari Supabase Cloud
 */
export const deleteEmployeeFromCloud = async (empId, allEmployees, allUnits, allSales) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('employees').delete().eq('id', empId);
    await syncAllToCloud(allUnits, allSales, allEmployees);
  } catch (e) {
    console.warn('Gagal menghapus karyawan dari cloud:', e);
  }
};

/**
 * Tambah unit motor baru ke Supabase Cloud
 */
export const saveNewUnitToCloud = async (newUnit, allUnits, allSales, allEmployees) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('units').upsert([unitToDb(newUnit)], { onConflict: 'id' });
    await syncAllToCloud(allUnits, allSales, allEmployees);
  } catch (e) {
    console.warn('Gagal upload unit baru ke cloud:', e);
  }
};

/**
 * Simpan transaksi penjualan ke Supabase Cloud
 */
export const saveTransactionToCloud = async (tx, unitId, newStatus, allUnits, allSales, allEmployees) => {
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
      deal_price: tx.dealPrice,
      payment_method: tx.paymentType === 'Tempo DP' ? 'dp-tempo' : 'cash',
      dp_amount: tx.dpAmount || 0,
      remaining_amount: tx.remainingPayment || 0,
      due_date: tx.dueDate || null,
      commission: tx.commission || 200000,
      status: tx.status || 'Lunas',
      tx_date: tx.date || new Date().toISOString().split('T')[0]
    }], { onConflict: 'id' });

    await syncAllToCloud(allUnits, allSales, allEmployees);
  } catch (e) {
    console.warn('Gagal upload transaksi ke cloud:', e);
  }
};

/**
 * Simpan pelunasan transaksi titip DP / tempo ke Supabase Cloud
 * Otomatis ubah status unit menjadi 'Terjual' dan transaksi menjadi 'Lunas'
 */
export const saveSettlementToCloud = async (txId, unitId, allUnits, allSales, allEmployees) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    if (unitId) {
      await supabase.from('units').update({ status: 'Terjual' }).eq('id', unitId);
    }
    await supabase.from('sales_transactions').update({
      status: 'Lunas',
      remaining_amount: 0
    }).eq('id', txId);

    await syncAllToCloud(allUnits, allSales, allEmployees);
  } catch (e) {
    console.warn('Gagal simpan pelunasan ke cloud:', e);
  }
};

/**
 * Langganan (Subscribe) perubahan realtime dari Supabase
 */
export const subscribeToCloudRealtime = (onRemoteUpdate) => {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  const channel = supabase
    .channel('maharga-realtime-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'system_settings' },
      (payload) => {
        if (payload?.new?.key === 'maharga_master_state') {
          const val = payload.new.value;
          if (val?.units || val?.employees) {
            onRemoteUpdate({
              units: val.units || [],
              salesList: val.salesList || [],
              employees: val.employees || initialEmployees
            });
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      async () => {
        // Jika ada perubahan langsung pada tabel employees
        const { data } = await supabase.from('employees').select('*').order('id', { ascending: true });
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
