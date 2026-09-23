import React, { useState } from 'react';
import {
  Users,
  GitBranch,
  Calendar,
  Lock,
  ChevronRight,
  MapPin,
  Search,
  X,
  Trophy,
  Eye,
  Layers,
  Clock,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';
import TournamentBracket from './TournamentBracket';
import ScheduleManager from './ScheduleManager';
import PublicRegistrationModal from './PublicRegistrationModal';

// ─── Tab IDs ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'teams',    label: 'Duplas Inscritas', icon: Users },
  { id: 'bracket',  label: 'Chaveamento',      icon: GitBranch },
  { id: 'schedule', label: 'Programação',      icon: Calendar },
];

// ─── Duplas Inscritas (View Only) ────────────────────────────────────────────
function PublicTeamsTab({ teams, categories, onOpenRegister }) {
  const [selectedCat, setSelectedCat] = useState(categories[0]?.id || '');
  const [search, setSearch] = useState('');

  const catTeams = teams.filter(t => t.categoryId === selectedCat);
  const filtered = catTeams.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.displayName?.toLowerCase().includes(q) ||
      t.player1?.name?.toLowerCase().includes(q) ||
      t.player2?.name?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q)
    );
  });

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
        <Layers className="w-12 h-12 text-slate-700" />
        <p className="text-slate-400 font-semibold">Nenhuma categoria cadastrada ainda.</p>
        <p className="text-xs text-slate-600">Aguarde a organização configurar o torneio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => { setSelectedCat(c.id); setSearch(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCat === c.id
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {c.name} ({teams.filter(t => t.categoryId === c.id).length})
          </button>
        ))}
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar atleta ou cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {onOpenRegister && (
          <button
            onClick={() => onOpenRegister(selectedCat)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-amber transition-all whitespace-nowrap cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>Inscrever Dupla nesta Categoria</span>
          </button>
        )}
      </div>

      {/* Teams Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 space-y-2 text-center">
          <Users className="w-10 h-10 text-slate-700" />
          <p className="text-slate-400 text-sm font-semibold">
            {catTeams.length === 0 ? 'Nenhuma dupla inscrita nesta categoria.' : 'Nenhuma dupla encontrada para a busca.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t, idx) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all duration-200 space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">DUPLA #{idx + 1}</span>
                  <h4 className="text-sm font-extrabold text-white font-display group-hover:text-amber-300 transition-colors">
                    {t.displayName}
                  </h4>
                  {t.city && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-400" /> {t.city}
                    </span>
                  )}
                </div>
                {t.isSeed && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex-shrink-0">
                    Seed #{t.seedRank || 1}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="bg-slate-950/70 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wide">Atleta 1</span>
                  <span className="text-xs text-slate-200 font-semibold">{t.player1?.name || '—'}</span>
                  {t.player1?.shirtSize && (
                    <span className="text-[10px] text-slate-500 block">Camisa {t.player1.shirtSize}</span>
                  )}
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wide">Atleta 2</span>
                  <span className="text-xs text-slate-200 font-semibold">{t.player2?.name || '—'}</span>
                  {t.player2?.shirtSize && (
                    <span className="text-[10px] text-slate-500 block">Camisa {t.player2.shirtSize}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chaveamento (View Only) ────────────────────────────────────────────────
function PublicBracketTab({ categories, teams, brackets, eventInfo, selectedCategoryId, setSelectedCategoryId }) {
  const currentCategory = categories.find(c => c.id === selectedCategoryId) || categories[0] || null;
  const currentBracket = selectedCategoryId ? (brackets[selectedCategoryId] || null) : null;

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
        <GitBranch className="w-12 h-12 text-slate-700" />
        <p className="text-slate-400 font-semibold">Nenhuma categoria disponível.</p>
      </div>
    );
  }

  if (!currentBracket) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
        <Clock className="w-12 h-12 text-slate-700" />
        <p className="text-slate-300 font-bold text-lg">Chave ainda não sorteada</p>
        <p className="text-xs text-slate-500">
          Aguarde a organização realizar o sorteio oficial para esta categoria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategoryId(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategoryId === c.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Bracket (read-only: no modals, no draw, no reset) */}
      <TournamentBracket
        bracket={currentBracket}
        allBrackets={brackets}
        category={currentCategory}
        courts={eventInfo?.courts}
        targetMatchId={null}
        onOpenScoreModal={() => {}}
        onOpenCourtScoreboard={() => {}}
        onOpenDrawModal={() => {}}
        onResetBracket={() => {}}
        onOpenLiveArena={() => {}}
        onUpdateCourt={() => {}}
        isReadOnly={true}
      />
    </div>
  );
}

