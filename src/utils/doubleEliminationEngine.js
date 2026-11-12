/**
 * Double Elimination Bracket Generator & Tournament Progression Engine
 * Generates Winners Bracket, Losers Bracket, and Grand Final for arbitrary N teams (4 to 32).
 */

// Helper to get next power of 2
export function getNextPowerOfTwo(n) {
  let p = 4;
  while (p < n) {
    p *= 2;
  }
  return p;
}

// Generate seeded positions for standard tournament bracket
export function getSeededBracketOrder(numTeams) {
  if (numTeams === 4) return [1, 4, 2, 3];
  if (numTeams === 8) return [1, 8, 4, 5, 2, 7, 3, 6];
  if (numTeams === 16) return [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11];
  if (numTeams === 32) {
    const r16 = getSeededBracketOrder(16);
    const result = [];
    for (const seed of r16) {
      result.push(seed, 33 - seed);
    }
    return result;
  }
  // Fallback linear
  const list = [];
  for (let i = 1; i <= numTeams; i++) list.push(i);
  return list;
}

/**
 * Creates the entire double elimination match structure
 * @param {Array} teams - list of registered teams
 * @param {Object} category - category settings (pointsToWin, setsToWin, etc.)
 */
export function generateDoubleEliminationBracket(teams, category) {
  const teamCount = teams.length;
  if (teamCount < 2) {
    throw new Error('É necessário ter pelo menos 2 duplas cadastradas para gerar a chave.');
  }

  const bracketSize = getNextPowerOfTwo(Math.max(teamCount, 4));
  const numRoundsWinners = Math.log2(bracketSize); // e.g. 8 -> 3 rounds (R1, Semi, Final)
  
  // Create Seeded Slots with BYEs
  const seedOrder = getSeededBracketOrder(bracketSize);
  const slottedTeams = new Array(bracketSize).fill(null);

  // Distribute teams according to seed order
  // teams are assumed to be sorted by their seed rank, or randomly ordered if unseeded
  for (let i = 0; i < bracketSize; i++) {
    const seedIndex = seedOrder[i] - 1;
    if (seedIndex < teams.length) {
      slottedTeams[i] = teams[seedIndex];
    } else {
      slottedTeams[i] = { id: `BYE-${i}`, isBye: true, displayName: 'FOLGA (BYE)' };
    }
  }

  let matchCounter = 1;
  const matches = {};
  const winnersRounds = [];
  const losersRounds = [];

  // ==========================================
  // 1. BUILD WINNERS BRACKET
  // ==========================================
  for (let r = 1; r <= numRoundsWinners; r++) {
    const roundMatchesCount = bracketSize / Math.pow(2, r);
    const roundMatches = [];
    const isFirstRound = (r === 1);
    const isWinnersFinal = (r === numRoundsWinners);

    let roundName = `Rodada ${r}`;
    if (isWinnersFinal) roundName = 'Final dos Vencedores';
    else if (r === numRoundsWinners - 1) roundName = 'Semifinal dos Vencedores';
    else if (r === numRoundsWinners - 2 && numRoundsWinners >= 4) roundName = 'Quartas dos Vencedores';

    for (let m = 0; m < roundMatchesCount; m++) {
      const matchId = `W-R${r}-M${m + 1}`;
      let team1 = null;
      let team2 = null;

      if (isFirstRound) {
        team1 = slottedTeams[m * 2];
        team2 = slottedTeams[m * 2 + 1];
      }

      const match = {
        id: matchId,
        bracket: 'WINNERS',
        type: 'WINNERS',
        categoryId: category.id,
        categoryName: category.name,
        round: r,
        roundName,
        matchNumber: matchCounter++,
        team1,
        team2,
        score1: null,
        score2: null,
        sets: [],
        winnerId: null,
        loserId: null,
        status: 'PENDING',
        court: null,
        startTime: null,
        nextWinnerMatchId: null,
        nextWinnerSlot: null,
        nextLoserMatchId: null,
        nextLoserSlot: null,
      };

      matches[matchId] = match;
      roundMatches.push(matchId);
    }
    winnersRounds.push({ round: r, name: roundName, matchIds: roundMatches });
  }

  // Connect Winners Bracket Progression
  for (let r = 1; r < numRoundsWinners; r++) {
    const currentRound = winnersRounds[r - 1].matchIds;
    const nextRound = winnersRounds[r].matchIds;

    for (let i = 0; i < currentRound.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      const slot = (i % 2 === 0) ? 'team1' : 'team2';
      matches[currentRound[i]].nextWinnerMatchId = nextRound[nextMatchIndex];
      matches[currentRound[i]].nextWinnerSlot = slot;
    }
  }

  // ==========================================
  // 2. BUILD LOSERS BRACKET (REPESCAGEM)
  // ==========================================
  // Losers bracket has 2 * (numRoundsWinners - 1) rounds
  const numRoundsLosers = 2 * (numRoundsWinners - 1);
  
  // Determine count of matches per losers round
  let currentLosersMatchCount = bracketSize / 4; // for 8 teams, LR1 has 2 matches

  for (let lr = 1; lr <= numRoundsLosers; lr++) {
    const isMinorRound = (lr % 2 === 1); // minor rounds play between losers bracket winners
    let roundName = `Repescagem R${lr}`;
    if (lr === numRoundsLosers) roundName = 'Final da Repescagem (Disputa 3º Lugar)';
    else if (lr === numRoundsLosers - 1) roundName = 'Semifinal da Repescagem';

    const roundMatches = [];
    for (let m = 0; m < currentLosersMatchCount; m++) {
      const matchId = `L-R${lr}-M${m + 1}`;
      const match = {
        id: matchId,
        bracket: 'LOSERS',
        type: 'LOSERS',
        categoryId: category.id,
        categoryName: category.name,
        round: lr,
        roundName,
        matchNumber: matchCounter++,
        team1: null,
        team2: null,
        score1: null,
        score2: null,
        sets: [],
        winnerId: null,
        loserId: null,
        status: 'PENDING',
        court: null,
        startTime: null,
        nextWinnerMatchId: null,
        nextWinnerSlot: null,
        nextLoserMatchId: null, // eliminated
        nextLoserSlot: null,
      };

      matches[matchId] = match;
      roundMatches.push(matchId);
    }
    losersRounds.push({ round: lr, name: roundName, matchIds: roundMatches });

    // In double elimination, match count stays same in even rounds (which receive drops from Winners),
    // and halves after even rounds.
    if (lr % 2 === 0) {
      currentLosersMatchCount = Math.max(1, currentLosersMatchCount / 2);
    }
  }

  // Connect Losers Bracket internal progressions:
  for (let lr = 1; lr < numRoundsLosers; lr++) {
    const currentRound = losersRounds[lr - 1].matchIds;
    const nextRound = losersRounds[lr].matchIds;

    if (lr % 2 === 1) {
      // Minor round -> Major round (same number of matches, winners go into team1)
      for (let i = 0; i < currentRound.length; i++) {
        matches[currentRound[i]].nextWinnerMatchId = nextRound[i];
        matches[currentRound[i]].nextWinnerSlot = 'team1';
      }
    } else {
      // Major round -> Minor round (halves matches, winners pair up)
      for (let i = 0; i < currentRound.length; i++) {
        const nextIndex = Math.floor(i / 2);
        const slot = (i % 2 === 0) ? 'team1' : 'team2';
        matches[currentRound[i]].nextWinnerMatchId = nextRound[nextIndex];
        matches[currentRound[i]].nextWinnerSlot = slot;
      }
    }
  }

  // Connect Drops from Winners Bracket to Losers Bracket:
  // WR1 losers drop to LR1
  const wr1Matches = winnersRounds[0].matchIds;
  const lr1Matches = losersRounds[0].matchIds;
  for (let i = 0; i < wr1Matches.length; i++) {
    const lrIndex = Math.floor(i / 2);
    const slot = (i % 2 === 0) ? 'team1' : 'team2';
    matches[wr1Matches[i]].nextLoserMatchId = lr1Matches[lrIndex];
    matches[wr1Matches[i]].nextLoserSlot = slot;
  }

  // WR2, WR3, etc. losers drop into LR2, LR4, LR6...
  for (let wr = 2; wr <= numRoundsWinners; wr++) {
    const wrMatches = winnersRounds[wr - 1].matchIds;
    const lrTargetRoundIndex = (wr - 1) * 2; // e.g. WR2 -> LR2 (index 1), WR3 -> LR4 (index 3)
    if (lrTargetRoundIndex - 1 < losersRounds.length) {
      const lrMatches = losersRounds[lrTargetRoundIndex - 1].matchIds;
      for (let i = 0; i < wrMatches.length; i++) {
        // Cross-match inversion to avoid immediate rematches
        const targetMatchIndex = (lrMatches.length - 1 - i) % lrMatches.length;
        matches[wrMatches[i]].nextLoserMatchId = lrMatches[targetMatchIndex];
        matches[wrMatches[i]].nextLoserSlot = 'team2';
      }
    }
  }

  // ==========================================
  // 3. BUILD GRAND FINAL (GRANDE FINAL)
  // ==========================================
  const gfMatchId = 'GF-M1';
  const grandFinalMatch = {
    id: gfMatchId,
    bracket: 'GRAND_FINAL',
    type: 'GRAND_FINAL',
    categoryId: category.id,
    categoryName: category.name,
    round: 1,
    roundName: 'Grande Final',
    matchNumber: matchCounter++,
    team1: null, // Winner of Winners Final
    team2: null, // Winner of Losers Final
    score1: null,
    score2: null,
    sets: [],
    winnerId: null,
    loserId: null,
    status: 'PENDING',
    court: null,
    startTime: null,
    nextWinnerMatchId: null,
    nextWinnerSlot: null,
    nextLoserMatchId: null,
    nextLoserSlot: null,
  };
  matches[gfMatchId] = grandFinalMatch;

  // Connect Winners Final and Losers Final to Grand Final
  const winnersFinalMatchId = winnersRounds[winnersRounds.length - 1].matchIds[0];
  const losersFinalMatchId = losersRounds[losersRounds.length - 1].matchIds[0];

  matches[winnersFinalMatchId].nextWinnerMatchId = gfMatchId;
  matches[winnersFinalMatchId].nextWinnerSlot = 'team1';

  matches[losersFinalMatchId].nextWinnerMatchId = gfMatchId;
  matches[losersFinalMatchId].nextWinnerSlot = 'team2';

  // Map and attach exact origin/source labels for every match slot
  for (const matchId in matches) {
    const m = matches[matchId];
    if (m.nextWinnerMatchId && matches[m.nextWinnerMatchId]) {
      const target = matches[m.nextWinnerMatchId];
      const slot = m.nextWinnerSlot;
      target[`${slot}Source`] = {
        type: 'WINNER',
        sourceMatchId: m.id,
        sourceMatchNumber: m.matchNumber,
        label: `Venc. Jogo #${m.matchNumber}`,
      };
      target[`${slot}SourceLabel`] = `Venc. Jogo #${m.matchNumber}`;
    }
    if (m.nextLoserMatchId && matches[m.nextLoserMatchId]) {
      const target = matches[m.nextLoserMatchId];
      const slot = m.nextLoserSlot;
      target[`${slot}Source`] = {
        type: 'LOSER',
        sourceMatchId: m.id,
        sourceMatchNumber: m.matchNumber,
        label: `Perd. Jogo #${m.matchNumber}`,
      };
      target[`${slot}SourceLabel`] = `Perd. Jogo #${m.matchNumber}`;
    }
  }

  // Return full tournament state
  const state = {
    categoryId: category.id,
    categoryName: category.name,
    bracketSize,
    totalTeams: teamCount,
    matches,
    winnersRounds,
    losersRounds,
    grandFinal: [gfMatchId],
    standings: [],
    createdAt: new Date().toISOString(),
  };

  // Automatically resolve any BYE matches in Round 1
  return autoResolveByes(state);
}

