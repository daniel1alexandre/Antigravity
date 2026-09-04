import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  AtSign, 
  MapPin, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Share2, 
  DollarSign, 
  Shirt, 
  Sparkles, 
  ExternalLink, 
  MessageCircle,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { PAYMENT_STATUS, SHIRT_SIZES, getAthletePayment } from '../types/tournament';

export default function TeamsManager({ 
  teams, 
  setTeams, 
  categories, 
  selectedCategoryId, 
  setSelectedCategoryId,
  isAddModalOpen,
  setIsAddModalOpen,
  eventInfo,
  onGoToPayments 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [editingTeam, setEditingTeam] = useState(null);
  const [sharePreviewTeam, setSharePreviewTeam] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: selectedCategoryId,
    player1Name: '',
    player1Nickname: '',
    player1Phone: '',
    player1Instagram: '',
    player1ShirtSize: 'M',
    player2Name: '',
    player2Nickname: '',
    player2Phone: '',
    player2Instagram: '',
    player2ShirtSize: 'M',
    city: '',
    isSeed: false,
    seedRank: '',
    paymentStatus: 'PENDING',
    paymentMethod: 'PIX',
    paidAmount: 0,
    paymentNotes: '',
  });

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({
      categoryId: selectedCategoryId,
      player1Name: '',
      player1Nickname: '',
      player1Phone: '',
      player1Instagram: '',
      player1ShirtSize: 'M',
      player2Name: '',
      player2Nickname: '',
      player2Phone: '',
      player2Instagram: '',
      player2ShirtSize: 'M',
      city: '',
      isSeed: false,
      seedRank: '',
      paymentStatus: 'PENDING',
      paymentMethod: 'PIX',
      paidAmount: 0,
      paymentNotes: '',
    });
    setIsAddModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      categoryId: team.categoryId,
      player1Name: team.player1?.name || '',
      player1Nickname: team.player1?.nickname || '',
      player1Phone: team.player1?.phone || '',
      player1Instagram: team.player1?.instagram || '',
      player1ShirtSize: team.player1?.shirtSize || 'M',
      player2Name: team.player2?.name || '',
      player2Nickname: team.player2?.nickname || '',
      player2Phone: team.player2?.phone || '',
      player2Instagram: team.player2?.instagram || '',
      player2ShirtSize: team.player2?.shirtSize || 'M',
      city: team.city || '',
      isSeed: Boolean(team.isSeed),
      seedRank: team.seedRank || '',
      paymentStatus: team.paymentStatus || 'PENDING',
      paymentMethod: team.paymentMethod || 'PIX',
      paidAmount: team.paidAmount ?? (team.paymentStatus === 'PAID_FULL' ? selectedCategory.entryFee : 0),
      paymentNotes: team.paymentNotes || '',
    });
    setIsAddModalOpen(true);
  };

  // Save Team
  const handleSaveTeam = (e) => {
    e.preventDefault();
    if (!formData.player1Name.trim() || !formData.player2Name.trim()) {
      alert('Preencha o nome de ambos os atletas da dupla.');
      return;
    }

    const displayName = `${formData.player1Nickname || formData.player1Name.split(' ')[0]} & ${formData.player2Nickname || formData.player2Name.split(' ')[0]}`;

    if (editingTeam) {
      setTeams(teams.map(t => {
        if (t.id === editingTeam.id) {
          return {
            ...t,
            categoryId: formData.categoryId,
            displayName,
            city: formData.city,
            isSeed: formData.isSeed,
            seedRank: formData.isSeed && formData.seedRank ? Number(formData.seedRank) : null,
            paymentStatus: formData.paymentStatus,
            paymentMethod: formData.paymentMethod,
            paidAmount: Number(formData.paidAmount || 0),
            paymentNotes: formData.paymentNotes,
            player1: {
              name: formData.player1Name,
              nickname: formData.player1Nickname,
              phone: formData.player1Phone,
              instagram: formData.player1Instagram,
              shirtSize: formData.player1ShirtSize,
            },
            player2: {
              name: formData.player2Name,
              nickname: formData.player2Nickname,
              phone: formData.player2Phone,
              instagram: formData.player2Instagram,
              shirtSize: formData.player2ShirtSize,
            },
          };
        }
        return t;
      }));
    } else {
      const cat = categories.find(c => c.id === formData.categoryId) || selectedCategory;
      const newTeam = {
        id: `team-${Date.now()}`,
        categoryId: formData.categoryId,
        displayName,
        city: formData.city,
        isSeed: formData.isSeed,
        seedRank: formData.isSeed && formData.seedRank ? Number(formData.seedRank) : null,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        paidAmount: formData.paymentStatus === 'PAID_FULL' ? (Number(formData.paidAmount) || cat.entryFee) : Number(formData.paidAmount || 0),
        paymentNotes: formData.paymentNotes,
        createdAt: new Date().toISOString(),
        player1: {
          name: formData.player1Name,
          nickname: formData.player1Nickname,
          phone: formData.player1Phone,
          instagram: formData.player1Instagram,
          shirtSize: formData.player1ShirtSize,
        },
        player2: {
          name: formData.player2Name,
          nickname: formData.player2Nickname,
          phone: formData.player2Phone,
          instagram: formData.player2Instagram,
          shirtSize: formData.player2ShirtSize,
        },
      };
      setTeams([newTeam, ...teams]);
    }

    setIsAddModalOpen(false);
  };

  // Delete Team
  const handleDeleteTeam = (id, name) => {
    if (window.confirm(`Tem certeza que deseja excluir a dupla "${name}"?`)) {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  // Toggle quick payment status
  const handleQuickPaymentToggle = (team) => {
    const nextStatus = team.paymentStatus === 'PAID_FULL' ? 'PENDING' : 'PAID_FULL';
    const cat = categories.find(c => c.id === team.categoryId) || selectedCategory;
    const nextAmount = nextStatus === 'PAID_FULL' ? cat.entryFee : 0;

    setTeams(teams.map(t => t.id === team.id ? {
      ...t,
      paymentStatus: nextStatus,
      paidAmount: nextAmount,
      paymentDate: nextStatus === 'PAID_FULL' ? new Date().toISOString().slice(0, 10) : null,
    } : t));
  };

  // Filtered Teams
  const categoryTeams = teams.filter(t => t.categoryId === selectedCategoryId);
  const filteredTeams = categoryTeams.filter(team => {
    const matchesSearch = 
      team.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.player1?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.player2?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.player1?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.player2?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = paymentFilter === 'ALL' ? true : team.paymentStatus === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  return (
    <div className="space-y-6">
      {/* Category Banner & Summary */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div 
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: selectedCategory?.color || '#F59E0B' }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span 
                className="w-3.5 h-3.5 rounded-full ring-4 ring-amber-500/20"
                style={{ backgroundColor: selectedCategory?.color || '#F59E0B' }}
              />
              <h2 className="text-2xl font-bold font-display text-white">
                {selectedCategory?.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-amber-400 border border-slate-700">
                {categoryTeams.length} {categoryTeams.length === 1 ? 'dupla cadastrada' : 'duplas cadastradas'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Inscrição: <strong className="text-emerald-400">R$ {selectedCategory?.entryFee}</strong> • Regra: Set até <strong className="text-amber-300">{selectedCategory?.pointsToWin} pts</strong> (+2)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Cadastrar Dupla
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-800">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar atleta, apelido, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Payment Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setPaymentFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                paymentFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({categoryTeams.length})
            </button>
            <button
              onClick={() => setPaymentFilter('PAID_FULL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                paymentFilter === 'PAID_FULL'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              Pagos ({categoryTeams.filter(t => t.paymentStatus === 'PAID_FULL').length})
            </button>
            <button
              onClick={() => setPaymentFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                paymentFilter === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-amber-400/80 hover:text-amber-300'
              }`}
            >
              Pendentes ({categoryTeams.filter(t => t.paymentStatus === 'PENDING').length})
            </button>
          </div>
        </div>
      </div>

      {/* Duplas Cards Grid */}
      {filteredTeams.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Nenhuma dupla encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || paymentFilter !== 'ALL'
              ? 'Tente ajustar os termos da busca ou filtros selecionados.'
              : 'Clique em "Cadastrar Dupla" para adicionar atletas nesta categoria.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-amber transition-all"
          >
            <Plus className="w-4 h-4" /> Cadastrar 1ª Dupla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team, index) => {
            const cat = categories.find(c => c.id === team.categoryId) || selectedCategory;
            const entryFee = cat ? cat.entryFee : 140;
            const p1Pay = getAthletePayment(team, 1, entryFee);
            const p2Pay = getAthletePayment(team, 2, entryFee);
            const pStatus = PAYMENT_STATUS[team.paymentStatus] || PAYMENT_STATUS.PENDING;

            return (
              <div
                key={team.id}
                onClick={() => onGoToPayments && onGoToPayments(team.id, 1)}
                title="Clique para abrir o Controle Financeiro desta dupla"
                className="glass-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between border border-slate-800/80 hover:border-emerald-500/50 hover:shadow-glow-emerald transition-all duration-300 shadow-lg cursor-pointer transform hover:-translate-y-1"
              >
                {/* Seed Badge */}
                {team.isSeed && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[11px] font-black px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1 z-10">
                    <Sparkles className="w-3 h-3" />
                    Cabeça #{team.seedRank || 1}
                  </div>
                )}

                <div>
                  {/* Dupla Header */}
                  <div className="flex items-start justify-between gap-2 pr-16">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        DUPLA #{index + 1}
                      </span>
                      <h3 className="font-extrabold text-lg text-white font-display leading-tight group-hover:text-amber-400 transition-colors flex items-center gap-2">
                        {team.displayName}
                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
                      </h3>
                      {team.city && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-500/80" /> {team.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Athletes Details with Individual Payment Badges */}
                  <div className="mt-4 space-y-2.5">
                    {/* Athlete 1 */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onGoToPayments) onGoToPayments(team.id, 1);
                      }}
                      title="Ir direto para o pagamento do Atleta 1"
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all flex items-center justify-between gap-2 cursor-pointer group/athlete"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            1
                          </span>
                          <p className="text-xs font-bold text-slate-200 group-hover/athlete:text-amber-300 transition-colors truncate">
                            {team.player1?.name}
                            {team.player1?.nickname && (
                              <span className="text-amber-400 ml-1 font-normal">"{team.player1?.nickname}"</span>
                            )}
                          </p>

                          {/* Athlete 1 Payment Indicator Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                            p1Pay.status === 'PAID_FULL' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : p1Pay.status === 'PAID_HALF'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : p1Pay.status === 'EXEMPT'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {p1Pay.status === 'PAID_FULL' ? (
                              <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pago (R$ {p1Pay.amount})</>
                            ) : p1Pay.status === 'PAID_HALF' ? (
                              <><Clock className="w-3 h-3 text-cyan-400" /> 50% (R$ {p1Pay.amount})</>
                            ) : p1Pay.status === 'EXEMPT' ? (
                              <span>Isento</span>
                            ) : (
                              <><Clock className="w-3 h-3 text-amber-400" /> Pendente</>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          {team.player1?.instagram && (
                            <span className="text-pink-400 flex items-center gap-0.5">
                              <AtSign className="w-2.5 h-2.5" />
                              {team.player1?.instagram}
                            </span>
                          )}
                          {team.player1?.shirtSize && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Shirt className="w-2.5 h-2.5 text-slate-500" /> Camisa {team.player1?.shirtSize}
                            </span>
                          )}
                        </div>
                      </div>

                      {team.player1?.phone && (
                        <a
                          href={`https://wa.me/55${team.player1?.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(team.player1?.name)}!%20Informa%C3%A7%C3%B5es%20sobre%20sua%20inscri%C3%A7%C3%A3o%20no%20torneio%20de%20Futv%C3%B4lei.`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Conversar no WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex-shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Athlete 2 */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onGoToPayments) onGoToPayments(team.id, 2);
                      }}
                      title="Ir direto para o pagamento do Atleta 2"
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all flex items-center justify-between gap-2 cursor-pointer group/athlete"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-5 h-5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            2
                          </span>
                          <p className="text-xs font-bold text-slate-200 group-hover/athlete:text-cyan-300 transition-colors truncate">
                            {team.player2?.name}
                            {team.player2?.nickname && (
                              <span className="text-amber-400 ml-1 font-normal">"{team.player2?.nickname}"</span>
                            )}
                          </p>

                          {/* Athlete 2 Payment Indicator Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                            p2Pay.status === 'PAID_FULL' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : p2Pay.status === 'PAID_HALF'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : p2Pay.status === 'EXEMPT'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {p2Pay.status === 'PAID_FULL' ? (
                              <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pago (R$ {p2Pay.amount})</>
                            ) : p2Pay.status === 'PAID_HALF' ? (
                              <><Clock className="w-3 h-3 text-cyan-400" /> 50% (R$ {p2Pay.amount})</>
                            ) : p2Pay.status === 'EXEMPT' ? (
                              <span>Isento</span>
                            ) : (
                              <><Clock className="w-3 h-3 text-amber-400" /> Pendente</>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          {team.player2?.instagram && (
                            <span className="text-pink-400 flex items-center gap-0.5">
                              <AtSign className="w-2.5 h-2.5" />
                              {team.player2?.instagram}
                            </span>
                          )}
                          {team.player2?.shirtSize && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Shirt className="w-2.5 h-2.5 text-slate-500" /> Camisa {team.player2?.shirtSize}
                            </span>
                          )}
                        </div>
                      </div>

                      {team.player2?.phone && (
                        <a
                          href={`https://wa.me/55${team.player2?.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(team.player2?.name)}!%20Informa%C3%A7%C3%B5es%20sobre%20sua%20inscri%C3%A7%C3%A3o%20no%20torneio%20de%20Futv%C3%B4lei.`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Conversar no WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex-shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Payment Toggle */}
                <div 
                  className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onGoToPayments && onGoToPayments(team.id, 1)}
                    title="Ir para o Controle Financeiro desta dupla"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all bg-slate-900 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 active:scale-95"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Financeiro</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSharePreviewTeam(team)}
                      title="Gerar Card Social da Dupla"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(team)}
                      title="Editar Dupla"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.displayName)}
                      title="Excluir Dupla"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create & Edit Team */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                {editingTeam ? 'Editar Dupla' : 'Cadastrar Nova Dupla'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              {/* Category selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (R$ {c.entryFee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Atleta 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Atleta 1 (Jogador 1)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lucas Gabriel da Silva"
                      value={formData.player1Name}
                      onChange={(e) => setFormData({ ...formData, player1Name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Apelido no Futvôlei</label>
                    <input
                      type="text"
                      placeholder="Ex: Canhotinha"
                      value={formData.player1Nickname}
                      onChange={(e) => setFormData({ ...formData, player1Nickname: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-0.5">WhatsApp / Fone</label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={formData.player1Phone}
                      onChange={(e) => setFormData({ ...formData, player1Phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-0.5">Instagram</label>
                    <input
                      type="text"
                      placeholder="@atleta"
                      value={formData.player1Instagram}
                      onChange={(e) => setFormData({ ...formData, player1Instagram: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Camisa</label>
                    <select
                      value={formData.player1ShirtSize}
                      onChange={(e) => setFormData({ ...formData, player1ShirtSize: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Atleta 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Atleta 2 (Jogador 2)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gabriel Santos Ribeiro"
                      value={formData.player2Name}
                      onChange={(e) => setFormData({ ...formData, player2Name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Apelido no Futvôlei</label>
                    <input
                      type="text"
                      placeholder="Ex: Biel"
                      value={formData.player2Nickname}
                      onChange={(e) => setFormData({ ...formData, player2Nickname: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">WhatsApp / Fone</label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4322"
                      value={formData.player2Phone}
                      onChange={(e) => setFormData({ ...formData, player2Phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Instagram</label>
                    <input
                      type="text"
                      placeholder="@atleta2"
                      value={formData.player2Instagram}
                      onChange={(e) => setFormData({ ...formData, player2Instagram: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Camisa</label>
                    <select
                      value={formData.player2ShirtSize}
                      onChange={(e) => setFormData({ ...formData, player2ShirtSize: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Extras & Seed & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade / Clube</label>
                  <input
                    type="text"
                    placeholder="Ex: Santos - SP"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Pagamento</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="PAID_FULL">Pago (100%)</option>
                    <option value="PAID_HALF">Pago (50%)</option>
                    <option value="EXEMPT">Isento / Cortesia</option>
                  </select>
                </div>
              </div>

              {/* Seed toggle */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isSeed}
                      onChange={(e) => setFormData({ ...formData, isSeed: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    Cabeça de Chave (Seed)?
                  </label>
                  <p className="text-[10px] text-slate-400">Mantém a dupla distribuída nos extremos da chave no sorteio.</p>
                </div>

                {formData.isSeed && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Posição:</span>
                    <input
                      type="number"
                      min="1"
                      max="16"
                      placeholder="#1"
                      value={formData.seedRank}
                      onChange={(e) => setFormData({ ...formData, seedRank: e.target.value })}
                      className="w-16 px-2 py-1 rounded bg-slate-900 border border-amber-500/50 text-xs text-amber-400 font-bold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-glow-amber transition-all"
                >
                  {editingTeam ? 'Salvar Dupla' : 'Confirmar Inscrição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Card Preview Modal */}
      {sharePreviewTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-gradient-to-b from-slate-900 via-[#0E1524] to-slate-950 border border-amber-500/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setSharePreviewTeam(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto shadow-glow-amber text-slate-950 font-black text-xl">
              DB
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                {eventInfo?.name || 'Torneio Oficial de Futvôlei'}
              </span>
              <h3 className="text-2xl font-black text-white font-display mt-1">
                {sharePreviewTeam.displayName}
              </h3>
              <p className="text-xs text-slate-400">
                {sharePreviewTeam.city || 'Confirmada no Torneio'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Atleta 1:</span>
                <span className="font-bold text-white">{sharePreviewTeam.player1?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Atleta 2:</span>
                <span className="font-bold text-white">{sharePreviewTeam.player2?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Categoria:</span>
                <span className="font-bold text-amber-400">{selectedCategory?.name}</span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400 font-semibold">
              ✓ Inscrição Oficial Confirmada na Eliminatória Dupla
            </p>

            <button
              onClick={() => {
                alert('Card pronto para print / compartilhamento nas redes sociais!');
                setSharePreviewTeam(null);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-glow-amber hover:bg-amber-400"
            >
              Fechar Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
