/**
 * Draw Engine for Tournament Brackets
 * Handles pure random shuffle, seeded lottery, and animated draw step sequencing.
 */

// Fisher-Yates shuffle
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Performs a seeded draw:
 * Places seeded teams in designated seed positions, and randomly fills remaining slots.
 */
export function performSeededDraw(teams) {
  const seededTeams = teams.filter(t => t.isSeed && t.seedRank > 0)
                           .sort((a, b) => a.seedRank - b.seedRank);
  const unseededTeams = shuffleArray(teams.filter(t => !t.isSeed || !t.seedRank));

  // If no seeded teams, just return shuffled array
  if (seededTeams.length === 0) {
    return unseededTeams;
  }

  // Combine seeded teams at the top of the ordered list followed by shuffled unseeded
  return [...seededTeams, ...unseededTeams];
}

/**
 * Performs a pure random draw
 */
export function performRandomDraw(teams) {
  return shuffleArray(teams);
}

/**
 * Prepares an animated draw sequence for UI presentation
 */
export function prepareDrawAnimationSteps(drawnTeams) {
  const steps = [];
  for (let i = 0; i < drawnTeams.length; i += 2) {
    const team1 = drawnTeams[i];
    const team2 = drawnTeams[i + 1] || null;
    steps.push({
      confronto: Math.floor(i / 2) + 1,
      team: team1,
      team1,
      team2,
      label: `Confronto ${Math.floor(i / 2) + 1}`,
    });
  }
  return steps;
}