// ─── Programação (View Only) ────────────────────────────────────────────────
function PublicScheduleTab({ categories, teams, brackets, eventInfo }) {
  return (
    <ScheduleManager
      categories={categories}
      teams={teams}
      brackets={brackets}
      eventInfo={eventInfo}
      setEventInfo={() => {}}
      onNavigateToBracket={() => {}}
      isReadOnly={true}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PublicViewScreen({
  eventInfo,
  categories = [],
  teams = [],
  brackets = {},
  onGoToLogin,
  onRegisterTeam,
}) {
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerDefaultCatId, setRegisterDefaultCatId] = useState(null);

  const totalTeams = teams.length;
  const totalAthletes = teams.length * 2;

  const handleOpenRegister = (catId = null) => {
    setRegisterDefaultCatId(catId || selectedCategoryId || categories[0]?.id || '');
    setIsRegisterModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-white flex flex-col">
      {/* Background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#070B12]/95 backdrop-blur-md border-b border-slate-800/80 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 flex-shrink-0 shadow-lg">
              <img src="/db-logo.jpg" alt="DB Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-base sm:text-lg text-white font-display tracking-tight">
                  DB Futvôlei Pro
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  VISUALIZAÇÃO PÚBLICA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {eventInfo?.name || 'Torneio'} • {eventInfo?.organizer || 'DB Sports'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenRegister()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Inscrever Dupla</span>
            </button>

            <button
              onClick={onGoToLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg transition-all transform hover:scale-105 active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fazer Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tournament Info Bar ── */}
      <div className="bg-slate-900/60 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-widest">Duplas</span>
              <span className="text-xl font-black text-white font-display">{totalTeams}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-widest">Atletas</span>
              <span className="text-xl font-black text-amber-400 font-display">{totalAthletes}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-widest">Categorias</span>
              <span className="text-xl font-black text-purple-400 font-display">{categories.length}</span>
            </div>
            {eventInfo?.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{eventInfo.location}{eventInfo.city ? ` • ${eventInfo.city}` : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Read-only Notice ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 w-full">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center gap-3 text-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-slate-400">
            <strong className="text-amber-300">Modo Somente Leitura</strong> — Você está visualizando o torneio sem login.
            Para gerenciar partidas, duplas e financeiro,{' '}
            <button onClick={onGoToLogin} className="text-amber-400 underline hover:text-amber-300 font-bold">
              faça login
            </button>
            .
          </span>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 w-full">
        <div className="flex gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60 w-full sm:w-auto sm:inline-flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none justify-center sm:justify-start ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {activeTab === 'teams' && (
          <PublicTeamsTab
            teams={teams}
            categories={categories}
            onOpenRegister={handleOpenRegister}
          />
        )}
        {activeTab === 'bracket' && (
          <PublicBracketTab
            categories={categories}
            teams={teams}
            brackets={brackets}
            eventInfo={eventInfo}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        )}
        {activeTab === 'schedule' && (
          <PublicScheduleTab
            categories={categories}
            teams={teams}
            brackets={brackets}
            eventInfo={eventInfo}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {eventInfo?.name || 'Futvôlei Pro Arena'} — Organização:{' '}
            <strong className="text-slate-400">{eventInfo?.organizer || 'DB Sports'}</strong>
          </p>
          <p className="text-[11px] text-slate-600">
            Double Elimination Engine v2.0 • Visualização Pública
          </p>
        </div>
      </footer>

      {/* ── Public Registration Modal ── */}
      <PublicRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        categories={categories}
        teams={teams}
        eventInfo={eventInfo}
        onRegisterTeam={onRegisterTeam}
        defaultCategoryId={registerDefaultCatId}
      />
    </div>
  );
}