/**
 * Automatically advances teams that have a BYE opponent in Round 1
 */
export function autoResolveByes(state) {
  const updatedMatches = { ...state.matches };
  let resolvedAny = false;

  do {
    resolvedAny = false;
    for (const mId in updatedMatches) {
      const match = updatedMatches[mId];
      if (match.status === 'COMPLETED') continue;

      const t1IsBye = match.team1?.isBye;
      const t2IsBye = match.team2?.isBye;

      if (t1IsBye || t2IsBye) {
        if (t1IsBye && t2IsBye) {
          match.status = 'COMPLETED';
          match.winnerId = match.team1.id;
          match.loserId = match.team2.id;
          match.isBye = true;
          propagateResult(updatedMatches, match, match.team1, match.team2);
          resolvedAny = true;
        } else if (t1IsBye && match.team2) {
          match.status = 'COMPLETED';
          match.winnerId = match.team2.id;
          match.loserId = match.team1.id;
          match.isBye = true;
          propagateResult(updatedMatches, match, match.team2, match.team1);
          resolvedAny = true;
        } else if (t2IsBye && match.team1) {
          match.status = 'COMPLETED';
          match.winnerId = match.team1.id;
          match.loserId = match.team2.id;
          match.isBye = true;
          propagateResult(updatedMatches, match, match.team1, match.team2);
          resolvedAny = true;
        }
      } else if (match.team1 && match.team2 && match.status === 'PENDING') {
        match.status = 'READY';
      }
    }
  } while (resolvedAny);

  return { ...state, matches: updatedMatches };
}

