// Sample Demo Data (Available on-demand in Admin Panel)
export const sampleDemoUnits = [
  {
    id: 1422,
    brand: "Honda",
    model: "Vario 125 CBS ISS",
    year: 2021,
    plate: "AD 2137 EEC",
    color: "Matte Black",
    odometer: 18450,
    engineNo: "JM51E1293847",
    frameNo: "MH1JM5118MK294812",
    taxStatus: "Hidup",
    taxValidUntil: "2027-04-15",
    taxDeadYears: 0,
    documents: ["STNK", "BPKB", "Faktur", "Notice Pajak"],
    condition: "Bodi orisinil 95%, mesin kering segel pabrik, ban depan-belakang 85%",
    buyPrice: 14000000,
    repairCost: 350000,
    minMarginPercent: 10,
    displayPrice: 16800000,
    status: "Tersedia",
    images: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80"
    ],
    entryDate: "2026-09-10",
    repairs: [
      { id: 1, date: "2026-09-11", item: "Ganti Oli Mesin & Gardan Castrol Power1", mechanic: "Budi Santoso", cost: 120000 },
      { id: 2, date: "2026-09-12", item: "Detailing & Poles Bodi Komplit", mechanic: "Rizky", cost: 150000 },
      { id: 3, date: "2026-09-12", item: "Ganti Roller & V-Belt CVT", mechanic: "Budi Santoso", cost: 80000 }
    ]
  },
  {
    id: 1421,
    brand: "Yamaha",
    model: "NMAX 155 Connected ABS",
    year: 2022,
    plate: "B 3442 UMG",
    color: "Prestige Silver",
    odometer: 12300,
    engineNo: "G3J1E0928374",
    frameNo: "MH3SG5620NJ381940",
    taxStatus: "Hidup",
    taxValidUntil: "2027-08-20",
    taxDeadYears: 0,
    documents: ["STNK", "BPKB", "Faktur"],
    condition: "Tangan pertama dari baru, kunci keyless lengkap 2 unit, bodi no baret",
    buyPrice: 24500000,
    repairCost: 450000,
    minMarginPercent: 9,
    displayPrice: 28500000,
    status: "Tersedia",
    images: [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80"
    ],
    entryDate: "2026-09-12",
    repairs: [
      { id: 1, date: "2026-09-13", item: "Kampas Rem Depan Belakang Ori", mechanic: "Agus Mekanik", cost: 250000 },
      { id: 2, date: "2026-09-13", item: "Ganti Aki GS Astra", mechanic: "Agus Mekanik", cost: 200000 }
    ]
  }
];

export const sampleDemoSales = [
  {
    id: "TX-2026-0901",
    unitId: 1415,
    unitName: "Honda Beat Deluxe CBS ISS (2023)",
    plate: "AD 3190 BP",
    salesId: 14,
    salesName: "Anas Nur Cholis",
    buyerName: "Dwi Prasetyo",
    buyerPhone: "081234567890",
    buyerAddress: "Jl. Pemuda No. 45, Solo",
    dealPrice: 15400000,
    paymentMethod: "cash",
    date: "2026-09-14",
    commission: 350000,
    status: "Lunas"
  }
];

// Production Clean Slate Defaults: Empty for real showroom operations
export const initialUnits = [];
export const initialSalesList = [];

export const initialEmployees = [];

export const initialFiles = [
  {
    id: "f-1",
    name: "config.json",
    path: "/config/config.json",
    size: "1.4 KB",
    type: "json",
    updatedAt: "2026-09-20 10:15",
    content: JSON.stringify({
      showroom_name: "Maharga Motor",
      hotline: "0812-3456-7890",
      address: "Jl. Raya Solo - Sukoharjo No. 88",
      bank_accounts: [
        { bank: "BCA", number: "0158-992-881", holder: "Maharga Motor" },
        { bank: "Mandiri", number: "138-00-1928374-1", holder: "Maharga Motor" }
      ],
      warranty_days: 30,
      min_margin_default_percent: 10
    }, null, 2)
  },
  {
    id: "f-2",
    name: "syarat-ketentuan-spk.txt",
    path: "/documents/syarat-ketentuan-spk.txt",
    size: "820 B",
    type: "text",
    updatedAt: "2026-09-15 09:30",
    content: "KETENTUAN TRANSAKSI MAHARGA MOTOR:\n1. Pembayaran hanya menerima Cash Tunai, Transfer Bank Resmi, atau Titip DP bertempo.\n2. Unit yang sudah dibeli mendapatkan Garansi Mesin selama 30 Hari kalender.\n3. Keabsahan dokumen (STNK & BPKB) dijamin 100% legal bebas blokir."
  },
  {
    id: "f-3",
    name: "database_backup.sql",
    path: "/backups/database_backup.sql",
    size: "1.2 KB",
    type: "sql",
    updatedAt: "2026-09-20 00:00",
    content: "-- Maharga Motor System DB Backup\n-- Ready for Production Operations"
  }
];

