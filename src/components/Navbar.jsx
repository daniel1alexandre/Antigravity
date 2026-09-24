import React, { useState, useRef, useEffect } from 'react';
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
  Eye,
  Calendar,
  ChevronDown,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  categories = [], 
  selectedCategoryId, 
  setSelectedCategoryId,
  tournaments = [],
  activeTournamentId,
  onSelectTournament,
  onOpenTournamentManager,
  onClearTournament,
  onDeleteTournament,
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
  const [isTournamentDropdownOpen, setIsTournamentDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || tournaments[0] || null;
  
  const isAdmin = currentUser?.role === 'ADMIN';
  const isGuest = !currentUser || currentUser?.role === 'VIEWER';
  const canAccessFinancial = isAdmin || Boolean(currentUser?.permissions?.manageFinancial);
  const canManageTournaments = isAdmin || Boolean(currentUser?.permissions?.manageTournaments);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTournamentDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navTabs = [
    {
      id: 'categories',
      label: 'Categorias',
      icon: Layers,
      color: 'text-purple-400',
      badge: categories.length > 0 ? categories.length : null,
      visible: !isGuest || isAdmin,
    },
    {
      id: 'teams',
      label: 'Duplas',
      icon: Users,
      color: 'text-amber-400',
      badge: teamsCount,
      visible: true,
    },
    {
      id: 'payments',
      label: 'Financeiro',
      icon: CreditCard,
      color: 'text-emerald-400',
      visible: canAccessFinancial,
    },
    {
      id: 'bracket',
      label: 'Jogos',
      icon: GitBranch,
      color: 'text-cyan-400',
      hasDot: hasBracket,
      visible: true,
    },
    {
      id: 'schedule',
      label: 'Programação',
      icon: Calendar,
      color: 'text-blue-400',
      visible: true,
    },
    {
      id: 'standings',
      label: 'Campeões',
      icon: Trophy,
      color: 'text-yellow-400',
      visible: true,
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: FileText,
      color: 'text-teal-400',
      visible: true,
    },
    {
      id: 'arena',
      label: 'Telão',
      icon: Tv,
      color: 'text-rose-400',
      visible: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Row: Brand, Context Switchers, Quick Actions & Profile */}
        <div className="flex items-center justify-between py-3 gap-2 sm:gap-4">
          
          {/* Left: Brand Identity */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group flex-shrink-0" 
            onClick={() => setActiveTab('categories')}
            title="Ir para o Início"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-glow-amber border border-amber-500/40 bg-slate-900 flex-shrink-0 flex items-center justify-center group-hover:border-amber-400 transition-all transform group-hover:scale-105">
              <img 
                src="/db-logo.jpg" 
                alt="DB Futvôlei Pro Logo" 
                className="w-full h-full object-cover object-center" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black font-display tracking-tight text-white flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                  DB FUTVÔLEI <span className="text-amber-400 font-extrabold">PRO</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Arena
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block leading-none mt-0.5">
                Gestão Oficial de Torneios & Chaves
              </p>
            </div>
          </div>

          {/* Center: Context Selectors (Torneio Ativo & Categoria) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink min-w-0">
            
            {/* Tournament Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsTournamentDropdownOpen(!isTournamentDropdownOpen)}
                title="Torneio Atual (clique para alternar)"
                className={`h-9 sm:h-10 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition-all max-w-[150px] sm:max-w-[200px] md:max-w-[260px] truncate ${
                  isTournamentDropdownOpen
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-glow-amber'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-amber-500/40 text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate font-bold">
                  {activeTournament?.eventInfo?.name || 'Torneio'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isTournamentDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {/* Tournament Dropdown Menu */}
              {isTournamentDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/98 border border-slate-700/90 shadow-2xl z-50 p-2 text-xs space-y-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Meus Torneios ({tournaments.length})</span>
                    {canManageTournaments && (
                      <button
                        onClick={() => {
                          setIsTournamentDropdownOpen(false);
                          onOpenNewTournamentModal();
                        }}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 lowercase first-letter:uppercase font-bold"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Novo</span>
                      </button>
                    )}
                  </div>

                  {/* List of tournaments */}
                  <div className="max-h-60 overflow-y-auto space-y-1 py-1 pr-1">
                    {tournaments.map((t) => {
                      const isCurrent = t.id === activeTournamentId;
                      return (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between p-2 rounded-xl transition-all group ${
                            isCurrent
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold'
                              : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-200 border border-transparent'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectTournament(t.id);
                              setIsTournamentDropdownOpen(false);
                            }}
                            className="flex-1 text-left flex items-center gap-2 truncate mr-2"
                            title={t.eventInfo?.name}
                          >
                            <Trophy className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-amber-400' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <span className="block truncate text-xs">{t.eventInfo?.name || 'Torneio'}</span>
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {t.categories?.length || 0} cat • {t.teams?.length || 0} duplas
                              </span>
                            </div>
                          </button>

                          {/* Quick action buttons per tournament */}
                          {canManageTournaments && (
                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsTournamentDropdownOpen(false);
                                  onClearTournament(t.id);
                                }}
                                title="Limpar dados (mantém apenas as categorias)"
                                className="p-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsTournamentDropdownOpen(false);
                                  onDeleteTournament(t.id);
                                }}
                                title="Excluir torneio"
                                className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer of Dropdown */}
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <button
                      onClick={() => {
                        setIsTournamentDropdownOpen(false);
                        onOpenTournamentManager();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-center font-bold text-slate-200 transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gerenciar Todos os Torneios</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right: Quick Action Buttons & User Session */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-semibold">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Visualização</span>
                </div>
                <button
                  onClick={onOpenLogin}
                  title="Fazer login no sistema"
                  className="h-9 sm:h-10 flex items-center gap-1.5 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-950" />
                  <span>Fazer Login</span>
                </button>
              </div>
            ) : (
              <>
                {/* Primary Action: Criar Novo Torneio */}
                {canManageTournaments && (
                  <button
                    onClick={onOpenNewTournamentModal}
                    title="Criar Novo Torneio Independente"
                    className="h-9 sm:h-10 flex items-center gap-1.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
                    <span className="hidden sm:inline">Novo Torneio</span>
                    <span className="sm:hidden">Novo</span>
                  </button>
                )}

                {/* Toolbar: Torneios, Usuários, Configurações */}
                <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
                  {/* Manage Tournaments Button (Modal) */}
                  <button
                    onClick={onOpenTournamentManager}
                    title="Gerenciar Todos os Torneios"
                    className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden xl:inline text-xs">Torneios</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                      {tournaments.length}
                    </span>
                  </button>

                  {/* Admin User Management Button */}
                  {isAdmin && (
                    <button
                      onClick={onOpenUserManager}
                      title="Gerenciar Usuários & Permissões"
                      className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden xl:inline text-xs">Usuários</span>
                    </button>
                  )}

                  {/* Settings Button */}
                  {isAdmin && (
                    <button
                      onClick={onOpenSettingsModal}
                      title="Configurações e Backup"
                      className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-center"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* User Session Pill */}
                <div className="flex items-center bg-slate-900/90 pl-2.5 pr-1 py-1 rounded-xl border border-slate-800 h-9 sm:h-10 gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                    </div>
                    <div className="hidden lg:block text-left leading-none">
                      <span className="block font-bold text-xs text-slate-200 max-w-[90px] truncate">
                        {currentUser?.name || currentUser?.username}
                      </span>
                      <span className="text-[9px] font-semibold text-amber-400/90 uppercase tracking-wider">
                        {currentUser?.role === 'ADMIN' ? 'Admin' : currentUser?.role === 'OPERATOR' ? 'Mesário' : 'Visitante'}
                      </span>
                    </div>
                  </div>

                  {/* Logout / Switch User */}
                  <button
                    onClick={onLogout}
                    title="Sair / Desconectar"
                    className="w-7 h-7 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Tab Navigation Menu (Harmonious & Professional Broadcast Style) */}
        <div className="py-2.5 border-t border-slate-800/80">
          <div className="flex items-center justify-start md:justify-center gap-1.5 sm:gap-2.5 lg:gap-3 overflow-x-auto no-scrollbar px-1">
            {navTabs.filter(t => t.visible).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap active:scale-95 flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : tab.color}`} />
                  <span>{tab.label}</span>
                  
                  {/* Count Badge */}
                  {tab.badge !== undefined && tab.badge !== null && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive 
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}>
                      {tab.badge}
                    </span>
                  )}

                  {/* Bracket Active Dot */}
                  {tab.hasDot && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </header>
  );
}