/**
 * Propagate winner and loser forward to their respective next matches
 */
function propagateResult(matches, match, winningTeam, losingTeam) {
  // Push Winner
  if (match.nextWinnerMatchId && winningTeam) {
    const nextW = matches[match.nextWinnerMatchId];
    if (nextW) {
      if (match.nextWinnerSlot === 'team1') nextW.team1 = winningTeam;
      if (match.nextWinnerSlot === 'team2') nextW.team2 = winningTeam;

      if (nextW.team1 && nextW.team2 && nextW.status === 'PENDING') {
        nextW.status = 'READY';
      }
    }
  }

  // Push Loser (to Losers Bracket)
  if (match.nextLoserMatchId && losingTeam) {
    const nextL = matches[match.nextLoserMatchId];
    if (nextL) {
      if (match.nextLoserSlot === 'team1') nextL.team1 = losingTeam;
      if (match.nextLoserSlot === 'team2') nextL.team2 = losingTeam;

      if (nextL.team1 && nextL.team2 && nextL.status === 'PENDING') {
        nextL.status = 'READY';
      }
    }
  }
}

/**
 * Automatically resolves matches where a team forfeited by W.O. in an earlier round.
 * A equipe perdedora por W.O. recebe 0 x 18 em todas as partidas seguintes,
 * avançando o adversário presente automaticamente.
 */
