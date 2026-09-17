import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Flame, 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Search, 
  Tv, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Shirt, 
  ExternalLink,
  ChevronRight,
  Clock,
  Radio,
  X
} from 'lucide-react';
import { authenticate } from '../utils/auth';

export default function LoginScreen({ 
  onLoginSuccess, 
  eventInfo, 
  categories = [], 
  teams = [], 
  brackets = {},
  onOpenLiveArena,
  onClose
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals for Public Tournament Dashboard
  const [publicModal, setPublicModal] = useState(null); // 'TEAMS' | 'MATCHES' | null
  const [selectedPublicCategory, setSelectedPublicCategory] = useState(categories[0]?.id || '');
  const [publicSearch, setPublicSearch] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const user = authenticate(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMsg('Usuário ou senha incorretos. Use Baumann / Daniel0306 ou cadastre com o Administrador.');
        setIsLoading(false);
      }
    }, 200);
  };

  // Metrics
  const totalAthletes = teams.length * 2;
  const currentCategory = categories.find(c => c.id === selectedPublicCategory) || categories[0] || null;
  const currentCategoryTeams = teams.filter(t => t.categoryId === (currentCategory?.id || ''));

  // Collect matches for table
  const allMatches = [];
  Object.keys(brackets).forEach(catId => {
    const b = brackets[catId];
    if (b && b.matches) {
      Object.values(b.matches).forEach(m => {
        allMatches.push({
          ...m,
          categoryId: catId,
          categoryName: b.categoryName || 'Torneio',
        });
      });
    }
  });

  const filteredPublicTeams = currentCategoryTeams.filter(t => {
    if (!publicSearch) return true;
    const q = publicSearch.toLowerCase();
    return (
      t.displayName?.toLowerCase().includes(q) ||
      t.player1?.name?.toLowerCase().includes(q) ||
      t.player2?.name?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q)
    );
  });

  const categoryMatches = allMatches.filter(m => m.categoryId === currentCategory?.id && !m.isBye);

  return (
    <div className="min-h-screen bg-[#070B12] text-white flex flex-col justify-between select-none relative overflow-x-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4 relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/40 flex items-center justify-center shadow-glow-amber flex-shrink-0">
              <img src="/db-logo.jpg" alt="DB Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl font-display tracking-tight text-white">
                  DB Futvôlei Pro
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PLATAFORMA OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {eventInfo?.name || 'Gestão de Torneios & Arena'} • {eventInfo?.organizer || 'DB Sports'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLiveArena && (
              <button
                onClick={onOpenLiveArena}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs font-bold transition-all shadow-sm"
              >
                <Tv className="w-4 h-4 text-amber-400" />
                Telão Oficial
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                Ver Sistema (Modo Visualização)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Split Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: PUBLIC TOURNAMENT DASHBOARD (7 cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tournament Overview Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> TORNEIO EM ANDAMENTO
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white mt-2">
                  {eventInfo?.name || 'Torneio de Futvôlei'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                  {eventInfo?.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> {eventInfo.date}
                    </span>
                  )}
                  {eventInfo?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> {eventInfo.location} • {eventInfo.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">ORGANIZAÇÃO</span>
                <span className="text-sm font-bold text-amber-400">{eventInfo?.organizer || 'DB Sports'}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duplas</span>
                <span className="text-2xl font-black font-display text-white">{teams.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Atletas</span>
                <span className="text-2xl font-black font-display text-amber-400">{totalAthletes}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Categorias</span>
                <span className="text-2xl font-black font-display text-purple-400">{categories.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quadras</span>
                <span className="text-2xl font-black font-display text-emerald-400">
                  {Array.isArray(eventInfo?.courts) ? eventInfo.courts.length : 3}
                </span>
              </div>
            </div>

            {/* Public Interactive Action Buttons */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-slate-400">
                Consulte as informações do torneio abertamente:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button 1: Ver Inscritos */}
                <button
                  onClick={() => {
                    setSelectedPublicCategory(categories[0]?.id || '');
                    setPublicModal('TEAMS');
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 hover:from-amber-500/20 hover:to-amber-600/10 border border-slate-800 hover:border-amber-500/60 transition-all duration-200 flex items-center justify-between text-left group shadow-sm hover:shadow-glow-amber"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-amber-300 block">
                        Ver Lista de Inscritos
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {teams.length} duplas e atletas confirmados
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </button>

                {/* Button 2: Tabela dos Jogos / Chaveamento */}
                <button
                  onClick={() => {
                    setSelectedPublicCategory(categories[0]?.id || '');
                    setPublicModal('MATCHES');
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 hover:from-purple-500/20 hover:to-purple-600/10 border border-slate-800 hover:border-purple-500/60 transition-all duration-200 flex items-center justify-between text-left group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-purple-300 block">
                        Tabela de Jogos
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Confrontos, placares e chaveamento
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </button>
              </div>

              {/* Telão Direct Button */}
              {onOpenLiveArena && (
                <button
                  onClick={onOpenLiveArena}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/40 hover:border-amber-400 flex items-center justify-between text-xs font-bold text-amber-300 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Abrir Telão Oficial da Arena em Tempo Real (Quadras Ao Vivo)
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-1 transition-transform">
                    Acessar ➔
                  </span>
                </button>
              )}
            </div>

          </div>

          {/* Categories Quick Showcase */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Categorias em Disputa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const catTeams = teams.filter(t => t.categoryId === cat.id);
                return (
                  <div 
                    key={cat.id} 
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">
                        Set até {cat.pointsToWin || 18} pts
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-amber-400">
                      {catTeams.length} duplas
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: LOGIN FORM (5 cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-glow-amber bg-slate-900/90 relative">
            
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-glow-amber flex-shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">
                  Acesso ao Painel
                </h2>
                <p className="text-xs text-slate-400">
                  Área restrita para administradores e mesários
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usuário / Login
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Baumann"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-glow-amber transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apenas Visualizar Torneio (Sem Login)</span>
                </button>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Acesso restrito para usuários cadastrados</span>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {eventInfo?.name || 'Futvôlei Pro Arena'} — Organização: <strong className="text-slate-400">{eventInfo?.organizer || 'DB Sports'}</strong>
          </p>
          <p className="text-[11px] text-slate-600">
            Administrador Master: <strong className="text-amber-400">Baumann</strong> • Double Elimination Engine v2.0
          </p>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* MODAL 1: VER LISTA DE INSCRITOS (PÚBLICO) */}
      {/* ============================================================ */}
      {publicModal === 'TEAMS' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-white">
                    Duplas & Atletas Inscritos
                  </h3>
                  <p className="text-xs text-slate-400">
                    {teams.length} duplas confirmadas no torneio
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPublicModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Pills & Search */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedPublicCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedPublicCategory === c.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {c.name} ({teams.filter(t => t.categoryId === c.id).length})
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar atleta ou cidade..."
                  value={publicSearch}
                  onChange={(e) => setPublicSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Teams List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {filteredPublicTeams.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  Nenhuma dupla encontrada para esta categoria ou busca.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredPublicTeams.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            DUPLA #{idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white font-display">
                            {t.displayName}
                          </h4>
                          {t.city && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-400" /> {t.city}
                            </span>
                          )}
                        </div>

                        {t.isSeed && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                            Seed #{t.seedRank || 1}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/60 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Atleta 1</span>
                          <span className="text-slate-200 font-semibold">{t.player1?.name}</span>
                          {t.player1?.shirtSize && (
                            <span className="text-[10px] text-slate-500 block">Camisa {t.player1?.shirtSize}</span>
                          )}
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Atleta 2</span>
                          <span className="text-slate-200 font-semibold">{t.player2?.name}</span>
                          {t.player2?.shirtSize && (
                            <span className="text-[10px] text-slate-500 block">Camisa {t.player2?.shirtSize}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setPublicModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: TABELA DOS JOGOS (PÚBLICO) */}
      {/* ============================================================ */}
      {publicModal === 'MATCHES' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-white">
                    Tabela de Jogos & Resultados
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acompanhe os confrontos de todas as categorias
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPublicModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Pills */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedPublicCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedPublicCategory === c.id
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Matches List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {categoryMatches.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">
                    Chave de jogos ainda não sorteada para esta categoria
                  </p>
                  <p className="text-xs text-slate-500">
                    Aguarde o sorteio oficial ser realizado pela organização.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryMatches.map((m) => {
                    const isFinished = m.status === 'COMPLETED';
                    const isLive = m.status === 'LIVE' || (m.court && m.status === 'READY');

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between ${
                          isLive
                            ? 'bg-slate-950 border-amber-500/60 shadow-glow-amber'
                            : isFinished
                            ? 'bg-slate-950/90 border-slate-800'
                            : 'bg-slate-950/50 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span className="font-mono text-xs font-black text-amber-400">
                            JOGO #{m.matchNumber} • {m.roundName}
                          </span>
                          {isLive ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> EM ANDAMENTO ({m.court || 'Quadra'})
                            </span>
                          ) : isFinished ? (
                            <span className="text-[10px] font-semibold text-slate-400">FINALIZADO</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">AGUARDANDO</span>
                          )}
                        </div>

                        <div className="space-y-1.5 py-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold truncate max-w-[170px] ${m.winnerId === m.team1?.id ? 'text-amber-400' : 'text-slate-200'}`}>
                              {m.team1?.displayName || 'Aguardando adversário'}
                            </span>
                            <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">
                              {m.score1 !== null && m.score1 !== undefined ? m.score1 : '-'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold truncate max-w-[170px] ${m.winnerId === m.team2?.id ? 'text-amber-400' : 'text-slate-200'}`}>
                              {m.team2?.displayName || 'Aguardando adversário'}
                            </span>
                            <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">
                              {m.score2 !== null && m.score2 !== undefined ? m.score2 : '-'}
                            </span>
                          </div>
                        </div>

                        {m.court && (
                          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Local: <strong>{m.court}</strong></span>
                            {isFinished && m.winner && (
                              <span className="text-emerald-400 font-bold">Vencedor: {m.winner.displayName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setPublicModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
