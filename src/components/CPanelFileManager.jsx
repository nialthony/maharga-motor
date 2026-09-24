import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  Image, 
  Database, 
  Code, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Download, 
  Save, 
  X, 
  HardDrive, 
  Search,
  CheckCircle2,
  FileCode,
  Globe,
  Cloud
} from 'lucide-react';

export default function CPanelFileManager({ files, setFiles }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isNewFileModal, setIsNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('/custom/');
  const [newFileType, setNewFileType] = useState('text');
  const [newFileContent, setNewFileContent] = useState('');

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (file) => {
    setSelectedFile(file);
    setEditContent(file.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedFile) return;
    setFiles(prev => prev.map(f => f.id === selectedFile.id ? { 
      ...f, 
      content: editContent,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    } : f));
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (confirm('Yakin ingin menghapus file ini dari storage cPanel?')) {
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

  const handleSimulateUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileObj = {
        id: `f-${Date.now()}`,
        name: uploadedFile.name,
        path: `/uploads/${uploadedFile.name}`,
        size: `${(uploadedFile.size / 1024).toFixed(1)} KB`,
        type: uploadedFile.type.includes('image') ? 'image' : 'text',
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        content: event.target.result
      };
      setFiles(prev => [fileObj, ...prev]);
    };

    if (uploadedFile.type.includes('image')) {
      reader.readAsDataURL(uploadedFile);
    } else {
      reader.readAsText(uploadedFile);
    }
  };

  const getFileIcon = (type) => {
    switch(type) {
      case 'image': return <Image className="w-4 h-4 text-emerald-400" />;
      case 'json': return <Code className="w-4 h-4 text-amber-400" />;
      case 'sql': return <Database className="w-4 h-4 text-blue-400" />;
      default: return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            cPanel File Manager & Web Config
          </h2>
          <p className="text-xs text-zinc-400">
            Kelola asset gambar, template banner, konfigurasi JSON showroom, dan file backup database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            Upload File
            <input type="file" onChange={handleSimulateUpload} className="hidden" />
          </label>
          <button
            onClick={() => setIsNewFileModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Buat File Baru
          </button>
        </div>
      </div>

      {/* Cloudflare Pages Deployment Notice Banner */}
      <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-zinc-200 block">Cloudflare Pages Ready</span>
            <span className="text-zinc-400 text-[11px]">Build command: <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">npm run build</code> • Output directory: <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">dist</code></span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
          STATIC SPA COMPATIBLE
        </span>
      </div>

      {/* Main Split: File Table & Preview/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* File List */}
        <div className="lg:col-span-2 bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm space-y-0">
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">{filteredFiles.length} file</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Nama File</th>
                  <th className="py-2.5 px-4">Path Lokasi</th>
                  <th className="py-2.5 px-4">Ukuran</th>
                  <th className="py-2.5 px-4">Terakhir Diubah</th>
                  <th className="py-2.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredFiles.map((f) => (
                  <tr 
                    key={f.id} 
                    onClick={() => {
                      setSelectedFile(f);
                      setIsEditing(false);
                    }}
                    className={`cursor-pointer transition-colors ${
                      selectedFile?.id === f.id ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-bold text-zinc-100 flex items-center gap-2">
                      {getFileIcon(f.type)}
                      <span>{f.name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 text-[11px]">{f.path}</td>
                    <td className="py-2.5 px-4 text-zinc-400 text-[11px]">{f.size}</td>
                    <td className="py-2.5 px-4 text-zinc-500 text-[11px]">{f.updatedAt}</td>
                    <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(f)}
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
                          title="Edit File"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1 rounded hover:bg-zinc-700 text-rose-400"
                          title="Hapus File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Editor / Inspector */}
        <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile.type)}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 font-mono">{selectedFile.name}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">{selectedFile.path}</span>
                  </div>
                </div>

                {!isEditing && selectedFile.type !== 'image' && (
                  <button
                    onClick={() => handleEdit(selectedFile)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    rows={14}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {selectedFile.type === 'image' ? (
                    <div className="space-y-2">
                      <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                        <img src={selectedFile.content} alt={selectedFile.name} className="w-full h-48 object-cover" />
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono text-center">{selectedFile.size}</p>
                    </div>
                  ) : (
                    <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
                      {selectedFile.content}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 text-xs space-y-1">
              <FileCode className="w-6 h-6 mx-auto text-zinc-600 mb-2" />
              <p>Pilih file dari daftar sebelah kiri untuk melihat isi atau mengedit kode.</p>
            </div>
          )}
        </div>
      </div>

      {/* New File Modal */}
      {isNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xl">
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
                  placeholder="contoh: settings.json atau notice.txt"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Tipe File</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="text">Text (.txt / .md)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="sql">SQL Dump (.sql)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Direktori Folder</label>
                  <input
                    type="text"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Isi / Konten File Awal</label>
                <textarea
                  rows={5}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Tuliskan teks atau data JSON di sini..."
                  className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewFileModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm"
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
