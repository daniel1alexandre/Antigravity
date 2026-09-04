import { DEFAULT_CATEGORIES } from '../types/tournament';
import { DEFAULT_COURTS } from '../types/tournament';
import { INITIAL_EVENT_INFO, MOCK_TEAMS } from './mockData';

const STORAGE_KEYS = {
  EVENT_INFO: 'futvolei_event_info',
  CATEGORIES: 'futvolei_categories',
  TEAMS: 'futvolei_teams',
  BRACKETS: 'futvolei_brackets',
  SETTINGS: 'futvolei_settings',
};

export function loadTournamentData() {
  try {
    const eventInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENT_INFO)) || INITIAL_EVENT_INFO;
    // Migrate: ensure courts array exists
    if (!eventInfo.courts || !Array.isArray(eventInfo.courts)) {
      eventInfo.courts = DEFAULT_COURTS;
    }
    const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || DEFAULT_CATEGORIES;
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS)) || MOCK_TEAMS;
    const brackets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BRACKETS)) || {};

    return {
      eventInfo,
      categories,
      teams,
      brackets,
    };
  } catch (err) {
    console.error('Error loading data from localStorage', err);
    return {
      eventInfo: INITIAL_EVENT_INFO,
      categories: DEFAULT_CATEGORIES,
      teams: MOCK_TEAMS,
      brackets: {},
    };
  }
}

export function saveTournamentData(data) {
  try {
    if (data.eventInfo) localStorage.setItem(STORAGE_KEYS.EVENT_INFO, JSON.stringify(data.eventInfo));
    if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
    if (data.teams) localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(data.teams));
    if (data.brackets) localStorage.setItem(STORAGE_KEYS.BRACKETS, JSON.stringify(data.brackets));
  } catch (err) {
    console.error('Error saving data to localStorage', err);
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
  localStorage.setItem(STORAGE_KEYS.EVENT_INFO, JSON.stringify(INITIAL_EVENT_INFO));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(MOCK_TEAMS));
  localStorage.removeItem(STORAGE_KEYS.BRACKETS);
  return {
    eventInfo: INITIAL_EVENT_INFO,
    categories: DEFAULT_CATEGORIES,
    teams: MOCK_TEAMS,
    brackets: {},
  };
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.EVENT_INFO);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.TEAMS);
  localStorage.removeItem(STORAGE_KEYS.BRACKETS);
  return {
    eventInfo: INITIAL_EVENT_INFO,
    categories: DEFAULT_CATEGORIES,
    teams: [],
    brackets: {},
  };
}
