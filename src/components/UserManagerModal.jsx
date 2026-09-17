import React, { useState, useEffect } from 'react';
import { 
  Users, 
  X, 
  Plus, 
  ShieldCheck, 
  Lock, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle,
  KeyRound,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { getUsers, addUser, updateUser, deleteUser, USER_ROLES } from '../utils/auth';

export default function UserManagerModal({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'OPERATOR',
    permissions: {
      manageTournaments: false,
      manageCategories: false,
      manageTeams: true,
      manageMatches: true,
      manageFinancial: false,
      drawBracket: false,
      manageUsers: false,
    },
  });

  const loadUsers = () => {
    setUsers(getUsers());
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setIsFormOpen(false);
      setEditingUserId(null);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'OPERATOR',
      permissions: {
        manageTournaments: false,
        manageCategories: false,
        manageTeams: true,
        manageMatches: true,
        manageFinancial: false,
        drawBracket: false,
        manageUsers: false,
      },
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      password: user.password || '',
      role: user.role || 'OPERATOR',
      permissions: {
        manageTournaments: Boolean(user.permissions?.manageTournaments),
        manageCategories: Boolean(user.permissions?.manageCategories),
        manageTeams: Boolean(user.permissions?.manageTeams),
        manageMatches: Boolean(user.permissions?.manageMatches),
        manageFinancial: Boolean(user.permissions?.manageFinancial),
        drawBracket: Boolean(user.permissions?.drawBracket),
        manageUsers: Boolean(user.permissions?.manageUsers),
      },
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleRoleChange = (newRole) => {
    const isAdmin = newRole === 'ADMIN';
    const isViewer = newRole === 'VIEWER';

    setFormData({
      ...formData,
      role: newRole,
      permissions: {
        manageTournaments: isAdmin,
        manageCategories: isAdmin,
        manageTeams: isAdmin || (!isViewer),
        manageMatches: isAdmin || (!isViewer),
        manageFinancial: isAdmin,
        drawBracket: isAdmin,
        manageUsers: isAdmin,
      },
    });
  };

  const handleTogglePermission = (key) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.username.trim()) {
      setErrorMsg('O login / nome de usuário é obrigatório.');
      return;
    }
    if (!formData.password.trim()) {
      setErrorMsg('A senha é obrigatória.');
      return;
    }

    try {
      if (editingUserId) {
        updateUser(editingUserId, formData);
        setSuccessMsg('Usuário atualizado com sucesso!');
      } else {
        addUser(formData);
        setSuccessMsg('Novo usuário cadastrado com sucesso!');
      }
      loadUsers();
      setIsFormOpen(false);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar usuário.');
    }
  };

  const handleDeleteUser = (user) => {
    if (user.isMaster || user.username.toLowerCase() === 'baumann') {
      alert('O Administrador Principal (Baumann) é protegido e não pode ser excluído.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
      try {
        deleteUser(user.id);
        loadUsers();
        setSuccessMsg('Usuário excluído com sucesso.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-amber">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                Gestão de Usuários & Permissões
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre e controle quem pode gerenciar o torneio, quadras ou financeiro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form to Add or Edit User */}
          {isFormOpen ? (
            <form onSubmit={handleSaveUser} className="space-y-4 p-5 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-glow-amber">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {editingUserId ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Mesário"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Login / Nome de Usuário</label>
                  <input
                    type="text"
                    required
                    disabled={editingUserId && users.find(u => u.id === editingUserId)?.isMaster}
                    placeholder="Ex: mesario1"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Senha de Acesso</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Digite a senha"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Perfil / Função</label>
                  <select
                    value={formData.role}
                    disabled={editingUserId && users.find(u => u.id === editingUserId)?.isMaster}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    <option value="ADMIN">Administrador (Acesso Total)</option>
                    <option value="OPERATOR">Mesário / Operador de Quadra</option>
                    <option value="VIEWER">Visualizador (Somente Leitura)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">Permissões Específicas:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.permissions.manageMatches}
                      onChange={() => handleTogglePermission('manageMatches')}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Lançar Súmulas & Placar das Quadras</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.permissions.manageTeams}
                      onChange={() => handleTogglePermission('manageTeams')}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Cadastrar & Editar Duplas</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.permissions.manageFinancial}
                      onChange={() => handleTogglePermission('manageFinancial')}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Acesso ao Módulo Financeiro</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.permissions.drawBracket}
                      onChange={() => handleTogglePermission('drawBracket')}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Realizar Sorteio das Chaves</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.permissions.manageTournaments}
                      onChange={() => handleTogglePermission('manageTournaments')}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Criar Novos Torneios & Categorias</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.permissions.manageUsers}
                      onChange={() => handleTogglePermission('manageUsers')}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Gerenciar Outros Usuários</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-glow-amber transition-all"
                >
                  {editingUserId ? 'Atualizar Usuário' : 'Salvar Novo Usuário'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total: <strong>{users.length}</strong> {users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
              </span>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-glow-amber transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Novo Usuário
              </button>
            </div>
          )}

          {/* Users List Table */}
          <div className="space-y-2">
            {users.map((user) => {
              const roleMeta = USER_ROLES[user.role] || USER_ROLES.OPERATOR;
              const isCurrentUser = currentUser?.username?.toLowerCase() === user.username.toLowerCase();

              return (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold font-mono">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {user.name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          (@{user.username})
                        </span>
                        {user.isMaster && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Principal
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Você
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleMeta.badgeColor}`}>
                          {roleMeta.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {user.role === 'ADMIN' ? 'Acesso irrestrito' : user.role === 'OPERATOR' ? 'Súmulas & Placar' : 'Somente leitura'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      title="Editar permissões e senha"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {!user.isMaster && user.username.toLowerCase() !== 'baumann' && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        title="Excluir usuário"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Usuário Administrador Mestre: <strong>Baumann</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
