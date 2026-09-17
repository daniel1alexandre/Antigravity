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
    entryFee: 120,
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
    entryFee: 140,
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
    entryFee: 160,
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
    entryFee: 200,
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
    entryFee: 140,
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
 * Helper to get athlete payment details with fallback to team-level values
 */
export function getAthletePayment(team, playerNum, entryFee) {
  const player = playerNum === 1 ? team?.player1 : team?.player2;
  const athleteFee = Math.round((entryFee || 140) / 2);

  if (player?.payment) {
    const isExempt = player.payment.status === 'EXEMPT';
    return {
      status: player.payment.status || 'PENDING',
      method: player.payment.method || team?.paymentMethod || 'PIX',
      amount: isExempt ? 0 : Number(player.payment.amount !== undefined ? player.payment.amount : 0),
      date: player.payment.date || null,
      notes: player.payment.notes || '',
      fee: isExempt ? 0 : athleteFee,
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
  };
}
