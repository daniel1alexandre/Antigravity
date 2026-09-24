import { DEFAULT_CATEGORIES } from '../types/tournament';
import { DEFAULT_COURTS } from '../types/tournament';
import { INITIAL_EVENT_INFO, MOCK_TEAMS } from './mockData';

const STORAGE_KEYS = {
  TOURNAMENTS_LIST: 'futvolei_tournaments_v2',
  ACTIVE_TOURNAMENT_ID: 'futvolei_active_tournament_id_v2',
  EVENT_INFO: 'futvolei_event_info',
  CATEGORIES: 'futvolei_categories',
  TEAMS: 'futvolei_teams',
  BRACKETS: 'futvolei_brackets',
  SETTINGS: 'futvolei_settings',
};

export function normalizeEventInfo(info = {}, defaultName = 'Novo Torneio de Futvôlei') {
  const eventInfo = { ...info };
  if (!eventInfo.name || !eventInfo.name.trim()) {
    eventInfo.name = defaultName;
  }
  if (!eventInfo.courts || !Array.isArray(eventInfo.courts) || eventInfo.courts.length === 0) {
    eventInfo.courts = DEFAULT_COURTS;
  }
  if (!eventInfo.expenses || !Array.isArray(eventInfo.expenses)) {
    eventInfo.expenses = [];
  }
  if (!eventInfo.sponsors || !Array.isArray(eventInfo.sponsors)) {
    eventInfo.sponsors = [];
  }
  if (!eventInfo.scheduleConfig || typeof eventInfo.scheduleConfig !== 'object') {
    eventInfo.scheduleConfig = {
      startTime: '08:00',
      matchDuration: 25,
      warmupDuration: 5,
      courtSwitchDuration: 3,
      selectedCourtIds: eventInfo.courts?.map(c => c.id) || ['court-1', 'court-2'],
      categoryOrder: [],
      days: [
        {
          id: 'day-1',
          name: 'Dia 1',
          date: eventInfo.date || '2026-09-05',
          startTime: '08:00',
          categoryIds: []
        }
      ],
      lunchBreak: {
        enabled: false,
        startTime: '12:30',
        duration: 45
      }
    };
  } else if (!Array.isArray(eventInfo.scheduleConfig.days) || eventInfo.scheduleConfig.days.length === 0) {
    eventInfo.scheduleConfig.days = [
      {
        id: 'day-1',
        name: 'Dia 1',
        date: eventInfo.date || '2026-09-05',
        startTime: eventInfo.scheduleConfig.startTime || '08:00',
        categoryIds: Array.isArray(eventInfo.scheduleConfig.categoryOrder) && eventInfo.scheduleConfig.categoryOrder.length > 0
          ? eventInfo.scheduleConfig.categoryOrder
          : []
      }
    ];
  }
  return eventInfo;
}

function syncLegacyStorage(tournament) {
  try {
    if (!tournament) return;
    if (tournament.eventInfo) localStorage.setItem(STORAGE_KEYS.EVENT_INFO, JSON.stringify(tournament.eventInfo));
    if (tournament.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(tournament.categories));
    if (tournament.teams) localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(tournament.teams));
    if (tournament.brackets) localStorage.setItem(STORAGE_KEYS.BRACKETS, JSON.stringify(tournament.brackets));
  } catch (e) {
    console.error('Erro ao sincronizar storage legado', e);
  }
}

export function loadTournamentData() {
  try {
    let tournaments = [];
    const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS_LIST);

    if (rawTournaments) {
      try {
        const parsed = JSON.parse(rawTournaments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          tournaments = parsed;
        }
      } catch (err) {
        console.error('Erro ao fazer parse dos torneios salvos', err);
      }
    }

    // Se ainda não existirem torneios estruturados, migra os dados existentes ou cria o inicial
    if (tournaments.length === 0) {
      const rawEventInfo = localStorage.getItem(STORAGE_KEYS.EVENT_INFO);
      const rawCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const rawTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
      const rawBrackets = localStorage.getItem(STORAGE_KEYS.BRACKETS);

      const legacyEventInfo = rawEventInfo !== null ? JSON.parse(rawEventInfo) : INITIAL_EVENT_INFO;
      const legacyCategories = rawCategories !== null ? JSON.parse(rawCategories) : DEFAULT_CATEGORIES;
      const legacyTeams = rawTeams !== null ? JSON.parse(rawTeams) : MOCK_TEAMS;
      const legacyBrackets = rawBrackets !== null ? JSON.parse(rawBrackets) : {};

      const initialId = legacyEventInfo?.id || 'tourn-1';
      const initialTournament = {
        id: initialId,
        eventInfo: normalizeEventInfo({ ...legacyEventInfo, id: initialId }),
        categories: legacyCategories,
        teams: legacyTeams,
        brackets: legacyBrackets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tournaments = [initialTournament];
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS_LIST, JSON.stringify(tournaments));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, initialId);
    }

    // Identifica o torneio ativo
    let activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
    let activeTournament = tournaments.find((t) => t.id === activeId);

    if (!activeTournament) {
      activeTournament = tournaments[0];
      activeId = activeTournament.id;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, activeId);
    }

    // Normaliza dados do torneio ativo
    activeTournament.eventInfo = normalizeEventInfo(activeTournament.eventInfo, activeTournament.eventInfo?.name);
    if (!Array.isArray(activeTournament.categories)) activeTournament.categories = [];
    if (!Array.isArray(activeTournament.teams)) activeTournament.teams = [];
    if (!activeTournament.brackets || typeof activeTournament.brackets !== 'object') activeTournament.brackets = {};

    syncLegacyStorage(activeTournament);

    return {
      tournaments,
      activeTournamentId: activeId,
      eventInfo: activeTournament.eventInfo,
      categories: activeTournament.categories,
      teams: activeTournament.teams,
      brackets: activeTournament.brackets,
    };
  } catch (err) {
    console.error('Error loading data from localStorage', err);
    const fallbackId = 'tourn-fallback';
    const fallbackEvent = normalizeEventInfo({ ...INITIAL_EVENT_INFO, id: fallbackId });
    const fallbackTournament = {
      id: fallbackId,
      eventInfo: fallbackEvent,
      categories: DEFAULT_CATEGORIES,
      teams: MOCK_TEAMS,
      brackets: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return {
      tournaments: [fallbackTournament],
      activeTournamentId: fallbackId,
      eventInfo: fallbackEvent,
      categories: DEFAULT_CATEGORIES,
      teams: MOCK_TEAMS,
      brackets: {},
    };
  }
}

