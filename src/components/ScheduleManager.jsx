import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  Printer,
  CheckCircle2,
  Layers,
  Settings2,
  Coffee,
  Flame,
  Search,
  Sliders,
  Grid,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  CalendarDays,
  Tag,
  AlertCircle,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────
function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return 480; // default 08:00
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(v) {
  const newH = Math.floor(v / 60) % 24;
  const newM = Math.floor(v % 60);
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function formatDatePt(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const wd = weekdays[dateObj.getDay()];
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} (${wd})`;
  } catch (e) {
    return dateStr;
  }
}

// ─── Core Scheduling Engine for a Single Day ────────────────────────────────
function buildDaySchedule({
  dayInfo,
  orderedCategoryEntries,
  startTime,
  matchDuration,
  warmupDuration,
  courtSwitchDuration,
  activeCourts,
  categoryCourtsConfig,
  startMatchCounter = 1,
}) {
  const slot = Number(matchDuration) + Number(warmupDuration) + Number(courtSwitchDuration);
  const startMins = timeToMinutes(startTime);
  const n = Math.max(activeCourts.length, 1);
  const free = new Array(n).fill(startMins);
  const all = [];
  const sums = [];
  let counter = startMatchCounter;

  orderedCategoryEntries.forEach(({ category: cat, matchesList }) => {
    const catStart = Math.min(...free);
    const cc = categoryCourtsConfig[cat.id];
    let allowed = (!cc || cc === 'ALL')
      ? activeCourts.map((_, i) => i)
      : activeCourts.map((c, i) => (Array.isArray(cc) && cc.includes(c.id) ? i : -1)).filter(i => i !== -1);
    if (!allowed.length) allowed = activeCourts.map((_, i) => i);

    matchesList.forEach(item => {
      let ci = allowed[0], ef = free[ci];
      for (let i = 1; i < allowed.length; i++) {
        const x = allowed[i];
        if (free[x] < ef) { ef = free[x]; ci = x; }
      }
      let s = ef;
      const co = activeCourts[ci] || { id: `court-${ci + 1}`, name: `Quadra ${ci + 1}` };
      all.push({
        ...item,
        dayId: dayInfo.id,
        dayName: dayInfo.name,
        dayDate: dayInfo.date,
        matchOrder: counter++,
        courtIndex: ci,
        court: co,
        slotStartMins: s,
        slotEndMins: s + slot,
        timeFormatted: minutesToTime(s),
        warmupTime: minutesToTime(s),
        gameStartTime: minutesToTime(s + Number(warmupDuration)),
        gameEndTime: minutesToTime(s + Number(warmupDuration) + Number(matchDuration)),
        slotEndTime: minutesToTime(s + slot),
      });
      free[ci] = s + slot;
    });

    const catEnd = Math.max(...free);
    const dm = catEnd - catStart;
    sums.push({
      category: cat,
      dayId: dayInfo.id,
      dayName: dayInfo.name,
      dayDate: dayInfo.date,
      matchesCount: matchesList.length,
      startTimeFormatted: minutesToTime(catStart),
      endTimeFormatted: minutesToTime(catEnd),
      durationHours: (dm / 60).toFixed(1),
      durationMins: dm,
    });
  });

  const end = Math.max(...free, startMins);
  return {
    scheduledMatches: all,
    categorySummaries: sums,
    dayStats: {
      totalMatches: all.length,
      dayStartTime: startTime,
      dayEndTime: minutesToTime(end),
      dayDurationHours: ((end - startMins) / 60).toFixed(1),
      courtsUsed: n,
      totalSlotMinutes: slot,
    },
    nextMatchCounter: counter,
  };
}

// ─── Multi-Day Scheduling Builder ───────────────────────────────────────────
function buildMultiDaySchedule({
  days,
  categories,
  categoryCourtsConfig,
  sharedParams,
  getMatchesForCategory,
}) {
  let globalCounter = 1;
  const daysResults = [];
  const allScheduledMatches = [];
  const allCategorySummaries = [];

  days.forEach(day => {
    const dayCategories = (day.categoryIds || [])
      .map(id => categories.find(c => c.id === id))
      .filter(Boolean);

    const orderedEntries = dayCategories.map(cat => ({
      category: cat,
      matchesList: getMatchesForCategory(cat, day),
    }));

    const dayRes = buildDaySchedule({
      ...sharedParams,
      dayInfo: day,
      startTime: day.startTime || sharedParams.startTime || '08:00',
      orderedCategoryEntries: orderedEntries,
      categoryCourtsConfig,
      startMatchCounter: globalCounter,
    });

    globalCounter = dayRes.nextMatchCounter;
    daysResults.push({
      day,
      dayCategories,
      ...dayRes,
    });
    allScheduledMatches.push(...dayRes.scheduledMatches);
    allCategorySummaries.push(...dayRes.categorySummaries);
  });

  const totalSlot = Number(sharedParams.matchDuration) + Number(sharedParams.warmupDuration) + Number(sharedParams.courtSwitchDuration);

  return {
    daysResults,
    scheduledMatches: allScheduledMatches,
    categorySummaries: allCategorySummaries,
    overallStats: {
      totalMatches: allScheduledMatches.length,
      totalDays: days.length,
      courtsUsed: sharedParams.activeCourts.length,
      totalSlotMinutes: totalSlot,
      tournamentStartTime: days[0]?.startTime || '08:00',
      tournamentEndTime: daysResults[daysResults.length - 1]?.dayStats?.dayEndTime || '18:00',
    },
  };
}

// ─── ProgramacaoPrevia Card ────────────────────────────────────────────────
function ProgramacaoPrevia({ scheduleResult, eventInfo }) {
  const { daysResults, categorySummaries, overallStats } = scheduleResult;
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handlePrint = () => window.print();

  const handleCopy = () => {
    if (!categorySummaries.length) { alert('Nenhuma categoria para copiar.'); return; }
    let text = `📅 *PROGRAMAÇÃO PRÉVIA - ${eventInfo?.name || 'TORNEIO'}*\n`;
    text += `⚠️ Programação sujeita a Mudanças e sem aviso prévio\n\n`;

    daysResults.forEach(({ day, categorySummaries: dSums, dayStats }) => {
      const dateFormatted = formatDatePt(day.date);
      text += `🗓️ *${day.name.toUpperCase()}* ${dateFormatted ? `— ${dateFormatted}` : ''}\n`;
      text += `⏰ Início: ${dayStats.dayStartTime} | Término estimado: ${dayStats.dayEndTime} (~${dayStats.dayDurationHours}h, ${dayStats.totalMatches} partidas)\n`;
      if (!dSums.length) {
        text += `   (Nenhuma categoria alocada neste dia)\n`;
      } else {
        dSums.forEach((s, idx) => {
          text += `🏷️ *${idx + 1}º ${s.category.name}* (${s.category.shortName})\n`;
          text += `   ⏱️ ${s.startTimeFormatted} → ${s.endTimeFormatted} (~${s.durationHours}h, ~${s.matchesCount} partidas)\n`;
        });
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  const displayedDays = selectedDayFilter === 'ALL'
    ? daysResults
    : daysResults.filter(d => d.day.id === selectedDayFilter);

  return (
    <div className="space-y-4">
      {/* Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Atenção</p>
          <p className="text-sm font-semibold text-amber-200 mt-0.5">
            Programação Prévia — baseada na quantidade de vagas por categoria e dias definidos.
          </p>
          <p className="text-xs text-amber-400/80 mt-1 italic">
            ⚠️ Programação sujeita a Mudanças e sem aviso prévio.
          </p>
        </div>
      </div>

      {/* Day Filter Tabs */}
      <div className="no-print flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDayFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedDayFilter === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Todos os Dias ({daysResults.length})
        </button>
        {daysResults.map(dr => (
          <button
            key={dr.day.id}
            onClick={() => setSelectedDayFilter(dr.day.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedDayFilter === dr.day.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{dr.day.name}</span>
            {dr.day.date && <span className="opacity-75 text-[10px]">({formatDatePt(dr.day.date)})</span>}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">DIAS DO TORNEIO</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-amber-400">{daysResults.length}</span>
            <span className="text-xs text-slate-400">{daysResults.length === 1 ? 'dia de jogos' : 'dias de jogos'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{overallStats.tournamentStartTime} às {overallStats.tournamentEndTime}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">JOGOS ESTIMADOS</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-white">{overallStats.totalMatches}</span>
            <span className="text-xs text-slate-400">partidas</span>
          </div>
          <p className="text-[11px] text-slate-500">Por vagas cadastradas</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">SLOT POR PARTIDA</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-cyan-400">{overallStats.totalSlotMinutes}</span>
            <span className="text-xs text-slate-400">min</span>
          </div>
          <p className="text-[11px] text-slate-500">Jogo + Aquec. + Troca</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">CATEGORIAS ALOCADAS</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-purple-400">{categorySummaries.length}</span>
            <span className="text-xs text-slate-400">categorias</span>
          </div>
          <p className="text-[11px] text-slate-500">Distribuídas nos dias</p>
        </div>
      </div>

      {/* Days & Categories Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-400" />
            Programação por Dia e Categoria
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              {copiedNotification ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedNotification ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {displayedDays.map(dr => (
          <div key={dr.day.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            {/* Day Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-base font-display">{dr.day.name}</h4>
                    {dr.day.date && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold border border-slate-700">
                        {formatDatePt(dr.day.date)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {dr.categorySummaries.length} categoria(s) agendadas • {dr.dayStats.totalMatches} partidas estimadas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-white">{dr.dayStats.dayStartTime}</span>
                <span className="text-slate-500">➔</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{dr.dayStats.dayEndTime}</span>
                <span className="text-[11px] text-slate-400 ml-1">(~{dr.dayStats.dayDurationHours}h)</span>
              </div>
            </div>

            {/* Categories in this day */}
            {dr.categorySummaries.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Nenhuma categoria atribuída a este dia. Adicione categorias na aba "Configuração da Programação".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dr.categorySummaries.map((s, idx) => (
                  <div key={s.category.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0">
                        {idx + 1}º
                      </div>
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.category.color || '#F59E0B' }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{s.category.name}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{s.category.shortName}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">~{s.matchesCount} partidas • ~{s.durationHours}h</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 justify-end">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.startTimeFormatted}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-emerald-400">{s.endTimeFormatted}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Estimado</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ProgramacaoOficial Card ───────────────────────────────────────────────
function ProgramacaoOficial({ scheduleResult, eventInfo, categories }) {
  const { daysResults, scheduledMatches, categorySummaries, overallStats } = scheduleResult;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const filteredMatches = useMemo(() =>
    scheduledMatches.filter(m => {
      const matchDay = selectedDayFilter === 'ALL' || m.dayId === selectedDayFilter;
      const matchCat = selectedCategoryFilter === 'ALL' || m.categoryId === selectedCategoryFilter;
      const q = searchTerm.toLowerCase();
      const matchText = !searchTerm ||
        m.team1Name.toLowerCase().includes(q) ||
        m.team2Name.toLowerCase().includes(q) ||
        m.category.name.toLowerCase().includes(q) ||
        m.court.name.toLowerCase().includes(q) ||
        m.roundName.toLowerCase().includes(q) ||
        (m.dayName && m.dayName.toLowerCase().includes(q)) ||
        m.timeFormatted.includes(q);
      return matchDay && matchCat && matchText;
    }),
    [scheduledMatches, selectedDayFilter, selectedCategoryFilter, searchTerm]
  );

  const handlePrint = () => window.print();

  const handleCopy = () => {
    if (!filteredMatches.length) { alert('Nenhum jogo para copiar.'); return; }
    let text = `📅 *GRADE DE HORÁRIOS - ${eventInfo?.name || 'TORNEIO'}*\n`;
    text += `⏰ Início Geral: ${overallStats.tournamentStartTime} | Total: ${overallStats.totalMatches} partidas\n\n`;

    daysResults.forEach(({ day, dayStats }) => {
      const dayMatches = filteredMatches.filter(m => m.dayId === day.id);
      if (dayMatches.length === 0) return;
      const dateFormatted = formatDatePt(day.date);
      text += `🗓️ *${day.name.toUpperCase()}* ${dateFormatted ? `— ${dateFormatted}` : ''}\n`;
      text += `⏰ Início: ${dayStats.dayStartTime} | Término: ${dayStats.dayEndTime}\n\n`;
      dayMatches.forEach(m => {
        text += `⏱️ *${m.timeFormatted}* | 🏟️ *${m.court.name}* | [${m.category.shortName}] ${m.roundName}\n`;
        text += `👉 *${m.team1Name}* vs *${m.team2Name}*\n\n`;
      });
      text += `------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  return (
    <div id="printable-schedule-grid" className="space-y-4">
      {/* Print-only header */}
      <div className="print-only-header">
        <h1 className="text-xl font-black uppercase">{eventInfo?.name || 'Torneio'}</h1>
        <p className="text-sm font-bold">Programação Oficial dos Jogos</p>
        <p className="text-xs mt-1">
          {daysResults.map(dr => `${dr.day.name}: ${dr.dayStats.dayStartTime} às ${dr.dayStats.dayEndTime}`).join(' • ')} • {overallStats.totalMatches} partidas
        </p>
      </div>

      {/* KPIs */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">DIAS DO TORNEIO</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-white">{daysResults.length}</span>
            <span className="text-xs text-slate-400">dias</span>
          </div>
          <p className="text-[11px] text-slate-500">{overallStats.tournamentStartTime} às {overallStats.tournamentEndTime}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">TOTAL DE JOGOS</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-white">{overallStats.totalMatches}</span>
            <span className="text-xs text-slate-400">partidas</span>
          </div>
          <p className="text-[11px] text-slate-500">{overallStats.courtsUsed} quadra(s)</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">SLOT POR PARTIDA</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-cyan-400">{overallStats.totalSlotMinutes}</span>
            <span className="text-xs text-slate-400">min</span>
          </div>
          <p className="text-[11px] text-slate-500">Jogo + Aquec. + Troca</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">CATEGORIAS</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-emerald-400">{categorySummaries.length}</span>
            <span className="text-xs text-slate-400">categorias</span>
          </div>
          <p className="text-[11px] text-slate-500">Inscritos reais</p>
        </div>
      </div>

      {/* Category Timeline Summary per Day */}
      <div className="no-print space-y-3">
        {daysResults.map(dr => (
          <div key={dr.day.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">{dr.day.name}</span>
                {dr.day.date && (
                  <span className="text-[11px] text-amber-300 font-semibold">({formatDatePt(dr.day.date)})</span>
                )}
              </div>
              <div className="text-xs font-mono text-slate-400">
                Início: <span className="text-white font-bold">{dr.dayStats.dayStartTime}</span> • Término est.: <span className="text-emerald-400 font-bold">{dr.dayStats.dayEndTime}</span>
              </div>
            </div>

            {dr.categorySummaries.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">Nenhuma categoria alocada neste dia.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {dr.categorySummaries.map((s, idx) => (
                  <div key={s.category.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-display font-extrabold text-[10px] flex-shrink-0">
                        {idx + 1}º
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.category.color || '#F59E0B' }} />
                      <div>
                        <span className="font-bold text-white text-xs block leading-tight">{s.category.name}</span>
                        <span className="text-[10px] text-slate-400">{s.matchesCount} partidas</span>
                      </div>
                    </div>
                    <div className="text-right text-xs font-mono text-amber-400 font-bold whitespace-nowrap">
                      <span>{s.startTimeFormatted}</span>
                      <span className="text-slate-500 text-[10px] block font-normal">➔ {s.endTimeFormatted}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grade de Horários Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Grade Horária &amp; Cronograma
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {filteredMatches.length} confrontos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar dupla, quadra, dia..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={selectedDayFilter}
              onChange={e => setSelectedDayFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todos os Dias ({daysResults.length})</option>
              {daysResults.map(dr => (
                <option key={dr.day.id} value={dr.day.id}>{dr.day.name} {dr.day.date ? `(${formatDatePt(dr.day.date)})` : ''}</option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copiedNotification ? 'Copiado!' : 'Copiar Grade p/ WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir Grade</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] bg-slate-950/40">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Dia</th>
                <th className="py-3 px-3">Horário</th>
                <th className="py-3 px-3">Quadra</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Fase</th>
                <th className="py-3 px-4">Confronto</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMatches.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-slate-500 text-xs">Nenhum jogo encontrado para os filtros selecionados.</td></tr>
              ) : filteredMatches.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-500">{m.matchOrder}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 text-[10px]">
                      {m.dayName}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                      <span>{m.timeFormatted}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({m.gameStartTime} - {m.gameEndTime})</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold">{m.court.name}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.category.color || '#F59E0B' }} />
                      <span className="font-semibold text-white">{m.category.shortName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{m.roundName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{m.team1Name}</span>
                      <span className="text-xs text-amber-500/80 font-display">vs</span>
                      <span className="text-white">{m.team2Name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {m.status === 'LIVE' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 animate-pulse">● Em Andamento</span>
                    ) : m.status === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">✓ Encerrado</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700">A Realizar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ScheduleManager({
  categories = [],
  teams = [],
  brackets = {},
  eventInfo = {},
  setEventInfo,
  onNavigateToBracket,
  isReadOnly = false,
}) {
  const [subMenu, setSubMenu] = useState('config');
  const [oficialTab, setOficialTab] = useState('previa');

  const savedConfig = eventInfo?.scheduleConfig || {};

  const [matchDuration, setMatchDuration] = useState(savedConfig.matchDuration || 25);
  const [warmupDuration, setWarmupDuration] = useState(savedConfig.warmupDuration !== undefined ? savedConfig.warmupDuration : 5);
  const [courtSwitchDuration, setCourtSwitchDuration] = useState(savedConfig.courtSwitchDuration !== undefined ? savedConfig.courtSwitchDuration : 3);

  const allCourts = eventInfo?.courts && eventInfo.courts.length > 0
    ? eventInfo.courts
    : [{ id: 'court-1', name: 'Quadra 1' }, { id: 'court-2', name: 'Quadra 2' }];

  const [selectedCourtIds, setSelectedCourtIds] = useState(savedConfig.selectedCourtIds || allCourts.map(c => c.id));
  const [categoryCourtsConfig, setCategoryCourtsConfig] = useState(savedConfig.categoryCourtsConfig || {});

  // ─── Multi-Day State Initialization ───
  const [days, setDays] = useState(() => {
    if (savedConfig.days && Array.isArray(savedConfig.days) && savedConfig.days.length > 0) {
      return savedConfig.days;
    }
    // Backward compatibility: create Day 1 with current categoryOrder or all categories
    const initialCategoryIds = (savedConfig.categoryOrder && Array.isArray(savedConfig.categoryOrder) && savedConfig.categoryOrder.length > 0)
      ? savedConfig.categoryOrder.filter(id => categories.some(c => c.id === id))
      : categories.map(c => c.id);

    return [
      {
        id: 'day-1',
        name: 'Dia 1',
        date: eventInfo?.date || '2026-09-05',
        startTime: savedConfig.startTime || '08:00',
        categoryIds: initialCategoryIds,
      }
    ];
  });

  const [hasSavedNotice, setHasSavedNotice] = useState(false);

  // Sync days when categories change (cleanup deleted categories)
  React.useEffect(() => {
    setDays(prevDays => prevDays.map(d => ({
      ...d,
      categoryIds: d.categoryIds.filter(id => categories.some(c => c.id === id)),
    })));
  }, [categories]);

  // Categories not assigned to ANY day
  const unassignedCategories = useMemo(() => {
    const assignedIds = new Set(days.flatMap(d => d.categoryIds));
    return categories.filter(c => !assignedIds.has(c.id));
  }, [days, categories]);

  // ─── Day Management Handlers ───
  const handleAddDay = () => {
    const nextNum = days.length + 1;
    let nextDate = eventInfo?.date || '';
    if (days.length > 0 && days[days.length - 1].date) {
      try {
        const prevParts = days[days.length - 1].date.split('-').map(Number);
        const d = new Date(prevParts[0], prevParts[1] - 1, prevParts[2]);
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        nextDate = `${y}-${m}-${dayNum}`;
      } catch (e) {
        nextDate = '';
      }
    }
    const newDay = {
      id: `day-${Date.now()}`,
      name: `Dia ${nextNum}`,
      date: nextDate,
      startTime: '08:00',
      categoryIds: [],
    };
    setDays([...days, newDay]);
  };

  const handleRemoveDay = (dayId) => {
    if (days.length <= 1) {
      alert('O torneio precisa ter pelo menos 1 dia configurado na programação.');
      return;
    }
    const dayToRemove = days.find(d => d.id === dayId);
    const catCount = dayToRemove?.categoryIds?.length || 0;
    const msg = catCount > 0
      ? `Remover "${dayToRemove?.name}"? As ${catCount} categoria(s) alocadas nele ficarão sem dia até serem atribuídas a outro.`
      : `Remover "${dayToRemove?.name}"?`;
    if (window.confirm(msg)) {
      setDays(prev => prev.filter(d => d.id !== dayId));
    }
  };

  const handleUpdateDay = (dayId, field, value) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, [field]: value } : d));
  };

  const handleToggleCategoryInDay = (dayId, categoryId) => {
    setDays(prev => prev.map(d => {
      if (d.id === dayId) {
        const exists = d.categoryIds.includes(categoryId);
        return {
          ...d,
          categoryIds: exists
            ? d.categoryIds.filter(id => id !== categoryId)
            : [...d.categoryIds, categoryId],
        };
      } else {
        // Exclude category from other days so it's assigned to one day
        return {
          ...d,
          categoryIds: d.categoryIds.filter(id => id !== categoryId),
        };
      }
    }));
  };

  const handleMoveCategoryInDay = (dayId, index, direction) => {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= d.categoryIds.length) return d;
      const nextCats = [...d.categoryIds];
      [nextCats[index], nextCats[targetIndex]] = [nextCats[targetIndex], nextCats[index]];
      return { ...d, categoryIds: nextCats };
    }));
  };

  const handleQuickAssignAllUnassigned = (dayId) => {
    const unassignedIds = unassignedCategories.map(c => c.id);
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, categoryIds: [...d.categoryIds, ...unassignedIds] } : d));
  };

  // ─── Court Allocation Handlers ───
  const activeCourts = allCourts.filter(c => selectedCourtIds.includes(c.id));
  const totalSlotMinutes = Number(matchDuration) + Number(warmupDuration) + Number(courtSwitchDuration);

  const handleSetCategoryCourts = (catId, mode) =>
    setCategoryCourtsConfig(prev => ({ ...prev, [catId]: mode }));

  const handleToggleCategoryCourt = (catId, courtId) => {
    setCategoryCourtsConfig(prev => {
      const current = prev[catId];
      let updated;
      if (!current || current === 'ALL') {
        updated = [courtId];
      } else if (Array.isArray(current)) {
        if (current.includes(courtId)) {
          updated = current.filter(id => id !== courtId);
          if (!updated.length) updated = 'ALL';
        } else {
          updated = [...current, courtId];
          if (updated.length >= activeCourts.length) updated = 'ALL';
        }
      } else {
        updated = [courtId];
      }
      return { ...prev, [catId]: updated };
    });
  };

  const toggleCourt = courtId => {
    setSelectedCourtIds(prev => {
      if (prev.includes(courtId)) {
        if (prev.length <= 1) { alert('É necessário ter pelo menos 1 quadra ativa.'); return prev; }
        return prev.filter(id => id !== courtId);
      }
      return [...prev, courtId];
    });
  };

  // ─── Save Configuration ───
  const handleSaveScheduleConfig = () => {
    if (isReadOnly || !setEventInfo) return;
    const flattenedOrder = days.flatMap(d => d.categoryIds);
    setEventInfo(prev => ({
      ...prev,
      scheduleConfig: {
        startTime: days[0]?.startTime || '08:00',
        matchDuration: Number(matchDuration),
        warmupDuration: Number(warmupDuration),
        courtSwitchDuration: Number(courtSwitchDuration),
        selectedCourtIds,
        categoryOrder: flattenedOrder,
        categoryCourtsConfig,
        days,
      }
    }));
    setHasSavedNotice(true);
    setTimeout(() => setHasSavedNotice(false), 3000);
  };

  const sharedParams = {
    startTime: days[0]?.startTime || '08:00',
    matchDuration,
    warmupDuration,
    courtSwitchDuration,
    activeCourts,
  };

  // ─── Multi-Day Prévia Schedule ───
  const previaSchedule = useMemo(() => {
    return buildMultiDaySchedule({
      days,
      categories,
      categoryCourtsConfig,
      sharedParams,
      getMatchesForCategory: (cat, day) => {
        const nSlots = Number(cat.maxTeams) || 0;
        const matchesList = [];
        if (nSlots >= 2) {
          const total = Math.max(1, (2 * nSlots) - 2);
          for (let i = 1; i <= total; i++) {
            let phase = 'Fase Classificatória';
            if (i === total) phase = 'Grande Final';
            else if (i >= total - 2) phase = 'Semifinal / Repescagem';
            else if (i <= Math.ceil(total / 2)) phase = 'Rodada Inicial';
            matchesList.push({
              id: `prev-${day.id}-${cat.id}-${i}`,
              realMatchId: null,
              category: cat,
              categoryId: cat.id,
              roundName: `${phase} (Jogo ${i})`,
              team1Name: `Dupla ${i * 2 - 1}`,
              team2Name: `Dupla ${i * 2}`,
              status: 'ESTIMATED',
              score: null,
            });
          }
        }
        return matchesList;
      },
    });
  }, [days, categories, categoryCourtsConfig, matchDuration, warmupDuration, courtSwitchDuration, activeCourts]);

  // ─── Multi-Day Oficial Schedule ───
  const oficialSchedule = useMemo(() => {
    return buildMultiDaySchedule({
      days,
      categories,
      categoryCourtsConfig,
      sharedParams,
      getMatchesForCategory: (cat, day) => {
        const catTeams = teams.filter(t => t.categoryId === cat.id);
        const bracket = brackets[cat.id];
        const hasRealBracket = bracket && bracket.matches && Object.keys(bracket.matches).length > 0;
        const matchesList = [];

        if (hasRealBracket) {
          Object.values(bracket.matches)
            .filter(m => !m.isBye && !m.isByeMatch)
            .sort((a, b) => {
              if (a.type !== b.type) {
                if (a.type === 'WINNERS') return -1;
                if (b.type === 'WINNERS') return 1;
                if (a.type === 'LOSERS') return -1;
                return 1;
              }
              return (a.round || 1) - (b.round || 1);
            })
            .forEach(m => {
              const t1 = m.team1?.displayName || (m.team1?.isBye ? 'Folga' : 'A definir');
              const t2 = m.team2?.displayName || (m.team2?.isBye ? 'Folga' : 'A definir');
              const roundName = m.type === 'GRAND_FINAL'
                ? 'Grande Final'
                : `${m.type === 'WINNERS' ? 'Chave Principal' : 'Repescagem'} - Rodada ${m.round || 1}`;
              matchesList.push({
                id: m.id,
                realMatchId: m.id,
                category: cat,
                categoryId: cat.id,
                roundName,
                team1Name: t1,
                team2Name: t2,
                status: m.status || 'PENDING',
                score: m.score ? `${m.score.team1 || 0} x ${m.score.team2 || 0}` : null,
              });
            });
        } else {
          const nTeams = catTeams.length;
          if (nTeams >= 2) {
            const total = Math.max(1, (2 * nTeams) - 2);
            for (let i = 1; i <= total; i++) {
              let phase = 'Fase Classificatória';
              if (i === total) phase = 'Grande Final';
              else if (i >= total - 2) phase = 'Semifinal / Repescagem';
              else if (i <= Math.ceil(total / 2)) phase = 'Rodada Inicial';
              matchesList.push({
                id: `sim-${day.id}-${cat.id}-${i}`,
                realMatchId: null,
                category: cat,
                categoryId: cat.id,
                roundName: `${phase} (Jogo ${i})`,
                team1Name: catTeams[(i * 2 - 2) % (catTeams.length || 1)]?.displayName || `Dupla ${i * 2 - 1}`,
                team2Name: catTeams[(i * 2 - 1) % (catTeams.length || 1)]?.displayName || `Dupla ${i * 2}`,
                status: 'ESTIMATED',
                score: null,
              });
            }
          }
        }
        return matchesList;
      },
    });
  }, [days, categories, teams, brackets, categoryCourtsConfig, matchDuration, warmupDuration, courtSwitchDuration, activeCourts]);

  const subMenuTabs = [
    { id: 'config', label: 'Configuração da Programação', icon: Sliders },
    { id: 'oficial', label: 'Programação Oficial', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="schedule-header-section flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">Programação do Torneio</h2>
            <p className="text-xs text-slate-400">
              Defina os dias de jogos, quais categorias competem em cada data e visualize a grade horária.
            </p>
          </div>
        </div>
        {subMenu === 'config' && !isReadOnly && (
          <button
            onClick={handleSaveScheduleConfig}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-glow-amber transition-all transform hover:scale-105 active:scale-95 no-print cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{hasSavedNotice ? 'Salvo com Sucesso!' : 'Salvar Configuração'}</span>
          </button>
        )}
      </div>

      {/* Sub-menu Navigation */}
      <div className="no-print flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5">
        {subMenuTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubMenu(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                subMenu === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:block">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* ─── CONFIGURAÇÃO DA PROGRAMAÇÃO ─── */}
      {subMenu === 'config' && (
        <div className="space-y-6">
          {/* Unassigned Categories Warning */}
          {unassignedCategories.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="text-xs font-bold text-amber-200">
                    Atenção: {unassignedCategories.length} categoria(s) ainda não estão alocadas em nenhum dia:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {unassignedCategories.map(c => (
                      <span key={c.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {c.name} ({c.shortName})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {days.length > 0 && (
                <button
                  onClick={() => handleQuickAssignAllUnassigned(days[0].id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  Alocar ao {days[0].name}
                </button>
              )}
            </div>
          )}

          {/* Top KPIs */}
          <div className="schedule-kpis-section grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400">DIAS DE JOGO</span><CalendarDays className="w-4 h-4 text-amber-400" /></div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-display text-amber-400">{days.length}</span>
                <span className="text-xs text-slate-400">{days.length === 1 ? 'dia' : 'dias'} configurados</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{categories.length - unassignedCategories.length} de {categories.length} categorias alocadas</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400">TOTAL DE JOGOS</span><Flame className="w-4 h-4 text-rose-400" /></div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-display text-white">{oficialSchedule.overallStats.totalMatches}</span>
                <span className="text-xs text-slate-400">partidas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Distribuídas em todos os dias</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400">SLOT POR PARTIDA</span><Settings2 className="w-4 h-4 text-cyan-400" /></div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-display text-cyan-400">{totalSlotMinutes}</span>
                <span className="text-xs text-slate-400">minutos</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Jogo: {matchDuration}m • Aquec: {warmupDuration}m • Troca: {courtSwitchDuration}m</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400">QUADRAS EM USO</span><Grid className="w-4 h-4 text-emerald-400" /></div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400">{activeCourts.length}</span>
                <span className="text-xs text-slate-400">de {allCourts.length} cadastradas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{activeCourts.map(c => c.name).join(', ')}</p>
            </div>
          </div>

          {/* Main Layout: Days Definition & General Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ─── DAYS & CATEGORIES MANAGER (Left 2 cols) ─── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-amber-400" />
                    Definição dos Dias e Categorias por Dia
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina o nome, data, horário de início de cada dia e selecione as categorias que irão jogar.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={handleAddDay}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Dia</span>
                  </button>
                )}
              </div>

              {days.map((day, dayIndex) => {
                const dayOficialRes = oficialSchedule.daysResults.find(r => r.day.id === day.id);
                const dayPreviaRes = previaSchedule.daysResults.find(r => r.day.id === day.id);
                const dayMatchesCount = dayOficialRes?.dayStats?.totalMatches || 0;
                const dayStartTime = day.startTime || '08:00';
                const dayEndTime = dayOficialRes?.dayStats?.dayEndTime || '18:00';
                const dayDuration = dayOficialRes?.dayStats?.dayDurationHours || '0.0';

                return (
                  <div
                    key={day.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
                  >
                    {/* Day Controls Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-display font-extrabold text-xs flex-shrink-0">
                          {dayIndex + 1}º
                        </div>
                        <input
                          type="text"
                          value={day.name}
                          onChange={e => handleUpdateDay(day.id, 'name', e.target.value)}
                          disabled={isReadOnly}
                          placeholder={`Dia ${dayIndex + 1}`}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500 w-44 sm:w-56"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={day.date || ''}
                            onChange={e => handleUpdateDay(day.id, 'date', e.target.value)}
                            disabled={isReadOnly}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] text-slate-400">Início:</span>
                          <input
                            type="time"
                            value={day.startTime || '08:00'}
                            onChange={e => handleUpdateDay(day.id, 'startTime', e.target.value)}
                            disabled={isReadOnly}
                            className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {days.length > 1 && !isReadOnly && (
                        <button
                          onClick={() => handleRemoveDay(day.id)}
                          className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all self-end sm:self-center cursor-pointer"
                          title="Remover este dia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Day Metrics Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-300">Previsão deste dia:</span>
                        <span className="font-mono font-bold text-amber-400">{dayStartTime}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="font-mono font-bold text-emerald-400">{dayEndTime}</span>
                        <span className="text-slate-400 text-[11px]">(~{dayDuration}h)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="font-bold text-white">{dayMatchesCount}</span> partidas •
                        <span className="font-bold text-white">{day.categoryIds.length}</span> categoria(s)
                      </div>
                    </div>

                    {/* Category Selection Badges */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          Categorias que jogam neste dia:
                        </label>
                        <span className="text-[11px] text-slate-500">Clique para incluir / remover</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => {
                          const isAssignedHere = day.categoryIds.includes(cat.id);
                          const otherDay = days.find(d => d.id !== day.id && d.categoryIds.includes(cat.id));

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => !isReadOnly && handleToggleCategoryInDay(day.id, cat.id)}
                              disabled={isReadOnly}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isAssignedHere
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                                  : otherDay
                                  ? 'bg-slate-900/60 text-slate-500 border border-slate-800 hover:text-slate-300 hover:border-slate-700'
                                  : 'bg-slate-900 text-slate-400 border border-slate-700/80 hover:text-white hover:border-amber-500/50'
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#F59E0B' }} />
                              <span>{cat.name}</span>
                              {isAssignedHere ? (
                                <Check className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
                              ) : otherDay ? (
                                <span className="text-[10px] text-slate-500 font-normal ml-0.5">({otherDay.name})</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ordered List of Categories within this Day */}
                    {day.categoryIds.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                          <span>Ordem de Início das Categorias neste Dia (quem joga primeiro):</span>
                          <span>{day.categoryIds.length} categorias</span>
                        </div>

                        <div className="space-y-2">
                          {day.categoryIds.map((catId, catIdx) => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return null;
                            const isFirst = catIdx === 0;
                            const isLast = catIdx === day.categoryIds.length - 1;
                            const catCourts = categoryCourtsConfig[cat.id];
                            const isAllCourts = !catCourts || catCourts === 'ALL';
                            const summaryItem = dayOficialRes?.categorySummaries?.find(s => s.category.id === cat.id);

                            return (
                              <div
                                key={cat.id}
                                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                                    {catIdx + 1}º
                                  </div>
                                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#F59E0B' }} />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white text-xs">{cat.name}</span>
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{cat.shortName}</span>
                                    </div>
                                    {summaryItem && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {summaryItem.matchesCount} partidas • ~{summaryItem.durationHours}h
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                                  {summaryItem && (
                                    <div className="text-left sm:text-right">
                                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{summaryItem.startTimeFormatted}</span>
                                        <span className="text-slate-500">➔</span>
                                        <span className="text-emerald-400">{summaryItem.endTimeFormatted}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Court selector for this category */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => !isReadOnly && handleSetCategoryCourts(cat.id, 'ALL')}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                                        isAllCourts ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                      }`}
                                    >
                                      Todas
                                    </button>
                                    {activeCourts.map(c => {
                                      const isSelected = Array.isArray(catCourts) && catCourts.includes(c.id);
                                      return (
                                        <button
                                          key={c.id}
                                          type="button"
                                          onClick={() => !isReadOnly && handleToggleCategoryCourt(cat.id, c.id)}
                                          className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                                            isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                                          }`}
                                        >
                                          {c.name.replace('Quadra ', 'Q')}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Up / Down Order in Day */}
                                  {!isReadOnly && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveCategoryInDay(day.id, catIdx, -1)}
                                        disabled={isFirst}
                                        className={`p-1 rounded-lg border transition-all ${
                                          isFirst ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer active:scale-95'
                                        }`}
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveCategoryInDay(day.id, catIdx, 1)}
                                        disabled={isLast}
                                        className={`p-1 rounded-lg border transition-all ${
                                          isLast ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer active:scale-95'
                                        }`}
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ─── GENERAL TIME & COURT PARAMETERS (Right col) ─── */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
              <div className="border-b border-slate-800/80 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Parâmetros de Tempo &amp; Quadras
                </h3>
                <p className="text-xs text-slate-400">Duração dos jogos e quadras ativas</p>
              </div>

              <div className="space-y-3.5 text-xs">
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
                    onChange={e => setMatchDuration(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

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
                    onChange={e => setWarmupDuration(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

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
                    onChange={e => setCourtSwitchDuration(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between font-mono">
                  <span className="text-slate-300">Slot Total por Jogo:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{totalSlotMinutes} min</span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-slate-300 font-semibold mb-2">Quadras Ativas na Programação:</label>
                  <div className="space-y-1.5">
                    {allCourts.map(c => {
                      const isChecked = selectedCourtIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROGRAMAÇÃO OFICIAL & PRÉVIA ─── */}
      {subMenu === 'oficial' && (
        <div className="space-y-4">
          {/* Inner tab selector */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setOficialTab('previa')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                oficialTab === 'previa' ? 'bg-amber-500/15 border-amber-500/50' : 'glass-panel border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${oficialTab === 'previa' ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-black ${oficialTab === 'previa' ? 'text-amber-300' : 'text-white'}`}>Programação Prévia</p>
                  <p className="text-[10px] text-slate-400">Baseada nas vagas por categoria e dias de disputa</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-amber-400/80 italic mb-2">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>Programação sujeita a Mudanças e sem aviso prévio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black font-display ${oficialTab === 'previa' ? 'text-amber-300' : 'text-slate-200'}`}>
                  {previaSchedule.overallStats.totalMatches}
                </span>
                <span className="text-xs text-slate-400">partidas estimadas nos {days.length} dias</span>
              </div>
            </button>

            <button
              onClick={() => setOficialTab('oficial')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                oficialTab === 'oficial' ? 'bg-emerald-500/15 border-emerald-500/50' : 'glass-panel border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${oficialTab === 'oficial' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-black ${oficialTab === 'oficial' ? 'text-emerald-300' : 'text-white'}`}>Programação Oficial</p>
                  <p className="text-[10px] text-slate-400">Baseada nas chaves e inscritos reais</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black font-display ${oficialTab === 'oficial' ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {oficialSchedule.overallStats.totalMatches}
                </span>
                <span className="text-xs text-slate-400">partidas reais nos {days.length} dias</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {days.map(d => `${d.name}: ${d.startTime}`).join(' • ')}
              </div>
            </button>
          </div>

          {oficialTab === 'previa' && <ProgramacaoPrevia scheduleResult={previaSchedule} eventInfo={eventInfo} />}
          {oficialTab === 'oficial' && <ProgramacaoOficial scheduleResult={oficialSchedule} eventInfo={eventInfo} categories={categories} />}
        </div>
      )}
    </div>
  );
}