export function autoResolveWalkovers(state, targetPoints = 18) {
  const walkoverTeams = state.walkoverTeams || {};
  if (Object.keys(walkoverTeams).length === 0) return state;

  const updatedMatches = { ...state.matches };
  let resolvedAny = false;

  do {
    resolvedAny = false;
    for (const mId in updatedMatches) {
      const match = updatedMatches[mId];
      if (match.status === 'COMPLETED' || match.isBye) continue;

      const t1 = match.team1;
      const t2 = match.team2;

      const t1IsWO = t1 && Boolean(walkoverTeams[t1.id]);
      const t2IsWO = t2 && Boolean(walkoverTeams[t2.id]);

      // Se uma ou ambas as equipes deram W.O.
      if ((t1IsWO || t2IsWO) && t1 && t2) {
        if (t1IsWO && t2IsWO) {
          match.status = 'COMPLETED';
          match.isWO = true;
          match.score1 = 0;
          match.score2 = 0;
          match.sets = [{ s1: 0, s2: 0 }];
          match.winnerId = t1.id;
          match.loserId = t2.id;
          propagateResult(updatedMatches, match, t1, t2);
          resolvedAny = true;
        } else if (t1IsWO) {
          // Equipe 1 deu W.O.: Equipe 1 recebe 0 e Equipe 2 (vencedora) recebe 18
          match.status = 'COMPLETED';
          match.isWO = true;
          match.score1 = 0;
          match.score2 = targetPoints;
          match.sets = [{ s1: 0, s2: targetPoints }];
          match.winnerId = t2.id;
          match.loserId = t1.id;
          propagateResult(updatedMatches, match, t2, t1);
          resolvedAny = true;
        } else if (t2IsWO) {
          // Equipe 2 deu W.O.: Equipe 1 (vencedora) recebe 18 e Equipe 2 recebe 0
          match.status = 'COMPLETED';
          match.isWO = true;
          match.score1 = targetPoints;
          match.score2 = 0;
          match.sets = [{ s1: targetPoints, s2: 0 }];
          match.winnerId = t1.id;
          match.loserId = t2.id;
          propagateResult(updatedMatches, match, t1, t2);
          resolvedAny = true;
        }
      }
    }
  } while (resolvedAny);

  return { ...state, matches: updatedMatches, walkoverTeams };
}

