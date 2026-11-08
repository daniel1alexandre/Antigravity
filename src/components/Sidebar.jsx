import React, { useState, useRef, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  CreditCard, 
  GitBranch, 
  Layers, 
  Tv, 
  Settings, 
  PlusCircle, 
  Calendar, 
  FileText, 
  User, 
  KeyRound, 
  LogOut, 
  Lock, 
  Eye, 
  ChevronDown, 
  RotateCcw, 
  Trash2, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Flame,
  LayoutDashboard
} from 'lucide-react';

export default function Sidebar({
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
  teamsCount = 0,
  hasBracket = false,
  isReadOnly = false,
  isOpen = true,
  onToggleSidebar,
  isMobile = false,
  onCloseMobile
}) {
  const [isTournamentMenuOpen, setIsTournamentMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dropdownRef = useRef(null);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || tournaments[0] || null;

  const isAdmin = currentUser?.role === 'ADMIN';
  const isGuest = !currentUser || currentUser?.role === 'VIEWER';
  const canAccessFinancial = isAdmin || Boolean(currentUser?.permissions?.manageFinancial);
  const canManageTournaments = isAdmin || Boolean(currentUser?.permissions?.manageTournaments);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTournamentMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main navigation tabs
  const navTabs = [
    {
      id: 'teams',
      label: 'Duplas',
      icon: Users,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badge: teamsCount,
      visible: true,
    },
    {
      id: 'bracket',
      label: 'Jogos & Chaves',
      icon: GitBranch,
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      hasDot: hasBracket,
      visible: true,
    },
    {
      id: 'schedule',
      label: 'Programação',
      icon: Calendar,
      color: 'text-blue-400',
      activeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      visible: true,
    },
    {
      id: 'arena',
      label: 'Telão / Live',
      icon: Tv,
      color: 'text-rose-400',
      activeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      visible: true,
    },
    {
      id: 'standings',
      label: 'Pódio & Campeões',
      icon: Trophy,
      color: 'text-yellow-400',
      activeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      visible: true,
    },
    {
      id: 'reports',
      label: 'Relatórios & Súmulas',
      icon: FileText,
      color: 'text-teal-400',
      activeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      visible: true,
    },
    {
      id: 'payments',
      label: 'Financeiro & PIX',
      icon: CreditCard,
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      visible: canAccessFinancial,
    },
    {
      id: 'categories',
      label: 'Categorias',
      icon: Layers,
      color: 'text-purple-400',
      activeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      badge: categories.length > 0 ? categories.length : null,
      visible: !isGuest || isAdmin,
    },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMobile && isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`z-40 flex flex-col bg-[#0d121c] border-r border-slate-800 shadow-2xl transition-all duration-300 ease-in-out h-screen ${
          isMobile
            ? `fixed inset-y-0 left-0 ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}`
            : `sticky top-0 flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`
        }`}
      >
        {/* 1. Header: Brand Identity & Toggle Button */}
        <div className="p-3.5 border-b border-slate-800/90 flex items-center justify-between gap-2 bg-slate-950/40">
          <div 
            onClick={() => handleTabClick('teams')}
            className={`flex items-center gap-2.5 cursor-pointer group min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}
            title="DB Futvôlei Pro Arena"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-glow-amber border border-amber-500/40 bg-slate-900 flex-shrink-0 flex items-center justify-center group-hover:border-amber-400 transition-all transform group-hover:scale-105">
              <img 
                src="/db-logo.jpg" 
                alt="DB Logo" 
                className="w-full h-full object-cover object-center" 
              />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-black font-display tracking-tight text-white group-hover:text-amber-300 transition-colors truncate">
                    DB FUTVÔLEI <span className="text-amber-400">PRO</span>
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Arena & Chaves Oficiais
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {isMobile ? (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            /* Desktop Collapse toggle button */
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* 2. Scrollable Body: Tournaments, Categories, Navigation & Settings */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 no-scrollbar">

          {/* Context Switchers: Tournament & Category */}
          {!isCollapsed && (
            <div className="space-y-2 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              
              {/* Active Tournament Selector */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>Torneio Ativo</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {tournaments.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsTournamentMenuOpen(!isTournamentMenuOpen)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all text-left truncate ${
                    isTournamentMenuOpen
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-700/80 hover:border-amber-500/40 text-slate-200'
                  }`}
                >
                  <span className="truncate">{activeTournament?.eventInfo?.name || 'Torneio'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${isTournamentMenuOpen ? 'rotate-180 text-amber-400' : ''}`} />
                </button>

                {/* Tournament Dropdown Popup */}
                {isTournamentMenuOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-1.5 text-xs space-y-1 backdrop-blur-xl">
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {tournaments.map((t) => {
                        const isCurrent = t.id === activeTournamentId;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              onSelectTournament(t.id);
                              setIsTournamentMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                              isCurrent
                                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate">{t.eventInfo?.name || 'Torneio'}</span>
                            {isCurrent && <span className="text-[10px] text-amber-400 font-bold ml-1">Ativo</span>}
                          </button>
                        );
                      })}
                    </div>
                    {canManageTournaments && (
                      <div className="pt-1.5 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setIsTournamentMenuOpen(false);
                            onOpenNewTournamentModal();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-all"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Novo Torneio</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active Category Selector */}
              {categories.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Categoria</span>
                    </span>
                  </div>
                  <select
                    value={selectedCategoryId || categories[0]?.id || ''}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 hover:border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 cursor-pointer truncate"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white font-semibold">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          )}

          {/* 3. Section: Menus Principais / Navegação */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Menu do Torneio
              </span>
            )}
            <div className="space-y-1">
              {navTabs.filter(t => t.visible).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    title={isCollapsed ? tab.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isCollapsed ? 'justify-center' : 'justify-between'
                    } ${
                      isActive
                        ? `${tab.activeColor} border shadow-sm font-bold`
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : tab.color}`} />
                      {!isCollapsed && <span className="truncate">{tab.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {tab.badge !== undefined && tab.badge !== null && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                            isActive
                              ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                        {tab.hasDot && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Section: Configurações & Gestão */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            {!isCollapsed && (
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Configurações & Gestão
              </span>
            )}
            <div className="space-y-1">
              
              {/* Novo Torneio */}
              {canManageTournaments && (
                <button
                  onClick={onOpenNewTournamentModal}
                  title={isCollapsed ? 'Novo Torneio' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20 group ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-amber-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  {!isCollapsed && <span>Novo Torneio</span>}
                </button>
              )}

              {/* Gerenciador de Torneios */}
              <button
                onClick={onOpenTournamentManager}
                title={isCollapsed ? 'Gerenciador de Torneios' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-slate-800/70 transition-all border border-transparent ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">Gerenciar Torneios</span>}
                </div>
                {!isCollapsed && (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    {tournaments.length}
                  </span>
                )}
              </button>

              {/* Usuários & Permissões (Admin) */}
              {isAdmin && (
                <button
                  onClick={onOpenUserManager}
                  title={isCollapsed ? 'Usuários & Permissões' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-slate-800/70 transition-all border border-transparent ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  {!isCollapsed && <span>Usuários & Senhas</span>}
                </button>
              )}

              {/* Configurações & Backup (Admin) */}
              {isAdmin && (
                <button
                  onClick={onOpenSettingsModal}
                  title={isCollapsed ? 'Configurações e Backup' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all border border-transparent ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {!isCollapsed && <span>Configurações & Backup</span>}
                </button>
              )}

              {/* Limpar Dados do Torneio */}
              {canManageTournaments && activeTournamentId && (
                <button
                  onClick={() => onClearTournament(activeTournamentId)}
                  title={isCollapsed ? 'Limpar dados do torneio (mantém categorias)' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all border border-transparent ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-slate-400 hover:text-rose-400 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">Resetar / Limpar Jogos</span>}
                </button>
              )}

            </div>
          </div>

        </div>

        {/* 5. Footer: User Session & Logout */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/60">
          {!currentUser ? (
            <button
              onClick={onOpenLogin}
              className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-glow-amber transition-all ${
                isCollapsed ? 'justify-center' : 'justify-center'
              }`}
            >
              <Lock className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Fazer Login</span>}
            </button>
          ) : (
            <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                {!isCollapsed && (
                  <div className="truncate">
                    <span className="block font-bold text-xs text-slate-200 truncate">
                      {currentUser?.name || currentUser?.username}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                      {currentUser?.role === 'ADMIN' ? 'Admin' : currentUser?.role === 'OPERATOR' ? 'Mesário' : 'Visitante'}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                title="Sair / Desconectar"
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center flex-shrink-0 border border-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
