import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Copy, 
  Check, 
  Edit2, 
  AlertCircle,
  MessageCircle,
  Receipt,
  Search,
  Plus,
  Trash2,
  Award,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { PAYMENT_STATUS, PAYMENT_METHODS, getAthletePayment } from '../types/tournament';

export default function PaymentControl({ 
  teams = [], 
  setTeams, 
  categories = [], 
  eventInfo = {}, 
  setEventInfo,
  targetPaymentAthlete,
  isReadOnly = false 
}) {
  // Navigation sub-menu within Financeiro
  const [activeSubTab, setActiveSubTab] = useState('registrations'); // 'registrations' | 'expenses' | 'sponsors' | 'balance'

  // Filter & Search states for Registrations
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);

  // Modal states for Expenses and Sponsors
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'Arbitragem',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'PAID', // 'PAID' | 'PENDING'
    notes: '',
  });

  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    tier: 'Cota Ouro',
    amount: '',
    contact: '',
    status: 'RECEIVED', // 'RECEIVED' | 'PENDING'
    notes: '',
  });

  const expensesList = Array.isArray(eventInfo?.expenses) ? eventInfo.expenses : [];
  const sponsorsList = Array.isArray(eventInfo?.sponsors) ? eventInfo.sponsors : [];

  // Auto-scroll and focus specific athlete row when navigated from Duplas
  useEffect(() => {
    if (targetPaymentAthlete?.teamId) {
      setActiveSubTab('registrations');
      const targetTeam = teams.find(t => t.id === targetPaymentAthlete.teamId);
      if (targetTeam && selectedCategoryFilter !== 'ALL' && selectedCategoryFilter !== targetTeam.categoryId) {
        setSelectedCategoryFilter('ALL');
      }
      setSelectedStatusFilter('ALL');
      setSearchTerm('');

      setTimeout(() => {
        const elementId = `athlete-row-${targetPaymentAthlete.teamId}-${targetPaymentAthlete.playerNum || 1}`;
        const targetElement = document.getElementById(elementId) || document.getElementById(`team-header-${targetPaymentAthlete.teamId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
    }
  }, [targetPaymentAthlete, teams]);

  // ==========================================
  // FINANCIAL CALCULATIONS & METRICS (WITH EXEMPT CONTROLS)
  // ==========================================

  // Inscrições (Inflow 1)
  const totalGrossExpectedRegistrations = teams.reduce((sum, t) => {
    const cat = categories.find(c => c.id === t.categoryId);
    return sum + (cat ? cat.entryFee : 140);
  }, 0);

  let totalCollectedRegistrations = 0;
  let totalAthletesCount = 0;
  let totalPaidAthletes = 0;
  let totalExemptAthletes = 0;
  let totalExemptValue = 0;

  teams.forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    const fee = cat ? cat.entryFee : 140;
    const p1 = getAthletePayment(t, 1, fee);
    const p2 = getAthletePayment(t, 2, fee);

    totalCollectedRegistrations += (Number(p1.amount) || 0) + (Number(p2.amount) || 0);
    totalAthletesCount += 2;
    if (p1.status === 'PAID_FULL') totalPaidAthletes++;
    if (p2.status === 'PAID_FULL') totalPaidAthletes++;
    if (p1.status === 'EXEMPT') {
      totalExemptAthletes++;
      totalExemptValue += p1.fee;
    }
    if (p2.status === 'EXEMPT') {
      totalExemptAthletes++;
      totalExemptValue += p2.fee;
    }
  });

  const totalPendingAthletes = Math.max(0, totalAthletesCount - totalPaidAthletes - totalExemptAthletes);
  // Net Expected = Gross Expected minus granted exemptions (cortesias)
  const netExpectedRegistrations = Math.max(0, totalGrossExpectedRegistrations - totalExemptValue);
  const totalPendingRegistrations = Math.max(0, netExpectedRegistrations - totalCollectedRegistrations);

  // Patrocínios (Inflow 2)
  const totalSponsorsExpected = sponsorsList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalSponsorsReceived = sponsorsList
    .filter(s => s.status === 'RECEIVED')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalSponsorsPending = totalSponsorsExpected - totalSponsorsReceived;

  // Despesas (Outflow)
  const totalExpensesAmount = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpensesPaid = expensesList
    .filter(e => e.status === 'PAID')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpensesPending = totalExpensesAmount - totalExpensesPaid;

  // Balanço Consolidado
  const totalInflowRealized = totalCollectedRegistrations + totalSponsorsReceived;
  const totalInflowProjected = netExpectedRegistrations + totalSponsorsExpected;
  const currentCashBalance = totalInflowRealized - totalExpensesPaid;
  const projectedNetProfit = totalInflowProjected - totalExpensesAmount;

  // ==========================================
  // TEAMS & ATHLETES MANAGEMENT
  // ==========================================
  const relevantTeams = teams.filter(team => {
    const cat = categories.find(c => c.id === team.categoryId);
    const fee = cat ? cat.entryFee : 140;
    const p1 = getAthletePayment(team, 1, fee);
    const p2 = getAthletePayment(team, 2, fee);

    const matchCat = selectedCategoryFilter === 'ALL' || team.categoryId === selectedCategoryFilter;
    const matchStatus = selectedStatusFilter === 'ALL' 
      ? true 
      : p1.status === selectedStatusFilter || p2.status === selectedStatusFilter;

    const term = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      team.displayName?.toLowerCase().includes(term) ||
      team.player1?.name?.toLowerCase().includes(term) ||
      team.player2?.name?.toLowerCase().includes(term) ||
      team.player1?.nickname?.toLowerCase().includes(term) ||
      team.player2?.nickname?.toLowerCase().includes(term);

    return matchCat && matchStatus && matchSearch;
  });

  const handleCopyPix = () => {
    if (eventInfo?.pixKey) {
      navigator.clipboard.writeText(eventInfo.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  const updateAthletePayment = (teamId, playerNum, updates) => {
    setTeams(teams.map(t => {
      if (t.id !== teamId) return t;

      const cat = categories.find(c => c.id === t.categoryId);
      const entryFee = cat ? cat.entryFee : 140;

      const currentP1 = getAthletePayment(t, 1, entryFee);
      const currentP2 = getAthletePayment(t, 2, entryFee);

      const updatedP1 = playerNum === 1 ? { ...currentP1, ...updates } : currentP1;
      const updatedP2 = playerNum === 2 ? { ...currentP2, ...updates } : currentP2;

      const newTotalPaid = Number(updatedP1.amount || 0) + Number(updatedP2.amount || 0);

      // Only 3 allowed statuses: PAID_FULL, EXEMPT, or PENDING
      let newTeamStatus = 'PENDING';
      if (updatedP1.status === 'PAID_FULL' && updatedP2.status === 'PAID_FULL') {
        newTeamStatus = 'PAID_FULL';
      } else if (updatedP1.status === 'EXEMPT' && updatedP2.status === 'EXEMPT') {
        newTeamStatus = 'EXEMPT';
      } else if (
        (updatedP1.status === 'PAID_FULL' && updatedP2.status === 'EXEMPT') ||
        (updatedP1.status === 'EXEMPT' && updatedP2.status === 'PAID_FULL')
      ) {
        newTeamStatus = 'PAID_FULL';
      } else {
        newTeamStatus = 'PENDING';
      }

      return {
        ...t,
        player1: {
          ...t.player1,
          payment: updatedP1,
        },
        player2: {
          ...t.player2,
          payment: updatedP2,
        },
        paymentStatus: newTeamStatus,
        paidAmount: newTotalPaid,
        paymentDate: updates.date || t.paymentDate,
      };
    }));
  };

  const handleAthleteStatusChange = (teamId, playerNum, newStatus, entryFee) => {
    const athleteFee = Math.round((entryFee || 140) / 2);
    let amount = 0;
    if (newStatus === 'PAID_FULL') amount = athleteFee;
    else if (newStatus === 'EXEMPT') amount = 0;
    else if (newStatus === 'PENDING') amount = 0;

    updateAthletePayment(teamId, playerNum, {
      status: newStatus,
      amount,
      date: newStatus === 'PAID_FULL' ? new Date().toISOString().slice(0, 10) : null,
    });
  };

  const sendWhatsAppAthleteBilling = (team, playerNum) => {
    if (isReadOnly) {
      alert('Modo apenas visualização: faça login para enviar mensagens.');
      return;
    }

    const cat = categories.find(c => c.id === team.categoryId);
    const entryFee = cat ? cat.entryFee : 140;
    const athlete = playerNum === 1 ? team.player1 : team.player2;
    const athletePayment = getAthletePayment(team, playerNum, entryFee);

    if (athletePayment.status === 'EXEMPT') {
      alert(`O atleta ${athlete?.name || 'atleta'} está com status ISENTO. Não há cobrança a ser realizada.`);
      return;
    }

    const pendingAmount = Math.max(0, athletePayment.fee - athletePayment.amount);
    const phone = athlete?.phone;

    if (!phone) {
      alert(`Nenhum telefone/WhatsApp cadastrado para o atleta ${athlete?.name || 'atleta'}.`);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Fala ${athlete?.name || 'Craque'}! 🏐\n\nPassando para confirmar a sua parte na inscrição da dupla *${team.displayName}* na categoria *${cat?.name || 'Futvôlei'}* do *${eventInfo?.name || 'Torneio'}*.\n\n💰 *Sua cota de inscrição:* R$ ${athletePayment.fee},00${pendingAmount < athletePayment.fee ? ` (R$ ${athletePayment.amount},00 já pago • Restante: R$ ${pendingAmount},00)` : ''}\n🔑 *Chave PIX:* ${eventInfo?.pixKey || 'Não cadastrada'} (${eventInfo?.pixReceiverName || 'Organização'})\n\nPor favor, envie o comprovante por aqui para confirmarmos a sua participação na chave de disputa! 🔥`;

    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendWhatsAppAthleteReceipt = (team, playerNum) => {
    if (isReadOnly) {
      alert('Modo apenas visualização: faça login para enviar comprovantes.');
      return;
    }

    const cat = categories.find(c => c.id === team.categoryId);
    const entryFee = cat ? cat.entryFee : 140;
    const athlete = playerNum === 1 ? team.player1 : team.player2;
    const athletePayment = getAthletePayment(team, playerNum, entryFee);
    const phone = athlete?.phone;

    if (!phone) {
      alert(`Nenhum telefone/WhatsApp cadastrado para o atleta ${athlete?.name || 'atleta'}.`);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const message = `✅ *PAGAMENTO CONFIRMADO!* 🏐\n\nFala ${athlete?.name || 'Craque'}! Confirmamos o recebimento de R$ ${athletePayment.amount},00 referente à sua inscrição na dupla *${team.displayName}*!\n\n📋 *Categoria:* ${cat?.name}\n🏆 *Formato:* Eliminatória Dupla Oficial\n📍 *Local:* ${eventInfo?.location || 'Arena'}\n📅 *Data:* ${eventInfo?.date || 'A definir'}\n\nTudo certo com a sua vaga! Boa sorte e nos vemos na arena! 🔥`;

    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ==========================================
  // EXPENSES CRUD
  // ==========================================
  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      description: '',
      category: 'Arbitragem',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'PAID',
      notes: '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      category: expense.category || 'Outros',
      amount: expense.amount,
      date: expense.date || new Date().toISOString().slice(0, 10),
      status: expense.status || 'PAID',
      notes: expense.notes || '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount) {
      alert('Preencha a descrição e o valor da despesa.');
      return;
    }

    const amountNum = Math.abs(Number(expenseForm.amount) || 0);

    let updatedExpenses;
    if (editingExpense) {
      updatedExpenses = expensesList.map(item => 
        item.id === editingExpense.id 
          ? { ...item, ...expenseForm, amount: amountNum }
          : item
      );
    } else {
      const newExpense = {
        id: `exp-${Date.now()}`,
        ...expenseForm,
        amount: amountNum,
        createdAt: new Date().toISOString(),
      };
      updatedExpenses = [newExpense, ...expensesList];
    }

    setEventInfo({
      ...eventInfo,
      expenses: updatedExpenses,
    });
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Excluir este registro de despesa?')) {
      const updated = expensesList.filter(item => item.id !== id);
      setEventInfo({
        ...eventInfo,
        expenses: updated,
      });
    }
  };

  const handleToggleExpenseStatus = (expense) => {
    const nextStatus = expense.status === 'PAID' ? 'PENDING' : 'PAID';
    const updated = expensesList.map(item =>
      item.id === expense.id ? { ...item, status: nextStatus } : item
    );
    setEventInfo({
      ...eventInfo,
      expenses: updated,
    });
  };

  // ==========================================
  // SPONSORS CRUD
  // ==========================================
  const handleOpenNewSponsor = () => {
    setEditingSponsor(null);
    setSponsorForm({
      name: '',
      tier: 'Cota Ouro',
      amount: '',
      contact: '',
      status: 'RECEIVED',
      notes: '',
    });
    setIsSponsorModalOpen(true);
  };

  const handleOpenEditSponsor = (sponsor) => {
    setEditingSponsor(sponsor);
    setSponsorForm({
      name: sponsor.name,
      tier: sponsor.tier || 'Apoio',
      amount: sponsor.amount,
      contact: sponsor.contact || '',
      status: sponsor.status || 'RECEIVED',
      notes: sponsor.notes || '',
    });
    setIsSponsorModalOpen(true);
  };

  const handleSaveSponsor = (e) => {
    e.preventDefault();
    if (!sponsorForm.name.trim() || !sponsorForm.amount) {
      alert('Preencha o nome do patrocinador e o valor da cota.');
      return;
    }

    const amountNum = Math.abs(Number(sponsorForm.amount) || 0);

    let updatedSponsors;
    if (editingSponsor) {
      updatedSponsors = sponsorsList.map(item =>
        item.id === editingSponsor.id
          ? { ...item, ...sponsorForm, amount: amountNum }
          : item
      );
    } else {
      const newSponsor = {
        id: `spon-${Date.now()}`,
        ...sponsorForm,
        amount: amountNum,
        createdAt: new Date().toISOString(),
      };
      updatedSponsors = [newSponsor, ...sponsorsList];
    }

    setEventInfo({
      ...eventInfo,
      sponsors: updatedSponsors,
    });
    setIsSponsorModalOpen(false);
  };

  const handleDeleteSponsor = (id) => {
    if (window.confirm('Excluir este patrocinador?')) {
      const updated = sponsorsList.filter(item => item.id !== id);
      setEventInfo({
        ...eventInfo,
        sponsors: updated,
      });
    }
  };

  const handleToggleSponsorStatus = (sponsor) => {
    const nextStatus = sponsor.status === 'RECEIVED' ? 'PENDING' : 'RECEIVED';
    const updated = sponsorsList.map(item =>
      item.id === sponsor.id ? { ...item, status: nextStatus } : item
    );
    setEventInfo({
      ...eventInfo,
      sponsors: updated,
    });
  };

  return (
    <div className="space-y-6">

      {/* Top 4 Global Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Inscrições Arrecadadas */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Inscrições Arrecadadas</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-2">
            R$ {totalCollectedRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalPaidAthletes} pagos • <strong className="text-purple-300 font-semibold">{totalExemptAthletes} isentos</strong></span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalPendingRegistrations > 0 
              ? `R$ ${totalPendingRegistrations.toLocaleString('pt-BR')} a receber (${totalPendingAthletes} pendentes)` 
              : '100% dos pagantes quitados'}
          </p>
        </div>

        {/* Patrocínios & Parcerias */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Patrocínios Recebidos</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-display mt-2">
            R$ {totalSponsorsReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {sponsorsList.length} marcas parceiras • <span className="text-slate-200">R$ {totalSponsorsPending.toLocaleString('pt-BR')} pendentes</span>
          </p>
        </div>

        {/* Despesas Pagas */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Despesas do Torneio</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-display mt-2">
            R$ {totalExpensesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {expensesList.length} lançamentos • <span className="text-slate-200">R$ {totalExpensesPending.toLocaleString('pt-BR')} a pagar</span>
          </p>
        </div>

        {/* Saldo Líquido do Torneio */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">Saldo em Caixa Atual</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-extrabold font-display mt-2 ${currentCashBalance >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            R$ {currentCashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Lucro final previsto: <strong className={projectedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>R$ {projectedNetProfit.toLocaleString('pt-BR')}</strong>
          </p>
        </div>

      </div>

      {/* Internal Menu / Sub-tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('registrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'registrations'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Inscrições & Atletas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
              {teams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'expenses'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>Despesas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
              {expensesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('sponsors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'sponsors'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Patrocínios</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
              {sponsorsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('balance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'balance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Balanço Geral</span>
          </button>
        </div>

        {/* Quick Context Actions based on active subtab */}
        {activeSubTab === 'expenses' && !isReadOnly && (
          <button
            onClick={handleOpenNewExpense}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        )}

        {activeSubTab === 'sponsors' && !isReadOnly && (
          <button
            onClick={handleOpenNewSponsor}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Patrocínio
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* SUB-TAB 1: INSCRIÇÕES & ATLETAS */}
      {/* ============================================================ */}
      {activeSubTab === 'registrations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* PIX Quick Box */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Chave PIX Oficial</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {eventInfo?.pixKeyType || 'E-mail'}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-mono font-bold text-white mt-0.5">
                  {eventInfo?.pixKey || 'Nenhuma chave cadastrada'}
                </p>
                <p className="text-xs text-slate-400">
                  Titular: <strong className="text-slate-300">{eventInfo?.pixReceiverName || 'Organizador'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleCopyPix}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
              >
                {copiedPix ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedPix ? 'Copiado!' : 'Copiar PIX'}
              </button>
              <button
                onClick={() => setIsPixModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Edit2 className="w-4 h-4" />
                Configurar PIX
              </button>
            </div>
          </div>

          {/* Audit Bar: Breakdown of Inscrições (Pagos, Isentos, Pendentes, Meta Efetiva) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-400 font-semibold block">Quitados ({totalPaidAthletes} atletas)</span>
              <p className="text-base font-mono font-bold text-white mt-0.5">
                R$ {totalCollectedRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-purple-300 font-semibold">Isentos / Cortesias</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  {totalExemptAthletes} atletas
                </span>
              </div>
              <p className="text-base font-mono font-bold text-purple-300 mt-0.5">
                R$ {totalExemptValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-[11px] text-amber-400 font-semibold block">Pendente Real ({totalPendingAthletes} atletas)</span>
              <p className="text-base font-mono font-bold text-amber-300 mt-0.5">
                R$ {totalPendingRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
              <span className="text-[11px] text-slate-400 font-semibold block">Meta Líquida Esperada</span>
              <p className="text-base font-mono font-bold text-slate-200 mt-0.5">
                R$ {netExpectedRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-white font-display flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Controle de Inscrições por Atleta
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie o status de cada atleta: apenas <strong>Pago</strong>, <strong>Isento</strong> ou <strong>Pendente</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {/* Search input */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar dupla ou atleta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">Todas Categorias</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {/* Status filter: ONLY Pago, Isento, Pendente */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">Todos Status</option>
                  <option value="PAID_FULL">Pago</option>
                  <option value="EXEMPT">Isento</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 w-1/4">Atleta / Dupla</th>
                    <th className="py-3.5 px-3">Categoria</th>
                    <th className="py-3.5 px-3">Cota Individual</th>
                    <th className="py-3.5 px-3">Pago (R$)</th>
                    <th className="py-3.5 px-3">Forma</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-right">Comprovante / WhatsApp</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {relevantTeams.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        Nenhuma dupla ou inscrição encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    relevantTeams.map((team) => {
                      const cat = categories.find(c => c.id === team.categoryId);
                      const entryFee = cat ? cat.entryFee : 140;
                      const p1Payment = getAthletePayment(team, 1, entryFee);
                      const p2Payment = getAthletePayment(team, 2, entryFee);

                      return (
                        <React.Fragment key={team.id}>
                          {/* Dupla Header Row */}
                          <tr id={`team-header-${team.id}`} className="bg-slate-900/50 font-bold border-t border-slate-800">
                            <td colSpan="7" className="py-2.5 px-4 text-slate-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || '#F59E0B' }} />
                                  <span className="text-white text-xs sm:text-sm font-display">{team.displayName}</span>
                                  <span className="text-[11px] font-normal text-slate-400">({team.city || 'Sem cidade'})</span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-400">
                                  Inscrição da Dupla: <strong className="text-emerald-400">R$ {entryFee}</strong> • Total Pago: <strong className="text-amber-400">R$ {(Number(p1Payment.amount) || 0) + (Number(p2Payment.amount) || 0)}</strong>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Player 1 Row */}
                          <tr id={`athlete-row-${team.id}-1`} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5 pl-3">
                                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-[11px] text-amber-400">
                                  #1
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200">{team.player1?.name || 'Jogador 1'}</p>
                                  <p className="text-[11px] text-slate-500">{team.player1?.phone || 'Sem fone'}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-slate-400">{cat?.name || 'Futvôlei'}</td>
                            <td className="py-3 px-3 font-semibold text-slate-300">R$ {p1Payment.fee}</td>

                            <td className="py-3 px-3">
                              <input
                                type="number"
                                disabled={isReadOnly}
                                value={p1Payment.amount}
                                onChange={(e) => updateAthletePayment(team.id, 1, { amount: Number(e.target.value) })}
                                className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <select
                                disabled={isReadOnly}
                                value={p1Payment.method}
                                onChange={(e) => updateAthletePayment(team.id, 1, { method: e.target.value })}
                                className="bg-slate-950 border border-slate-700 text-[11px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {Object.values(PAYMENT_METHODS).map(m => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                              </select>
                            </td>

                            {/* Status: ONLY Pago, Isento, Pendente */}
                            <td className="py-3 px-3">
                              <select
                                disabled={isReadOnly}
                                value={p1Payment.status}
                                onChange={(e) => handleAthleteStatusChange(team.id, 1, e.target.value, entryFee)}
                                className={`font-semibold rounded-lg px-2.5 py-1 text-[11px] border focus:outline-none bg-slate-950 disabled:opacity-60 disabled:cursor-not-allowed ${
                                  PAYMENT_STATUS[p1Payment.status]?.color || PAYMENT_STATUS.PENDING.color
                                }`}
                              >
                                <option value="PENDING">Pendente</option>
                                <option value="PAID_FULL">Pago</option>
                                <option value="EXEMPT">Isento</option>
                              </select>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {p1Payment.status === 'EXEMPT' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                    Isento (Não Cobrar)
                                  </span>
                                ) : p1Payment.status === 'PAID_FULL' ? (
                                  <button
                                    onClick={() => sendWhatsAppAthleteReceipt(team, 1)}
                                    disabled={isReadOnly}
                                    title={isReadOnly ? 'Apenas visualização: faça login para interagir' : `Enviar comprovante para ${team.player1?.name || 'Jogador 1'} no WhatsApp`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    Recibo
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => sendWhatsAppAthleteBilling(team, 1)}
                                    disabled={isReadOnly}
                                    title={isReadOnly ? 'Apenas visualização: faça login para interagir' : `Cobrar ${team.player1?.name || 'Jogador 1'} via WhatsApp`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <MessageCircle className="w-3 h-3 text-amber-400" />
                                    Cobrar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Player 2 Row */}
                          <tr id={`athlete-row-${team.id}-2`} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5 pl-3">
                                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-[11px] text-amber-400">
                                  #2
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200">{team.player2?.name || 'Jogador 2'}</p>
                                  <p className="text-[11px] text-slate-500">{team.player2?.phone || 'Sem fone'}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-slate-400">{cat?.name || 'Futvôlei'}</td>
                            <td className="py-3 px-3 font-semibold text-slate-300">R$ {p2Payment.fee}</td>

                            <td className="py-3 px-3">
                              <input
                                type="number"
                                disabled={isReadOnly}
                                value={p2Payment.amount}
                                onChange={(e) => updateAthletePayment(team.id, 2, { amount: Number(e.target.value) })}
                                className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <select
                                disabled={isReadOnly}
                                value={p2Payment.method}
                                onChange={(e) => updateAthletePayment(team.id, 2, { method: e.target.value })}
                                className="bg-slate-950 border border-slate-700 text-[11px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {Object.values(PAYMENT_METHODS).map(m => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                              </select>
                            </td>

                            {/* Status: ONLY Pago, Isento, Pendente */}
                            <td className="py-3 px-3">
                              <select
                                disabled={isReadOnly}
                                value={p2Payment.status}
                                onChange={(e) => handleAthleteStatusChange(team.id, 2, e.target.value, entryFee)}
                                className={`font-semibold rounded-lg px-2.5 py-1 text-[11px] border focus:outline-none bg-slate-950 disabled:opacity-60 disabled:cursor-not-allowed ${
                                  PAYMENT_STATUS[p2Payment.status]?.color || PAYMENT_STATUS.PENDING.color
                                }`}
                              >
                                <option value="PENDING">Pendente</option>
                                <option value="PAID_FULL">Pago</option>
                                <option value="EXEMPT">Isento</option>
                              </select>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {p2Payment.status === 'EXEMPT' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                    Isento (Não Cobrar)
                                  </span>
                                ) : p2Payment.status === 'PAID_FULL' ? (
                                  <button
                                    onClick={() => sendWhatsAppAthleteReceipt(team, 2)}
                                    disabled={isReadOnly}
                                    title={isReadOnly ? 'Apenas visualização: faça login para interagir' : `Enviar comprovante para ${team.player2?.name || 'Jogador 2'} no WhatsApp`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    Recibo
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => sendWhatsAppAthleteBilling(team, 2)}
                                    disabled={isReadOnly}
                                    title={isReadOnly ? 'Apenas visualização: faça login para interagir' : `Cobrar ${team.player2?.name || 'Jogador 2'} via WhatsApp`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <MessageCircle className="w-3 h-3 text-amber-400" />
                                    Cobrar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 2: DESPESAS DO TORNEIO */}
      {/* ============================================================ */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Total de Despesas Cadastradas</span>
              <p className="text-xl font-bold text-white mt-1">
                R$ {totalExpensesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-semibold">Despesas Já Pagas</span>
              <p className="text-xl font-bold text-emerald-300 mt-1">
                R$ {totalExpensesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-rose-500/30">
              <span className="text-xs text-rose-400 font-semibold">Despesas a Pagar (Pendentes)</span>
              <p className="text-xl font-bold text-rose-300 mt-1">
                R$ {totalExpensesPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white font-display flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-400" />
                  Gestão de Despesas do Torneio
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lance os custos de arbitragem, troféus, quadras, som, brindes e infraestrutura.
                </p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={handleOpenNewExpense}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Nova Despesa
                </button>
              )}
            </div>

            {expensesList.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">Nenhuma despesa cadastrada ainda.</p>
                {!isReadOnly && (
                  <button
                    onClick={handleOpenNewExpense}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                  >
                    Cadastrar 1ª Despesa
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Valor (R$)</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Obs.</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {expensesList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{item.description}</td>
                        <td className="py-3 px-3 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{item.date || '-'}</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-300">
                          R$ {Number(item.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => !isReadOnly && handleToggleExpenseStatus(item)}
                            disabled={isReadOnly}
                            title={isReadOnly ? 'Apenas visualização' : 'Clique para alternar o status'}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                              item.status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {item.status === 'PAID' ? '✓ Paga' : '⏳ Pendente'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{item.notes || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          {!isReadOnly ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditExpense(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Editar Despesa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(item.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Excluir Despesa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 3: PATROCÍNIOS & PARCERIAS */}
      {/* ============================================================ */}
      {activeSubTab === 'sponsors' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Total de Patrocínio Negociado</span>
              <p className="text-xl font-bold text-white mt-1">
                R$ {totalSponsorsExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-semibold">Patrocínio Já Recebido</span>
              <p className="text-xl font-bold text-emerald-300 mt-1">
                R$ {totalSponsorsReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-amber-500/30">
              <span className="text-xs text-amber-400 font-semibold">A Receber (Pendente)</span>
              <p className="text-xl font-bold text-amber-300 mt-1">
                R$ {totalSponsorsPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Sponsors Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Patrocinadores e Cotas de Apoio
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cadastre marcas parceiras, valores de cotas e acompanhe os recebimentos.
                </p>
              </div>
              <button
                onClick={handleOpenNewSponsor}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Novo Patrocínio
              </button>
            </div>

            {sponsorsList.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Award className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">Nenhum patrocinador cadastrado ainda.</p>
                <button
                  onClick={handleOpenNewSponsor}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md"
                >
                  Cadastrar 1º Patrocinador
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Patrocinador / Marca</th>
                      <th className="py-3 px-3">Cota</th>
                      <th className="py-3 px-3">Contato / Telefone</th>
                      <th className="py-3 px-3">Valor Cota (R$)</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Obs.</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sponsorsList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-semibold text-amber-300">
                            {item.tier}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{item.contact || '-'}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-300">
                          R$ {Number(item.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => !isReadOnly && handleToggleSponsorStatus(item)}
                            disabled={isReadOnly}
                            title={isReadOnly ? 'Apenas visualização' : 'Clique para alternar o status'}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                              item.status === 'RECEIVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {item.status === 'RECEIVED' ? '✓ Recebido' : '⏳ A Receber'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{item.notes || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          {!isReadOnly ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditSponsor(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Editar Patrocínio"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSponsor(item.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Excluir Patrocínio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 4: BALANÇO GERAL & DRE DO EVENTO */}
      {/* ============================================================ */}
      {activeSubTab === 'balance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Receitas Breakdown */}
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Receitas do Torneio
                </h4>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Entradas
                </span>
              </div>

              <div className="space-y-3 text-sm">
                {/* Inscrições Brutas */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">Inscrições (Capacidade Bruta)</p>
                    <p className="text-xs text-slate-400">{totalAthletesCount} vagas totais no torneio</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-300">
                      R$ {totalGrossExpectedRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Dedução de Isenções / Cortesias */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <div>
                    <p className="font-semibold text-purple-200 flex items-center gap-1.5">
                      <span>(-) Isenções / Cortesias Concedidas</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {totalExemptAthletes} atletas
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">Atletas isentos de pagamento pela organização</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-purple-300">
                      - R$ {totalExemptValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-purple-400/80">cortesias</p>
                  </div>
                </div>

                {/* Arrecadação Líquida de Inscrições */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">Inscrições Arrecadadas (Caixa)</p>
                    <p className="text-xs text-slate-400">{totalPaidAthletes} atletas quitados • {totalPendingAthletes} a pagar</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-emerald-300">
                      R$ {totalCollectedRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-slate-500">Meta líquida: R$ {netExpectedRegistrations.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {/* Patrocínios */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">Patrocínios e Cotas</p>
                    <p className="text-xs text-slate-400">{sponsorsList.length} empresas parceiras</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-amber-300">
                      R$ {totalSponsorsReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-slate-500">de R$ {totalSponsorsExpected.toLocaleString('pt-BR')} previstos</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-bold text-base">
                  <span className="text-slate-200">Total de Receitas em Caixa:</span>
                  <span className="text-emerald-400 font-mono">
                    R$ {totalInflowRealized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Despesas Breakdown */}
            <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-400" />
                  Custos & Despesas
                </h4>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Saídas
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">Despesas Já Pagas</p>
                    <p className="text-xs text-slate-400">Custos já quitados da organização</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-rose-300">
                      R$ {totalExpensesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">Despesas Pendentes</p>
                    <p className="text-xs text-slate-400">Contas a pagar até o final do evento</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-amber-300">
                      R$ {totalExpensesPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-bold text-base">
                  <span className="text-slate-200">Total de Despesas do Evento:</span>
                  <span className="text-rose-400 font-mono">
                    R$ {totalExpensesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Resultado Final Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/40 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Resultado Financeiro Consolidado
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-white mt-2">
                  Saldo Líquido Atual: <span className={currentCashBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>R$ {currentCashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Lucro Final Projetado: <strong className="text-cyan-300">R$ {projectedNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> considerando 100% das receitas e custos previstos.
                </p>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-xs text-slate-400">Margem Estimada</span>
                <p className="text-2xl font-mono font-black text-cyan-400">
                  {totalInflowProjected > 0 ? Math.round((projectedNetProfit / totalInflowProjected) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Modal Configure PIX */}
      {isPixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              Configurar Chave PIX
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Chave</label>
                <select
                  value={eventInfo?.pixKeyType || 'E-mail'}
                  onChange={(e) => setEventInfo({ ...eventInfo, pixKeyType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
                >
                  <option value="E-mail">E-mail</option>
                  <option value="Telefone">Celular / Telefone</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="Chave Aleatória">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chave PIX *</label>
                <input
                  type="text"
                  placeholder="Ex: seu-pix@dominio.com ou 11987654321"
                  value={eventInfo?.pixKey || ''}
                  onChange={(e) => setEventInfo({ ...eventInfo, pixKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Titular da Conta</label>
                <input
                  type="text"
                  placeholder="Ex: Arena Sports LTDA"
                  value={eventInfo?.pixReceiverName || ''}
                  onChange={(e) => setEventInfo({ ...eventInfo, pixReceiverName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPixModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md transition-all active:scale-95"
              >
                Salvar Chave PIX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Despesa */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-400" />
              {editingExpense ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
            </h3>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição do Custo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 4 Árbitros Oficiais (Sábado e Domingo)"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="Arbitragem">Arbitragem</option>
                    <option value="Premiação / Troféus">Premiação / Troféus</option>
                    <option value="Estrutura & Quadras">Estrutura & Quadras</option>
                    <option value="Marketing / Mídia">Marketing / Mídia</option>
                    <option value="Alimentação / Água">Alimentação / Água</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={expenseForm.status}
                    onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="PAID">Paga (Quitada)</option>
                    <option value="PENDING">Pendente (A pagar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Pago via PIX ao coordenador de arbitragem"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Patrocínio */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              {editingSponsor ? 'Editar Patrocínio' : 'Cadastrar Patrocinador'}
            </h3>

            <form onSubmit={handleSaveSponsor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome da Marca / Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arena Beach Prime"
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cota / Tipo</label>
                  <select
                    value={sponsorForm.tier}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="Cota Master">Cota Master</option>
                    <option value="Cota Ouro">Cota Ouro</option>
                    <option value="Cota Prata">Cota Prata</option>
                    <option value="Cota Bronze">Cota Bronze</option>
                    <option value="Apoio / Permuta">Apoio / Permuta</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valor da Cota (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={sponsorForm.amount}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contato / Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={sponsorForm.contact}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, contact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={sponsorForm.status}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="RECEIVED">Recebido (Pago)</option>
                    <option value="PENDING">A Receber (Pendente)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Logo nas regatas e banner na quadra central"
                  value={sponsorForm.notes}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSponsorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95"
                >
                  Salvar Patrocínio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
