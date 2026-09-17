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
} from 'lucide-react';
import { getNextPowerOfTwo } from '../utils/doubleEliminationEngine';

// ─── Helpers ───────────────────────────────────────────────────────────────
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(v) {
  const newH = Math.floor(v / 60) % 24;
  const newM = Math.floor(v % 60);
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// ─── Core Scheduling Engine ────────────────────────────────────────────────
function buildSchedule({
  orderedCategoryEntries,
  startTime,
  matchDuration,
  warmupDuration,
  courtSwitchDuration,
  activeCourts,
  categoryCourtsConfig,
  lunchEnabled,
  lunchStart,
  lunchDuration,
}) {
  const slot = Number(matchDuration) + Number(warmupDuration) + Number(courtSwitchDuration);
  const startMins = timeToMinutes(startTime);
  const lunchStartMins = lunchEnabled ? timeToMinutes(lunchStart) : null;
  const lunchEndMins = lunchEnabled ? lunchStartMins + Number(lunchDuration) : null;
  const n = Math.max(activeCourts.length, 1);
  const free = new Array(n).fill(startMins);
  const all = [];
  const sums = [];
  let counter = 1;

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
      if (lunchEnabled && lunchStartMins && lunchEndMins && s < lunchEndMins && s + slot > lunchStartMins) {
        s = lunchEndMins;
      }
      const co = activeCourts[ci] || { id: `court-${ci + 1}`, name: `Quadra ${ci + 1}` };
      all.push({
        ...item,
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
    overallStats: {
      totalMatches: all.length,
      tournamentStartTime: startTime,
      tournamentEndTime: minutesToTime(end),
      totalDurationHours: ((end - startMins) / 60).toFixed(1),
      courtsUsed: n,
      totalSlotMinutes: slot,
    },
  };
}

// ─── ProgramacaoPrevia Card ────────────────────────────────────────────────
function ProgramacaoPrevia({ scheduleResult, eventInfo }) {
  const { categorySummaries, overallStats } = scheduleResult;
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handlePrint = () => window.print();

  const handleCopy = () => {
    if (!categorySummaries.length) { alert('Nenhuma categoria para copiar.'); return; }
    let text = `📅 *PROGRAMAÇÃO PRÉVIA - ${eventInfo?.name || 'TORNEIO'}*\n`;
    text += `⚠️ Programação sujeita a Mudanças e sem aviso prévio\n`;
    text += `⏰ Início: ${overallStats.tournamentStartTime} | Término: ${overallStats.tournamentEndTime}\n\n`;
    categorySummaries.forEach(s => {
      text += `🏷️ *${s.category.name}* (${s.category.shortName})\n`;
      text += `   ⏱️ ${s.startTimeFormatted} → ${s.endTimeFormatted} (~${s.durationHours}h, ~${s.matchesCount} partidas)\n\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  return (
    <div className="space-y-4">
      {/* Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Atenção</p>
          <p className="text-sm font-semibold text-amber-200 mt-0.5">
            Programação Prévia — baseada na quantidade de vagas por categoria.
          </p>
          <p className="text-xs text-amber-400/80 mt-1 italic">
            ⚠️ Programação sujeita a Mudanças e sem aviso prévio.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">INÍCIO &amp; TÉRMINO</span>
          <div className="mt-1">
            <span className="text-lg font-black font-display text-white">{overallStats.tournamentStartTime}</span>
            <span className="text-xs text-slate-400 mx-1">às</span>
            <span className="text-lg font-black font-display text-amber-400">{overallStats.tournamentEndTime}</span>
          </div>
          <p className="text-[11px] text-slate-500">~{overallStats.totalDurationHours}h estimadas</p>
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
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">CATEGORIAS</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-purple-400">{categorySummaries.length}</span>
            <span className="text-xs text-slate-400">cats</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Resumo por Categoria
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95">
              {copiedNotification ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedNotification ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95">
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {categorySummaries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Nenhuma categoria com vagas definidas. Configure as vagas nas categorias para gerar a prévia.
          </div>
        ) : (
          <div className="space-y-2">
            {categorySummaries.map((s, idx) => (
              <div key={s.category.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
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
                    <p className="text-xs text-slate-400 mt-0.5">~{s.matchesCount} partidas • ~{s.durationHours}h estimadas</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.startTimeFormatted}</span>
                  <span className="text-slate-500">➔</span>
                  <span className="text-emerald-400">{s.endTimeFormatted}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProgramacaoOficial Card ───────────────────────────────────────────────
function ProgramacaoOficial({ scheduleResult, eventInfo, categories }) {
  const { scheduledMatches, categorySummaries, overallStats } = scheduleResult;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const filteredMatches = useMemo(() =>
    scheduledMatches.filter(m => {
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
    }),
    [scheduledMatches, selectedCategoryFilter, searchTerm]
  );

  const handlePrint = () => window.print();

  const handleCopy = () => {
    if (!filteredMatches.length) { alert('Nenhum jogo para copiar.'); return; }
    let text = `📅 *GRADE DE HORÁRIOS - ${eventInfo?.name || 'TORNEIO'}*\n`;
    text += `⏰ Início: ${overallStats.tournamentStartTime} | Término: ${overallStats.tournamentEndTime}\n\n`;
    filteredMatches.forEach(m => {
      text += `⏱️ *${m.timeFormatted}* | 🏟️ *${m.court.name}* | [${m.category.shortName}] ${m.roundName}\n`;
      text += `👉 *${m.team1Name}* vs *${m.team2Name}*\n\n`;
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
          Início: {overallStats.tournamentStartTime} • Término: {overallStats.tournamentEndTime} • {overallStats.totalMatches} partidas
        </p>
      </div>

      {/* KPIs */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">INÍCIO &amp; TÉRMINO</span>
          <div className="mt-1">
            <span className="text-lg font-black font-display text-white">{overallStats.tournamentStartTime}</span>
            <span className="text-xs text-slate-400 mx-1">às</span>
            <span className="text-lg font-black font-display text-amber-400">{overallStats.tournamentEndTime}</span>
          </div>
          <p className="text-[11px] text-slate-500">~{overallStats.totalDurationHours}h estimadas</p>
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
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">CATEGORIAS</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-display text-emerald-400">{categorySummaries.length}</span>
            <span className="text-xs text-slate-400">cats</span>
          </div>
        </div>
      </div>

      {/* Category Timeline Summary */}
      <div className="no-print glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Layers className="w-4 h-4 text-emerald-400" />
          Resumo das Categorias — Inscritos Reais
        </h3>
        {categorySummaries.map((s, idx) => (
          <div key={s.category.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-display font-extrabold text-xs flex-shrink-0">
                {idx + 1}º
              </div>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.category.color || '#F59E0B' }} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs">{s.category.name}</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{s.category.shortName}</span>
                </div>
                <p className="text-[10px] text-slate-400">{s.matchesCount} partidas</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 flex-shrink-0">
              <span>{s.startTimeFormatted}</span>
              <span className="text-slate-500">➔</span>
              <span className="text-emerald-400">{s.endTimeFormatted}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grade de Horários Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
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
                placeholder="Buscar dupla, quadra..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95">
              {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copiedNotification ? 'Copiado!' : 'Copiar Grade p/ WhatsApp'}</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95">
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
                <tr><td colSpan="7" className="py-8 text-center text-slate-500 text-xs">Nenhum jogo encontrado.</td></tr>
              ) : filteredMatches.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-500">{m.matchOrder}</td>
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

// ─── Main Component ────────────────────────────────────────────────        
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

  const [startTime, setStartTime] = useState(savedConfig.startTime || '08:00');
  const [matchDuration, setMatchDuration] = useState(savedConfig.matchDuration || 25);
  const [warmupDuration, setWarmupDuration] = useState(savedConfig.warmupDuration !== undefined ? savedConfig.warmupDuration : 5);
  const [courtSwitchDuration, setCourtSwitchDuration] = useState(savedConfig.courtSwitchDuration !== undefined ? savedConfig.courtSwitchDuration : 3);

  const allCourts = eventInfo?.courts && eventInfo.courts.length > 0
    ? eventInfo.courts
    : [{ id: 'court-1', name: 'Quadra 1' }, { id: 'court-2', name: 'Quadra 2' }];

  const [selectedCourtIds, setSelectedCourtIds] = useState(savedConfig.selectedCourtIds || allCourts.map(c => c.id));
  const [lunchEnabled, setLunchEnabled] = useState(savedConfig.lunchBreak?.enabled || false);
  const [lunchStart, setLunchStart] = useState(savedConfig.lunchBreak?.startTime || '12:30');
  const [lunchDuration, setLunchDuration] = useState(savedConfig.lunchBreak?.duration || 45);
  const [categoryCourtsConfig, setCategoryCourtsConfig] = useState(savedConfig.categoryCourtsConfig || {});
  const [categoryOrder, setCategoryOrder] = useState(() => {
    if (savedConfig.categoryOrder && Array.isArray(savedConfig.categoryOrder)) {
      const existing = savedConfig.categoryOrder.filter(id => categories.some(c => c.id === id));
      const missing = categories.filter(c => !existing.includes(c.id)).map(c => c.id);
      return [...existing, ...missing];
    }
    return categories.map(c => c.id);
  });
  const [hasSavedNotice, setHasSavedNotice] = useState(false);

  React.useEffect(() => {
    setCategoryOrder(prev => {
      const existing = prev.filter(id => categories.some(c => c.id === id));
      const missing = categories.filter(c => !existing.includes(c.id)).map(c => c.id);
      return [...existing, ...missing];
    });
  }, [categories]);

  const activeCourts = allCourts.filter(c => selectedCourtIds.includes(c.id));
  const totalSlotMinutes = Number(matchDuration) + Number(warmupDuration) + Number(courtSwitchDuration);

  const moveCategory = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categoryOrder.length) return;
    const newOrder = [...categoryOrder];
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setCategoryOrder(newOrder);
  };

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

  const handleSaveScheduleConfig = () => {
    if (isReadOnly || !setEventInfo) return;
    setEventInfo(prev => ({
      ...prev,
      scheduleConfig: {
        startTime, matchDuration: Number(matchDuration), warmupDuration: Number(warmupDuration),
        courtSwitchDuration: Number(courtSwitchDuration), selectedCourtIds, categoryOrder, categoryCourtsConfig,
        lunchBreak: { enabled: lunchEnabled, startTime: lunchStart, duration: Number(lunchDuration) }
      }
    }));
    setHasSavedNotice(true);
    setTimeout(() => setHasSavedNotice(false), 3000);
  };

  const sharedParams = { startTime, matchDuration, warmupDuration, courtSwitchDuration, activeCourts, categoryCourtsConfig, lunchEnabled, lunchStart, lunchDuration };

  // Build Prévia entries (based on maxTeams/vagas)
  const previaEntries = useMemo(() => {
    return categoryOrder.map(id => categories.find(c => c.id === id)).filter(Boolean).map(cat => {
      const nSlots = Number(cat.maxTeams) || 0;
      const matchesList = [];
      if (nSlots >= 2) {
        const total = Math.max(1, (2 * nSlots) - 2);
        for (let i = 1; i <= total; i++) {
          let phase = 'Fase Classificatória';
          if (i === total) phase = 'Grande Final';
          else if (i >= total - 2) phase = 'Semifinal / Repescagem';
          else if (i <= Math.ceil(total / 2)) phase = 'Rodada Inicial';
          matchesList.push({ id: `prev-${cat.id}-${i}`, realMatchId: null, category: cat, categoryId: cat.id, roundName: `${phase} (Jogo ${i})`, team1Name: `Dupla ${i * 2 - 1}`, team2Name: `Dupla ${i * 2}`, status: 'ESTIMATED', score: null });
        }
      }
      return { category: cat, matchesList };
    });
  }, [categoryOrder, categories]);

  // Build Oficial entries (based on actual inscribed teams + real brackets)
  const oficialEntries = useMemo(() => {
    return categoryOrder.map(id => categories.find(c => c.id === id)).filter(Boolean).map(cat => {
      const catTeams = teams.filter(t => t.categoryId === cat.id);
      const bracket = brackets[cat.id];
      const hasRealBracket = bracket && bracket.matches && Object.keys(bracket.matches).length > 0;
      const matchesList = [];
      if (hasRealBracket) {
        Object.values(bracket.matches).filter(m => !m.isBye && !m.isByeMatch).sort((a, b) => {
          if (a.type !== b.type) { if (a.type === 'WINNERS') return -1; if (b.type === 'WINNERS') return 1; if (a.type === 'LOSERS') return -1; return 1; }
          return (a.round || 1) - (b.round || 1);
        }).forEach(m => {
          const t1 = m.team1?.displayName || (m.team1?.isBye ? 'Folga' : 'A definir');
          const t2 = m.team2?.displayName || (m.team2?.isBye ? 'Folga' : 'A definir');
          const roundName = m.type === 'GRAND_FINAL' ? 'Grande Final' : `${m.type === 'WINNERS' ? 'Chave Principal' : 'Repescagem'} - Rodada ${m.round || 1}`;
          matchesList.push({ id: m.id, realMatchId: m.id, category: cat, categoryId: cat.id, roundName, team1Name: t1, team2Name: t2, status: m.status || 'PENDING', score: m.score ? `${m.score.team1 || 0} x ${m.score.team2 || 0}` : null });
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
            matchesList.push({ id: `sim-${cat.id}-${i}`, realMatchId: null, category: cat, categoryId: cat.id, roundName: `${phase} (Jogo ${i})`, team1Name: catTeams[(i * 2 - 2) % (catTeams.length || 1)]?.displayName || `Dupla ${i * 2 - 1}`, team2Name: catTeams[(i * 2 - 1) % (catTeams.length || 1)]?.displayName || `Dupla ${i * 2}`, status: 'ESTIMATED', score: null });
          }
        }
      }
      return { category: cat, matchesList };
    });
  }, [categoryOrder, categories, teams, brackets]);

  const previaSchedule = useMemo(() => buildSchedule({ orderedCategoryEntries: previaEntries, ...sharedParams }), [previaEntries, startTime, matchDuration, warmupDuration, courtSwitchDuration, activeCourts, categoryCourtsConfig, lunchEnabled, lunchStart, lunchDuration]);
  const oficialSchedule = useMemo(() => buildSchedule({ orderedCategoryEntries: oficialEntries, ...sharedParams }), [oficialEntries, startTime, matchDuration, warmupDuration, courtSwitchDuration, activeCourts, categoryCourtsConfig, lunchEnabled, lunchStart, lunchDuration]);

  const configSummaries = useMemo(() =>
    oficialSchedule.categorySummaries.map((s, idx) => ({
      ...s,
      prevMatchesCount: previaSchedule.categorySummaries[idx]?.matchesCount || 0,
    })),
    [oficialSchedule, previaSchedule]
  );

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
            <p className="text-xs text-slate-400">Configure os parâmetros e visualize a grade horária prévia e oficial.</p>
          </div>
        </div>
        {subMenu === 'config' && !isReadOnly && (
          <button
            onClick={handleSaveScheduleConfig}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-glow-amber transition-all transform hover:scale-105 active:scale-95 no-print"
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
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
          {/* KPIs */}
          <div className="schedule-kpis-section grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400">INÍCIO &amp; TÉRMINO</span><Clock className="w-4 h-4 text-amber-400" /></div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black font-display text-white">{oficialSchedule.overallStats.tournamentStartTime}</span>
                <span className="text-xs text-slate-400 mx-1.5">às</span>
                <span className="text-xl sm:text-2xl font-black font-display text-amber-400">{oficialSchedule.overallStats.tournamentEndTime}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">~{oficialSchedule.overallStats.totalDurationHours}h estimadas</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400">TOTAL DE JOGOS</span><Flame className="w-4 h-4 text-rose-400" /></div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-display text-white">{oficialSchedule.overallStats.totalMatches}</span>
                <span className="text-xs text-slate-400">partidas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{oficialSchedule.overallStats.courtsUsed} quadra(s)</p>
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

          {/* Configuration & Sequencing */}
          <div className="schedule-config-section grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Order */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Ordem e Sequência de Início das Categorias
                  </h3>
                  <p className="text-xs text-slate-400">A primeira categoria começa no horário inicial; as próximas seguem conforme quadras liberam.</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{configSummaries.length} categorias</span>
              </div>

              {configSummaries.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">Nenhuma categoria cadastrada. Crie categorias para programar o torneio.</div>
              ) : (
                <div className="space-y-3">
                  {configSummaries.map((item, index) => {
                    const isFirst = index === 0, isLast = index === configSummaries.length - 1;
                    const catCourts = categoryCourtsConfig[item.category.id];
                    const isAllCourts = !catCourts || catCourts === 'ALL';
                    return (
                      <div key={item.category.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0">{index + 1}º</div>
                            <div className="flex items-center gap-2.5">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.category.color || '#F59E0B' }} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-white text-sm">{item.category.name}</h4>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{item.category.shortName}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {item.matchesCount} partidas (inscritos) • {item.prevMatchesCount} (vagas)
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                            <div className="text-left sm:text-right">
                              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{item.startTimeFormatted}</span>
                                <span className="text-slate-500">➔</span>
                                <span className="text-emerald-400">{item.endTimeFormatted}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">Duração: ~{item.durationHours}h ({item.durationMins} min)</span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button onClick={() => moveCategory(index, -1)} disabled={isFirst} className={`p-1.5 rounded-lg border transition-all ${isFirst ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white cursor-pointer active:scale-95'}`}>
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => moveCategory(index, 1)} disabled={isLast} className={`p-1.5 rounded-lg border transition-all ${isLast ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white cursor-pointer active:scale-95'}`}>
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Court allocation */}
                        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                            <Grid className="w-3.5 h-3.5 text-amber-400" />Alocação de Quadras:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button type="button" onClick={() => handleSetCategoryCourts(item.category.id, 'ALL')} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${isAllCourts ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>
                              Todas ({activeCourts.length} quadras)
                            </button>
                            {activeCourts.map(c => {
                              const isSelected = Array.isArray(catCourts) && catCourts.includes(c.id);
                              return (
                                <button key={c.id} type="button" onClick={() => handleToggleCategoryCourt(item.category.id, c.id)} className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'}`}>
                                  {c.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Time & Court Parameters */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="border-b border-slate-800/80 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2"><Sliders className="w-4 h-4 text-amber-400" />Parâmetros de Tempo &amp; Quadras</h3>
                <p className="text-xs text-slate-400">Ajuste os minutos e as quadras disponíveis</p>
              </div>
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Horário de Início do Torneio</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={isReadOnly} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500 cursor-pointer" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1"><label className="text-slate-300 font-semibold">Tempo de Partida</label><span className="font-mono text-amber-400 font-bold">{matchDuration} min</span></div>
                  <input type="range" min="10" max="60" step="5" value={matchDuration} onChange={e => setMatchDuration(Number(e.target.value))} disabled={isReadOnly} className="w-full accent-amber-500 cursor-pointer" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1"><label className="text-slate-300 font-semibold">Tempo de Aquecimento</label><span className="font-mono text-cyan-400 font-bold">{warmupDuration} min</span></div>
                  <input type="range" min="0" max="20" step="1" value={warmupDuration} onChange={e => setWarmupDuration(Number(e.target.value))} disabled={isReadOnly} className="w-full accent-cyan-500 cursor-pointer" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1"><label className="text-slate-300 font-semibold">Troca de Quadras / Intervalo</label><span className="font-mono text-purple-400 font-bold">{courtSwitchDuration} min</span></div>
                  <input type="range" min="0" max="15" step="1" value={courtSwitchDuration} onChange={e => setCourtSwitchDuration(Number(e.target.value))} disabled={isReadOnly} className="w-full accent-purple-500 cursor-pointer" />
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between font-mono">
                  <span className="text-slate-300">Tempo Total por Jogo:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{totalSlotMinutes} min</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-slate-300 font-semibold mb-2">Quadras Ativas na Programação:</label>
                  <div className="space-y-1.5">
                    {allCourts.map(c => {
                      const isChecked = selectedCourtIds.includes(c.id);
                      return (
                        <label key={c.id} className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                          <span className="font-semibold text-xs">{c.name}</span>
                          <input type="checkbox" checked={isChecked} onChange={() => toggleCourt(c.id)} disabled={isReadOnly} className="accent-amber-500 w-4 h-4 rounded cursor-pointer" />
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Coffee className="w-3.5 h-3.5 text-amber-400" /><span>Pausa / Almoço</span>
                    </label>
                    <input type="checkbox" checked={lunchEnabled} onChange={e => setLunchEnabled(e.target.checked)} disabled={isReadOnly} className="accent-amber-500 w-4 h-4 cursor-pointer" />
                  </div>
                  {lunchEnabled && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Início:</span>
                        <input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)} disabled={isReadOnly} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-xs" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Duração:</span>
                        <select value={lunchDuration} onChange={e => setLunchDuration(Number(e.target.value))} disabled={isReadOnly} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs">
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
        </div>
      )}

      {/* ─── PROGRAMAÇÃO OFICIAL ─── */}
      {subMenu === 'oficial' && (
        <div className="space-y-4">
          {/* Inner tab selector */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setOficialTab('previa')}
              className={`p-4 rounded-2xl border text-left transition-all ${oficialTab === 'previa' ? 'bg-amber-500/15 border-amber-500/50' : 'glass-panel border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${oficialTab === 'previa' ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-black ${oficialTab === 'previa' ? 'text-amber-300' : 'text-white'}`}>Programação Prévia</p>
                  <p className="text-[10px] text-slate-400">Baseada nas vagas por categoria</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-amber-400/80 italic mb-2">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>Programação sujeita a Mudanças e sem aviso prévio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black font-display ${oficialTab === 'previa' ? 'text-amber-300' : 'text-slate-200'}`}>{previaSchedule.overallStats.totalMatches}</span>
                <span className="text-xs text-slate-400">partidas estimadas</span>
              </div>
            </button>

            <button
              onClick={() => setOficialTab('oficial')}
              className={`p-4 rounded-2xl border text-left transition-all ${oficialTab === 'oficial' ? 'bg-emerald-500/15 border-emerald-500/50' : 'glass-panel border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${oficialTab === 'oficial' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-black ${oficialTab === 'oficial' ? 'text-emerald-300' : 'text-white'}`}>Programação Oficial</p>
                  <p className="text-[10px] text-slate-400">Baseada nos inscritos reais</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black font-display ${oficialTab === 'oficial' ? 'text-emerald-300' : 'text-slate-200'}`}>{oficialSchedule.overallStats.totalMatches}</span>
                <span className="text-xs text-slate-400">partidas reais</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {oficialSchedule.overallStats.tournamentStartTime} → {oficialSchedule.overallStats.tournamentEndTime}
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
