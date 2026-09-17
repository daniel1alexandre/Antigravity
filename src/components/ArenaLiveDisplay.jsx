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
  Edit3,
  GripVertical,
  Move,
  ArrowDownCircle,
  Radio
} from 'lucide-react';
import { DEFAULT_COURTS } from '../types/tournament';

export default function ArenaLiveDisplay({ 
  eventInfo, 
  brackets, 
  categories, 
  isOpen, 
  onClose,
  onSelectUpcomingMatch,
  onOpenScoreModal,
  onUpdateCourt,
  isReadOnly = false
}) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedMatch, setDraggedMatch] = useState(null);
  const [dragOverCourt, setDragOverCourt] = useState(null);
  const [selectedWaitingMatch, setSelectedWaitingMatch] = useState(null);

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
  const upcomingMatches = allMatches.filter(m => m.status === 'READY' && !m.court && !m.isBye);

  // Drop handler for free court
  const handleDropOnCourt = (e, courtName) => {
    e.preventDefault();
    setDragOverCourt(null);
    if (isReadOnly) return;

    let matchId = null;
    let categoryId = null;

    try {
      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (raw) {
        const parsed = JSON.parse(raw);
        matchId = parsed.matchId;
        categoryId = parsed.categoryId;
      }
    } catch (err) {}

    if (!matchId) {
      matchId = draggedMatch?.id || selectedWaitingMatch?.id;
      categoryId = draggedMatch?.categoryId || selectedWaitingMatch?.categoryId;
    }

    if (matchId && onUpdateCourt) {
      onUpdateCourt(matchId, courtName, categoryId);
    }

    setDraggedMatch(null);
    setSelectedWaitingMatch(null);
  };

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
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Quadras em Ação — Jogos Ao Vivo
            </h2>
            <span className="text-xs text-slate-400">
              Arraste um jogo da lista de espera e solte em uma quadra livre para iniciar
            </span>
          </div>
          {selectedWaitingMatch && (
            <div className="bg-amber-500/20 border border-amber-500/50 px-3 py-1 rounded-xl text-xs text-amber-300 flex items-center gap-2 animate-bounce">
              <span>Jogo #{selectedWaitingMatch.matchNumber} selecionado: clique ou solte em uma quadra livre</span>
              <button 
                onClick={() => setSelectedWaitingMatch(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {courts.map((court) => {
            const courtName = court.name;
            const courtMatch = allMatches.find(m => m.court === courtName && m.status !== 'COMPLETED');
            const isAvailable = !courtMatch;
            const isDragOver = dragOverCourt === courtName;
            const isTargeting = (draggedMatch || selectedWaitingMatch) && isAvailable;

            return (
              <div
                key={court.id || courtName}
                onDragOver={(e) => {
                  if (!isAvailable) {
                    e.dataTransfer.dropEffect = 'none';
                    return;
                  }
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverCourt !== courtName) {
                    setDragOverCourt(courtName);
                  }
                }}
                onDragLeave={(e) => {
                  if (dragOverCourt === courtName) {
                    setDragOverCourt(null);
                  }
                }}
                onDrop={(e) => handleDropOnCourt(e, courtName)}
                onClick={() => {
                  if (isReadOnly) {
                    alert('Modo apenas visualização: faça login como administrador ou mesário para alocar quadras ou lançar placares.');
                    return;
                  }
                  if (courtMatch) {
                    if (onOpenScoreModal) {
                      onOpenScoreModal(courtMatch.categoryId, courtMatch);
                    }
                  } else if (selectedWaitingMatch && onUpdateCourt) {
                    onUpdateCourt(selectedWaitingMatch.id, courtName, selectedWaitingMatch.categoryId);
                    setSelectedWaitingMatch(null);
                  }
                }}
                title={
                  courtMatch 
                    ? "Clique para lançar súmula e finalizar partida" 
                    : isTargeting
                    ? "Clique ou solte aqui para colocar o jogo selecionado nesta quadra"
                    : "Quadra livre. Arraste um jogo da lista de espera para cá."
                }
                className={`rounded-3xl p-5 border flex flex-col justify-between min-h-[230px] transition-all duration-200 relative overflow-hidden ${
                  courtMatch
                    ? 'bg-slate-900/90 border-amber-500/60 hover:border-amber-400 shadow-glow-amber cursor-pointer hover:scale-[1.01] group/court'
                    : isDragOver
                    ? 'bg-emerald-950/80 border-2 border-emerald-400 shadow-glow-emerald scale-105 ring-4 ring-emerald-500/40 cursor-copy'
                    : isTargeting
                    ? 'bg-emerald-950/30 border-2 border-dashed border-emerald-500/80 hover:border-emerald-300 hover:bg-emerald-900/40 cursor-pointer shadow-lg animate-pulse'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                {/* Court Tag */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg shadow-sm transition-colors ${
                    isDragOver 
                      ? 'bg-emerald-400 text-slate-950' 
                      : isTargeting 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-amber-500 text-slate-950'
                  }`}>
                    {courtName}
                  </span>
                  {courtMatch ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> EM ANDAMENTO
                      </span>
                      {onUpdateCourt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Deseja desocupar a ${courtName} e retornar o Jogo #${courtMatch.matchNumber} para a lista de espera?`)) {
                              onUpdateCourt(courtMatch.id, null, courtMatch.categoryId);
                            }
                          }}
                          title="Desocupar quadra (retornar para espera)"
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 p-1 rounded-md transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isTargeting 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'text-slate-500'
                    }`}>
                      {isDragOver ? 'SOLTAR AQUI!' : isTargeting ? 'DISPONÍVEL • SOLTE AQUI' : 'DISPONÍVEL'}
                    </span>
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
                  <div className="my-auto text-center py-5 flex flex-col items-center justify-center gap-2">
                    {isDragOver ? (
                      <div className="space-y-1 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-300">
                          <ArrowDownCircle className="w-6 h-6 animate-bounce" />
                        </div>
                        <p className="text-sm font-black text-emerald-300">SOLTE PARA INICIAR!</p>
                        <p className="text-[10px] text-emerald-400/80">Partida será alocada na {courtName}</p>
                      </div>
                    ) : isTargeting ? (
                      <div className="space-y-1">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                          <ArrowDownCircle className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-black text-emerald-300">SOLTE O JOGO AQUI</p>
                        <p className="text-[10px] text-slate-400">ou clique para alocar nesta quadra</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                          <Move className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-slate-400 font-semibold">Quadra Livre</p>
                        <p className="text-[10px] text-slate-500">Arraste um jogo para cá</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center flex items-center justify-between">
                  <span>Arena de Futvôlei Oficial</span>
                  {courtMatch ? (
                    <span className="text-amber-400/80 font-bold group-hover/court:underline">Lançar Placar ➔</span>
                  ) : isTargeting ? (
                    <span className="text-emerald-400 font-bold">Solte aqui ➔</span>
                  ) : (
                    <span className="text-slate-600">Livre</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Matches & Recent Results Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* On-Deck / Próximos Jogos com Drag & Drop */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-amber-400 font-display flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Próximas Chamadas (Na Espera / Aquecimento)
            </h3>
            <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
              <GripVertical className="w-3.5 h-3.5" /> Arraste para a quadra
            </span>
          </div>

          {upcomingMatches.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Nenhum confronto na fila no momento.</p>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {upcomingMatches.map((m) => {
                const isBeingDragged = draggedMatch?.id === m.id;
                const isSelected = selectedWaitingMatch?.id === m.id;

                return (
                  <div 
                    key={m.id} 
                    draggable={!isReadOnly}
                    onDragStart={(e) => {
                      if (isReadOnly) return;
                      const payload = JSON.stringify({ matchId: m.id, categoryId: m.categoryId });
                      e.dataTransfer.setData('application/json', payload);
                      e.dataTransfer.setData('text/plain', payload);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedMatch(m);
                      setSelectedWaitingMatch(m);
                    }}
                    onDragEnd={() => {
                      setDraggedMatch(null);
                      setDragOverCourt(null);
                    }}
                    onClick={() => {
                      if (isReadOnly) return;
                      if (selectedWaitingMatch?.id === m.id) {
                        setSelectedWaitingMatch(null);
                      } else {
                        setSelectedWaitingMatch(m);
                      }
                    }}
                    title={isReadOnly ? 'Apenas visualização das partidas na fila' : 'Segure e arraste até uma quadra livre, ou clique para selecionar'}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs cursor-grab active:cursor-grabbing transition-all duration-150 group shadow-sm select-none ${
                      isBeingDragged
                        ? 'opacity-40 border-dashed border-amber-400 bg-amber-500/10 scale-95'
                        : isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-glow-amber ring-2 ring-amber-400/50'
                        : 'bg-slate-950/90 border-slate-800 hover:border-amber-400/80 hover:bg-amber-500/10 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/40">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-amber-400 font-black bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 px-2 py-0.5 rounded-lg border border-slate-700 transition-colors">
                        JOGO #{m.matchNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {m.categoryName}
                      </span>
                    </div>

                    <div className="font-bold text-slate-100 group-hover:text-white truncate mx-2 max-w-[180px] sm:max-w-[240px]">
                      {m.team1?.displayName} <span className="text-amber-400 font-black mx-1">VS</span> {m.team2?.displayName}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 transition-all ${
                        isSelected 
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950'
                      }`}>
                        <Move className="w-3 h-3" />
                        {isSelected ? 'Arraste ou clique na quadra' : 'Arraste para Quadra'}
                      </span>
                    </div>
                  </div>
                );
              })}
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
