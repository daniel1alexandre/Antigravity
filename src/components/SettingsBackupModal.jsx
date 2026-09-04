import React, { useRef, useState } from 'react';
import {
  Settings,
  X,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Plus,
  Edit2,
  Check,
  MapPin,
} from 'lucide-react';
import { exportTournamentJSON, resetToDemoData, clearAllData } from '../utils/storage';
import { DEFAULT_COURTS } from '../types/tournament';

export default function SettingsBackupModal({
  isOpen,
  onClose,
  eventInfo,
  setEventInfo,
  categories,
  setCategories,
  teams,
  setTeams,
  brackets,
  setBrackets,
  setSelectedCategoryId,
}) {
  const fileInputRef = useRef(null);

  const [newCourtName, setNewCourtName] = useState('');
  const [editingCourtId, setEditingCourtId] = useState(null);
  const [editingCourtName, setEditingCourtName] = useState('');

  if (!isOpen) return null;

  const courts = Array.isArray(eventInfo?.courts) ? eventInfo.courts : DEFAULT_COURTS;

  const updateCourts = (next) => setEventInfo({ ...eventInfo, courts: next });

  const handleAddCourt = () => {
    const name = newCourtName.trim();
    if (!name) return;
    if (courts.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Já existe uma quadra com esse nome.');
      return;
    }
    updateCourts([...courts, { id: `court-${Date.now()}`, name, description: '' }]);
    setNewCourtName('');
  };

  const handleStartEdit = (court) => {
    setEditingCourtId(court.id);
    setEditingCourtName(court.name);
  };

  const handleSaveEdit = (courtId) => {
    const name = editingCourtName.trim();
    if (!name) return;
    updateCourts(courts.map((c) => (c.id === courtId ? { ...c, name } : c)));
    setEditingCourtId(null);
  };

  const handleDeleteCourt = (courtId) => {
    if (courts.length <= 1) {
      alert('É preciso manter pelo menos uma quadra cadastrada.');
      return;
    }
    if (window.confirm('Excluir esta quadra?')) {
      updateCourts(courts.filter((c) => c.id !== courtId));
    }
  };

  const handleSaveInfo = (e) => {
    e.preventDefault();
    alert('Configurações do evento atualizadas!');
    onClose();
  };

  const handleExport = () => {
    exportTournamentJSON({ eventInfo, categories, teams, brackets, exportedAt: new Date().toISOString() });
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.eventInfo) setEventInfo(imported.eventInfo);
        if (imported.categories) {
          setCategories(imported.categories);
          setSelectedCategoryId(imported.categories[0]?.id || '');
        }
        if (imported.teams) setTeams(imported.teams);
        if (imported.brackets) setBrackets(imported.brackets);
        alert('Backup restaurado com sucesso!');
        onClose();
      } catch {
        alert('Erro ao importar arquivo JSON: formato inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (window.confirm('Restaurar dados de demonstração?')) {
      const demo = resetToDemoData();
      setEventInfo(demo.eventInfo);
      setCategories(demo.categories);
      setTeams(demo.teams);
      setBrackets({});
      setSelectedCategoryId(demo.categories[0]?.id || '');
      onClose();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('ATENÇÃO: Apagar TODOS os dados? Esta ação é irreversível.')) {
      const empty = clearAllData();
      setEventInfo(empty.eventInfo);
      setCategories(empty.categories);
      setTeams([]);
      setBrackets({});
      setSelectedCategoryId(empty.categories[0]?.id || '');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 my-6 relative">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              Configurações & Backup do Torneio
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Event Details ── */}
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Oficial do Torneio *</label>
            <input
              type="text"
              required
              value={eventInfo?.name || ''}
              onChange={(e) => setEventInfo({ ...eventInfo, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Local / Arena</label>
              <input
                type="text"
                placeholder="Ex: Arena Praia Sol"
                value={eventInfo?.location || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade / UF</label>
              <input
                type="text"
                placeholder="Ex: Santos - SP"
                value={eventInfo?.city || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data do Evento</label>
              <input
                type="date"
                value={eventInfo?.date || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Organizador</label>
              <input
                type="text"
                placeholder="Ex: DB Sports"
                value={eventInfo?.organizer || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, organizer: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-amber transition-all"
          >
            Salvar Dados do Torneio
          </button>
        </form>

        {/* ══════════════════════════════════════
            COURTS MANAGER
            ══════════════════════════════════════ */}
        <div className="pt-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Gerenciar Quadras do Evento
            </h4>
            <span className="text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              {courts.length} quadra{courts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {courts.map((court, idx) => (
              <div
                key={court.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 group transition-colors hover:border-slate-700"
              >
                {/* Number badge */}
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-[11px] font-black flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  {idx + 1}
                </span>

                {editingCourtId === court.id ? (
                  <input
                    autoFocus
                    value={editingCourtName}
                    onChange={(e) => setEditingCourtName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(court.id);
                      if (e.key === 'Escape') setEditingCourtId(null);
                    }}
                    className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-amber-500 text-xs text-white font-semibold focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 text-sm font-semibold text-slate-200">{court.name}</span>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingCourtId === court.id ? (
                    <button
                      onClick={() => handleSaveEdit(court.id)}
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                      title="Salvar nome"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(court)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Renomear"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCourt(court.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Excluir quadra"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add court row */}
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder='Nome da nova quadra, ex: "Quadra 4"'
                value={newCourtName}
                onChange={(e) => setNewCourtName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddCourt(); }
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCourt}
              disabled={!newCourtName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-amber transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        </div>

        {/* ── Backup & Recovery ── */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Gerenciamento de Dados & Backup
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-xs font-semibold transition-all hover:text-emerald-400"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Exportar Backup (.JSON)
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-xs font-semibold transition-all hover:text-cyan-400"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              Restaurar Backup (.JSON)
            </button>
            <input type="file" ref={fileInputRef} accept=".json" onChange={handleImportFile} className="hidden" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleResetDemo}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-amber-400 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Demonstração
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 hover:bg-rose-900/40 text-rose-400 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Todos os Dados
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
