import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  X, 
  Maximize2, 
  Minimize2, 
  Flame, 
  Clock, 
  Trophy, 
  CheckCircle, 
  Layers, 
  ArrowRight,
  Sparkles,
  Edit3
} from 'lucide-react';
import { DEFAULT_COURTS } from '../types/tournament';

export default function ArenaLiveDisplay({ 
  eventInfo, 
  brackets, 
  categories, 
  isOpen, 
  onClose,
  onSelectUpcomingMatch,
  onOpenScoreModal 
}) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const courts = Array.isArray(eventInfo?.courts) && eventInfo.courts.length > 0
    ? eventInfo.courts
    : DEFAULT_COURTS;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Toggle true browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Collect all matches across all categories
  const allMatches = [];
  Object.keys(brackets).forEach(catId => {
    const b = brackets[catId];
    if (b && b.matches) {
      Object.values(b.matches).forEach(m => {
        allMatches.push({ ...m, categoryName: b.categoryName, categoryId: catId });
      });
    }
  });

  const liveMatches = allMatches.filter(m => m.status === 'LIVE' || (m.court && m.status === 'READY'));
  const completedMatches = allMatches.filter(m => m.status === 'COMPLETED' && !m.isBye);
  const upcomingMatches = allMatches.filter(m => m.status === 'READY' && !m.court && !m.isBye).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 bg-[#070B12] text-white flex flex-col justify-between p-4 sm:p-8 overflow-y-auto animate-in fade-in select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/40 flex items-center justify-center shadow-glow-amber flex-shrink-0">
            <img src="/db-logo.jpg" alt="DB Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                {eventInfo?.name || 'TORNEIO DE FUTVÔLEI'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" /> TELÃO OFICIAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {eventInfo?.location} • {eventInfo?.city}
            </p>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">HORÁRIO DA ARENA</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">{currentTime}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            title="Tela Cheia"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-900/50 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Courts Live Grid */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Quadras em Ação — Jogos Ao Vivo
          </h2>
          <span className="text-xs text-slate-400">Atualização instantânea dos confrontos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {courts.map((court, idx) => {
            const courtName = court.name;
            const courtMatch = allMatches.find(m => m.court === courtName && m.status !== 'COMPLETED');

            return (
              <div
                key={court.id || courtName}
                onClick={() => {
                  if (courtMatch && onOpenScoreModal) {
                    onOpenScoreModal(courtMatch.categoryId, courtMatch);
                  }
                }}
                title={courtMatch ? "Clique para lançar súmula e finalizar partida" : ""}
                className={`rounded-3xl p-5 border flex flex-col justify-between min-h-[220px] transition-all relative overflow-hidden ${
                  courtMatch
                    ? 'bg-slate-900/90 border-amber-500/60 hover:border-amber-400 shadow-glow-amber cursor-pointer hover:scale-[1.02] group/court'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                {/* Court Tag */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 shadow-sm">
                    {courtName}
                  </span>
                  {courtMatch ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> EM ANDAMENTO
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">DISPONÍVEL</span>
                  )}
                </div>

                {courtMatch ? (
                  <div className="my-auto space-y-3 py-2">
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-400">
                        {courtMatch.categoryName} • {courtMatch.roundName}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-extrabold text-sm text-white truncate max-w-[140px]">
                          {courtMatch.team1?.displayName}
                        </span>
                        <span className="font-mono font-black text-lg text-amber-400">
                          {courtMatch.score1 !== null && courtMatch.score1 !== undefined ? courtMatch.score1 : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-extrabold text-sm text-white truncate max-w-[140px]">
                          {courtMatch.team2?.displayName}
                        </span>
                        <span className="font-mono font-black text-lg text-amber-400">
                          {courtMatch.score2 !== null && courtMatch.score2 !== undefined ? courtMatch.score2 : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Quick action pill button */}
                    <div className="pt-1 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-slate-950 bg-amber-400 group-hover/court:bg-amber-300 px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 transition-colors">
                        <Edit3 className="w-3 h-3" /> Lançar Súmula & Finalizar
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="my-auto text-center py-6">
                    <p className="text-xs text-slate-500">Aguardando chamada da próxima partida</p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center flex items-center justify-between">
                  <span>Arena de Futvôlei Oficial</span>
                  {courtMatch && <span className="text-amber-400/80 font-bold group-hover/court:underline">Lançar Placar ➔</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Matches & Recent Results Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* On-Deck / Próximos Jogos */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-amber-400 font-display flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Próximas Chamadas (Aquecimento)
          </h3>

          {upcomingMatches.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Nenhum confronto na fila no momento.</p>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => onSelectUpcomingMatch && onSelectUpcomingMatch(m.categoryId, m.id)}
                  title="Clique para ir direto para a Chave onde está este jogo"
                  className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-amber-400/80 hover:bg-amber-500/10 flex items-center justify-between text-xs cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-glow-amber transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-black bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 px-2 py-0.5 rounded-lg border border-slate-700 transition-colors">
                      JOGO #{m.matchNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {m.categoryName}
                    </span>
                  </div>

                  <div className="font-bold text-slate-100 group-hover:text-white truncate mx-2">
                    {m.team1?.displayName} <span className="text-amber-400 font-black mx-1">VS</span> {m.team2?.displayName}
                  </div>

                  <span className="text-[10px] font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30 whitespace-nowrap">
                    Ir para a Chave ➔
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos Resultados */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-emerald-400 font-display flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Últimos Resultados Finalizados
          </h3>

          {completedMatches.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Aguardando primeiras partidas serem finalizadas.</p>
          ) : (
            <div className="space-y-2">
              {completedMatches.slice(-4).reverse().map((m) => (
                <div key={m.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">JOGO #{m.matchNumber}</span>
                  <div className="font-bold">
                    <span className={m.winnerId === m.team1?.id ? 'text-amber-400 font-black' : 'text-slate-400'}>
                      {m.team1?.displayName} ({m.score1})
                    </span>
                    <span className="text-slate-600 mx-1.5">x</span>
                    <span className={m.winnerId === m.team2?.id ? 'text-amber-400 font-black' : 'text-slate-400'}>
                      {m.team2?.displayName} ({m.score2})
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Final</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
