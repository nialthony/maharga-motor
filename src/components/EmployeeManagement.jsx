import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  X, 
  Trash2, 
  Search,
  UserCheck
} from 'lucide-react';

export default function EmployeeManagement({ employees, setEmployees, currentRole, onSwitchUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [newPin, setNewPin] = useState('');
  
  // Form State for new employee
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('sales');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('1234');

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEmployee = (e) => {
    e.preventDefault();
    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_');
    const cleanName = name.trim();
    if (!cleanUsername || !cleanName) return;

    if (employees.some(emp => emp.username.toLowerCase() === cleanUsername)) {
      alert(`Username "${cleanUsername}" sudah digunakan! Silakan gunakan username unik lain.`);
      return;
    }

    const newEmp = {
      id: Date.now(),
      username: cleanUsername,
      name: cleanName,
      role,
      email: email.trim(),
      phone: phone.trim(),
      pin: pin.trim() || '1234',
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      permissions: role === 'owner' ? ['all_access'] : role === 'admin' ? ['inventory_manage', 'pos_access', 'file_manager'] : ['pos_access', 'view_catalog']
    };

    const nextEmployees = [...employees, newEmp];
    setEmployees(nextEmployees);
    setIsModalOpen(false);
    setUsername('');
    setName('');
    setEmail('');
    setPhone('');
    setPin('1234');
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (!targetEmployee || !newPin.trim()) return;

    const nextEmployees = employees.map(emp => 
      emp.id === targetEmployee.id ? { ...emp, pin: newPin.trim() } : emp
    );
    setEmployees(nextEmployees);
    setIsPinModalOpen(false);
    setNewPin('');
    setTargetEmployee(null);
  };

  const handleToggleStatus = (id) => {
    const nextEmployees = employees.map(emp => {
      if (emp.id === id) {
        return {
          ...emp,
          status: emp.status === 'active' ? 'suspended' : 'active'
        };
      }
      return emp;
    });
    setEmployees(nextEmployees);
  };

  const handleDeleteEmployee = (id) => {
    if (confirm('Yakin ingin menghapus akun staf/karyawan ini?')) {
      const nextEmployees = employees.filter(emp => emp.id !== id);
      setEmployees(nextEmployees);
    }
  };

  const getRoleBadge = (empRole) => {
    switch(empRole) {
      case 'owner': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">OWNER</span>;
      case 'admin': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800">ADMIN SHOWROOM</span>;
      case 'sales': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">SALES EXECUTIVE</span>;
      case 'mechanic': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800">MEKANIK QC</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Manajemen Staf & Hak Akses
            </h2>
            {currentRole && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Sesi: {currentRole.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola data staf sales, admin kasir, mekanik bengkel, reset PIN login, dan kontrol izin hak akses modul.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Functional Search Bar */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              type="text"
              aria-label="Cari karyawan"
              placeholder="Cari nama, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none w-full text-xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                aria-label="Hapus kata kunci pencarian"
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Buka form tambah karyawan"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm min-h-[36px]"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[3]" />
            Tambah Akun
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <span className="text-zinc-500 uppercase text-[10px] font-bold">Total Pengguna</span>
          <h3 className="text-xl font-black font-mono text-zinc-100">{employees.length} User</h3>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <span className="text-zinc-500 uppercase text-[10px] font-bold">Tim Sales</span>
          <h3 className="text-xl font-black font-mono text-emerald-400">
            {employees.filter(e => e.role === 'sales').length} Orang
          </h3>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <span className="text-zinc-500 uppercase text-[10px] font-bold">Admin & Kasir</span>
          <h3 className="text-xl font-black font-mono text-blue-400">
            {employees.filter(e => e.role === 'admin' || e.role === 'owner').length} Orang
          </h3>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <span className="text-zinc-500 uppercase text-[10px] font-bold">Mekanik Bengkel</span>
          <h3 className="text-xl font-black font-mono text-purple-400">
            {employees.filter(e => e.role === 'mechanic').length} Orang
          </h3>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Nama Karyawan</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role Jabatan</th>
                <th className="py-3 px-4">Kontak (WA/Email)</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">PIN Akses</th>
                <th className="py-3 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 shrink-0">
                        {emp.avatar ? (
                          <img 
                            src={emp.avatar} 
                            alt={emp.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span>{emp.username.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <span>{emp.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">@{emp.username}</td>
                    <td className="py-3 px-4">{getRoleBadge(emp.role)}</td>
                    <td className="py-3 px-4 text-zinc-400">
                      <div>{emp.phone}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{emp.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(emp.id)}
                        aria-label={`Ubah status akun ${emp.name}`}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.status === 'active' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {emp.status === 'active' ? 'Aktif' : 'Nonaktif (Suspended)'}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        ••••
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onSwitchUser && (
                          <button
                            onClick={() => onSwitchUser(emp)}
                            aria-label={`Beralih ke akun ${emp.name}`}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[11px] font-medium flex items-center gap-1 border border-zinc-700 transition-colors min-h-[30px]"
                            title="Masuk sebagai akun ini"
                          >
                            <UserCheck className="w-3 h-3" />
                            Beralih
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setTargetEmployee(emp);
                            setIsPinModalOpen(true);
                          }}
                          aria-label={`Ganti PIN untuk ${emp.name}`}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1 border border-zinc-700 transition-colors min-h-[30px]"
                          title="Reset PIN"
                        >
                          <KeyRound className="w-3 h-3 text-amber-400" />
                          PIN
                        </button>

                        {emp.role !== 'owner' && (
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            aria-label={`Hapus akun ${emp.name}`}
                            className="p-1 rounded hover:bg-zinc-800 text-rose-400 transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-zinc-500">
                    Tidak ditemukan staf dengan kata kunci "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100">Tambah Akun Karyawan Baru</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                aria-label="Tutup form tambah karyawan"
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Username Login *</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: dimas_sales"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Dimas Saputra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Role Jabatan</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="sales">Sales Executive</option>
                    <option value="admin">Admin Showroom</option>
                    <option value="mechanic">Mekanik Bengkel</option>
                    <option value="owner">Owner Showroom</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">PIN Login (4 Digit)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold text-center tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Nomor WhatsApp</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Email Staf</label>
                <input
                  type="email"
                  placeholder="nama@mahargamotor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold min-h-[36px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm min-h-[36px]"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-2xl">
            <h4 className="text-xs font-bold text-zinc-100">Reset PIN: {targetEmployee?.name}</h4>
            <form onSubmit={handleUpdatePin} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Masukkan PIN Baru (4-6 Angka):</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold text-center tracking-widest text-base focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-semibold min-h-[32px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm min-h-[32px]"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
