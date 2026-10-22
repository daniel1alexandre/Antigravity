import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar, 
  Play, 
  Check, 
  Filter,
  CheckCircle2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { DEFAULT_COURTS } from '../types/tournament';
import { 
  computeOfficialTournamentSchedule, 
  formatDatePt, 
  getRoundPriority,
  timeToMinutes 
} from '../utils/scheduleEngine';

export default function ArenaLiveDisplay({ 
  eventInfo, 
  brackets = {}, 
  categories = [], 
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
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'READY' | 'LIVE' | 'COMPLETED'

  // Compute official tournament schedule for multi-day support
  const scheduleData = useMemo(() => {
    return computeOfficialTournamentSchedule({
      eventInfo,
      categories,
      brackets,
    });
  }, [eventInfo, categories, brackets]);

  const days = scheduleData.days || [];
  
  // By default, select the FIRST DAY (Dia 1) as requested by user
  const [selectedDayId, setSelectedDayId] = useState(() => days[0]?.id || 'day-1');

  // Sync selectedDayId if days change and selection is invalid
  const activeDayId = (selectedDayId === 'ALL' || days.some(d => d.id === selectedDayId))
    ? selectedDayId
    : (days[0]?.id || 'day-1');

  const selectedDay = days.find(d => d.id === activeDayId) || days[0] || null;

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

  // Collect all live matches currently active in brackets
  const allLiveBracketMatches = [];
  Object.keys(brackets).forEach(catId => {
    const b = brackets[catId];
    if (b && b.matches) {
      Object.values(b.matches).forEach(m => {
        allLiveBracketMatches.push({ ...m, categoryName: b.categoryName, categoryId: catId });
      });
    }
  });

  const availableCourts = courts.filter(court => {
    const cName = court.name;
    return !allLiveBracketMatches.some(m => m.court === cName && m.status !== 'COMPLETED');
  });

  // Collect all matches from scheduleData, plus any bracket matches that were not yet in scheduleData
  const scheduledMatchIds = new Set((scheduleData.scheduledMatches || []).map(sm => sm.realMatchId || sm.id));
  const missingBracketMatches = allLiveBracketMatches
    .filter(m => !scheduledMatchIds.has(m.id))
    .map((m, idx) => ({
      ...m,
      realMatchId: m.id,
      dayId: days[0]?.id || 'day-1',
      dayName: days[0]?.name || 'Dia 1',
      timeFormatted: days[0]?.startTime || '08:00',
      slotStartMins: 480 + (idx * 5),
    }));

  const baseScheduledList = [
    ...(scheduleData.scheduledMatches || []),
    ...missingBracketMatches,
  ];

  // Build the day-aware scheduled match list
  // Merging schedule order, scheduled times, rounds, and live bracket states
  const scheduledList = baseScheduledList.map(sm => {
    const liveMatch = brackets[sm.categoryId]?.matches?.[sm.realMatchId || sm.id];
    const categoryObj = categories.find(c => c.id === sm.categoryId) || sm.category;
    
    const team1 = liveMatch?.team1 || sm.team1 || null;
    const team2 = liveMatch?.team2 || sm.team2 || null;
    
    // activeCourt is the actual court currently in live play from brackets!
    // sm.courtName is only the simulated/scheduled court from the official schedule.
    const activeCourt = liveMatch?.court || null;
    const scheduledCourt = sm.courtName || sm.court?.name || null;
    
    const status = liveMatch?.status || sm.status || 'PENDING';
    const score1 = (liveMatch && liveMatch.score1 !== null && liveMatch.score1 !== undefined) ? liveMatch.score1 : null;
    const score2 = (liveMatch && liveMatch.score2 !== null && liveMatch.score2 !== undefined) ? liveMatch.score2 : null;
    const winnerId = liveMatch?.winnerId || null;

    const t1IsBye = Boolean(team1?.isBye || team1?.id?.startsWith('BYE'));
    const t2IsBye = Boolean(team2?.isBye || team2?.id?.startsWith('BYE'));
    const isBye = Boolean(sm.isBye || liveMatch?.isBye || t1IsBye || t2IsBye);

    const hasBothTeams = Boolean(
      team1 && team2 &&
      !t1IsBye && !t2IsBye &&
      (team1.displayName || team1.name || team1.id) &&
      (team2.displayName || team2.name || team2.id) &&
      !team1.id?.toString().startsWith('W_') &&
      !team1.id?.toString().startsWith('L_') &&
      !team2.id?.toString().startsWith('W_') &&
      !team2.id?.toString().startsWith('L_')
    );
    const isCompleted = status === 'COMPLETED';
    const isLive = Boolean(activeCourt && (status === 'LIVE' || status === 'WARMUP' || status === 'READY')) && !isCompleted;
    const isReady = hasBothTeams && !activeCourt && !isCompleted && !isBye;
    const isWaitingPrevious = !hasBothTeams && !isCompleted && !isBye;

    const bType = liveMatch?.bracket || liveMatch?.type || sm.bracket || sm.type || 'WINNERS';
    const roundNumber = liveMatch?.round || sm.round || 1;
    const roundPriority = getRoundPriority(bType, roundNumber);

    return {
      ...sm,
      id: sm.realMatchId || sm.id,
      realMatchId: sm.realMatchId || sm.id,
      matchNumber: liveMatch?.matchNumber || sm.matchNumber,
      categoryId: sm.categoryId,
      categoryName: categoryObj?.name || sm.categoryName || 'Torneio',
      categoryColor: categoryObj?.color || '#F59E0B',
      roundName: liveMatch?.roundName || sm.roundName || 'Confronto',
      bracket: bType,
      round: roundNumber,
      roundPriority,
      team1,
      team2,
      team1Name: team1?.displayName || (t1IsBye ? 'Folga' : 'A definir'),
      team2Name: team2?.displayName || (t2IsBye ? 'Folga' : 'A definir'),
      court: activeCourt,
      activeCourt,
      scheduledCourt,
      status,
      score1,
      score2,
      winnerId,
      isLive,
      isReady,
      isCompleted,
      isWaitingPrevious,
      isBye,
    };
  }).filter(m => !m.isBye);

  // Filter matches for the selected day (or all days)
  const matchesForDay = activeDayId === 'ALL'
    ? scheduledList
    : scheduledList.filter(m => m.dayId === activeDayId);

  // Sort matches strictly respecting:
  // 1. Scheduled Time (slotStartMins or timeFormatted)
  // 2. Round progression priority (WR1 -> LR1 -> WR2 -> LR2 -> ... -> Grand Final)
  // 3. Match Number
  const sortedDayMatches = [...matchesForDay].sort((a, b) => {
    if (a.slotStartMins !== b.slotStartMins) {
      return (a.slotStartMins || 0) - (b.slotStartMins || 0);
    }
    if (a.roundPriority !== b.roundPriority) {
      return a.roundPriority - b.roundPriority;
    }
    return (a.matchNumber || 0) - (b.matchNumber || 0);
  });

  // Categorize lists for UI
  const readyQueueMatches = sortedDayMatches.filter(m => m.isReady);
  const liveDayMatches = sortedDayMatches.filter(m => m.isLive);
  const completedDayMatches = sortedDayMatches.filter(m => m.isCompleted);

  // Filter for display based on sub-tab
  const displayedMatches = sortedDayMatches.filter(m => {
    if (queueFilter === 'READY') return m.isReady;
    if (queueFilter === 'LIVE') return m.isLive;
    if (queueFilter === 'COMPLETED') return m.isCompleted;
    return true; // 'ALL'
  });

  // Drop handler for free court
  const handleDropOnCourt = (e, courtName) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCourt(null);
    if (isReadOnly) return;

    let matchId = null;
    let categoryId = null;

    try {
      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
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
    <div className="fixed inset-0 z-50 bg-[#070B12] text-white flex flex-col justify-between p-3 sm:p-6 overflow-y-auto animate-in fade-in select-none">
      
      {/* ── 1. Top Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        
        {/* Brand & Event Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/40 flex items-center justify-center shadow-glow-amber flex-shrink-0">
            <img src="/db-logo.jpg" alt="DB Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                {eventInfo?.name || 'TORNEIO DE FUTVÔLEI'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" /> TELÃO OFICIAL DA ARENA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {eventInfo?.location ? `${eventInfo.location} • ` : ''}{eventInfo?.city || 'Arena Oficial'}
            </p>
          </div>
        </div>

        {/* Day Selector Tabs & Live Clock */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Day Selector Pill Tabs */}
          {days.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-md">
              {days.map((day, idx) => {
                const isSelected = activeDayId === day.id;
                const dayMatchesCount = (scheduleData.scheduledMatches || []).filter(m => m.dayId === day.id).length;
                const dayLiveCount = (scheduleData.scheduledMatches || []).filter(m => m.dayId === day.id && m.isLive).length;

                return (
                  <button
                    key={day.id}
                    onClick={() => {
                      setSelectedDayId(day.id);
                      setSelectedWaitingMatch(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow-amber'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{day.name || `Dia ${idx + 1}`}</span>
                    {day.date && (
                      <span className={`text-[10px] hidden sm:inline ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                        ({formatDatePt(day.date).split(' ')[0]})
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {dayMatchesCount}
                    </span>
                    {dayLiveCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title={`${dayLiveCount} jogo em quadra`} />
                    )}
                  </button>
                );
              })}

              {days.length > 1 && (
                <button
                  onClick={() => {
                    setSelectedDayId('ALL');
                    setSelectedWaitingMatch(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeDayId === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-glow-amber'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Todos
                </button>
              )}
            </div>
          )}

          {/* Live Arena Clock */}
          <div className="bg-slate-900/90 px-3.5 py-1.5 rounded-2xl border border-slate-800 text-right">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">HORÁRIO DA ARENA</span>
            <span className="font-mono text-lg sm:text-xl font-black text-amber-400 leading-none">{currentTime}</span>
          </div>

          {/* Fullscreen & Close */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleFullscreen}
              title="Tela Cheia"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Fechar Telão"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-900/50 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* ── 2. Active Day Summary Bar ── */}
      <div className="my-3 px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {activeDayId === 'ALL' ? 'Todos os Dias do Torneio' : `${selectedDay?.name || 'Dia 1'} • ${formatDatePt(selectedDay?.date)}`}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Início: <strong className="text-white">{selectedDay?.startTime || '08:00'}</strong>
          </span>

          {/* Categories Scheduled for this day */}
          {selectedDay?.categoryIds && selectedDay.categoryIds.length > 0 && (
            <div className="flex items-center gap-1.5 ml-1 flex-wrap">
              <span className="text-slate-500 font-semibold text-[11px]">Categorias:</span>
              {selectedDay.categoryIds.map(cId => {
                const cat = categories.find(c => c.id === cId);
                if (!cat) return null;
                const catStartTime = selectedDay.categoryStartTimes?.[cat.id] || selectedDay.startTime || '08:00';
                return (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#F59E0B' }} />
                    <span>{cat.name}</span>
                    <span className="text-amber-400/90 font-mono">({catStartTime})</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Day Match KPIs */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 ml-auto">
          <span>Total: <strong className="text-white">{sortedDayMatches.length} jogos</strong></span>
          <span>Prontos: <strong className="text-emerald-400">{readyQueueMatches.length}</strong></span>
          <span>Ao Vivo: <strong className="text-amber-400">{liveDayMatches.length}</strong></span>
          <span>Finalizados: <strong className="text-purple-300">{completedDayMatches.length}</strong></span>
        </div>
      </div>

      {/* ── 3. Courts Live Grid (Quadras em Ação) ── */}
      <div className="my-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-display text-white">
              Quadras em Ação — Jogos Ao Vivo
            </h2>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Arraste uma partida da fila ou selecione e clique na quadra)
            </span>
          </div>

          {selectedWaitingMatch && (
            <div className="bg-amber-500/20 border border-amber-500/50 px-3 py-1 rounded-xl text-xs text-amber-300 flex items-center gap-2 animate-pulse shadow-sm">
              <span>Jogo #{selectedWaitingMatch.matchNumber} selecionado: clique em uma quadra livre</span>
              <button 
                onClick={() => setSelectedWaitingMatch(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {courts.map((court) => {
            const courtName = court.name;
            const courtMatch = allLiveBracketMatches.find(m => m.court === courtName && m.status !== 'COMPLETED');
            const isAvailable = !courtMatch;
            const isDragOver = dragOverCourt === courtName;
            const isTargeting = (draggedMatch || selectedWaitingMatch) && isAvailable;

            return (
              <div
                key={court.id || courtName}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isAvailable) {
                    e.dataTransfer.dropEffect = 'none';
                    return;
                  }
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverCourt !== courtName) {
                    setDragOverCourt(courtName);
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (isAvailable && dragOverCourt !== courtName) {
                    setDragOverCourt(courtName);
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget)) return;
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
                    ? "Clique para colocar o jogo selecionado nesta quadra"
                    : "Quadra livre. Arraste ou clique em um jogo pronto para iniciar."
                }
                className={`rounded-3xl p-4 border flex flex-col justify-between min-h-[210px] transition-all duration-200 relative overflow-hidden ${
                  courtMatch
                    ? 'bg-slate-900/95 border-amber-500/60 hover:border-amber-400 shadow-glow-amber cursor-pointer hover:scale-[1.01] group/court'
                    : isDragOver
                    ? 'bg-emerald-950/80 border-2 border-emerald-400 shadow-glow-emerald scale-105 ring-4 ring-emerald-500/40 cursor-copy'
                    : isTargeting
                    ? 'bg-emerald-950/40 border-2 border-dashed border-emerald-500/80 hover:border-emerald-300 hover:bg-emerald-900/40 cursor-pointer shadow-lg animate-pulse'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                {/* Court Top Row */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> EM JOGO
                      </span>
                      {!isReadOnly && onUpdateCourt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Deseja desocupar a ${courtName} e retornar o Jogo #${courtMatch.matchNumber} para a lista de espera?`)) {
                              onUpdateCourt(courtMatch.id, null, courtMatch.categoryId);
                            }
                          }}
                          title="Desocupar quadra (retornar para espera)"
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 p-1 rounded-md transition-colors cursor-pointer"
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
                      {isDragOver ? 'SOLTAR AQUI!' : isTargeting ? 'CLIQUE PARA ALOCAR' : 'DISPONÍVEL'}
                    </span>
                  )}
                </div>

                {/* Court Body */}
                {courtMatch ? (
                  <div className="my-auto space-y-2.5 py-1">
                    <div className="text-center">
                      <span className="text-[11px] uppercase font-bold text-amber-400 block truncate">
                        {courtMatch.categoryName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        JOGO #{courtMatch.matchNumber} • {courtMatch.roundName}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="font-extrabold text-xs text-white truncate max-w-[130px]">
                          {courtMatch.team1?.displayName || 'Dupla 1'}
                        </span>
                        <span className="font-mono font-black text-base text-amber-400">
                          {courtMatch.score1 !== null && courtMatch.score1 !== undefined ? courtMatch.score1 : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="font-extrabold text-xs text-white truncate max-w-[130px]">
                          {courtMatch.team2?.displayName || 'Dupla 2'}
                        </span>
                        <span className="font-mono font-black text-base text-amber-400">
                          {courtMatch.score2 !== null && courtMatch.score2 !== undefined ? courtMatch.score2 : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-0.5 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-950 bg-amber-400 group-hover/court:bg-amber-300 px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 transition-colors">
                        <Edit3 className="w-3 h-3" /> Lançar Placar
                      </span>

                      {!isReadOnly && availableCourts.length > 0 && onUpdateCourt && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Mover:</span>
                          {availableCourts.map(c => {
                            const shortName = c.name.replace(/Quadra\s*/i, 'Q');
                            return (
                              <button
                                key={c.id || c.name}
                                type="button"
                                onClick={() => onUpdateCourt(courtMatch.id, c.name, courtMatch.categoryId)}
                                title={`Mover este jogo para a ${c.name}`}
                                className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-[9px] font-black transition-colors cursor-pointer"
                              >
                                {shortName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto text-center py-4 flex flex-col items-center justify-center gap-1.5">
                    {isDragOver ? (
                      <div className="space-y-1 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-300">
                          <ArrowDownCircle className="w-5 h-5 animate-bounce" />
                        </div>
                        <p className="text-xs font-black text-emerald-300">SOLTE PARA INICIAR!</p>
                      </div>
                    ) : isTargeting ? (
                      <div className="space-y-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                          <ArrowDownCircle className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-black text-emerald-300">CLIQUE PARA ALOCAR</p>
                        <p className="text-[10px] text-slate-400">ou solte o jogo aqui</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                          <Move className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs text-slate-400 font-semibold">Quadra Livre</p>
                        <p className="text-[10px] text-slate-500">Pronta para o próximo confronto</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Arena DB Pro</span>
                  {courtMatch ? (
                    <span className="text-amber-400 font-bold group-hover/court:underline">Placar ➔</span>
                  ) : isTargeting ? (
                    <span className="text-emerald-400 font-bold">Disponível ➔</span>
                  ) : (
                    <span className="text-slate-600">Livre</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. On-Deck Queue & Programmed Matches (Organized by Day & Rounds) ── */}
      <div className="my-2 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3.5">
        
        {/* Queue Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-amber-400 font-display flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Programação & Próximas Chamadas ({activeDayId === 'ALL' ? 'Todos os Dias' : selectedDay?.name || 'Dia 1'})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Partidas organizadas em ordem cronológica de horário e sequência de rodadas da chave.
            </p>
          </div>

          {/* Sub-Filters: Todos, Prontos, Ao Vivo, Finalizados */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
            <button
              onClick={() => setQueueFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                queueFilter === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({sortedDayMatches.length})
            </button>
            <button
              onClick={() => setQueueFilter('READY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                queueFilter === 'READY' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Prontos ({readyQueueMatches.length})
            </button>
            <button
              onClick={() => setQueueFilter('LIVE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                queueFilter === 'LIVE' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Ao Vivo ({liveDayMatches.length})
            </button>
            <button
              onClick={() => setQueueFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                queueFilter === 'COMPLETED' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Finalizados ({completedDayMatches.length})
            </button>
          </div>
        </div>

        {/* Matches List */}
        {displayedMatches.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">
              {queueFilter === 'READY' 
                ? 'Nenhum confronto aguardando alocação de quadra no momento.' 
                : queueFilter === 'LIVE'
                ? 'Nenhuma partida em andamento no momento.'
                : queueFilter === 'COMPLETED'
                ? 'Nenhuma partida finalizada ainda.'
                : 'Nenhum confronto agendado para este dia.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {displayedMatches.map((m) => {
              const isBeingDragged = draggedMatch?.id === m.id;
              const isSelected = selectedWaitingMatch?.id === m.id;

              return (
                <div
                  key={m.id}
                  draggable={!isReadOnly && m.isReady}
                  onDragStart={(e) => {
                    if (isReadOnly || !m.isReady) return;
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
                    if (m.isLive) {
                      if (onOpenScoreModal) onOpenScoreModal(m.categoryId, m);
                      return;
                    }
                    if (m.isReady) {
                      if (selectedWaitingMatch?.id === m.id) {
                        setSelectedWaitingMatch(null);
                      } else {
                        setSelectedWaitingMatch(m);
                      }
                    }
                  }}
                  title={
                    m.isLive 
                      ? "Partida em andamento: clique para abrir súmula" 
                      : m.isReady 
                      ? "Clique para selecionar e alocar na quadra livre, ou arraste" 
                      : m.isCompleted
                      ? "Partida finalizada"
                      : "Aguardando definição dos confrontos anteriores"
                  }
                  className={`p-3 rounded-2xl border text-xs transition-all duration-150 flex flex-col justify-between gap-2 shadow-sm ${
                    isBeingDragged
                      ? 'opacity-40 border-dashed border-amber-400 bg-amber-500/10 scale-95'
                      : isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-glow-amber ring-2 ring-amber-400/50'
                      : m.isLive
                      ? 'bg-slate-900/90 border-emerald-500/60 shadow-glow-emerald cursor-pointer'
                      : m.isReady
                      ? 'bg-slate-950 border-amber-500/60 hover:border-amber-400 hover:bg-slate-900/90 cursor-grab active:cursor-grabbing hover:-translate-y-0.5'
                      : m.isCompleted
                      ? 'bg-slate-950/60 border-slate-800 opacity-75'
                      : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  {/* Top Line: Time, Number, Category, Round */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {/* Scheduled Time Badge */}
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                        {m.timeFormatted || '08:00'}
                      </span>

                      {/* Match Number */}
                      <span className="font-mono text-[10px] font-black text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        #{m.matchNumber || m.id}
                      </span>

                      {/* Category Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.categoryColor }} />
                        <span className="truncate max-w-[100px]">{m.categoryName}</span>
                      </span>
                    </div>

                    {/* Status Pill */}
                    {m.isLive ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1 animate-pulse">
                        <Flame className="w-2.5 h-2.5 fill-current" /> {m.court || 'EM JOGO'}
                      </span>
                    ) : m.isCompleted ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {m.score1 !== null ? `${m.score1} x ${m.score2}` : 'FINALIZADO'}
                      </span>
                    ) : m.isReady ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> PRONTO
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                        AGUARDANDO
                      </span>
                    )}
                  </div>

                  {/* Middle Line: Round Name & Confrontation */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-cyan-300 block truncate">
                      {m.roundName}
                    </span>

                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-2">
                      <span className={`font-bold truncate text-xs ${m.winnerId && m.winnerId === m.team1?.id ? 'text-amber-400 font-black' : 'text-slate-100'}`}>
                        {m.team1Name}
                      </span>
                      <span className="text-[10px] font-black text-amber-400/90 px-1.5 bg-slate-950 rounded py-0.5 border border-slate-800">
                        VS
                      </span>
                      <span className={`font-bold truncate text-xs text-right ${m.winnerId && m.winnerId === m.team2?.id ? 'text-amber-400 font-black' : 'text-slate-100'}`}>
                        {m.team2Name}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Line: Action / Assignment CTA */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60 gap-1 flex-wrap">
                    <span className="text-slate-500">{m.dayName || 'Dia 1'}</span>
                    
                    {m.isReady && !isReadOnly ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {availableCourts.length > 0 && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Quadra:</span>
                            {availableCourts.map(c => {
                              const shortName = c.name.replace(/Quadra\s*/i, 'Q');
                              return (
                                <button
                                  key={c.id || c.name}
                                  type="button"
                                  onClick={() => {
                                    if (onUpdateCourt) {
                                      onUpdateCourt(m.id, c.name, m.categoryId);
                                      setSelectedWaitingMatch(null);
                                    }
                                  }}
                                  title={`Alocar agora na ${c.name}`}
                                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-400 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-[10px] font-black transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                  +{shortName}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <span 
                          onClick={() => {
                            if (selectedWaitingMatch?.id === m.id) {
                              setSelectedWaitingMatch(null);
                            } else {
                              setSelectedWaitingMatch(m);
                            }
                          }}
                          className={`font-bold flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-amber-400 hover:text-amber-300'
                          }`}
                        >
                          <GripVertical className="w-3 h-3" />
                          {isSelected ? 'Quadra selecionada' : 'Mover / Arrastar'}
                        </span>
                      </div>
                    ) : m.isLive ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Lançar Placar
                      </span>
                    ) : m.isCompleted ? (
                      <span className="text-purple-300">Concluído</span>
                    ) : (
                      <span className="text-slate-500">Aguardando anteriores</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