/**
 * Updates score and advances teams for a played match
 */
export function updateMatchScore(state, matchId, score1, score2, sets = [], options = {}) {
  const matches = { ...state.matches };
  const match = { ...matches[matchId] };

  if (!match || !match.team1 || !match.team2) {
    throw new Error('Partida inválida ou incompleta.');
  }

  match.score1 = Number(score1);
  match.score2 = Number(score2);
  match.sets = sets.length > 0 ? sets : [{ s1: Number(score1), s2: Number(score2) }];

  if (match.score1 === match.score2) {
    throw new Error('No futvôlei não há empate. Uma dupla precisa vencer.');
  }

  const winningTeam = match.score1 > match.score2 ? match.team1 : match.team2;
  const losingTeam = match.score1 > match.score2 ? match.team2 : match.team1;

  match.winnerId = winningTeam.id;
  match.loserId = losingTeam.id;
  match.status = 'COMPLETED';

  // Opções de W.O. ou Retirada
  if (options.isWO) {
    match.isWO = true;
    match.woWinner = options.woWinner;
    match.woLoser = losingTeam.id;
  } else {
    match.isWO = false;
  }

  if (options.isRetirement) {
    match.isRetirement = true;
    match.retiredTeam = options.retiredTeam;
  } else {
    match.isRetirement = false;
  }

  matches[matchId] = match;

  // Propagate results
  propagateResult(matches, match, winningTeam, losingTeam);

  let walkoverTeams = { ...(state.walkoverTeams || {}) };
  // Se foi W.O., marca a equipe perdedora para receber 0 x 18 nas partidas seguintes
  if (options.isWO && losingTeam?.id) {
    walkoverTeams[losingTeam.id] = true;
  }

  let newState = { ...state, matches, walkoverTeams };

  // Auto-resolve any new BYE encounters that were formed by the propagation
  newState = autoResolveByes(newState);

  // Auto-resolve matches for teams that gave W.O. in earlier rounds
  const targetPts = Math.max(match.score1, match.score2, 18);
  newState = autoResolveWalkovers(newState, targetPts);

  // Compute final standings if Grand Final completed
  let standings = [...(newState.standings || [])];
  const gfMatch = newState.matches['GF-M1'];
  if (gfMatch && gfMatch.status === 'COMPLETED') {
    standings = calculateStandings(newState);
  }

  return {
    ...newState,
    standings,
  };
}

/**
 * Calculates complete standings / podium based on match results
 */
export function calculateStandings(state) {
  const gfMatch = state.matches['GF-M1'];
  if (!gfMatch || gfMatch.status !== 'COMPLETED') return [];

  const standings = [];
  const champion = gfMatch.score1 > gfMatch.score2 ? gfMatch.team1 : gfMatch.team2;
  const runnerUp = gfMatch.score1 > gfMatch.score2 ? gfMatch.team2 : gfMatch.team1;

  if (champion) standings.push({ place: 1, team: champion, title: 'CAMPEÃO 🏆' });
  if (runnerUp) standings.push({ place: 2, team: runnerUp, title: 'VICE-CAMPEÃO 🥈' });

  // 3rd place is the loser of the Losers Final (LF)
  const lfRounds = state.losersRounds;
  if (lfRounds.length > 0) {
    const lastLfMatchId = lfRounds[lfRounds.length - 1].matchIds[0];
    const lfMatch = state.matches[lastLfMatchId];
    if (lfMatch && lfMatch.status === 'COMPLETED') {
      const thirdPlace = lfMatch.score1 > lfMatch.score2 ? lfMatch.team2 : lfMatch.team1;
      if (thirdPlace && !thirdPlace.isBye) {
        standings.push({ place: 3, team: thirdPlace, title: '3º LUGAR 🥉' });
      }
    }
  }

  return standings;
}

