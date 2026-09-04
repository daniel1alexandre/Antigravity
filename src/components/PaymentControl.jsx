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
  Send, 
  Filter, 
  Download, 
  Edit2, 
  AlertCircle,
  MessageCircle,
  PiggyBank,
  Receipt,
  User,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PAYMENT_STATUS, PAYMENT_METHODS, getAthletePayment } from '../types/tournament';

export default function PaymentControl({ 
  teams, 
  setTeams, 
  categories, 
  eventInfo, 
  setEventInfo,
  targetPaymentAthlete 
}) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);

  // Auto-scroll and focus specific athlete row when navigated from Duplas
  useEffect(() => {
    if (targetPaymentAthlete?.teamId) {
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
  
  // Custom Expenses Estimator
  const [expenses, setExpenses] = useState({
    referees: 400,
    trophies: 350,
    prizes: 600,
    jerseys: 400,
  });

  // Calculate Metrics based on athlete payments
  const totalExpected = teams.reduce((sum, t) => {
    const cat = categories.find(c => c.id === t.categoryId);
    return sum + (cat ? cat.entryFee : 140);
  }, 0);

  let totalCollected = 0;
  let totalAthletesCount = 0;
  let totalPaidAthletes = 0;

  teams.forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    const fee = cat ? cat.entryFee : 140;
    const p1 = getAthletePayment(t, 1, fee);
    const p2 = getAthletePayment(t, 2, fee);

    totalCollected += (Number(p1.amount) || 0) + (Number(p2.amount) || 0);
    totalAthletesCount += 2;
    if (p1.status === 'PAID_FULL' || p1.status === 'EXEMPT') totalPaidAthletes++;
    if (p2.status === 'PAID_FULL' || p2.status === 'EXEMPT') totalPaidAthletes++;
  });

  const totalPending = Math.max(0, totalExpected - totalCollected);
  const totalExpenses = Object.values(expenses).reduce((sum, v) => sum + Number(v || 0), 0);
  const estimatedProfit = totalCollected - totalExpenses;

  // Filter teams and athletes
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

  // Copy PIX key
  const handleCopyPix = () => {
    if (eventInfo?.pixKey) {
      navigator.clipboard.writeText(eventInfo.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  // Update specific athlete payment
  const updateAthletePayment = (teamId, playerNum, updates) => {
    setTeams(teams.map(t => {
      if (t.id !== teamId) return t;

      const cat = categories.find(c => c.id === t.categoryId);
      const entryFee = cat ? cat.entryFee : 140;
      const athleteFee = Math.round(entryFee / 2);

      const currentP1 = getAthletePayment(t, 1, entryFee);
      const currentP2 = getAthletePayment(t, 2, entryFee);

      const updatedP1 = playerNum === 1 ? { ...currentP1, ...updates } : currentP1;
      const updatedP2 = playerNum === 2 ? { ...currentP2, ...updates } : currentP2;

      // Calculate combined team status & total paid
      const newTotalPaid = Number(updatedP1.amount || 0) + Number(updatedP2.amount || 0);
      let newTeamStatus = 'PENDING';

      if (updatedP1.status === 'PAID_FULL' && updatedP2.status === 'PAID_FULL') {
        newTeamStatus = 'PAID_FULL';
      } else if (updatedP1.status === 'EXEMPT' && updatedP2.status === 'EXEMPT') {
        newTeamStatus = 'EXEMPT';
      } else if (
        updatedP1.status === 'PAID_FULL' || 
        updatedP2.status === 'PAID_FULL' || 
        updatedP1.status === 'PAID_HALF' || 
        updatedP2.status === 'PAID_HALF' ||
        newTotalPaid > 0
      ) {
        newTeamStatus = 'PAID_HALF';
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

  // Change athlete status
  const handleAthleteStatusChange = (teamId, playerNum, newStatus, entryFee) => {
    const athleteFee = Math.round((entryFee || 140) / 2);
    let amount = 0;
    if (newStatus === 'PAID_FULL') amount = athleteFee;
    else if (newStatus === 'PAID_HALF') amount = Math.round(athleteFee / 2);
    else if (newStatus === 'PENDING') amount = 0;
    else if (newStatus === 'EXEMPT') amount = 0;

    updateAthletePayment(teamId, playerNum, {
      status: newStatus,
      amount,
      date: (newStatus === 'PAID_FULL' || newStatus === 'PAID_HALF') ? new Date().toISOString().slice(0, 10) : null,
    });
  };

  // WhatsApp Billing Template for specific athlete
  const sendWhatsAppAthleteBilling = (team, playerNum) => {
    const cat = categories.find(c => c.id === team.categoryId);
    const entryFee = cat ? cat.entryFee : 140;
    const athlete = playerNum === 1 ? team.player1 : team.player2;
    const athletePayment = getAthletePayment(team, playerNum, entryFee);
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

  // WhatsApp Confirmation Receipt Template for specific athlete
  const sendWhatsAppAthleteReceipt = (team, playerNum) => {
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
    const message = `✅ *PAGAMENTO CONFIRMADO!* 🏐\n\nFala ${athlete?.name || 'Craque'}! Confirmamos o recebimento de R$ ${athletePayment.amount},00 referente à sua inscrição na dupla *${team.displayName}*!\n\n📋 *Categoria:* ${cat?.name}\n🏆 *Formato:* Eliminatória Dupla (Duas derrotas para eliminação)\n📍 *Local:* ${eventInfo?.location}\n📅 *Data:* ${eventInfo?.date}\n\nTudo certo com a sua vaga! Boa sorte e nos vemos na arena! 🔥`;

    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Arrecadado */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Total Arrecadado</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-2">
            R$ {totalCollected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalPaidAthletes} de {totalAthletesCount} atletas quitados ({totalAthletesCount > 0 ? Math.round((totalPaidAthletes / totalAthletesCount) * 100) : 0}%)</span>
          </div>
        </div>

        {/* Total a Receber */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Pendente a Receber</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-display mt-2">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Total previsto: <span className="text-slate-200 font-semibold">R$ {totalExpected.toLocaleString('pt-BR')}</span>
          </p>
        </div>

        {/* Despesas Estimadas */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Despesas do Torneio</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-display mt-2">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Arbitragem, Troféus & Premiação
          </p>
        </div>

        {/* Lucro Líquido */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">Lucro Líquido Atual</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-extrabold font-display mt-2 ${estimatedProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            R$ {estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Arrecadado menos custos
          </p>
        </div>
      </div>

      {/* PIX Quick Box & Settings */}
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

      {/* Filter and Teams Payment Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-white font-display flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Controle de Pagamentos por Atleta
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerencie individualmente a inscrição de cada jogador da dupla com status, valores, métodos e cobrança no WhatsApp.
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

            {/* Status filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
            >
              <option value="ALL">Todos Status</option>
              <option value="PAID_FULL">Pago (100%)</option>
              <option value="PAID_HALF">Pago (50%)</option>
              <option value="PENDING">Pendente</option>
              <option value="EXEMPT">Isento</option>
            </select>
          </div>
        </div>

        {/* Table Content: Grouped by Team with individual athlete sub-rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 w-1/4">Atleta / Dupla</th>
                <th className="py-3.5 px-3">Categoria</th>
                <th className="py-3.5 px-3">Cota Individual</th>
                <th className="py-3.5 px-3">Valor Pago</th>
                <th className="py-3.5 px-3">Forma Pagamento</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Ações WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {relevantTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Nenhuma inscrição encontrada com estes filtros.
                  </td>
                </tr>
              ) : (
                relevantTeams.map((team) => {
                  const cat = categories.find(c => c.id === team.categoryId);
                  const entryFee = cat ? cat.entryFee : 140;
                  const p1Payment = getAthletePayment(team, 1, entryFee);
                  const p2Payment = getAthletePayment(team, 2, entryFee);

                  const teamTotalPaid = p1Payment.amount + p2Payment.amount;
                  const isTeamFullyPaid = teamTotalPaid >= entryFee;

                  const isTargetAthlete1 = targetPaymentAthlete?.teamId === team.id && Number(targetPaymentAthlete?.playerNum) === 1;
                  const isTargetAthlete2 = targetPaymentAthlete?.teamId === team.id && Number(targetPaymentAthlete?.playerNum) === 2;
                  const isTargetTeam = targetPaymentAthlete?.teamId === team.id;

                  return (
                    <React.Fragment key={team.id}>
                      {/* Team Header Bar */}
                      <tr 
                        id={`team-header-${team.id}`}
                        className={`transition-colors border-t-2 ${
                          isTargetTeam 
                            ? 'bg-amber-500/20 border-amber-400' 
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <td colSpan={7} className="py-2.5 px-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="font-extrabold text-sm text-white font-display">
                                🏐 {team.displayName}
                              </span>
                              <span 
                                className="font-semibold px-2 py-0.5 rounded text-[10px] inline-block"
                                style={{ 
                                  backgroundColor: `${cat?.color || '#F59E0B'}20`, 
                                  color: cat?.color || '#F59E0B',
                                  borderColor: `${cat?.color || '#F59E0B'}40`
                                }}
                              >
                                {cat?.name || 'Categoria'} (R$ {entryFee},00)
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-400">
                                Total da Dupla:{' '}
                                <strong className={`font-mono font-bold ${isTeamFullyPaid ? 'text-emerald-400' : teamTotalPaid > 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                                  R$ {teamTotalPaid},00 / R$ {entryFee},00
                                </strong>
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isTeamFullyPaid 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                  : teamTotalPaid > 0 
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {isTeamFullyPaid ? 'DUPLA QUITADA' : teamTotalPaid > 0 ? 'PARCIAL (50%)' : 'PENDENTE'}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Row for Athlete 1 */}
                      <tr 
                        id={`athlete-row-${team.id}-1`}
                        className={`transition-all ${
                          isTargetAthlete1 
                            ? 'bg-amber-500/25 ring-2 ring-amber-400 z-10 shadow-lg' 
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Athlete Info */}
                        <td className="py-3 px-4 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                              1
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate">
                                {team.player1?.name || 'Jogador 1'}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                {team.player1?.nickname && <span>"{team.player1.nickname}"</span>}
                                {team.player1?.phone && <span>📱 {team.player1.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="text-slate-400 text-xs">{cat?.shortName || 'CAT'}</span>
                        </td>

                        {/* Athlete Expected Fee */}
                        <td className="py-3 px-3 font-semibold text-slate-300">
                          R$ {p1Payment.fee},00
                        </td>

                        {/* Amount Paid with direct edit */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">R$</span>
                            <input
                              type="number"
                              min="0"
                              max={entryFee}
                              value={p1Payment.amount}
                              onChange={(e) => updateAthletePayment(team.id, 1, { amount: Number(e.target.value) })}
                              className={`w-20 px-2 py-1 rounded-lg bg-slate-950 border text-xs font-mono font-bold focus:outline-none ${
                                p1Payment.amount >= p1Payment.fee
                                  ? 'text-emerald-400 border-emerald-500/50'
                                  : p1Payment.amount > 0
                                  ? 'text-cyan-400 border-cyan-500/50'
                                  : 'text-amber-400 border-slate-700'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3 px-3">
                          <select
                            value={p1Payment.method}
                            onChange={(e) => updateAthletePayment(team.id, 1, { method: e.target.value })}
                            className="bg-slate-950 border border-slate-700 text-[11px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500"
                          >
                            {Object.values(PAYMENT_METHODS).map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Status Selector */}
                        <td className="py-3 px-3">
                          <select
                            value={p1Payment.status}
                            onChange={(e) => handleAthleteStatusChange(team.id, 1, e.target.value, entryFee)}
                            className={`font-semibold rounded-lg px-2.5 py-1 text-[11px] border focus:outline-none bg-slate-950 ${
                              PAYMENT_STATUS[p1Payment.status]?.color || PAYMENT_STATUS.PENDING.color
                            }`}
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="PAID_FULL">Pago (100%)</option>
                            <option value="PAID_HALF">Pago (50%)</option>
                            <option value="EXEMPT">Isento</option>
                          </select>
                        </td>

                        {/* Actions WhatsApp */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p1Payment.status !== 'PAID_FULL' ? (
                              <button
                                onClick={() => sendWhatsAppAthleteBilling(team, 1)}
                                title={`Cobrar ${team.player1?.name || 'Jogador 1'} via WhatsApp`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all active:scale-95"
                              >
                                <MessageCircle className="w-3 h-3 text-amber-400" />
                                Cobrar
                              </button>
                            ) : (
                              <button
                                onClick={() => sendWhatsAppAthleteReceipt(team, 1)}
                                title={`Enviar comprovante para ${team.player1?.name || 'Jogador 1'} no WhatsApp`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-all active:scale-95"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Recibo
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Row for Athlete 2 */}
                      <tr 
                        id={`athlete-row-${team.id}-2`}
                        className={`transition-all border-b border-slate-800/60 ${
                          isTargetAthlete2 
                            ? 'bg-amber-500/25 ring-2 ring-amber-400 z-10 shadow-lg' 
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Athlete Info */}
                        <td className="py-3 px-4 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs flex-shrink-0">
                              2
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate">
                                {team.player2?.name || 'Jogador 2'}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                {team.player2?.nickname && <span>"{team.player2.nickname}"</span>}
                                {team.player2?.phone && <span>📱 {team.player2.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="text-slate-400 text-xs">{cat?.shortName || 'CAT'}</span>
                        </td>

                        {/* Athlete Expected Fee */}
                        <td className="py-3 px-3 font-semibold text-slate-300">
                          R$ {p2Payment.fee},00
                        </td>

                        {/* Amount Paid with direct edit */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">R$</span>
                            <input
                              type="number"
                              min="0"
                              max={entryFee}
                              value={p2Payment.amount}
                              onChange={(e) => updateAthletePayment(team.id, 2, { amount: Number(e.target.value) })}
                              className={`w-20 px-2 py-1 rounded-lg bg-slate-950 border text-xs font-mono font-bold focus:outline-none ${
                                p2Payment.amount >= p2Payment.fee
                                  ? 'text-emerald-400 border-emerald-500/50'
                                  : p2Payment.amount > 0
                                  ? 'text-cyan-400 border-cyan-500/50'
                                  : 'text-amber-400 border-slate-700'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3 px-3">
                          <select
                            value={p2Payment.method}
                            onChange={(e) => updateAthletePayment(team.id, 2, { method: e.target.value })}
                            className="bg-slate-950 border border-slate-700 text-[11px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500"
                          >
                            {Object.values(PAYMENT_METHODS).map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Status Selector */}
                        <td className="py-3 px-3">
                          <select
                            value={p2Payment.status}
                            onChange={(e) => handleAthleteStatusChange(team.id, 2, e.target.value, entryFee)}
                            className={`font-semibold rounded-lg px-2.5 py-1 text-[11px] border focus:outline-none bg-slate-950 ${
                              PAYMENT_STATUS[p2Payment.status]?.color || PAYMENT_STATUS.PENDING.color
                            }`}
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="PAID_FULL">Pago (100%)</option>
                            <option value="PAID_HALF">Pago (50%)</option>
                            <option value="EXEMPT">Isento</option>
                          </select>
                        </td>

                        {/* Actions WhatsApp */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p2Payment.status !== 'PAID_FULL' ? (
                              <button
                                onClick={() => sendWhatsAppAthleteBilling(team, 2)}
                                title={`Cobrar ${team.player2?.name || 'Jogador 2'} via WhatsApp`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all active:scale-95"
                              >
                                <MessageCircle className="w-3 h-3 text-amber-400" />
                                Cobrar
                              </button>
                            ) : (
                              <button
                                onClick={() => sendWhatsAppAthleteReceipt(team, 2)}
                                title={`Enviar comprovante para ${team.player2?.name || 'Jogador 2'} no WhatsApp`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-all active:scale-95"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Recibo
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

      {/* Expenses Breakdown Box */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-amber-400" />
          Estimador de Custos do Torneio
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Arbitragem (R$)</label>
            <input
              type="number"
              value={expenses.referees}
              onChange={(e) => setExpenses({ ...expenses, referees: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Troféus/Medalhas (R$)</label>
            <input
              type="number"
              value={expenses.trophies}
              onChange={(e) => setExpenses({ ...expenses, trophies: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Premiação Dinheiro (R$)</label>
            <input
              type="number"
              value={expenses.prizes}
              onChange={(e) => setExpenses({ ...expenses, prizes: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Regatas / Brindes (R$)</label>
            <input
              type="number"
              value={expenses.jerseys}
              onChange={(e) => setExpenses({ ...expenses, jerseys: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

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
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md"
              >
                Salvar Chave PIX
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
