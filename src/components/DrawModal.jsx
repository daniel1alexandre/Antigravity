import React, { useState } from 'react';
import { Shuffle, Sparkles, Trophy, Play, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight, Lock, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { performSeededDraw, performRandomDraw, prepareDrawAnimationSteps } from '../utils/drawEngine';
import { generateDoubleEliminationBracket } from '../utils/doubleEliminationEngine';
import { getAthletePayment } from '../types/tournament';

export default function DrawModal({ 
  isOpen, 
  onClose, 
  teams, 
  categories, 
  selectedCategoryId, 
  setBrackets,
  setActiveTab 
}) {
  const [drawMode, setDrawMode] = useState('SEEDED'); // 'SEEDED' or 'RANDOM'
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnList, setDrawnList] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationSteps, setAnimationSteps] = useState([]);

  if (!isOpen) return null;

  const category = categories.find(c => c.id === selectedCategoryId) || categories[0] || null;

  if (!category) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 text-center space-y-4">
          <p className="text-sm text-slate-300">Nenhuma categoria cadastrada para realizar sorteio.</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs hover:bg-slate-700">Fechar</button>
        </div>
      </div>
    );
  }

  const categoryTeams = teams.filter(t => t.categoryId === selectedCategoryId);
  const seededCount = categoryTeams.filter(t => t.isSeed).length;

  // Strict Rule: Only allow draw if ALL athletes in this category have status PAID_FULL (Pago) or EXEMPT (Isento)
  const unpaidAthletes = [];
  categoryTeams.forEach(team => {
    const p1 = getAthletePayment(team, 1, category.entryFee);
    const p2 = getAthletePayment(team, 2, category.entryFee);

    if (p1.status !== 'PAID_FULL' && p1.status !== 'EXEMPT') {
      unpaidAthletes.push({
        teamId: team.id,
        teamName: team.displayName,
        athleteName: team.player1?.name || 'Jogador 1',
        status: p1.status,
      });
    }
    if (p2.status !== 'PAID_FULL' && p2.status !== 'EXEMPT') {
      unpaidAthletes.push({
        teamId: team.id,
        teamName: team.displayName,
        athleteName: team.player2?.name || 'Jogador 2',
        status: p2.status,
      });
    }
  });

  const isAllPaid = unpaidAthletes.length === 0;

  const handleStartDraw = () => {
    if (!isAllPaid) {
      alert(`Sorteio Bloqueado! Existem ${unpaidAthletes.length} atletas com pagamento não quitado nesta categoria. Só é permitido realizar o sorteio dos jogos se TODOS os atletas estiverem com o status PAGO.`);
      return;
    }

    if (categoryTeams.length < 2) {
      alert('É necessário ter pelo menos 2 duplas cadastradas nesta categoria para realizar o sorteio.');
      return;
    }

    setIsDrawing(true);
    setDrawnList(null);
    setCurrentStepIndex(0);

    const ordered = drawMode === 'SEEDED'
      ? performSeededDraw(categoryTeams)
      : performRandomDraw(categoryTeams);

    const steps = prepareDrawAnimationSteps(ordered);
    setAnimationSteps(steps);
    setDrawnList(ordered);

    // Step-by-step reveal timer
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStepIndex(step);
      if (step >= steps.length) {
        clearInterval(interval);
        setIsDrawing(false);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    }, 450);
  };

  const handleApplyBracket = () => {
    if (!drawnList || drawnList.length === 0) return;

    try {
      const newBracket = generateDoubleEliminationBracket(drawnList, category);
      setBrackets(prev => ({
        ...prev,
        [selectedCategoryId]: newBracket,
      }));
      onClose();
      setActiveTab('bracket');
    } catch (err) {
      alert('Erro ao gerar chave: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-6 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Shuffle className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                Sorteio dos Confrontos
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Categoria: <strong className="text-amber-400">{category?.name}</strong> • {categoryTeams.length} duplas cadastradas
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector */}
        {!drawnList && (
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Escolha o Tipo de Sorteio
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Seeded Option */}
              <button
                type="button"
                onClick={() => setDrawMode('SEEDED')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  drawMode === 'SEEDED'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm text-white font-display">Com Cabeças de Chave</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Distribui os favoritos ({seededCount} duplas marcadas) nos extremos da chave para evitar confrontos precoces.
                </p>
                {drawMode === 'SEEDED' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-4 right-4" />
                )}
              </button>

              {/* Random Option */}
              <button
                type="button"
                onClick={() => setDrawMode('RANDOM')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  drawMode === 'RANDOM'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-sm text-white font-display">100% Aleatório</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Embaralha todas as duplas livremente sem distinção de cabeça de chave.
                </p>
                {drawMode === 'RANDOM' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-4 right-4" />
                )}
              </button>
            </div>

            {categoryTeams.length < 2 && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Cadastre pelo menos 2 duplas nesta categoria antes de realizar o sorteio.</span>
              </div>
            )}

            {/* Strict Payment Lock Alert */}
            {!isAllPaid && categoryTeams.length >= 2 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-rose-300">
                      Sorteio Bloqueado: Pagamento Obrigatório
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Só é permitido realizar o sorteio dos confrontos se <strong>todos os atletas</strong> da categoria estiverem com o status <strong>Pago</strong>.
                    </p>
                    <p className="text-xs text-rose-400 font-semibold mt-2">
                      {unpaidAthletes.length} {unpaidAthletes.length === 1 ? 'atleta com pendência' : 'atletas com pendência'}:
                    </p>

                    <div className="mt-2 max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                      {unpaidAthletes.map((ua, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] py-1 px-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-white font-medium">
                            {ua.athleteName} <span className="text-slate-400">({ua.teamName})</span>
                          </span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            ua.status === 'EXEMPT' 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {ua.status === 'EXEMPT' ? 'Isento (Requer Pago)' : 'Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-500/20 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setActiveTab('payments');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Ir para o Financeiro Regularizar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Animated Reveal Arena */}
        {drawnList && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                {isDrawing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sorteando confrontos ao vivo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Sorteio Concluído com Sucesso!
                  </>
                )}
              </span>
            </div>

            {/* List of matches or groups being revealed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {animationSteps.slice(0, currentStepIndex).map((stepItem, idx) => {
                const t1 = stepItem?.team1 || stepItem?.team;
                const t2 = stepItem?.team2;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5 animate-in zoom-in-95 duration-200 shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                      <span className="font-mono text-[10px] font-black tracking-wider text-amber-400">
                        CONFRONTO #{stepItem?.confronto || (idx + 1)}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sorteado
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="truncate max-w-[180px]">{t1?.displayName || 'Aguardando'}</span>
                        {t1?.isSeed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Seed #{t1.seedRank}
                          </span>
                        )}
                      </div>

                      <div className="text-[9px] font-black text-amber-400/80 text-center tracking-widest">VS</div>

                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span className="truncate max-w-[180px]">{t2 ? t2.displayName : 'FOLGA (BYE)'}</span>
                        {t2?.isSeed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Seed #{t2.seedRank}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {!drawnList ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={categoryTeams.length < 2 || isDrawing || !isAllPaid}
                onClick={handleStartDraw}
                title={!isAllPaid ? 'Bloqueado: regularize o pagamento de todos os atletas antes de sortear' : 'Iniciar Sorteio'}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
              >
                {!isAllPaid ? (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" />
                    Sorteio Bloqueado
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Iniciar Sorteio Ao Vivo
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isDrawing}
                onClick={handleStartDraw}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sortear Novamente
              </button>
              <button
                type="button"
                disabled={isDrawing}
                onClick={handleApplyBracket}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-glow-emerald transition-all transform hover:scale-105"
              >
                <Trophy className="w-4 h-4" />
                Aplicar no Chaveamento
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
