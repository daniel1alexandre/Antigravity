/**
 * Tournament Scheduling Engine
 * Multi-day scheduling, chronological slot calculation, and round progression ordering.
 */
import { DEFAULT_COURTS } from '../types/tournament';

export function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return 480; // default 08:00
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(v) {
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

/**
 * Priority order for Double Elimination tournament rounds:
 * WR1 (10) -> LR1 (15) -> WR2 (20) -> LR2 (25) -> ... -> Grand Final (999)
 */
export function getRoundPriority(bracketType, roundNumber) {
  const type = String(bracketType || '').toUpperCase();
  const r = Number(roundNumber) || 1;
  if (type === 'WINNERS') {
    return r * 10;
  }
  if (type === 'LOSERS') {
    return r * 10 + 5;
  }
  if (type === 'GRAND_FINAL') {
    return 999;
  }
  return 50;
}

// ─── Core Scheduling Engine for a Single Day ────────────────────────────────
export function buildDaySchedule({
  dayInfo,
  orderedCategoryEntries,
  startTime,
  matchDuration,
  warmupDuration,
  courtSwitchDuration,
  activeCourts,
  categoryCourtsConfig = {},
  startMatchCounter = 1,
}) {
  const slot = Number(matchDuration) + Number(warmupDuration) + Number(courtSwitchDuration);
  const dayStartMins = timeToMinutes(dayInfo.startTime || startTime || '08:00');
  const n = Math.max(activeCourts.length, 1);
  const free = new Array(n).fill(dayStartMins);
  const all = [];
  const sums = [];
  let counter = startMatchCounter;

  // Sort category entries by their configured start time for this day
  const sortedCategoryEntries = [...orderedCategoryEntries].sort((a, b) => {
    const tA = timeToMinutes(dayInfo.categoryStartTimes?.[a.category.id] || dayInfo.startTime || startTime || '08:00');
    const tB = timeToMinutes(dayInfo.categoryStartTimes?.[b.category.id] || dayInfo.startTime || startTime || '08:00');
    return tA - tB;
  });

  sortedCategoryEntries.forEach(({ category: cat, matchesList }) => {
    const desiredCatStartTime = dayInfo.categoryStartTimes?.[cat.id] || dayInfo.startTime || startTime || '08:00';
    const desiredCatStartMins = timeToMinutes(desiredCatStartTime);

    const cc = categoryCourtsConfig[cat.id];
    let allowed = (!cc || cc === 'ALL')
      ? activeCourts.map((_, i) => i)
      : activeCourts.map((c, i) => (Array.isArray(cc) && cc.includes(c.id) ? i : -1)).filter(i => i !== -1);
    if (!allowed.length) allowed = activeCourts.map((_, i) => i);

    const catMatches = [];

    matchesList.forEach(item => {
      // Find the allowed court that is ready earliest (considering the category start time)
      let bestCourt = allowed[0];
      let bestReadyTime = Math.max(free[bestCourt], desiredCatStartMins);

      for (let i = 1; i < allowed.length; i++) {
        const c = allowed[i];
        const readyTime = Math.max(free[c], desiredCatStartMins);
        if (readyTime < bestReadyTime) {
          bestReadyTime = readyTime;
          bestCourt = c;
        } else if (readyTime === bestReadyTime && free[c] < free[bestCourt]) {
          bestCourt = c;
        }
      }

      const s = bestReadyTime;
      const co = activeCourts[bestCourt] || { id: `court-${bestCourt + 1}`, name: `Quadra ${bestCourt + 1}` };

      const matchObj = {
        ...item,
        dayId: dayInfo.id,
        dayName: dayInfo.name,
        dayDate: dayInfo.date,
        courtIndex: bestCourt,
        court: co,
        courtName: co.name || `Quadra ${bestCourt + 1}`,
        slotStartMins: s,
        slotEndMins: s + slot,
        timeFormatted: minutesToTime(s),
        warmupTime: minutesToTime(s),
        gameStartTime: minutesToTime(s + Number(warmupDuration)),
        gameEndTime: minutesToTime(s + Number(warmupDuration) + Number(matchDuration)),
        slotEndTime: minutesToTime(s + slot),
      };

      catMatches.push(matchObj);
      all.push(matchObj);
      free[bestCourt] = s + slot;
    });

    const catActualStart = catMatches.length > 0
      ? Math.min(...catMatches.map(m => m.slotStartMins))
      : desiredCatStartMins;
    const catActualEnd = catMatches.length > 0
      ? Math.max(...catMatches.map(m => m.slotEndMins))
      : desiredCatStartMins;
    const dm = catActualEnd - catActualStart;

    sums.push({
      category: cat,
      dayId: dayInfo.id,
      dayName: dayInfo.name,
      dayDate: dayInfo.date,
      matchesCount: matchesList.length,
      configuredStartTime: desiredCatStartTime,
      startTimeFormatted: minutesToTime(catActualStart),
      endTimeFormatted: minutesToTime(catActualEnd),
      durationHours: (dm / 60).toFixed(1),
      durationMins: dm,
      delayed: catMatches.length > 0 && catActualStart > desiredCatStartMins,
      delayMinutes: catMatches.length > 0 ? Math.max(0, catActualStart - desiredCatStartMins) : 0,
    });
  });

  // Sort matches chronologically across all categories on this day
  all.sort((a, b) => {
    if (a.slotStartMins !== b.slotStartMins) {
      return a.slotStartMins - b.slotStartMins;
    }
    return a.courtIndex - b.courtIndex;
  });

  all.forEach(m => {
    m.matchOrder = counter++;
  });

  const dayActualStart = all.length > 0 ? Math.min(...all.map(m => m.slotStartMins)) : dayStartMins;
  const dayActualEnd = all.length > 0 ? Math.max(...all.map(m => m.slotEndMins)) : dayStartMins;
  const dayDurationMins = dayActualEnd - dayActualStart;

  return {
    scheduledMatches: all,
    categorySummaries: sums,
    dayStats: {
      totalMatches: all.length,
      dayStartTime: minutesToTime(dayActualStart),
      dayEndTime: minutesToTime(dayActualEnd),
      dayDurationHours: (dayDurationMins / 60).toFixed(1),
      courtsUsed: n,
      totalSlotMinutes: slot,
    },
    nextMatchCounter: counter,
  };
}

// ─── Multi-Day Scheduling Builder ───────────────────────────────────────────
export function buildMultiDaySchedule({
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
      tournamentStartTime: daysResults[0]?.dayStats?.dayStartTime || days[0]?.startTime || '08:00',
      tournamentEndTime: daysResults[daysResults.length - 1]?.dayStats?.dayEndTime || '18:00',
    },
  };
}

