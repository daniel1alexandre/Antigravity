import React, { useState } from 'react';
import {
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Users,
  Phone,
  Tag,
  Trophy,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function PublicRegistrationModal({
  isOpen,
  onClose,
  categories = [],
  teams = [],
  eventInfo = {},
  onRegisterTeam,
  onViewTeamsList,
  defaultCategoryId = null,
}) {
  const [selectedCatId, setSelectedCatId] = useState(defaultCategoryId || categories[0]?.id || '');
  const [teamName, setTeamName] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player1Phone, setPlayer1Phone] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [player2Phone, setPlayer2Phone] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.id === selectedCatId) || categories[0] || null;
  const currentCategoryTeams = teams.filter(t => t.categoryId === currentCategory?.id);
  const maxTeams = Number(currentCategory?.maxTeams) || 16;
  const isCategoryFull = currentCategoryTeams.length >= maxTeams;

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedCatId) {
      setErrorMessage('Por favor, selecione uma categoria.');
      return;
    }
    if (!teamName.trim()) {
      setErrorMessage('Por favor, informe o nome da dupla.');
      return;
    }
    if (!player1Name.trim()) {
      setErrorMessage('Por favor, informe o nome do Atleta 1.');
      return;
    }
    if (!player1Phone.trim()) {
      setErrorMessage('Por favor, informe o telefone do Atleta 1.');
      return;
    }
    if (!player2Name.trim()) {
      setErrorMessage('Por favor, informe o nome do Atleta 2.');
      return;
    }
    if (!player2Phone.trim()) {
      setErrorMessage('Por favor, informe o telefone do Atleta 2.');
      return;
    }

    const newTeam = {
      id: `team-${Date.now()}`,
      categoryId: selectedCatId,
      displayName: teamName.trim(),
      city: eventInfo?.city || '',
      isSeed: false,
      paymentStatus: 'PENDING',
      paymentMethod: 'PIX',
      paidAmount: 0,
      paymentNotes: 'Inscrição realizada via tela inicial',
      createdAt: new Date().toISOString(),
      player1: {
        name: player1Name.trim(),
        phone: player1Phone.trim(),
        nickname: '',
        shirtSize: 'M',
      },
      player2: {
        name: player2Name.trim(),
        phone: player2Phone.trim(),
        nickname: '',
        shirtSize: 'M',
      },
    };

    if (onRegisterTeam) {
      onRegisterTeam(newTeam);
    }

    setSuccessData({
      team: newTeam,
      category: currentCategory,
    });
  };

  const handleCopyPix = () => {
    if (!eventInfo?.pixKey) return;
    navigator.clipboard.writeText(eventInfo.pixKey).then(() => {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    });
  };

  const handleResetForAnother = () => {
    setTeamName('');
    setPlayer1Name('');
    setPlayer1Phone('');
    setPlayer2Name('');
    setPlayer2Phone('');
    setErrorMessage('');
    setSuccessData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-glow-amber flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                Inscrição de Dupla no Torneio
              </h3>
              <p className="text-xs text-slate-400">
                {eventInfo?.name || 'DB Futvôlei Pro'} • Preencha os dados e salve sua vaga
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          
          {/* ─── SUCCESS SCREEN ─── */}
          {successData ? (
            <div className="space-y-5 text-center py-2 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-emerald">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-black font-display text-white">
                  Inscrição Realizada com Sucesso!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Sua dupla foi cadastrada e já está registrada no sistema oficial.
                </p>
              </div>

              {/* Inscription Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-slate-400">Dupla Confirmada:</span>
                  <span className="text-sm font-black text-amber-400 font-display">
                    {successData.team.displayName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Categoria:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: successData.category?.color || '#F59E0B' }} />
                    <span className="font-bold text-white">{successData.category?.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Atleta 1</span>
                    <span className="font-bold text-white block mt-0.5">{successData.team.player1.name}</span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {successData.team.player1.phone}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Atleta 2</span>
                    <span className="font-bold text-white block mt-0.5">{successData.team.player2.name}</span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {successData.team.player2.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-semibold">Status da Inscrição:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    ● Pendente de Pagamento
                  </span>
                </div>
              </div>

              {/* PIX Payment Box */}
              {eventInfo?.pixKey && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Pagamento via PIX da Inscrição
                    </span>
                    <span className="text-xs font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      R$ {successData.category?.entryFee || 140},00
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Efetue a transferência para confirmar sua participação:
                  </p>

                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-slate-400 block font-semibold">Chave PIX ({eventInfo?.pixKeyType || 'E-mail'}):</span>
                      <span className="font-mono text-xs font-bold text-amber-400 truncate block">
                        {eventInfo.pixKey}
                      </span>
                      {eventInfo?.pixReceiverName && (
                        <span className="text-[10px] text-slate-500 block truncate">
                          Favorecido: {eventInfo.pixReceiverName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex-shrink-0"
                    >
                      {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {onViewTeamsList && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewTeamsList(successData.category?.id);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Ver Lista de Inscritos</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Inscrever Outra Dupla</span>
                </button>
              </div>
            </div>
          ) : (
            /* ─── REGISTRATION FORM ─── */
            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* 1. Category Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    Selecione a Categoria *
                  </label>
                  {currentCategory && (
                    <span className="text-[11px] text-amber-400 font-bold">
                      Inscrição: R$ {currentCategory.entryFee},00
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    const catTeamsCount = teams.filter(t => t.categoryId === cat.id).length;
                    const catMax = Number(cat.maxTeams) || 16;
                    const isFull = catTeamsCount >= catMax;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 shadow-glow-amber text-white ring-1 ring-amber-500/50'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#F59E0B' }} />
                            <span className="font-bold text-xs text-white">{cat.name}</span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                            {cat.shortName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span className="font-semibold text-amber-300">R$ {cat.entryFee}</span>
                          <span>{catTeamsCount} / {catMax} vagas</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Team Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome da Dupla *
                </label>
                <div className="relative">
                  <Trophy className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas & Gabriel ou Canhota / Digão"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Como a dupla será chamada nas tabelas e no chaveamento.
                </span>
              </div>

              {/* 3. Atleta 1 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Dados do Atleta 1
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lucas da Silva"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Telefone / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="(11) 98765-4321"
                        value={player1Phone}
                        onChange={(e) => setPlayer1Phone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Atleta 2 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Dados do Atleta 2
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gabriel Santos"
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Telefone / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="(11) 98765-4322"
                        value={player2Phone}
                        onChange={(e) => setPlayer2Phone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Save Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-glow-amber transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Salvar Inscrição</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
