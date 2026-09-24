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
 * Muat seluruh data dari Supabase Cloud (Units, Sales, Employees)
 */
export const fetchCloudData = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // 1. Cek dulu apakah ada master snapshot di system_settings
    const { data: snapshotData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maharga_master_state')
      .single();

    if (snapshotData?.value?.units?.length) {
      return {
        units: snapshotData.value.units,
        salesList: snapshotData.value.salesList || [],
        employees: snapshotData.value.employees || initialEmployees,
        source: 'supabase_cloud'
      };
    }

    // 2. Jika belum ada snapshot, baca dari tabel units langsung
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
        employees: initialEmployees,
        source: 'supabase_cloud'
      };
    }

    // 3. Jika database Supabase masih kosong, lakukan initial seed otomatis
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
    // 1. Simpan Master State Snapshot di system_settings (garansi sinkron 100% antar-device)
    await supabase.from('system_settings').upsert({
      key: 'maharga_master_state',
      value: {
        units,
        salesList,
        employees,
        lastUpdated: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    });

    // 2. Simpan juga ke tabel units individual secara non-blocking
    if (units && units.length > 0) {
      const dbRows = units.map(unitToDb);
      await supabase.from('units').upsert(dbRows, { onConflict: 'id' });
    }

    return true;
  } catch (err) {
    console.error('Error sinkronisasi ke Supabase:', err);
    return false;
  }
};

/**
 * Tambah unit motor baru ke Supabase Cloud
 */
export const saveNewUnitToCloud = async (newUnit, allUnits, allSales, allEmployees) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    // Upsert ke tabel units
    await supabase.from('units').upsert([unitToDb(newUnit)], { onConflict: 'id' });
    // Update master snapshot
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
    // Update status unit
    await supabase.from('units').update({ status: newStatus }).eq('id', unitId);
    
    // Insert transaksi
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

    // Update master snapshot
    await syncAllToCloud(allUnits, allSales, allEmployees);
  } catch (e) {
    console.warn('Gagal upload transaksi ke cloud:', e);
  }
};

/**
 * Langganan (Subscribe) perubahan realtime dari Supabase
 * Saat device A mengubah data, callback akan terpanggil di device B secara langsung
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
          if (val?.units) {
            onRemoteUpdate({
              units: val.units,
              salesList: val.salesList || [],
              employees: val.employees || initialEmployees
            });
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
