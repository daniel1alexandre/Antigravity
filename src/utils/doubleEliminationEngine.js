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
  const wr1MatchIds = state.winnersRounds[0]?.matchIds || [];

  wr1MatchIds.forEach((mId) => {
    const match = updatedMatches[mId];
    if (!match) return;

    const t1IsBye = match.team1?.isBye;
    const t2IsBye = match.team2?.isBye;

    if (t1IsBye && t2IsBye) {
      // Both BYEs
      match.status = 'COMPLETED';
      match.winnerId = match.team1.id;
      match.loserId = match.team2.id;
      match.isBye = true;
      propagateResult(updatedMatches, match, match.team1, match.team2);
    } else if (t1IsBye && match.team2) {
      // Team 2 gets BYE win
      match.status = 'COMPLETED';
      match.winnerId = match.team2.id;
      match.loserId = match.team1.id;
      match.isBye = true;
      propagateResult(updatedMatches, match, match.team2, match.team1);
    } else if (t2IsBye && match.team1) {
      // Team 1 gets BYE win
      match.status = 'COMPLETED';
      match.winnerId = match.team1.id;
      match.loserId = match.team2.id;
      match.isBye = true;
      propagateResult(updatedMatches, match, match.team1, match.team2);
    } else if (match.team1 && match.team2) {
      match.status = 'READY';
    }
  });

  return { ...state, matches: updatedMatches };
}

/**
 * Propagate winner and loser forward to their respective next matches
 */
function propagateResult(matches, match, winningTeam, losingTeam) {
  // Push Winner
  if (match.nextWinnerMatchId && winningTeam && !winningTeam.isBye) {
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
  if (match.nextLoserMatchId && losingTeam && !losingTeam.isBye) {
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
 * Updates score and advances teams for a played match
 */
export function updateMatchScore(state, matchId, score1, score2, sets = []) {
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

  matches[matchId] = match;

  // Propagate results
  propagateResult(matches, match, winningTeam, losingTeam);

  // Compute final standings if Grand Final completed
  let standings = [...(state.standings || [])];
  if (match.bracket === 'GRAND_FINAL' && match.status === 'COMPLETED') {
    standings = calculateStandings({ ...state, matches });
  }

  return {
    ...state,
    matches,
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
