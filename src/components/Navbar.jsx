import React from 'react';
import { 
  Trophy, 
  Users, 
  CreditCard, 
  GitBranch, 
  Layers, 
  Tv, 
  Settings, 
  Shuffle, 
  PlusCircle, 
  Flame,
  Award,
  FileText,
  User,
  KeyRound,
  LogOut,
  ShieldCheck,
  Lock,
  Eye
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  categories = [], 
  selectedCategoryId, 
  setSelectedCategoryId,
  onOpenNewTournamentModal,
  onOpenSettingsModal,
  onOpenUserManager,
  onOpenLogin,
  currentUser,
  onLogout,
  teamsCount,
  hasBracket,
  isReadOnly = false
}) {
  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0] || null;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isGuest = !currentUser || currentUser?.role === 'VIEWER';
  const canAccessFinancial = isAdmin || Boolean(currentUser?.permissions?.manageFinancial);
  const canManageTournaments = isAdmin || Boolean(currentUser?.permissions?.manageTournaments);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('teams')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-glow-amber border border-amber-500/40 bg-slate-900 flex-shrink-0 flex items-center justify-center">
              <img 
                src="/db-logo.jpg" 
                alt="DB Futvôlei Pro Logo" 
                className="w-full h-full object-cover object-center" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                  DB FUTVÔLEI <span className="text-amber-400 font-extrabold">PRO</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Gestão de Torneios, Sorteios e Chaves</p>
            </div>
          </div>

          {/* Category Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
            <span className="text-xs font-medium text-slate-400 hidden md:inline">Categoria:</span>
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-amber-400 focus:outline-none cursor-pointer pr-2"
            >
              {categories.length === 0 ? (
                <option value="" className="bg-slate-900 text-slate-400">
                  Nenhuma Categoria
                </option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                    {cat.name} ({cat.shortName})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* User Session & Action Quick Buttons */}
          <div className="flex items-center gap-2">
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-semibold">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Visualização</span>
                </div>
                <button
                  onClick={onOpenLogin}
                  title="Fazer login no sistema"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-950" />
                  <span>Fazer Login</span>
                </button>
              </div>
            ) : (
              <>
                {/* User Badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-slate-200 max-w-[110px] truncate">
                    {currentUser?.name || currentUser?.username}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentUser?.role === 'ADMIN' ? 'Admin' : currentUser?.role === 'OPERATOR' ? 'Mesário' : 'Visitante'}
                  </span>
                </div>

                {/* Admin User Management Button */}
                {isAdmin && (
                  <button
                    onClick={onOpenUserManager}
                    title="Gerenciar Usuários & Permissões"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold transition-all shadow-sm"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span className="hidden xl:inline">Usuários</span>
                  </button>
                )}

                {/* Create Tournament Button (Admins only) */}
                {canManageTournaments && (
                  <button
                    onClick={onOpenNewTournamentModal}
                    title="Criar Novo Torneio do Zero"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-950" />
                    <span className="hidden sm:inline">Criar Novo Torneio</span>
                    <span className="sm:hidden">Novo</span>
                  </button>
                )}

                {/* Settings Button */}
                {isAdmin && (
                  <button
                    onClick={onOpenSettingsModal}
                    title="Configurações e Backup"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}

                {/* Logout / Switch User */}
                <button
                  onClick={onLogout}
                  title="Sair / Desconectar"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto py-2.5 border-t border-slate-800/80 no-scrollbar">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'teams'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Duplas & Inscrições</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
              {teamsCount}
            </span>
          </button>

          {canAccessFinancial && (
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Financeiro</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitBranch className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Chaveamento</span>
            {hasBracket && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'standings'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>Pódio & Campeões</span>
          </button>

          {(!isGuest || isAdmin) && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>Categorias</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Relatórios</span>
          </button>

          <button
            onClick={() => setActiveTab('arena')}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'arena'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Tv className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Telão Oficial</span>
          </button>
        </div>
      </div>
    </header>
  );
}