/**
 * Computes full official schedule using tournament eventInfo, brackets and categories
 */
export function computeOfficialTournamentSchedule({
  eventInfo = {},
  categories = [],
  brackets = {},
  teams = []
}) {
  const savedConfig = eventInfo?.scheduleConfig || {};
  const activeCourts = Array.isArray(eventInfo?.courts) && eventInfo.courts.length > 0
    ? eventInfo.courts
    : DEFAULT_COURTS;

  const matchDuration = Number(savedConfig.matchDuration) || 30;
  const warmupDuration = Number(savedConfig.warmupDuration) || 5;
  const courtSwitchDuration = Number(savedConfig.courtSwitchDuration) || 5;
  const categoryCourtsConfig = savedConfig.categoryCourtsConfig || {};

  // Build days
  let days = Array.isArray(savedConfig.days) && savedConfig.days.length > 0
    ? savedConfig.days
    : [
        {
          id: 'day-1',
          name: 'Dia 1',
          date: eventInfo?.date || new Date().toISOString().slice(0, 10),
          startTime: savedConfig.startTime || '08:00',
          categoryIds: categories.map(c => c.id),
          categoryStartTimes: {},
        }
      ];

  // If a category is not assigned to any day, assign to Day 1
  const assignedCatIds = new Set();
  days.forEach(d => (d.categoryIds || []).forEach(id => assignedCatIds.add(id)));
  const unassignedCats = categories.filter(c => !assignedCatIds.has(c.id)).map(c => c.id);
  if (unassignedCats.length > 0 && days.length > 0) {
    days = days.map((d, idx) => idx === 0 ? { ...d, categoryIds: [...(d.categoryIds || []), ...unassignedCats] } : d);
  }

  const sharedParams = {
    startTime: savedConfig.startTime || '08:00',
    matchDuration,
    warmupDuration,
    courtSwitchDuration,
    activeCourts,
  };

  const scheduleResult = buildMultiDaySchedule({
    days,
    categories,
    categoryCourtsConfig,
    sharedParams,
    getMatchesForCategory: (cat, day) => {
      const bracket = brackets[cat.id];
      const hasRealBracket = bracket && bracket.matches && Object.keys(bracket.matches).length > 0;
      const matchesList = [];

      if (hasRealBracket) {
        Object.values(bracket.matches)
          .filter(m => !m.isBye && !m.isByeMatch)
          .sort((a, b) => {
            const prioA = getRoundPriority(a.bracket || a.type, a.round);
            const prioB = getRoundPriority(b.bracket || b.type, b.round);
            if (prioA !== prioB) {
              return prioA - prioB;
            }
            return (a.matchNumber || 0) - (b.matchNumber || 0);
          })
          .forEach(m => {
            const t1 = m.team1?.displayName || (m.team1?.isBye ? 'Folga' : 'A definir');
            const t2 = m.team2?.displayName || (m.team2?.isBye ? 'Folga' : 'A definir');
            const bType = m.bracket || m.type;
            const roundName = bType === 'GRAND_FINAL'
              ? 'Grande Final'
              : `${bType === 'WINNERS' ? 'Chave Principal' : 'Repescagem'} - Rodada ${m.round || 1}`;
            const matchScore = (m.score1 !== null && m.score1 !== undefined && m.score2 !== null && m.score2 !== undefined)
              ? `${m.score1} x ${m.score2}`
              : (m.score ? `${m.score.team1 || 0} x ${m.score.team2 || 0}` : null);
            matchesList.push({
              id: m.id,
              realMatchId: m.id,
              category: cat,
              categoryId: cat.id,
              roundName: m.roundName || roundName,
              team1Name: t1,
              team2Name: t2,
              status: m.status || 'PENDING',
              score: matchScore,
              bracket: bType,
              round: m.round,
              court: m.court,
              team1: m.team1,
              team2: m.team2,
              matchNumber: m.matchNumber,
            });
          });
      } else {
        const catTeams = teams.filter(t => t.categoryId === cat.id);
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
              matchNumber: i,
            });
          }
        }
      }
      return matchesList;
    },
  });

  const matchesById = {};
  scheduleResult.scheduledMatches.forEach(m => {
    if (m.realMatchId) {
      matchesById[m.realMatchId] = m;
    }
    matchesById[m.id] = m;
  });

  return {
    days,
    scheduleResult,
    scheduledMatches: scheduleResult.scheduledMatches,
    matchesById,
  };
}
