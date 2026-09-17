import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Settings2, 
  Coffee, 
  Flame, 
  Search, 
  Sliders,
  Users,
  Grid,
  ListFilter,
  Copy,
  Check
} from 'lucide-react';
import { getNextPowerOfTwo } from '../utils/doubleEliminationEngine';

export default function ScheduleManager({
  categories = [],
  teams = [],
  brackets = {},
  eventInfo = {},
  setEventInfo,
  onNavigateToBracket,
  isReadOnly = false,
}) {
  // Default configuration or saved in eventInfo.scheduleConfig
  const savedConfig = eventInfo?.scheduleConfig || {};

  const [startTime, setStartTime] = useState(savedConfig.startTime || '08:00');
  const [matchDuration, setMatchDuration] = useState(savedConfig.matchDuration || 25);
  const [warmupDuration, setWarmupDuration] = useState(savedConfig.warmupDuration !== undefined ? savedConfig.warmupDuration : 5);
  const [courtSwitchDuration, setCourtSwitchDuration] = useState(savedConfig.courtSwitchDuration !== undefined ? savedConfig.courtSwitchDuration : 3);
  
  // Available courts from eventInfo or default 2 courts
  const allCourts = eventInfo?.courts && eventInfo.courts.length > 0
    ? eventInfo.courts
    : [
        { id: 'court-1', name: 'Quadra 1' },
        { id: 'court-2', name: 'Quadra 2' }
      ];

  const [selectedCourtIds, setSelectedCourtIds] = useState(
    savedConfig.selectedCourtIds || allCourts.map(c => c.id)
  );

  // Lunch / Break configuration
  const [lunchEnabled, setLunchEnabled] = useState(savedConfig.lunchBreak?.enabled || false);
  const [lunchStart, setLunchStart] = useState(savedConfig.lunchBreak?.startTime || '12:30');
  const [lunchDuration, setLunchDuration] = useState(savedConfig.lunchBreak?.duration || 45);

  // Category Order state
  const [categoryOrder, setCategoryOrder] = useState(() => {
    if (savedConfig.categoryOrder && Array.isArray(savedConfig.categoryOrder)) {
      // Merge with any newly added categories that might not be in saved order
      const existing = savedConfig.categoryOrder.filter(id => categories.some(c => c.id === id));
      const missing = categories.filter(c => !existing.includes(c.id)).map(c => c.id);
      return [...existing, ...missing];
    }
    return categories.map(c => c.id);
  });

  // UI View Mode: 'timeline' (por quadras) or 'table' (lista completa)
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [hasSavedNotice, setHasSavedNotice] = useState(false);

  // Synchronize category order if categories prop changes
  React.useEffect(() => {
    setCategoryOrder(prev => {
      const existing = prev.filter(id => categories.some(c => c.id === id));
      const missing = categories.filter(c => !existing.includes(c.id)).map(c => c.id);
      return [...existing, ...missing];
    });
  }, [categories]);

  // Handle reorder categories
  const moveCategory = (index, direction) => {
    if (isReadOnly) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categoryOrder.length) return;
    const newOrder = [...categoryOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setCategoryOrder(newOrder);
  };

  // Toggle court selection
  const toggleCourt = (courtId) => {
    if (isReadOnly) return;
    setSelectedCourtIds(prev => {
      if (prev.includes(courtId)) {
        if (prev.length <= 1) {
          alert('É necessário ter pelo menos 1 quadra ativa para a programação.');
          return prev;
        }
        return prev.filter(id => id !== courtId);
      } else {
        return [...prev, courtId];
      }
    });
  };

  // Save changes to eventInfo
  const handleSaveScheduleConfig = () => {
    if (isReadOnly || !setEventInfo) return;
    const updatedConfig = {
      startTime,
      matchDuration: Number(matchDuration),
      warmupDuration: Number(warmupDuration),
      courtSwitchDuration: Number(courtSwitchDuration),
      selectedCourtIds,
      categoryOrder,
      lunchBreak: {
        enabled: lunchEnabled,
        startTime: lunchStart,
        duration: Number(lunchDuration)
      }
    };

    setEventInfo(prev => ({
      ...prev,
      scheduleConfig: updatedConfig
    }));

    setHasSavedNotice(true);
    setTimeout(() => setHasSavedNotice(false), 3000);
  };

  // Helper to add minutes to 'HH:MM' string
  const addMinutesToTime = (timeStr, minutesToAdd) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMins = h * 60 + m + minutesToAdd;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // Helper to convert 'HH:MM' to minutes from midnight
  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (totalMins) => {
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = Math.floor(totalMins % 60);
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // Active Courts list
  const activeCourts = allCourts.filter(c => selectedCourtIds.includes(c.id));
  const courtsCount = Math.max(activeCourts.length, 1);

  // Total slot duration per match
  const totalSlotMinutes = Number(matchDuration) + Number(warmupDuration) + Number(courtSwitchDuration);

  // =========================================================================
  // SCHEDULING ENGINE: CALCULATE MATCHES & GENERATE TIME SLOTS
  // =========================================================================
  const { scheduledMatches, categorySummaries, overallStats } = useMemo(() => {
    const orderedCategories = categoryOrder
      .map(id => categories.find(c => c.id === id))
      .filter(Boolean);

    // Track court availability times in minutes from midnight
    // courtCurrentTime[courtIndex] = current minute when the court is free
    const startMins = timeToMinutes(startTime);
    const lunchStartMins = lunchEnabled ? timeToMinutes(lunchStart) : null;
    const lunchEndMins = lunchEnabled ? lunchStartMins + Number(lunchDuration) : null;

    let courtNextFreeTime = new Array(courtsCount).fill(startMins);

    const allScheduled = [];
    const summaries = [];
    let matchGlobalCounter = 1;

    orderedCategories.forEach((cat) => {
      const catTeams = teams.filter(t => t.categoryId === cat.id);
      const bracket = brackets[cat.id];
      const hasRealBracket = bracket && bracket.matches && Object.keys(bracket.matches).length > 0;

      let catMatchesList = [];

      if (hasRealBracket) {
        // Collect real matches from bracket, excluding BYE matches
        const rawMatches = Object.values(bracket.matches)
          .filter(m => !m.isBye && !m.isByeMatch)
          .sort((a, b) => {
            // Sort by round: winners first, then losers, then grand final
            if (a.type !== b.type) {
              if (a.type === 'WINNERS') return -1;
              if (b.type === 'WINNERS') return 1;
              if (a.type === 'LOSERS') return -1;
              return 1;
            }
            return (a.round || 1) - (b.round || 1);
          });

        catMatchesList = rawMatches.map(m => {
          const t1 = m.team1?.displayName || (m.team1?.isBye ? 'Folga' : 'A definir');
          const t2 = m.team2?.displayName || (m.team2?.isBye ? 'Folga' : 'A definir');
          const roundName = m.type === 'GRAND_FINAL'
            ? 'Grande Final'
            : `${m.type === 'WINNERS' ? 'Chave Principal' : 'Repescagem'} - Rodada ${m.round || 1}`;

          return {
            id: m.id,
            realMatchId: m.id,
            category: cat,
            categoryId: cat.id,
            roundName,
            team1Name: t1,
            team2Name: t2,
            status: m.status || 'PENDING',
            score: m.score ? `${m.score.team1 || 0} x ${m.score.team2 || 0}` : null
          };
        });
      } else {
        // Simulação baseada na quantidade de duplas inscritas
        const nTeams = catTeams.length;
        let estimatedMatchesCount = 0;

        if (nTeams >= 2) {
          const bracketSize = getNextPowerOfTwo(Math.max(nTeams, 4));
          // In double elimination: total matches is approximately 2*N - 2
          estimatedMatchesCount = Math.max(1, (2 * nTeams) - 2);
        }

        for (let i = 1; i <= estimatedMatchesCount; i++) {
          let phase = 'Fase Classificatória';
          if (i === estimatedMatchesCount) phase = 'Grande Final';
          else if (i >= estimatedMatchesCount - 2) phase = 'Semifinal / Repescagem';
          else if (i <= Math.ceil(estimatedMatchesCount / 2)) phase = 'Rodada Inicial';

          catMatchesList.push({
            id: `sim-${cat.id}-${i}`,
            realMatchId: null,
            category: cat,
            categoryId: cat.id,
            roundName: `${phase} (Jogo ${i})`,
            team1Name: catTeams[(i * 2 - 2) % (catTeams.length || 1)]?.displayName || `Dupla ${i * 2 - 1}`,
            team2Name: catTeams[(i * 2 - 1) % (catTeams.length || 1)]?.displayName || `Dupla ${i * 2}`,
            status: 'ESTIMATED',
            score: null
          });
        }
      }

      const catStartMinutes = Math.min(...courtNextFreeTime);

      // Schedule each match across available courts
      catMatchesList.forEach((item) => {
        // Find court that is free earliest
        let chosenCourtIndex = 0;
        let earliestFree = courtNextFreeTime[0];

        for (let c = 1; c < courtsCount; c++) {
          if (courtNextFreeTime[c] < earliestFree) {
            earliestFree = courtNextFreeTime[c];
            chosenCourtIndex = c;
          }
        }

        let slotStart = earliestFree;

        // Check for lunch break intersection
        if (lunchEnabled && lunchStartMins && lunchEndMins) {
          if (slotStart < lunchEndMins && slotStart + totalSlotMinutes > lunchStartMins) {
            // Push match to after lunch
            slotStart = lunchEndMins;
          }
        }

        const warmupStartStr = minutesToTime(slotStart);
        const matchStartStr = minutesToTime(slotStart + Number(warmupDuration));
        const matchEndStr = minutesToTime(slotStart + Number(warmupDuration) + Number(matchDuration));
        const slotEndStr = minutesToTime(slotStart + totalSlotMinutes);

        const courtObj = activeCourts[chosenCourtIndex] || { id: `court-${chosenCourtIndex + 1}`, name: `Quadra ${chosenCourtIndex + 1}` };

        allScheduled.push({
          ...item,
          matchOrder: matchGlobalCounter++,
          courtIndex: chosenCourtIndex,
          court: courtObj,
          slotStartMins: slotStart,
          slotEndMins: slotStart + totalSlotMinutes,
          timeFormatted: warmupStartStr,
          warmupTime: warmupStartStr,
          gameStartTime: matchStartStr,
          gameEndTime: matchEndStr,
          slotEndTime: slotEndStr,
        });

        // Update court free time
        courtNextFreeTime[chosenCourtIndex] = slotStart + totalSlotMinutes;
      });

      const catEndMinutes = Math.max(...courtNextFreeTime);
      const durationMins = catEndMinutes - catStartMinutes;

      summaries.push({
        category: cat,
        teamsCount: catTeams.length,
        matchesCount: catMatchesList.length,
        hasRealBracket,
        startTimeFormatted: minutesToTime(catStartMinutes),
        endTimeFormatted: minutesToTime(catEndMinutes),
        durationHours: (durationMins / 60).toFixed(1),
        durationMins,
      });
    });

    const tournamentStartMins = startMins;
    const tournamentEndMins = Math.max(...courtNextFreeTime, startMins);
    const totalTournamentMins = tournamentEndMins - tournamentStartMins;

    const stats = {
      totalMatches: allScheduled.length,
      tournamentStartTime: startTime,
      tournamentEndTime: minutesToTime(tournamentEndMins),
      totalDurationHours: (totalTournamentMins / 60).toFixed(1),
      courtsUsed: courtsCount,
      slotPerGameMinutes: totalSlotMinutes,
    };

    return {
      scheduledMatches: allScheduled,
      categorySummaries: summaries,
      overallStats: stats,
    };
  }, [
    categoryOrder,
    categories,
    teams,
    brackets,
    startTime,
    matchDuration,
    warmupDuration,
    courtSwitchDuration,
    courtsCount,
    activeCourts,
    lunchEnabled,
    lunchStart,
    lunchDuration,
    totalSlotMinutes
  ]);

  // Filtered matches for table search / category filter
  const filteredMatches = useMemo(() => {
    return scheduledMatches.filter(m => {
      const matchCat = selectedCategoryFilter === 'ALL' || m.categoryId === selectedCategoryFilter;
      const q = searchTerm.toLowerCase();
      const matchText = !searchTerm || 
        m.team1Name.toLowerCase().includes(q) ||
        m.team2Name.toLowerCase().includes(q) ||
        m.category.name.toLowerCase().includes(q) ||
        m.court.name.toLowerCase().includes(q) ||
        m.roundName.toLowerCase().includes(q) ||
        m.timeFormatted.includes(q);

      return matchCat && matchText;
    });
  }, [scheduledMatches, selectedCategoryFilter, searchTerm]);

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  // Copy schedule as plain text for WhatsApp
  const handleCopyScheduleText = () => {
    let text = `📅 *PROGRAMAÇÃO OFICIAL - ${eventInfo?.name || 'TORNEIO DE FUTVÔLEI'}*\n`;
    text += `⏰ Início: ${overallStats.tournamentStartTime} | Término Previsto: ${overallStats.tournamentEndTime}\n`;
    text += `🏟️ Quadras em Uso: ${overallStats.courtsUsed} | Duração por Jogo: ${overallStats.slotPerGameMinutes} min\n\n`;

    text += `📋 *ORDEM DAS CATEGORIAS:*\n`;
    categorySummaries.forEach((s, idx) => {
      text += `${idx + 1}. *${s.category.name}* (${s.teamsCount} duplas - ${s.matchesCount} jogos) ➔ ${s.startTimeFormatted} às ${s.endTimeFormatted}\n`;
    });

    text += `\n🎾 *GRADE DE JOGOS:*\n`;
    scheduledMatches.forEach((m) => {
      text += `⏱️ ${m.timeFormatted} | ${m.court.name} | [${m.category.shortName}] ${m.roundName}\n`;
      text += `   👉 ${m.team1Name} vs ${m.team2Name}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  return (
    <div className="space-y-6">

      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                Programação Oficial dos Jogos
              </h2>
              <p className="text-xs text-slate-400">
                Ordene as categorias, configure os tempos de partida e gere a grade horária automática por quadras.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Copy Button */}
          <button
            onClick={handleCopyScheduleText}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
            title="Copiar programação para WhatsApp"
          >
            {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
            <span>{copiedNotification ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            title="Imprimir grade oficial"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir</span>
          </button>

          {/* Save Configuration Button */}
          {!isReadOnly && (
            <button
              onClick={handleSaveScheduleConfig}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{hasSavedNotice ? 'Salvo com Sucesso!' : 'Salvar Programação'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">INÍCIO & TÉRMINO</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-display text-white">
              {overallStats.tournamentStartTime}
            </span>
            <span className="text-xs text-slate-400 mx-1.5">às</span>
            <span className="text-xl sm:text-2xl font-black font-display text-amber-400">
              {overallStats.tournamentEndTime}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Duração estimada: ~{overallStats.totalDurationHours} horas</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">TOTAL DE JOGOS</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-display text-white">
              {overallStats.totalMatches}
            </span>
            <span className="text-xs text-slate-400">partidas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Distribuídos em {overallStats.courtsUsed} quadra(s)</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">SLOT POR PARTIDA</span>
            <Settings2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-display text-cyan-400">
              {overallStats.slotPerGameMinutes}
            </span>
            <span className="text-xs text-slate-400">minutos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Jogo: {matchDuration}m • Aquec: {warmupDuration}m • Troca: {courtSwitchDuration}m
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">QUADRAS EM USO</span>
            <Grid className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400">
              {overallStats.courtsUsed}
            </span>
            <span className="text-xs text-slate-400">de {allCourts.length} cadastradas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeCourts.map(c => c.name).join(', ')}
          </p>
        </div>
      </div>

      {/* Configuration & Sequencing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Category Order & Sequencing */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Ordem e Sequência de Início das Categorias
              </h3>
              <p className="text-xs text-slate-400">
                A primeira categoria da lista começa no horário inicial; as próximas seguem conforme as quadras liberam.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {categorySummaries.length} categorias
            </span>
          </div>

          {categorySummaries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhuma categoria cadastrada no momento. Crie categorias para programar o torneio.
            </div>
          ) : (
            <div className="space-y-2.5">
              {categorySummaries.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === categorySummaries.length - 1;

                return (
                  <div
                    key={item.category.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Position and Category Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0">
                        {index + 1}º
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.category.color || '#F59E0B' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">
                              {item.category.name}
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {item.category.shortName}
                            </span>
                            {item.hasRealBracket && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Chave Ativa
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.teamsCount} duplas inscritas • ~{item.matchesCount} partidas estimadas
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Estimated Times & Reorder Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.startTimeFormatted}</span>
                          <span className="text-slate-500">➔</span>
                          <span className="text-emerald-400">{item.endTimeFormatted}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Duração: ~{item.durationHours}h ({item.durationMins} min)
                        </span>
                      </div>

                      {/* Up / Down Buttons */}
                      {!isReadOnly && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => moveCategory(index, -1)}
                            disabled={isFirst}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isFirst 
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white'
                            }`}
                            title="Mover categoria para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveCategory(index, 1)}
                            disabled={isLast}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isLast 
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white'
                            }`}
                            title="Mover categoria para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Global Time & Court Parameters */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Parâmetros de Tempo & Quadras
            </h3>
            <p className="text-xs text-slate-400">Ajuste os minutos e as quadras disponíveis</p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Start Time */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Horário de Início do Torneio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Match Duration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Tempo de Partida</label>
                <span className="font-mono text-amber-400 font-bold">{matchDuration} min</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Warmup Duration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Tempo de Aquecimento</label>
                <span className="font-mono text-cyan-400 font-bold">{warmupDuration} min</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={warmupDuration}
                onChange={(e) => setWarmupDuration(Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Court Switch Duration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Troca de Quadras / Intervalo</label>
                <span className="font-mono text-purple-400 font-bold">{courtSwitchDuration} min</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={courtSwitchDuration}
                onChange={(e) => setCourtSwitchDuration(Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Total Slot Banner */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between font-mono">
              <span className="text-slate-300">Tempo Total por Jogo:</span>
              <span className="font-extrabold text-emerald-400 text-sm">{totalSlotMinutes} min</span>
            </div>

            {/* Quadras Ativas */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-semibold mb-2">
                Quadras Ativas na Programação:
              </label>
              <div className="space-y-1.5">
                {allCourts.map(c => {
                  const isChecked = selectedCourtIds.includes(c.id);
                  return (
                    <label 
                      key={c.id} 
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-semibold text-xs">{c.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCourt(c.id)}
                        disabled={isReadOnly}
                        className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional Lunch Break */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pausa / Almoço</span>
                </label>
                <input
                  type="checkbox"
                  checked={lunchEnabled}
                  onChange={(e) => setLunchEnabled(e.target.checked)}
                  disabled={isReadOnly}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {lunchEnabled && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Início:</span>
                    <input
                      type="time"
                      value={lunchStart}
                      onChange={(e) => setLunchStart(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Duração:</span>
                    <select
                      value={lunchDuration}
                      onChange={(e) => setLunchDuration(Number(e.target.value))}
                      disabled={isReadOnly}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 hora</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Grade de Jogos / Cronograma Detalhado */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        {/* Table & View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Grade Horária & Cronograma Detalhado
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {filteredMatches.length} confrontos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar dupla, quadra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Matches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] bg-slate-950/40">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Horário Previsto</th>
                <th className="py-3 px-3">Quadra</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Fase / Rodada</th>
                <th className="py-3 px-4">Confronto</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                    Nenhum jogo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  return (
                    <tr 
                      key={m.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {m.matchOrder}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                          <span>{m.timeFormatted}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({m.gameStartTime} - {m.gameEndTime})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold">
                          {m.court.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: m.category.color || '#F59E0B' }}
                          />
                          <span className="font-semibold text-white">
                            {m.category.shortName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {m.roundName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{m.team1Name}</span>
                          <span className="text-xs text-amber-500/80 font-display">vs</span>
                          <span className="text-white">{m.team2Name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {m.status === 'LIVE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 animate-pulse">
                            ● Em Andamento
                          </span>
                        ) : m.status === 'COMPLETED' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            ✓ Encerrado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700">
                            A Realizar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