/**
 * Retorna o rótulo de procedência da vaga (ex: "Venc. Jogo #1", "Perd. Jogo #4")
 * sempre que o adversário ainda não estiver definido.
 * Suporta tanto matches recém-gerados quanto dados legados já salvos.
 */
export function getMatchSlotSourceLabel(match, slot = 'team1', allMatches = {}) {
  if (!match) return 'A definir';

  // 1. Label previamente gravado no objeto do confronto
  if (slot === 'team1' && match.team1SourceLabel) return match.team1SourceLabel;
  if (slot === 'team2' && match.team2SourceLabel) return match.team2SourceLabel;
  if (slot === 'team1' && match.team1Source?.label) return match.team1Source.label;
  if (slot === 'team2' && match.team2Source?.label) return match.team2Source.label;

  // 2. Busca dinâmica nos confrontos passados caso não tenha o campo gravado
  if (allMatches && typeof allMatches === 'object') {
    for (const srcId of Object.keys(allMatches)) {
      const src = allMatches[srcId];
      if (src.nextWinnerMatchId === match.id && src.nextWinnerSlot === slot) {
        return `Venc. Jogo #${src.matchNumber}`;
      }
      if (src.nextLoserMatchId === match.id && src.nextLoserSlot === slot) {
        return `Perd. Jogo #${src.matchNumber}`;
      }
    }
  }

  // 3. Casos especiais por tipo de confronto
  if (match.type === 'GRAND_FINAL' || match.bracket === 'GRAND_FINAL') {
    return slot === 'team1' ? 'Venc. Final Vencedores' : 'Venc. Final Repescagem';
  }

  return 'A definir';
}

/**
 * Retorna o texto a ser exibido para a dupla:
 * Se a dupla já estiver definida: nome da dupla (ou Folga se for BYE).
 * Se a dupla ainda NÃO estiver definida: de qual jogo ela virá (ex: "Venc. Jogo #1").
 */
export function getTeamSlotDisplay(match, slot = 'team1', allMatches = {}) {
  const team = slot === 'team1' ? match?.team1 : match?.team2;
  if (team) {
    if (team.isBye) return 'Folga (Sem adversário)';
    return team.displayName || team.name || 'Dupla';
  }
  return getMatchSlotSourceLabel(match, slot, allMatches);
}

/**
 * Verifica se todas as partidas de todas as categorias sorteadas foram finalizadas.
 * Quando o último resultado é digitado, o torneio é considerado encerrado.
 */
export function checkIsTournamentCompleted(brackets, categories = []) {
  if (!brackets || typeof brackets !== 'object') return false;
  const bracketEntries = Object.entries(brackets);
  if (bracketEntries.length === 0) return false;

  let hasAnyDrawnCategory = false;
  let totalPlayableMatches = 0;
  let completedMatches = 0;

  for (const [catId, b] of bracketEntries) {
    if (!b || !b.matches || typeof b.matches !== 'object') continue;
    const matchValues = Object.values(b.matches);
    if (matchValues.length === 0) continue;

    hasAnyDrawnCategory = true;
    for (const m of matchValues) {
      // Ignora folgas (BYE)
      if (m.isBye || m.team1?.isBye || m.team2?.isBye || m.team1?.id?.startsWith('BYE') || m.team2?.id?.startsWith('BYE')) {
        continue;
      }
      totalPlayableMatches++;
      if (m.status === 'COMPLETED' && m.winnerId) {
        completedMatches++;
      }
    }
  }

  return hasAnyDrawnCategory && totalPlayableMatches > 0 && completedMatches === totalPlayableMatches;
}
