// Authentication and User Permissions Manager
// Default Master Admin: Baumann / Daniel0306

const USERS_STORAGE_KEY = 'futvolei_users_v2';
const SESSION_STORAGE_KEY = 'futvolei_auth_session_v2';

export const USER_ROLES = {
  ADMIN: {
    id: 'ADMIN',
    name: 'Administrador',
    description: 'Acesso total a todas as funções, financeiro, sorteio, configurações e gestão de usuários.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  OPERATOR: {
    id: 'OPERATOR',
    name: 'Mesário / Operador',
    description: 'Pode gerenciar partidas, quadras, lançar súmulas e placares. Sem acesso ao financeiro e usuários.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  VIEWER: {
    id: 'VIEWER',
    name: 'Visualizador / Público',
    description: 'Visualização somente leitura de chaves, inscritos, tabela de jogos e telão.',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  },
};

export const DEFAULT_ADMIN_USER = {
  id: 'usr-master-baumann',
  username: 'Baumann',
  password: 'Daniel0306',
  name: 'Daniel Baumann',
  role: 'ADMIN',
  isMaster: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  permissions: {
    manageTournaments: true,
    manageCategories: true,
    manageTeams: true,
    manageFinancial: true,
    manageMatches: true,
    manageUsers: true,
    drawBracket: true,
  },
};

/**
 * Get all users from storage. Ensures default admin exists.
 */
export function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    let users = raw ? JSON.parse(raw) : [];

    // Ensure master admin Baumann exists
    const masterExists = users.some(u => u.username && u.username.toLowerCase() === 'baumann');
    if (!masterExists) {
      users = [DEFAULT_ADMIN_USER, ...users];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    return users;
  } catch (err) {
    console.error('Error loading users:', err);
    return [DEFAULT_ADMIN_USER];
  }
}

/**
 * Save users list to storage
 */
export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

/**
 * Authenticate with username and password
 */
export function authenticate(username, password) {
  const users = getUsers();
  const cleanUsername = username?.trim().toLowerCase();
  const user = users.find(u => u.username && u.username.toLowerCase() === cleanUsername && u.password === password);

  if (user) {
    const sessionUser = {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      role: user.role || 'OPERATOR',
      isMaster: Boolean(user.isMaster),
      permissions: user.permissions || {},
      loginAt: new Date().toISOString(),
    };
    setCurrentUser(sessionUser);
    return sessionUser;
  }
  return null;
}

/**
 * Get active session user
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Set active session user
 */
export function setCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error saving session:', err);
  }
}

/**
 * Logout
 */
export function logout() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Add a new user
 */
export function addUser(userData) {
  const users = getUsers();
  const cleanUsername = userData.username.trim();

  if (users.some(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    throw new Error(`O usuário "${cleanUsername}" já existe. Escolha outro nome de login.`);
  }

  const role = userData.role || 'OPERATOR';
  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    username: cleanUsername,
    password: userData.password,
    name: userData.name?.trim() || cleanUsername,
    role,
    isMaster: false,
    createdAt: new Date().toISOString(),
    permissions: {
      manageTournaments: role === 'ADMIN',
      manageCategories: role === 'ADMIN',
      manageTeams: role === 'ADMIN' || role === 'OPERATOR',
      manageFinancial: role === 'ADMIN',
      manageMatches: role === 'ADMIN' || role === 'OPERATOR',
      manageUsers: role === 'ADMIN',
      drawBracket: role === 'ADMIN',
      ...userData.permissions,
    },
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  return newUser;
}

/**
 * Update an existing user
 */
export function updateUser(userId, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error('Usuário não encontrado.');

  const existing = users[index];

  // Protect master admin from role demotion or username rename
  if (existing.isMaster) {
    updates.username = existing.username;
    updates.role = 'ADMIN';
  }

  users[index] = {
    ...existing,
    ...updates,
    permissions: {
      ...existing.permissions,
      ...updates.permissions,
    },
  };

  saveUsers(users);
  return users[index];
}

/**
 * Delete user (master admin cannot be deleted)
 */
export function deleteUser(userId) {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (!target) throw new Error('Usuário não encontrado.');

  if (target.isMaster || (target.username && target.username.toLowerCase() === 'baumann')) {
    throw new Error('O usuário Administrador Principal (Baumann) não pode ser excluído.');
  }

  const updated = users.filter(u => u.id !== userId);
  saveUsers(updated);
  return true;
}
