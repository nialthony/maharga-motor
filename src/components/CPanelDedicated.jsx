import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  Database, 
  Globe, 
  ShieldCheck, 
  HardDrive, 
  Terminal, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Search, 
  CheckCircle2, 
  Play, 
  Server, 
  Cpu, 
  Activity, 
  Lock, 
  RefreshCw, 
  ExternalLink,
  Code2,
  FileCode,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function CPanelDedicated({ 
  units, 
  salesList, 
  employees, 
  files, 
  setFiles, 
  onBackToERP 
}) {
  const [activeModule, setActiveModule] = useState('files'); // 'files' | 'db' | 'domains' | 'backup' | 'security' | 'php'
  
  // File Manager State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(files[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(files[0]?.content || '');
  const [isNewFileModal, setIsNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('/public_html/');
  const [newFileType, setNewFileType] = useState('text');
  const [newFileContent, setNewFileContent] = useState('');

  // Database / phpMyAdmin State
  const [selectedTable, setSelectedTable] = useState('units');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM units WHERE status = "Tersedia";');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlMsg, setSqlMsg] = useState('');

  // Server Stats Mock
  const serverStats = {
    domain: 'mahargamotor.com',
    ip: '103.147.154.21',
    serverName: 'litespeed-srv01.maharga.net',
    homeDir: '/home/maharga/public_html',
    cpanelVersion: '118.0 (Build 14)',
    phpVersion: 'PHP 8.3.8',
    mysqlVersion: 'MySQL 8.0.36',
    diskUsed: '1.42 GB / 20.00 GB (7.1%)',
    bandwidth: '14.80 GB / Unlimited',
    sslStatus: 'Let’s Encrypt Wildcard (Aktif)',
    serverLoad: '0.14 (4 CPUs)',
    memoryUsed: '1.18 GB / 4.00 GB (29.5%)'
  };

  // SQL Runner Handler
  const handleRunSQL = (e) => {
    e.preventDefault();
    const query = sqlQuery.trim().toLowerCase();

    if (query.includes('from units')) {
      setSelectedTable('units');
      setSqlResult(units);
      setSqlMsg(`Showing ${units.length} rows (Query took 0.0004 sec)`);
    } else if (query.includes('from sales')) {
      setSelectedTable('sales');
      setSqlResult(salesList);
      setSqlMsg(`Showing ${salesList.length} rows (Query took 0.0003 sec)`);
    } else if (query.includes('from employees') || query.includes('from users')) {
      setSelectedTable('employees');
      setSqlResult(employees);
      setSqlMsg(`Showing ${employees.length} rows (Query took 0.0002 sec)`);
    } else {
      setSelectedTable('units');
      setSqlResult(units);
      setSqlMsg(`Query executed successfully. 7 rows returned.`);
    }
  };

  const handleSaveFile = () => {
    if (!selectedFile) return;
    setFiles(prev => prev.map(f => f.id === selectedFile.id ? { 
      ...f, 
      content: editContent,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    } : f));
    setIsEditing(false);
  };

  const handleDeleteFile = (id) => {
    if (confirm('Konfirmasi: Hapus file ini secara permanen dari server public_html?')) {
      setFiles(prev => prev.filter(f => f.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
        setIsEditing(false);
      }
    }
  };

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fileObj = {
      id: `f-${Date.now()}`,
      name: newFileName,
      path: `${newFilePath}${newFileName}`,
      size: `${(newFileContent.length / 1024).toFixed(1)} KB`,
      type: newFileType,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content: newFileContent
    };

    setFiles(prev => [fileObj, ...prev]);
    setIsNewFileModal(false);
    setNewFileName('');
    setNewFileContent('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16">
      {/* cPanel Top Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToERP}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition-colors mr-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Showroom ERP
            </button>
            <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-xs font-mono">
              cP
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-zinc-100 font-mono">
                cPanel <span className="text-amber-400">Control Center</span>
              </span>
              <span className="text-[10px] text-zinc-500 ml-2 font-mono">mahargamotor.com</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-400 hidden sm:inline font-mono">IP: {serverStats.ip}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
              LITESPEED ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left Column: Server Information / Stats (Classic cPanel Sidebar) */}
          <div className="space-y-4">
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                Informasi Server Hosting
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Domain Utama</span>
                  <span className="font-bold text-zinc-200 font-mono">{serverStats.domain}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Home Directory</span>
                  <span className="font-mono text-zinc-300 text-[11px]">{serverStats.homeDir}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Server Software</span>
                  <span className="font-semibold text-zinc-300">{serverStats.serverName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Versi PHP & MySQL</span>
                  <span className="font-mono text-zinc-300">{serverStats.phpVersion} • {serverStats.mysqlVersion}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Status SSL/TLS</span>
                  <span className="text-emerald-400 font-medium">{serverStats.sslStatus}</span>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Penggunaan Resource
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Kapasitas Disk:</span>
                    <span className="font-mono text-zinc-200">7.1%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-500 w-[7.1%]" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{serverStats.diskUsed}</span>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Memory RAM:</span>
                    <span className="font-mono text-zinc-200">29.5%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[29.5%]" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{serverStats.memoryUsed}</span>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>CPU Load:</span>
                    <span className="font-mono text-emerald-400">{serverStats.serverLoad}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3 Columns: cPanel Main Management Suite */}
          <div className="lg:col-span-3 space-y-4">
            {/* Module Switcher Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveModule('files')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeModule === 'files' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                File Manager
              </button>
              <button
                onClick={() => setActiveModule('db')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeModule === 'db' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                phpMyAdmin & Database SQL
              </button>
              <button
                onClick={() => setActiveModule('domains')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeModule === 'domains' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Domain & SSL
              </button>
              <button
                onClick={() => setActiveModule('backup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeModule === 'backup' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Backup Wizard
              </button>
              <button
                onClick={() => setActiveModule('security')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeModule === 'security' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Security & .htaccess
              </button>
            </div>

            {/* MODULE 1: FILE MANAGER */}
            {activeModule === 'files' && (
              <div className="space-y-4">
                <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Current Directory:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 font-mono text-xs text-amber-400 border border-zinc-800">
                      /public_html
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsNewFileModal(true)}
                      className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700"
                    >
                      <Plus className="w-3 h-3" />
                      File Baru
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* File List Table */}
                  <div className="md:col-span-2 bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                          <tr>
                            <th className="py-2.5 px-3">Nama File</th>
                            <th className="py-2.5 px-3">Ukuran</th>
                            <th className="py-2.5 px-3">Modified</th>
                            <th className="py-2.5 px-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-mono">
                          {files.map((f) => (
                            <tr
                              key={f.id}
                              onClick={() => {
                                setSelectedFile(f);
                                setEditContent(f.content);
                                setIsEditing(false);
                              }}
                              className={`cursor-pointer ${
                                selectedFile?.id === f.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/40'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-bold text-zinc-100 flex items-center gap-2">
                                <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{f.name}</span>
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400 text-[11px]">{f.size}</td>
                              <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{f.updatedAt}</td>
                              <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setSelectedFile(f);
                                      setEditContent(f.content);
                                      setIsEditing(true);
                                    }}
                                    className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
                                    title="Edit Kode"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFile(f.id)}
                                    className="p-1 rounded hover:bg-zinc-700 text-rose-400"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-100 font-mono">{selectedFile.name}</h4>
                            <span className="text-[10px] text-zinc-500 font-mono">{selectedFile.path}</span>
                          </div>
                          {!isEditing && selectedFile.type !== 'image' && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2.5">
                            <textarea
                              rows={12}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setIsEditing(false)}
                                className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs"
                              >
                                Batal
                              </button>
                              <button
                                onClick={handleSaveFile}
                                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Simpan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                            {selectedFile.content}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-zinc-500 text-xs">Pilih file untuk melihat isi kode.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 2: PHPMYADMIN & SQL CONSOLE */}
            {activeModule === 'db' && (
              <div className="space-y-4">
                <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                        phpMyAdmin SQL Query Console (Database: maharga_motor_db)
                      </h3>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Server: 127.0.0.1:3306</span>
                  </div>

                  <form onSubmit={handleRunSQL} className="space-y-2">
                    <textarea
                      rows={3}
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      placeholder="Tulis query SQL (contoh: SELECT * FROM units;)"
                      className="w-full p-2.5 rounded bg-zinc-950 border border-zinc-800 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSqlQuery('SELECT * FROM units;');
                            setSelectedTable('units');
                            setSqlResult(units);
                            setSqlMsg(`Showing ${units.length} rows`);
                          }}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono hover:bg-zinc-700"
                        >
                          TABLE: units
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSqlQuery('SELECT * FROM sales;');
                            setSelectedTable('sales');
                            setSqlResult(salesList);
                            setSqlMsg(`Showing ${salesList.length} rows`);
                          }}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono hover:bg-zinc-700"
                        >
                          TABLE: sales
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSqlQuery('SELECT * FROM employees;');
                            setSelectedTable('employees');
                            setSqlResult(employees);
                            setSqlMsg(`Showing ${employees.length} rows`);
                          }}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono hover:bg-zinc-700"
                        >
                          TABLE: employees
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 font-mono shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-zinc-950" />
                        Execute Query
                      </button>
                    </div>
                  </form>
                </div>

                {/* Query Result Table */}
                <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden">
                  <div className="p-2.5 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center text-xs font-mono">
                    <span className="text-emerald-400 font-bold">{sqlMsg || 'Database Ready'}</span>
                    <span className="text-zinc-500">Table: {selectedTable}</span>
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs text-zinc-300 font-mono">
                      <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 sticky top-0">
                        <tr>
                          {selectedTable === 'units' && (
                            <>
                              <th className="py-2 px-3">id</th>
                              <th className="py-2 px-3">nopol</th>
                              <th className="py-2 px-3">brand_model</th>
                              <th className="py-2 px-3">buy_price</th>
                              <th className="py-2 px-3">display_price</th>
                              <th className="py-2 px-3">status</th>
                            </>
                          )}
                          {selectedTable === 'sales' && (
                            <>
                              <th className="py-2 px-3">tx_id</th>
                              <th className="py-2 px-3">unit_name</th>
                              <th className="py-2 px-3">buyer_name</th>
                              <th className="py-2 px-3">deal_price</th>
                              <th className="py-2 px-3">payment_method</th>
                            </>
                          )}
                          {selectedTable === 'employees' && (
                            <>
                              <th className="py-2 px-3">user_id</th>
                              <th className="py-2 px-3">username</th>
                              <th className="py-2 px-3">name</th>
                              <th className="py-2 px-3">role</th>
                              <th className="py-2 px-3">pin_hash</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                        {selectedTable === 'units' && units.map(u => (
                          <tr key={u.id} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-3 font-bold text-zinc-400">{u.id}</td>
                            <td className="py-2 px-3 font-bold text-amber-400">{u.plate}</td>
                            <td className="py-2 px-3 text-zinc-200">{u.brand} {u.model}</td>
                            <td className="py-2 px-3 text-zinc-300">{formatIDR(u.buyPrice)}</td>
                            <td className="py-2 px-3 font-bold text-zinc-100">{formatIDR(u.displayPrice)}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {selectedTable === 'sales' && salesList.map(s => (
                          <tr key={s.id} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-3 font-bold text-zinc-400">{s.id}</td>
                            <td className="py-2 px-3 text-zinc-200">{s.unitName}</td>
                            <td className="py-2 px-3 text-zinc-300">{s.buyerName}</td>
                            <td className="py-2 px-3 font-bold text-emerald-400">{formatIDR(s.dealPrice)}</td>
                            <td className="py-2 px-3 uppercase">{s.paymentMethod}</td>
                          </tr>
                        ))}

                        {selectedTable === 'employees' && employees.map(e => (
                          <tr key={e.id} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-3 font-bold text-zinc-400">{e.id}</td>
                            <td className="py-2 px-3 text-amber-400">@{e.username}</td>
                            <td className="py-2 px-3 text-zinc-200">{e.name}</td>
                            <td className="py-2 px-3 uppercase font-bold text-zinc-400">{e.role}</td>
                            <td className="py-2 px-3 text-zinc-500 font-mono">•••• (PIN: {e.pin})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 3: DOMAINS & SSL */}
            {activeModule === 'domains' && (
              <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-4 text-xs">
                <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  Konfigurasi Domain & DNS Cloudflare
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-200 font-mono">mahargamotor.com</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                        SSL ACTIVE (HTTPS)
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Document Root: <code className="text-amber-300 font-mono">/home/maharga/public_html</code>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-300">DNS Zone Records:</h4>
                    <table className="w-full text-left font-mono text-[11px] border border-zinc-800">
                      <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Value</th>
                          <th className="p-2">Proxy Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        <tr>
                          <td className="p-2 text-zinc-200">@</td>
                          <td className="p-2 text-amber-400">A</td>
                          <td className="p-2">103.147.154.21</td>
                          <td className="p-2 text-orange-400">Proxied (Cloudflare)</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-zinc-200">www</td>
                          <td className="p-2 text-amber-400">CNAME</td>
                          <td className="p-2">mahargamotor.com</td>
                          <td className="p-2 text-orange-400">Proxied (Cloudflare)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 4: BACKUP WIZARD */}
            {activeModule === 'backup' && (
              <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-4 text-xs">
                <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Backup & Export Database (.sql & .zip)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                    <span className="font-bold text-zinc-200 block">Full Website Backup</span>
                    <p className="text-zinc-400 text-[11px]">Download seluruh berkas web `/public_html` dan konfigurasi JSON.</p>
                    <button
                      onClick={() => alert('Download backup_maharga_full.zip dimulai.')}
                      className="px-3.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 border border-zinc-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Full Backup (.zip)
                    </button>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                    <span className="font-bold text-zinc-200 block">Database MySQL Dump</span>
                    <p className="text-zinc-400 text-[11px]">Download dump data unit motor, histori penjualan, dan akun karyawan.</p>
                    <button
                      onClick={() => alert('Download database_maharga.sql dimulai.')}
                      className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Database (.sql)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 5: SECURITY & HTACCESS */}
            {activeModule === 'security' && (
              <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-4 text-xs">
                <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Security Rules & .htaccess Editor
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 whitespace-pre-line leading-relaxed">
{`# Maharga Motor Security Configuration (.htaccess)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Block direct access to config files
<FilesMatch "^(config\.json|\.env|\.git)">
    Order allow,deny
    Deny from all
</FilesMatch>

# LiteSpeed Cache Setup
<IfModule LiteSpeed>
    CacheLookup on
</IfModule>`}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Proteksi direktori dan SSL force aktif.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New File Modal */}
      {isNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100">Buat File Baru di Server</h3>
              <button onClick={() => setIsNewFileModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Nama File *</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: .htaccess atau settings.json"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Direktori Path</label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Konten Awal</label>
                <textarea
                  rows={4}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewFileModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm"
                >
                  Simpan File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