export const initialBrands = [
  { id: 1, name: "Yamaha" },
  { id: 2, name: "Honda" },
  { id: 3, name: "Kawasaki" },
  { id: 4, name: "Suzuki" },
  { id: 5, name: "Daihatsu" },
  { id: 6, name: "Toyota" },
  { id: 7, name: "SM SPORTS" },
  { id: 8, name: "Japstyle" }
];

export const initialTypes = [
  { id: 1, brandId: 1, brandName: "Yamaha", name: "NMAX" },
  { id: 2, brandId: 1, brandName: "Yamaha", name: "Aerox" },
  { id: 3, brandId: 1, brandName: "Yamaha", name: "LEXi" },
  { id: 4, brandId: 1, brandName: "Yamaha", name: "MX KING" },
  { id: 5, brandId: 1, brandName: "Yamaha", name: "MX KING V1" },
  { id: 6, brandId: 1, brandName: "Yamaha", name: "MX KING V2" },
  { id: 7, brandId: 1, brandName: "Yamaha", name: "NMAX NEW" },
  { id: 8, brandId: 1, brandName: "Yamaha", name: "NMAX NEO" },
  { id: 9, brandId: 1, brandName: "Yamaha", name: "R15" },
  { id: 10, brandId: 1, brandName: "Yamaha", name: "MIO" },
  { id: 11, brandId: 1, brandName: "Yamaha", name: "Rx King 135" },
  { id: 12, brandId: 1, brandName: "Yamaha", name: "Vixion" },
  { id: 13, brandId: 2, brandName: "Honda", name: "Vario 125" },
  { id: 14, brandId: 2, brandName: "Honda", name: "Scoopy" },
  { id: 15, brandId: 2, brandName: "Honda", name: "PCX" },
  { id: 16, brandId: 2, brandName: "Honda", name: "Stylo" },
  { id: 17, brandId: 2, brandName: "Honda", name: "Beat" },
  { id: 18, brandId: 2, brandName: "Honda", name: "Vario 160" },
  { id: 19, brandId: 3, brandName: "Kawasaki", name: "KLX 150" },
  { id: 20, brandId: 3, brandName: "Kawasaki", name: "Ninja 250" },
  { id: 21, brandId: 3, brandName: "Kawasaki", name: "W175" },
  { id: 22, brandId: 4, brandName: "Suzuki", name: "Satria F150" },
  { id: 23, brandId: 4, brandName: "Suzuki", name: "GSX-R150" }
];

export const initialSettings = {
  commission_per_unit: 200000,
  store_phone: "0821-3564-1774",
  store_address: "Jl. Ponggok - Krajan KM.1, Ds Tombol Rt 09/10, Ds. Dalangan, Kec. Tulung, Kab. Klaten",
  cashier_name: "Admin Maharga",
  store_logo: "/logo.png",
  license_status: "TERVERIFIKASI EXTEND",
  license_expired: "2027-03-19"
};

export const initialMechanics = [];

export const formatIDR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(val);
};

export const calculateUnitEconomics = (unit) => {
  if (!unit) return { totalModal: 0, minPrice: 0, estimatedProfit: 0, marginPercent: 0 };
  const totalModal = Number(unit.buyPrice || 0) + Number(unit.repairCost || 0);
  const minPrice = Math.round(totalModal * (1 + (Number(unit.minMarginPercent || 10) / 100)));
  const estimatedProfit = Number(unit.displayPrice || 0) - totalModal;
  const marginPercent = totalModal > 0 ? ((estimatedProfit / totalModal) * 100).toFixed(1) : 0;
  return {
    totalModal,
    minPrice,
    estimatedProfit,
    marginPercent
  };
};
