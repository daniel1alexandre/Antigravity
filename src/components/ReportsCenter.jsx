import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Users, 
  Trophy, 
  Shirt, 
  Phone, 
  Calendar, 
  Building, 
  Receipt,
  Layers,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Share2,
  Check,
  ChevronDown,
  ArrowDownUp,
  Medal
} from 'lucide-react';
import { PAYMENT_STATUS, PAYMENT_METHODS, getAthletePayment } from '../types/tournament';

export default function ReportsCenter({
  teams = [],
  categories = [],
  brackets = {},
  eventInfo = {},
}) {
  // Report Mode: Preset vs Custom Builder
  const [activeReportType, setActiveReportType] = useState('INSCRICOES');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // State for tracking individual shirt delivery per athlete: { 'teamId-1': true/false, 'teamId-2': true/false }
  const [deliveredShirts, setDeliveredShirts] = useState(() => {
    try {
      const saved = localStorage.getItem('futvolei_delivered_shirts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleShirtDelivery = (teamId, playerNum) => {
    setDeliveredShirts(prev => {
      const key = `${teamId}-${playerNum}`;
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('futvolei_delivered_shirts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Custom Report Builder Fields configuration
  const [customTitle, setCustomTitle] = useState('Relatório Personalizado do Torneio');
  const [customDescription, setCustomDescription] = useState('Filtro customizado de dados e atletas');
  const [customFields, setCustomFields] = useState({
    teamName: true,
    category: true,
    athletesNames: true,
    phones: true,
    shirtSizes: true,
    city: true,
    individualPayment: true,
    teamPaymentTotal: true,
    paymentStatus: true,
    paymentMethod: true,
    isSeed: false,
    signatureField: false,
  });

  // Filtered Teams based on options, sorted alphabetically
  const filteredTeams = useMemo(() => {
    const list = teams.filter(team => {
      const matchCat = selectedCategoryFilter === 'ALL' || team.categoryId === selectedCategoryFilter;
      
      const cat = categories.find(c => c.id === team.categoryId);
      const entryFee = cat ? cat.entryFee : 140;
      const p1 = getAthletePayment(team, 1, entryFee);
      const p2 = getAthletePayment(team, 2, entryFee);

      let matchStatus = true;
      if (selectedPaymentStatusFilter === 'PAID_FULL') {
        matchStatus = (p1.status === 'PAID_FULL' && p2.status === 'PAID_FULL') || team.paymentStatus === 'PAID_FULL';
      } else if (selectedPaymentStatusFilter === 'PENDING') {
        matchStatus = p1.status === 'PENDING' || p2.status === 'PENDING' || team.paymentStatus === 'PENDING';
      } else if (selectedPaymentStatusFilter === 'PARTIAL') {
        matchStatus = (p1.status === 'PAID_FULL' && p2.status !== 'PAID_FULL') || (p2.status === 'PAID_FULL' && p1.status !== 'PAID_FULL') || team.paymentStatus === 'PAID_HALF';
      } else if (selectedPaymentStatusFilter !== 'ALL') {
        matchStatus = team.paymentStatus === selectedPaymentStatusFilter;
      }

      const term = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        team.displayName?.toLowerCase().includes(term) ||
        team.player1?.name?.toLowerCase().includes(term) ||
        team.player2?.name?.toLowerCase().includes(term) ||
        team.player1?.nickname?.toLowerCase().includes(term) ||
        team.player2?.nickname?.toLowerCase().includes(term) ||
        team.city?.toLowerCase().includes(term);

      return matchCat && matchStatus && matchSearch;
    });

    // Always sort alphabetically by displayName / player name for Relação de Inscritos
    list.sort((a, b) => {
      const nameA = (a.displayName || a.player1?.name || '').trim();
      const nameB = (b.displayName || b.player1?.name || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    });

    return list;
  }, [teams, selectedCategoryFilter, selectedPaymentStatusFilter, searchTerm, categories, activeReportType]);

  // Chronological athletes payment ranking (Quem Pagou Primeiro)
  const paidAthletesTimeline = useMemo(() => {
    const list = [];

    filteredTeams.forEach(team => {
      const cat = categories.find(c => c.id === team.categoryId);
      const fee = cat ? cat.entryFee : 140;
      const p1 = getAthletePayment(team, 1, fee);
      const p2 = getAthletePayment(team, 2, fee);

      // Athlete 1
      if (p1.amount > 0 || p1.status === 'PAID_FULL' || p1.status === 'PAID_HALF') {
        list.push({
          teamId: team.id,
          teamName: team.displayName,
          categoryId: team.categoryId,
          categoryName: cat?.name || 'Categoria',
          categoryShort: cat?.shortName || 'CAT',
          athleteName: team.player1?.name || 'Jogador 1',
          nickname: team.player1?.nickname || '',
          phone: team.player1?.phone || '',
          shirtSize: team.player1?.shirtSize || 'M',
          amount: p1.amount,
          fee: p1.fee,
          status: p1.status,
          method: p1.method || 'PIX',
          date: p1.date || team.paymentDate || team.createdAt || '2026-08-25',
          playerNum: 1,
        });
      }

      // Athlete 2
      if (p2.amount > 0 || p2.status === 'PAID_FULL' || p2.status === 'PAID_HALF') {
        list.push({
          teamId: team.id,
          teamName: team.displayName,
          categoryId: team.categoryId,
          categoryName: cat?.name || 'Categoria',
          categoryShort: cat?.shortName || 'CAT',
          athleteName: team.player2?.name || 'Jogador 2',
          nickname: team.player2?.nickname || '',
          phone: team.player2?.phone || '',
          shirtSize: team.player2?.shirtSize || 'M',
          amount: p2.amount,
          fee: p2.fee,
          status: p2.status,
          method: p2.method || 'PIX',
          date: p2.date || team.paymentDate || team.createdAt || '2026-08-25',
          playerNum: 2,
        });
      }
    });

    // Sort chronologically ascending: earliest payment dates come first
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return a.athleteName.localeCompare(b.athleteName);
    });

    return list;
  }, [filteredTeams, categories]);

  // Shirt Size aggregation
  const shirtStats = useMemo(() => {
    const stats = { P: 0, M: 0, G: 0, GG: 0, XG: 0, OUTRO: 0, TOTAL: 0 };
    filteredTeams.forEach(t => {
      [t.player1, t.player2].forEach(p => {
        if (p) {
          stats.TOTAL++;
          const sz = (p.shirtSize || 'M').toUpperCase();
          if (stats[sz] !== undefined) stats[sz]++;
          else stats.OUTRO++;
        }
      });
    });
    return stats;
  }, [filteredTeams]);

  // Financial aggregates
  const financialStats = useMemo(() => {
    let expected = 0;
    let collected = 0;
    let paidAthletes = 0;
    let totalAthletes = filteredTeams.length * 2;

    filteredTeams.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const fee = cat ? cat.entryFee : 140;
      expected += fee;

      const p1 = getAthletePayment(t, 1, fee);
      const p2 = getAthletePayment(t, 2, fee);

      collected += (Number(p1.amount) || 0) + (Number(p2.amount) || 0);
      if (p1.status === 'PAID_FULL' || p1.status === 'EXEMPT') paidAthletes++;
      if (p2.status === 'PAID_FULL' || p2.status === 'EXEMPT') paidAthletes++;
    });

    return {
      expected,
      collected,
      pending: Math.max(0, expected - collected),
      paidAthletes,
      totalAthletes,
      percentPaid: expected > 0 ? Math.round((collected / expected) * 100) : 0,
    };
  }, [filteredTeams, categories]);

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Export as CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (activeReportType === 'ORDEM_PAGAMENTO') {
      csvContent += 'Posição Ordem;Data Pagamento;Atleta;Dupla;Categoria;Valor Pago;Cota;Status;Forma\r\n';
      paidAthletesTimeline.forEach((item, idx) => {
        csvContent += `"${idx + 1}";"${item.date}";"${item.athleteName}";"${item.teamName}";"${item.categoryName}";"${item.amount}";"${item.fee}";"${item.status}";"${item.method}"\r\n`;
      });
    } else if (activeReportType === 'FINANCEIRO') {
      csvContent += 'Dupla;Categoria;Jogador 1;Pago 1;Método 1;Jogador 2;Pago 2;Método 2;Total Dupla Pago;Status\r\n';
      filteredTeams.forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const fee = cat ? cat.entryFee : 140;
        const p1 = getAthletePayment(t, 1, fee);
        const p2 = getAthletePayment(t, 2, fee);
        const total = p1.amount + p2.amount;
        const status = total >= fee ? 'QUITADO' : total > 0 ? 'PARCIAL (50%)' : 'PENDENTE';
        csvContent += `"${t.displayName}";"${cat?.name || ''}";"${t.player1?.name || ''}";"${p1.amount}";"${p1.method || 'PIX'}";"${t.player2?.name || ''}";"${p2.amount}";"${p2.method || 'PIX'}";"${total}";"${status}"\r\n`;
      });
    } else if (activeReportType === 'REGATAS') {
      csvContent += 'Dupla;Categoria;Jogador 1;Camisa 1;Entregue 1;Jogador 2;Camisa 2;Entregue 2\r\n';
      filteredTeams.forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const ent1 = deliveredShirts[`${t.id}-1`] ? 'SIM' : 'NÃO';
        const ent2 = deliveredShirts[`${t.id}-2`] ? 'SIM' : 'NÃO';
        csvContent += `"${t.displayName}";"${cat?.name || ''}";"${t.player1?.name || ''}";"${t.player1?.shirtSize || 'M'}";"${ent1}";"${t.player2?.name || ''}";"${t.player2?.shirtSize || 'M'}";"${ent2}"\r\n`;
      });
    } else {
      csvContent += 'Dupla;Categoria;Atleta 1;Camisa 1;Tel 1;Atleta 2;Camisa 2;Tel 2;Cidade;Status Pagamento\r\n';
      filteredTeams.forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        csvContent += `"${t.displayName}";"${cat?.name || ''}";"${t.player1?.name || ''}";"${t.player1?.shirtSize || 'M'}";"${t.player1?.phone || ''}";"${t.player2?.name || ''}";"${t.player2?.shirtSize || 'M'}";"${t.player2?.phone || ''}";"${t.city || ''}";"${t.paymentStatus || 'PENDING'}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${activeReportType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Report Preset Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            Central de Relatórios & Impressão
          </div>
          <h2 className="text-2xl font-black font-display text-white mt-1">
            Geração e Exportação de Relatórios
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Escolha um modelo pré-definido ou monte o seu relatório sob medida selecionando as colunas e filtros desejados.
          </p>
        </div>

        {/* Action Buttons: Print & CSV */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            title="Baixar planilha CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-amber transition-all active:scale-95"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Modelos de Relatórios Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden no-scrollbar">
        <button
          onClick={() => setActiveReportType('INSCRICOES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
            activeReportType === 'INSCRICOES'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-glow-amber'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Relação Geral de Inscritos
        </button>

        <button
          onClick={() => setActiveReportType('ORDEM_PAGAMENTO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
            activeReportType === 'ORDEM_PAGAMENTO'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-glow-amber'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <ArrowDownUp className="w-4 h-4" />
          Ordem de Pagamento (Quem Pagou Primeiro)
        </button>

        <button
          onClick={() => setActiveReportType('FINANCEIRO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
            activeReportType === 'FINANCEIRO'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-glow-emerald'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Financeiro & Cotas
        </button>

        <button
          onClick={() => setActiveReportType('REGATAS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
            activeReportType === 'REGATAS'
              ? 'bg-purple-500 text-slate-950 border-purple-400'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Shirt className="w-4 h-4" />
          Controle de Camisas & Tamanhos
        </button>

        <button
          onClick={() => setActiveReportType('CUSTOM')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
            activeReportType === 'CUSTOM'
              ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 border-amber-300'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Personalizado (Monte o Seu)
        </button>
      </div>

      {/* Report Filters and Customizer Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar atleta, dupla ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Categoria:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Todas as Categorias</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Pagamento:</span>
              <select
                value={selectedPaymentStatusFilter}
                onChange={(e) => setSelectedPaymentStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Todos os Status</option>
                <option value="PAID_FULL">Quitados (100%)</option>
                <option value="PARTIAL">Parciais (50%)</option>
                <option value="PENDING">Pendentes</option>
                <option value="EXEMPT">Isentos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Field Selector (Visible when activeReportType === 'CUSTOM') */}
        {activeReportType === 'CUSTOM' && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Título do seu relatório..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold"
              />
              <input
                type="text"
                placeholder="Subtítulo ou observações..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300"
              />
            </div>

            <div>
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                Campos que devem aparecer na tabela:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { key: 'teamName', label: 'Nome da Dupla' },
                  { key: 'category', label: 'Categoria' },
                  { key: 'athletesNames', label: 'Nome dos Atletas' },
                  { key: 'phones', label: 'Telefones / WhatsApp' },
                  { key: 'shirtSizes', label: 'Tamanho das Regatas' },
                  { key: 'city', label: 'Cidade / Origem' },
                  { key: 'individualPayment', label: 'Pagamento Individual (Atleta 1 e 2)' },
                  { key: 'teamPaymentTotal', label: 'Total da Dupla (R$ Pago / R$ Total)' },
                  { key: 'paymentStatus', label: 'Status do Pagamento' },
                  { key: 'paymentMethod', label: 'Forma de Pagamento' },
                  { key: 'isSeed', label: 'Cabeça de Chave' },
                  { key: 'signatureField', label: 'Espaço para Assinatura (Presença)' },
                ].map(field => (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => setCustomFields({ ...customFields, [field.key]: !customFields[field.key] })}
                    className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                      customFields[field.key]
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {customFields[field.key] ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5" />}
                    {field.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE REPORT PREVIEW CONTAINER */}
      <div 
        id="printable-report" 
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl print:bg-white print:text-black print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div className="border-b-2 border-amber-500/80 pb-4 mb-6 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-2xl text-white print:text-black tracking-tight">
                  {eventInfo?.name || 'Torneio Oficial de Futvôlei'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 print:border-black print:text-black">
                  RELATÓRIO OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                📍 {eventInfo?.location || 'Arena Principal'} • 📅 {eventInfo?.date || new Date().toLocaleDateString('pt-BR')} • Organização: {eventInfo?.organizer || 'Diretoria do Torneio'}
              </p>
            </div>

            <div className="text-right text-[11px] text-slate-400 print:text-gray-600">
              <p>Emitido em: <strong className="text-slate-200 print:text-black">{new Date().toLocaleString('pt-BR')}</strong></p>
              <p>Total de Duplas: <strong className="text-amber-400 print:text-black">{filteredTeams.length}</strong> ({filteredTeams.length * 2} atletas)</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 print:border-gray-300 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-lg text-amber-400 print:text-black font-display flex items-center gap-2">
              {activeReportType === 'INSCRICOES' && (
                <>
                  <span>📋 Relação Geral de Duplas e Atletas Inscritos</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 print:border-black print:text-black">
                    Ordem Alfabética (A-Z)
                  </span>
                </>
              )}
              {activeReportType === 'ORDEM_PAGAMENTO' && '⚡ Ordem Cronológica de Pagamentos (Quem Pagou Primeiro)'}
              {activeReportType === 'FINANCEIRO' && '💰 Relatório Financeiro e Controle de Cotas'}
              {activeReportType === 'REGATAS' && '👕 Grade de Produção e Entrega de Camisas / Uniformes'}
              {activeReportType === 'CUSTOM' && `✨ ${customTitle}`}
            </h3>
            {activeReportType === 'CUSTOM' && customDescription && (
              <span className="text-xs text-slate-400 print:text-gray-600">{customDescription}</span>
            )}
          </div>
        </div>

        {/* FINANCIAL SUMMARY HIGHLIGHT (If Financial or Custom with payments) */}
        {(activeReportType === 'FINANCEIRO' || (activeReportType === 'CUSTOM' && customFields.teamPaymentTotal)) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-slate-900/80 print:bg-gray-100 border border-slate-800 print:border-gray-300 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-bold">Total Previsto</span>
              <p className="text-base font-extrabold text-white print:text-black mt-0.5">
                R$ {financialStats.expected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 print:text-black uppercase font-bold">Total Arrecadado</span>
              <p className="text-base font-extrabold text-emerald-400 print:text-black mt-0.5">
                R$ {financialStats.collected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 print:text-black uppercase font-bold">Pendente a Receber</span>
              <p className="text-base font-extrabold text-amber-400 print:text-black mt-0.5">
                R$ {financialStats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 print:text-black uppercase font-bold">Atletas Quitados</span>
              <p className="text-base font-extrabold text-cyan-400 print:text-black mt-0.5">
                {financialStats.paidAthletes} de {financialStats.totalAthletes} ({financialStats.percentPaid}%)
              </p>
            </div>
          </div>
        )}

        {/* SHIRT SIZE AGGREGATION HIGHLIGHT (If Regatas) */}
        {activeReportType === 'REGATAS' && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900/80 print:bg-gray-100 border border-slate-800 print:border-gray-300">
            <h4 className="font-bold text-xs text-purple-300 print:text-black uppercase tracking-wider mb-2">
              Resumo Consolidado de Tamanhos para Confecção
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {['P', 'M', 'G', 'GG', 'XG'].map(size => (
                <div key={size} className="p-2 rounded-lg bg-slate-950 print:bg-white border border-slate-800 print:border-gray-300">
                  <span className="text-[10px] text-slate-400 print:text-gray-600 block">Tamanho {size}</span>
                  <strong className="text-base text-purple-400 print:text-black font-extrabold">{shirtStats[size] || 0}</strong>
                </div>
              ))}
              <div className="p-2 rounded-lg bg-purple-950/40 print:bg-gray-200 border border-purple-800/50 print:border-gray-400">
                <span className="text-[10px] text-purple-300 print:text-gray-700 block font-bold">Total Geral</span>
                <strong className="text-base text-purple-300 print:text-black font-black">{shirtStats.TOTAL}</strong>
              </div>
            </div>
          </div>
        )}

        {/* MAIN DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 print:bg-gray-200 border-b-2 border-slate-800 print:border-black text-[11px] font-bold uppercase tracking-wider text-slate-400 print:text-black">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Dupla / Atletas</th>
                <th className="py-2.5 px-3">Cat.</th>
                
                {/* Mode Specific Columns */}
                {activeReportType === 'INSCRICOES' && (
                  <>
                    <th className="py-2.5 px-3">Jogador 1 (Regata / Tel)</th>
                    <th className="py-2.5 px-3">Jogador 2 (Regata / Tel)</th>
                    <th className="py-2.5 px-3">Cidade</th>
                    <th className="py-2.5 px-3">Status Pag.</th>
                  </>
                )}

                {activeReportType === 'ORDEM_PAGAMENTO' && (
                  <>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Atleta Pagante</th>
                    <th className="py-2.5 px-3">Dupla</th>
                    <th className="py-2.5 px-3">Valor Pago</th>
                    <th className="py-2.5 px-3">Forma</th>
                    <th className="py-2.5 px-3">Status</th>
                  </>
                )}

                {activeReportType === 'FINANCEIRO' && (
                  <>
                    <th className="py-2.5 px-3">Jogador 1 (Pago / Método)</th>
                    <th className="py-2.5 px-3">Jogador 2 (Pago / Método)</th>
                    <th className="py-2.5 px-3">Total Dupla</th>
                    <th className="py-2.5 px-3">Status</th>
                  </>
                )}

                {activeReportType === 'REGATAS' && (
                  <>
                    <th className="py-2.5 px-3">Jogador 1</th>
                    <th className="py-2.5 px-3 text-center">Camisa 1</th>
                    <th className="py-2.5 px-3 text-center">Entregue 1?</th>
                    <th className="py-2.5 px-3">Jogador 2</th>
                    <th className="py-2.5 px-3 text-center">Camisa 2</th>
                    <th className="py-2.5 px-3 text-center">Entregue 2?</th>
                  </>
                )}

                {activeReportType === 'CUSTOM' && (
                  <>
                    {customFields.athletesNames && <th className="py-2.5 px-3">Atletas</th>}
                    {customFields.phones && <th className="py-2.5 px-3">Contatos</th>}
                    {customFields.shirtSizes && <th className="py-2.5 px-3">Regatas</th>}
                    {customFields.city && <th className="py-2.5 px-3">Cidade</th>}
                    {customFields.individualPayment && <th className="py-2.5 px-3">Cotistas (1 e 2)</th>}
                    {customFields.teamPaymentTotal && <th className="py-2.5 px-3">Total Dupla</th>}
                    {customFields.paymentMethod && <th className="py-2.5 px-3">Método</th>}
                    {customFields.paymentStatus && <th className="py-2.5 px-3">Status</th>}
                    {customFields.signatureField && <th className="py-2.5 px-3 w-48 text-center">Assinatura</th>}
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
              {activeReportType === 'ORDEM_PAGAMENTO' ? (
                paidAthletesTimeline.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 print:text-gray-500">
                      Nenhum pagamento registrado até o momento.
                    </td>
                  </tr>
                ) : (
                  paidAthletesTimeline.map((item, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <tr key={`${item.teamId}-${item.playerNum}`} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                        {/* Position Badge */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                              isTop1 
                                ? 'bg-amber-400 text-slate-950 shadow-glow-amber ring-2 ring-amber-300' 
                                : isTop2 
                                ? 'bg-slate-300 text-slate-950 ring-2 ring-slate-200' 
                                : isTop3 
                                ? 'bg-amber-700 text-white ring-2 ring-amber-600' 
                                : 'bg-slate-800 text-slate-300 font-mono'
                            }`}>
                              {index + 1}º
                            </span>
                            {isTop1 && <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tight hidden sm:inline">1º a Pagar</span>}
                          </div>
                        </td>

                        {/* Dupla / Atleta */}
                        <td className="py-2.5 px-3 font-bold text-white print:text-black">
                          {item.athleteName}
                          {item.nickname && (
                            <span className="text-amber-400 ml-1 font-normal">"{item.nickname}"</span>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-amber-400 print:text-black">
                            {item.categoryShort}
                          </span>
                        </td>

                        {/* Data / Hora do Pagamento */}
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-300 print:text-black">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 print:bg-transparent print:border-none print:text-black">
                            📅 {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '28/08/2026'}
                          </span>
                        </td>

                        {/* Atleta Pagante */}
                        <td className="py-2.5 px-3 text-slate-200 print:text-black font-medium">
                          {item.athleteName} (Jogador {item.playerNum})
                        </td>

                        {/* Dupla */}
                        <td className="py-2.5 px-3 text-slate-400 print:text-black">
                          {item.teamName}
                        </td>

                        {/* Valor Pago */}
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 print:text-black">
                          R$ {item.amount},00
                        </td>

                        {/* Forma de Pagamento */}
                        <td className="py-2.5 px-3 text-slate-400 print:text-black">
                          {item.method}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded border print:border-black ${
                            item.status === 'PAID_FULL' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          } print:bg-transparent print:text-black`}>
                            {item.status === 'PAID_FULL' ? '100% PAGO' : '50% PAGO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 print:text-gray-500">
                      Nenhuma dupla ou atleta encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team, index) => {
                    const cat = categories.find(c => c.id === team.categoryId);
                    const entryFee = cat ? cat.entryFee : 140;
                    const p1 = getAthletePayment(team, 1, entryFee);
                    const p2 = getAthletePayment(team, 2, entryFee);
                    const teamTotal = p1.amount + p2.amount;
                    const isPaid = teamTotal >= entryFee;

                    return (
                      <tr key={team.id} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                        {/* # Index */}
                        <td className="py-2.5 px-3 font-mono text-slate-400 print:text-black font-semibold">
                          {index + 1}
                        </td>

                        {/* Team Name */}
                        <td className="py-2.5 px-3 font-bold text-white print:text-black">
                          <div>
                            {team.displayName}
                            {team.isSeed && (
                              <span className="ml-1 text-[10px] text-amber-400 print:text-black font-semibold">
                                (Cabeça #{team.seedRank || 1})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-amber-400 print:text-black">
                            {cat?.shortName || 'CAT'}
                          </span>
                        </td>

                        {/* REPORT: INSCRICOES */}
                        {activeReportType === 'INSCRICOES' && (
                          <>
                            <td className="py-2.5 px-3">
                              <p className="font-semibold text-slate-200 print:text-black">{team.player1?.name}</p>
                              <p className="text-[10px] text-slate-400 print:text-gray-600">
                                Camisa: {team.player1?.shirtSize || 'M'} • 📱 {team.player1?.phone || 'Sem tel'}
                              </p>
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-semibold text-slate-200 print:text-black">{team.player2?.name}</p>
                              <p className="text-[10px] text-slate-400 print:text-gray-600">
                                Camisa: {team.player2?.shirtSize || 'M'} • 📱 {team.player2?.phone || 'Sem tel'}
                              </p>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 print:text-black">{team.city || '-'}</td>
                            <td className="py-2.5 px-3">
                              <span className={`font-bold ${isPaid ? 'text-emerald-400 print:text-black' : teamTotal > 0 ? 'text-cyan-400 print:text-black' : 'text-amber-400 print:text-black'}`}>
                                {isPaid ? 'PAGO (100%)' : teamTotal > 0 ? 'PARCIAL (50%)' : 'PENDENTE'}
                              </span>
                            </td>
                          </>
                        )}

                        {/* REPORT: FINANCEIRO */}
                        {activeReportType === 'FINANCEIRO' && (
                          <>
                            <td className="py-2.5 px-3">
                              <p className="font-semibold text-slate-200 print:text-black">{team.player1?.name || 'Jogador 1'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[11px] font-mono font-bold ${p1.amount > 0 ? 'text-emerald-400' : 'text-amber-400'} print:text-black`}>
                                  R$ {p1.amount},00
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 print:border-black print:text-black font-semibold">
                                  {p1.method || 'PIX'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-semibold text-slate-200 print:text-black">{team.player2?.name || 'Jogador 2'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[11px] font-mono font-bold ${p2.amount > 0 ? 'text-emerald-400' : 'text-amber-400'} print:text-black`}>
                                  R$ {p2.amount},00
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 print:border-black print:text-black font-semibold">
                                  {p2.method || 'PIX'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-black text-white print:text-black text-xs">
                              R$ {p1.amount + p2.amount},00
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`font-bold text-[10px] px-2 py-0.5 rounded border print:border-black ${
                                isPaid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : teamTotal > 0 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              } print:bg-transparent print:text-black`}>
                                {isPaid ? 'QUITADO' : teamTotal > 0 ? 'PARCIAL (50%)' : 'PENDENTE'}
                              </span>
                            </td>
                          </>
                        )}

                        {/* REPORT: REGATAS / CAMISAS */}
                        {activeReportType === 'REGATAS' && (
                          <>
                            {/* Player 1 */}
                            <td className="py-2.5 px-3 font-semibold text-slate-200 print:text-black">
                              {team.player1?.name || 'Jogador 1'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 print:text-black print:border print:border-black">
                                {team.player1?.shirtSize || 'M'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleShirtDelivery(team.id, 1)}
                                title={deliveredShirts[`${team.id}-1`] ? 'Camisa entregue ao Atleta 1 (clique para alternar)' : 'Marcar como entregue ao Atleta 1'}
                                className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  deliveredShirts[`${team.id}-1`]
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 print:bg-transparent print:border-black print:text-black'
                                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 print:border-black'
                                }`}
                              >
                                {deliveredShirts[`${team.id}-1`] ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                                    <span>Entregue</span>
                                  </>
                                ) : (
                                  <span className="w-3.5 h-3.5 border border-slate-500 print:border-black rounded inline-block" />
                                )}
                              </button>
                            </td>

                            {/* Player 2 */}
                            <td className="py-2.5 px-3 font-semibold text-slate-200 print:text-black">
                              {team.player2?.name || 'Jogador 2'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 print:text-black print:border print:border-black">
                                {team.player2?.shirtSize || 'M'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleShirtDelivery(team.id, 2)}
                                title={deliveredShirts[`${team.id}-2`] ? 'Camisa entregue ao Atleta 2 (clique para alternar)' : 'Marcar como entregue ao Atleta 2'}
                                className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  deliveredShirts[`${team.id}-2`]
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 print:bg-transparent print:border-black print:text-black'
                                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 print:border-black'
                                }`}
                              >
                                {deliveredShirts[`${team.id}-2`] ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                                    <span>Entregue</span>
                                  </>
                                ) : (
                                  <span className="w-3.5 h-3.5 border border-slate-500 print:border-black rounded inline-block" />
                                )}
                              </button>
                            </td>
                          </>
                        )}

                        {/* REPORT: CUSTOM BUILDER */}
                        {activeReportType === 'CUSTOM' && (
                          <>
                            {customFields.athletesNames && (
                              <td className="py-2.5 px-3 text-slate-300 print:text-black">
                                {team.player1?.name} & {team.player2?.name}
                              </td>
                            )}
                            {customFields.phones && (
                              <td className="py-2.5 px-3 text-slate-400 print:text-black text-[11px]">
                                {team.player1?.phone || '-'} / {team.player2?.phone || '-'}
                              </td>
                            )}
                            {customFields.shirtSizes && (
                              <td className="py-2.5 px-3 text-slate-300 print:text-black font-mono">
                                {team.player1?.shirtSize || 'M'} & {team.player2?.shirtSize || 'M'}
                              </td>
                            )}
                            {customFields.city && (
                              <td className="py-2.5 px-3 text-slate-400 print:text-black">{team.city || '-'}</td>
                            )}
                            {customFields.individualPayment && (
                              <td className="py-2.5 px-3 font-mono text-[11px] print:text-black">
                                1: R$ {p1.amount} • 2: R$ {p2.amount}
                              </td>
                            )}
                            {customFields.teamPaymentTotal && (
                              <td className="py-2.5 px-3 font-mono font-bold text-white print:text-black">
                                R$ {teamTotal} / R$ {entryFee}
                              </td>
                            )}
                            {customFields.paymentMethod && (
                              <td className="py-2.5 px-3 text-slate-400 print:text-black">{team.paymentMethod || 'PIX'}</td>
                            )}
                            {customFields.paymentStatus && (
                              <td className="py-2.5 px-3 font-bold print:text-black">
                                {isPaid ? 'QUITADO' : teamTotal > 0 ? 'PARCIAL' : 'PENDENTE'}
                              </td>
                            )}
                            {customFields.signatureField && (
                              <td className="py-2.5 px-3 text-center border-b border-dotted border-slate-700 print:border-black">
                                {/* Blank for physical signature */}
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 print:border-black flex items-center justify-between text-[11px] text-slate-500 print:text-gray-700">
          <p>DB Futvôlei Pro — Sistema de Gestão de Torneios e Eliminatória Dupla</p>
          <p>Página 1 de 1</p>
        </div>
      </div>
    </div>
  );
}
