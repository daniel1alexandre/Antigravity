import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, DollarSign, Users, Award, Shield } from 'lucide-react';

export default function CategoryManager({ categories, setCategories, teams, selectedCategoryId, setSelectedCategoryId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    entryFee: 140,
    maxTeams: 16,
    pointsToWin: 18,
    setsToWin: 1,
    twoPointDifference: true,
    color: '#F59E0B',
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      shortName: '',
      description: '',
      entryFee: 140,
      maxTeams: 16,
      pointsToWin: 18,
      setsToWin: 1,
      twoPointDifference: true,
      color: '#F59E0B',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      shortName: cat.shortName,
      description: cat.description || '',
      entryFee: cat.entryFee || 140,
      maxTeams: cat.maxTeams || 16,
      pointsToWin: cat.pointsToWin || 18,
      setsToWin: cat.setsToWin || 1,
      twoPointDifference: cat.twoPointDifference ?? true,
      color: cat.color || '#F59E0B',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c));
    } else {
      const newCat = {
        id: `cat-${Date.now()}`,
        ...formData,
        shortName: formData.shortName || formData.name.substring(0, 4).toUpperCase(),
      };
      setCategories([...categories, newCat]);
      setSelectedCategoryId(newCat.id);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (catId) => {
    const teamsInCat = teams.filter(t => t.categoryId === catId);
    if (teamsInCat.length > 0) {
      alert(`Não é possível excluir: existem ${teamsInCat.length} duplas cadastradas nesta categoria. Remova ou transfira as duplas primeiro.`);
      return;
    }
    if (categories.length <= 1) {
      alert('Você deve manter pelo menos uma categoria cadastrada.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      const updated = categories.filter(c => c.id !== catId);
      setCategories(updated);
      if (selectedCategoryId === catId) {
        setSelectedCategoryId(updated[0]?.id || '');
      }
    }
  };

  const colors = [
    { label: 'Dourado', value: '#F59E0B' },
    { label: 'Esmeralda', value: '#10B981' },
    { label: 'Ciano', value: '#06B6D4' },
    { label: 'Rosa Pink', value: '#EC4899' },
    { label: 'Roxo', value: '#8B5CF6' },
    { label: 'Vermelho', value: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            Categorias do Torneio
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure as categorias, valores de inscrição e regras de pontuação para o chaveamento.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const categoryTeams = teams.filter(t => t.categoryId === cat.id);
          const paidTeams = categoryTeams.filter(t => t.paymentStatus === 'PAID_FULL');
          const totalRevenue = categoryTeams.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
          const isSelected = selectedCategoryId === cat.id;

          return (
            <div
              key={cat.id}
              className={`relative rounded-2xl p-5 transition-all glass-panel border ${
                isSelected ? 'border-purple-500 ring-2 ring-purple-500/20 bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Color Bar Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                style={{ backgroundColor: cat.color || '#F59E0B' }}
              />

              <div className="flex items-start justify-between gap-2 mt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color || '#F59E0B' }}
                    />
                    <h3 className="font-bold text-lg text-white font-display">{cat.name}</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 mt-1 inline-block">
                    {cat.shortName}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Editar Categoria"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{cat.description}</p>
              )}

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-cyan-400" /> Duplas
                  </span>
                  <p className="text-sm font-bold text-slate-200 mt-0.5">
                    {categoryTeams.length} <span className="text-xs font-normal text-slate-500">cadastradas</span>
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> Inscrição
                  </span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">
                    R$ {cat.entryFee}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-400" /> Pagos
                  </span>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">
                    {paidTeams.length} confirmados
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Award className="w-3 h-3 text-purple-400" /> Pontuação
                  </span>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">
                    {cat.pointsToWin} pts {cat.twoPointDifference ? '(+2)' : ''}
                  </p>
                </div>
              </div>

              {/* Quick Select Button */}
              <button
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full mt-4 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isSelected ? '✓ Categoria Selecionada' : 'Selecionar Categoria'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Categoria C (Bronze) ou Misto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sigla / Código</label>
                  <input
                    type="text"
                    placeholder="Ex: CAT-C"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Taxa de Inscrição (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-emerald-400 font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Requisitos</label>
                <input
                  type="text"
                  placeholder="Ex: Aberto para atletas amadores e iniciantes"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Limite de Vagas</label>
                  <select
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={999}>Ilimitado (Livre)</option>
                    <option value={4}>4 Duplas</option>
                    <option value={6}>6 Duplas</option>
                    <option value={8}>8 Duplas</option>
                    <option value={10}>10 Duplas</option>
                    <option value={12}>12 Duplas</option>
                    <option value={16}>16 Duplas</option>
                    <option value={24}>24 Duplas</option>
                    <option value={32}>32 Duplas</option>
                    <option value={64}>64 Duplas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pontos do Set</label>
                  <select
                    value={formData.pointsToWin}
                    onChange={(e) => setFormData({ ...formData, pointsToWin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={18}>18 Pontos (Padrão)</option>
                    <option value={21}>21 Pontos (Oficial)</option>
                    <option value={15}>15 Pontos (Rápido)</option>
                    <option value={25}>25 Pontos</option>
                  </select>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cor do Card</label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        formData.color === c.value ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                >
                  {editingCategory ? 'Salvar Alterações' : 'Cadastrar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
