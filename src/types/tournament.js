export const PAYMENT_STATUS = {
  PAID_FULL: { label: 'Pago', value: 'PAID_FULL', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  EXEMPT: { label: 'Isento', value: 'EXEMPT', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  PENDING: { label: 'Pendente', value: 'PENDING', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

export const PAYMENT_METHODS = {
  PIX: { label: 'PIX', value: 'PIX' },
  CASH: { label: 'Dinheiro', value: 'CASH' },
  CARD: { label: 'Cartão', value: 'CARD' },
  TRANSFER: { label: 'Transferência', value: 'TRANSFER' },
};

export const MATCH_STATUS = {
  PENDING: 'PENDING',       // Waiting for previous round matches
  READY: 'READY',           // Both teams defined, ready to play
  WARMUP: 'WARMUP',         // In court warming up
  LIVE: 'LIVE',             // Game in progress
  COMPLETED: 'COMPLETED',   // Match finished
};

export const DEFAULT_CATEGORIES = [
  {
    id: 'cat-iniciante',
    name: 'Iniciante',
    shortName: 'INI',
    description: 'Atletas que começaram recentemente no futvôlei',
    entryFee: 60, // Valor por atleta (R$ 120 por dupla)
    secondCategoryFee: 40, // Valor com desconto para 2ª categoria
    maxTeams: 16,
    pointsToWin: 18,
    setsToWin: 1, // 1 set to 18
    twoPointDifference: true,
    color: '#06B6D4',
  },
  {
    id: 'cat-c',
    name: 'Categoria C (Bronze)',
    shortName: 'CAT-C',
    description: 'Jogadores intermediários nível bronze',
    entryFee: 70, // Valor por atleta (R$ 140 por dupla)
    secondCategoryFee: 50,
    maxTeams: 16,
    pointsToWin: 18,
    setsToWin: 1,
    twoPointDifference: true,
    color: '#F59E0B',
  },
  {
    id: 'cat-b',
    name: 'Categoria B (Prata)',
    shortName: 'CAT-B',
    description: 'Nível avançado prata com experiência em torneios',
    entryFee: 80, // Valor por atleta (R$ 160 por dupla)
    secondCategoryFee: 60,
    maxTeams: 16,
    pointsToWin: 18,
    setsToWin: 1,
    twoPointDifference: true,
    color: '#10B981',
  },
  {
    id: 'cat-a',
    name: 'Categoria A / Open (Ouro)',
    shortName: 'OPEN',
    description: 'Categoria principal com os melhores atletas',
    entryFee: 100, // Valor por atleta (R$ 200 por dupla)
    secondCategoryFee: 70,
    maxTeams: 16,
    pointsToWin: 21,
    setsToWin: 1,
    twoPointDifference: true,
    color: '#EC4899',
  },
  {
    id: 'cat-misto',
    name: 'Misto (Masc + Fem)',
    shortName: 'MISTO',
    description: 'Duplas formadas por um atleta masculino e uma feminina',
    entryFee: 70, // Valor por atleta (R$ 140 por dupla)
    secondCategoryFee: 50,
    maxTeams: 16,
    pointsToWin: 18,
    setsToWin: 1,
    twoPointDifference: true,
    color: '#8B5CF6',
  },
];

export const SHIRT_SIZES = ['P', 'M', 'G', 'GG', 'XG'];

// Default courts — used only as initial value when no courts exist in eventInfo
export const DEFAULT_COURTS = [
  { id: 'court-1', name: 'Quadra 1', description: '' },
  { id: 'court-2', name: 'Quadra 2', description: '' },
  { id: 'court-3', name: 'Quadra Central', description: '' },
];

/**
 * Detects if an athlete is already enrolled in another category in the tournament
 */
export function getAthleteOtherCategories(athlete, teams = [], categories = [], currentTeamId = null, currentCategoryId = null) {
  if (!athlete) return [];
  const cleanName = (athlete.name || '').trim().toLowerCase();
  const cleanPhone = (athlete.phone || '').replace(/\D/g, '');

  if (!cleanName && !cleanPhone) return [];

  const otherEntries = [];

  teams.forEach(t => {
    if (currentTeamId && t.id === currentTeamId) return;

    // Compare player 1
    const p1Name = (t.player1?.name || '').trim().toLowerCase();
    const p1Phone = (t.player1?.phone || '').replace(/\D/g, '');
    const matchP1 = (cleanName && p1Name && p1Name === cleanName) ||
                    (cleanPhone && cleanPhone.length >= 8 && p1Phone === cleanPhone);

    // Compare player 2
    const p2Name = (t.player2?.name || '').trim().toLowerCase();
    const p2Phone = (t.player2?.phone || '').replace(/\D/g, '');
    const matchP2 = (cleanName && p2Name && p2Name === cleanName) ||
                    (cleanPhone && cleanPhone.length >= 8 && p2Phone === cleanPhone);

    if (matchP1 || matchP2) {
      const cat = categories.find(c => c.id === t.categoryId);
      otherEntries.push({
        teamId: t.id,
        teamDisplayName: t.displayName,
        categoryId: t.categoryId,
        categoryName: cat?.name || 'Outra Categoria',
        categoryColor: cat?.color || '#F59E0B',
        playerNum: matchP1 ? 1 : 2,
        isSameCategory: currentCategoryId ? t.categoryId === currentCategoryId : false,
      });
    }
  });

  return otherEntries;
}

/**
 * Helper to get athlete payment details with fallback to team-level values.
 * In the new model, category entryFee is configured PER ATHLETE.
 * Specific athlete-level fee adjustments (e.g. 2nd category discount) are respected.
 */
export function getAthletePayment(team, playerNum, entryFee) {
  const player = playerNum === 1 ? team?.player1 : team?.player2;
  const defaultCategoryFee = entryFee !== undefined && entryFee !== null ? Number(entryFee) : 70;

  // Individual athlete fee: custom fee takes precedence, then player fee, then category entryFee
  const hasCustomFee = (player?.payment?.fee !== undefined && player.payment.fee !== null) ||
                       (player?.fee !== undefined && player.fee !== null);
  const athleteFee = player?.payment?.fee !== undefined && player.payment.fee !== null
    ? Number(player.payment.fee)
    : (player?.fee !== undefined && player.fee !== null
        ? Number(player.fee)
        : defaultCategoryFee);

  if (player?.payment) {
    const isExempt = player.payment.status === 'EXEMPT';
    return {
      status: player.payment.status || 'PENDING',
      method: player.payment.method || team?.paymentMethod || 'PIX',
      amount: isExempt ? 0 : Number(player.payment.amount !== undefined ? player.payment.amount : 0),
      date: player.payment.date || null,
      notes: player.payment.notes || '',
      fee: isExempt ? 0 : athleteFee,
      isCustomFee: Boolean(hasCustomFee),
      isSecondCategory: Boolean(player.payment.isSecondCategory || player.isSecondCategory),
    };
  }

  let derivedStatus = 'PENDING';
  let derivedAmount = 0;

  if (team?.paymentStatus === 'PAID_FULL') {
    derivedStatus = 'PAID_FULL';
    derivedAmount = athleteFee;
  } else if (team?.paymentStatus === 'EXEMPT') {
    derivedStatus = 'EXEMPT';
    derivedAmount = 0;
  }

  const isExempt = derivedStatus === 'EXEMPT';

  return {
    status: derivedStatus,
    method: team?.paymentMethod || 'PIX',
    amount: derivedAmount,
    date: team?.paymentDate || null,
    notes: team?.paymentNotes || '',
    fee: isExempt ? 0 : athleteFee,
    isCustomFee: Boolean(hasCustomFee),
    isSecondCategory: Boolean(player?.isSecondCategory),
  };
}