/**
 * Cria um novo torneio mantendo intactos todos os torneios que já existem.
 */
export function createNewTournament(customInfo = {}) {
  try {
    const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS_LIST);
    let currentTournaments = [];
    if (rawTournaments) {
      try {
        currentTournaments = JSON.parse(rawTournaments) || [];
      } catch {
        currentTournaments = [];
      }
    }

    const newId = `tourn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEventInfo = normalizeEventInfo({
      id: newId,
      name: customInfo.name?.trim() || 'Novo Torneio de Futvôlei',
      organizer: customInfo.organizer?.trim() || '',
      location: customInfo.location?.trim() || '',
      city: customInfo.city?.trim() || '',
      date: customInfo.date?.trim() || '',
      courts: DEFAULT_COURTS,
      pixKey: '',
      pixReceiver: '',
      pixBank: '',
      defaultEntryFee: 140,
      expenses: [],
      sponsors: [],
      ...customInfo,
    });

    const newTournament = {
      id: newId,
      eventInfo: newEventInfo,
      categories: [],
      teams: [],
      brackets: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Adiciona o novo torneio sem mexer nos existentes
    const updatedTournaments = [...currentTournaments, newTournament];

    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS_LIST, JSON.stringify(updatedTournaments));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, newId);
    syncLegacyStorage(newTournament);

    return {
      tournaments: updatedTournaments,
      activeTournamentId: newId,
      eventInfo: newTournament.eventInfo,
      categories: [],
      teams: [],
      brackets: {},
    };
  } catch (err) {
    console.error('Erro ao criar novo torneio', err);
    throw err;
  }
}

/**
 * Salva as alterações do torneio ativo (ou de um torneio específico) na lista de torneios.
 */
export function saveTournamentData(data, targetTournamentId) {
  try {
    const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS_LIST);
    let tournaments = [];
    if (rawTournaments) {
      tournaments = JSON.parse(rawTournaments) || [];
    }
    const activeId = targetTournamentId || localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);

    let updatedTournaments = tournaments.map((t) => {
      if (t.id === activeId) {
        return {
          ...t,
          eventInfo: data.eventInfo ? normalizeEventInfo(data.eventInfo) : t.eventInfo,
          categories: data.categories !== undefined ? data.categories : t.categories,
          teams: data.teams !== undefined ? data.teams : t.teams,
          brackets: data.brackets !== undefined ? data.brackets : t.brackets,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    // Se o torneio ainda não estiver na lista, adiciona-o
    if (!updatedTournaments.some((t) => t.id === activeId) && activeId) {
      const newT = {
        id: activeId,
        eventInfo: normalizeEventInfo(data.eventInfo),
        categories: data.categories || [],
        teams: data.teams || [],
        brackets: data.brackets || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedTournaments.push(newT);
    }

    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS_LIST, JSON.stringify(updatedTournaments));

    // Sincroniza chaves legadas se for o torneio ativo
    const activeTournament = updatedTournaments.find((t) => t.id === activeId);
    if (activeTournament) {
      syncLegacyStorage(activeTournament);
    }
  } catch (err) {
    console.error('Error saving data to localStorage', err);
  }
}

/**
 * Limpa todas as informações do torneio (duplas, chaveamentos, despesas),
 * mantendo APENAS as categorias e as informações de cadastro do torneio.
 */
export function clearTournamentData(tournamentId) {
  try {
    const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS_LIST);
    let tournaments = [];
    if (rawTournaments) {
      tournaments = JSON.parse(rawTournaments) || [];
    }

    let clearedTournament = null;
    const updatedTournaments = tournaments.map((t) => {
      if (t.id === tournamentId) {
        clearedTournament = {
          ...t,
          // Mantém as categorias intactas!
          categories: Array.isArray(t.categories) ? t.categories : [],
          // Limpa todas as informações do torneio:
          teams: [],
          brackets: {},
          eventInfo: {
            ...t.eventInfo,
            expenses: [],
            scheduleConfig: {
              ...(t.eventInfo?.scheduleConfig || {}),
              categoryOrder: [],
              lunchBreak: { enabled: false, startTime: '12:30', duration: 45 },
            },
          },
          updatedAt: new Date().toISOString(),
        };
        return clearedTournament;
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS_LIST, JSON.stringify(updatedTournaments));

    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
    if (activeId === tournamentId && clearedTournament) {
      syncLegacyStorage(clearedTournament);
    }

    return {
      tournaments: updatedTournaments,
      clearedTournament,
    };
  } catch (err) {
    console.error('Erro ao limpar dados do torneio', err);
    throw err;
  }
}

/**
 * Exclui o torneio especificado.
 * Se o torneio excluído for o ativo, seleciona outro torneio existente ou cria um novo limpo se não sobrar nenhum.
 */
export function deleteTournament(tournamentId) {
  try {
    const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS_LIST);
    let tournaments = [];
    if (rawTournaments) {
      tournaments = JSON.parse(rawTournaments) || [];
    }

    let updatedTournaments = tournaments.filter((t) => t.id !== tournamentId);

    // Se deletou todos os torneios, cria um padrão limpo para a lista nunca ficar vazia
    if (updatedTournaments.length === 0) {
      const fallbackId = `tourn-${Date.now()}`;
      const fallbackTournament = {
        id: fallbackId,
        eventInfo: normalizeEventInfo({
          id: fallbackId,
          name: 'Novo Torneio de Futvôlei',
          organizer: '',
          location: '',
          city: '',
          date: '',
          courts: DEFAULT_COURTS,
          expenses: [],
          sponsors: [],
        }),
        categories: [],
        teams: [],
        brackets: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedTournaments = [fallbackTournament];
    }

    let activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
    if (activeId === tournamentId || !updatedTournaments.some((t) => t.id === activeId)) {
      activeId = updatedTournaments[0].id;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, activeId);
    }

    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS_LIST, JSON.stringify(updatedTournaments));

    const activeTournament = updatedTournaments.find((t) => t.id === activeId) || updatedTournaments[0];
    syncLegacyStorage(activeTournament);

    return {
      tournaments: updatedTournaments,
      activeTournamentId: activeId,
      activeTournament,
    };
  } catch (err) {
    console.error('Erro ao excluir torneio', err);
    throw err;
  }
}

/**
 * Alterna o torneio ativo atual.
 */
export function switchActiveTournament(tournamentId) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, tournamentId);
    const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS_LIST);
    let tournaments = [];
    if (rawTournaments) {
      tournaments = JSON.parse(rawTournaments) || [];
    }
    const active = tournaments.find((t) => t.id === tournamentId) || tournaments[0];
    if (active) {
      syncLegacyStorage(active);
    }
    return active;
  } catch (err) {
    console.error('Erro ao alternar torneio ativo', err);
    throw err;
  }
}

export function exportTournamentJSON(data) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  const filename = `futvolei_torneio_${new Date().toISOString().slice(0, 10)}.json`;
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetToDemoData() {
  const demoId = `tourn-demo-${Date.now()}`;
  const demoEvent = normalizeEventInfo({ ...INITIAL_EVENT_INFO, id: demoId });
  const demoTournament = {
    id: demoId,
    eventInfo: demoEvent,
    categories: DEFAULT_CATEGORIES,
    teams: MOCK_TEAMS,
    brackets: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS_LIST);
  let tournaments = [];
  if (rawTournaments) {
    try {
      tournaments = JSON.parse(rawTournaments) || [];
    } catch {
      tournaments = [];
    }
  }

  // Substitui o ativo atual pelo demo ou adiciona
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
  let updatedTournaments = tournaments.map((t) => (t.id === activeId ? demoTournament : t));
  if (!updatedTournaments.some((t) => t.id === demoTournament.id)) {
    updatedTournaments = [demoTournament, ...tournaments];
  }

  localStorage.setItem(STORAGE_KEYS.TOURNAMENTS_LIST, JSON.stringify(updatedTournaments));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, demoTournament.id);
  syncLegacyStorage(demoTournament);

  return {
    tournaments: updatedTournaments,
    activeTournamentId: demoTournament.id,
    eventInfo: demoTournament.eventInfo,
    categories: DEFAULT_CATEGORIES,
    teams: MOCK_TEAMS,
    brackets: {},
  };
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.TOURNAMENTS_LIST);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
  localStorage.removeItem(STORAGE_KEYS.EVENT_INFO);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.TEAMS);
  localStorage.removeItem(STORAGE_KEYS.BRACKETS);
  return loadTournamentData();
}
