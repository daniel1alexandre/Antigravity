import React, { useState } from 'react';
import { Shuffle, Sparkles, Trophy, Play, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { performSeededDraw, performRandomDraw, prepareDrawAnimationSteps } from '../utils/drawEngine';
import { generateDoubleEliminationBracket } from '../utils/doubleEliminationEngine';

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

  const category = categories.find(c => c.id === selectedCategoryId) || categories[0];
  const categoryTeams = teams.filter(t => t.categoryId === selectedCategoryId);
  const seededCount = categoryTeams.filter(t => t.isSeed).length;

  const handleStartDraw = () => {
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
              <span className="text-xs font-mono text-slate-400">
                {Math.min(currentStepIndex, animationSteps.length)} de {animationSteps.length} jogos revelados
              </span>
            </div>

            {/* Revealed Confrontations Grid */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {animationSteps.slice(0, currentStepIndex).map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-300"
                >
                  <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    JOGO {idx + 1}
                  </span>

                  <div className="flex-1 flex items-center justify-between text-xs sm:text-sm font-bold gap-2">
                    <div className="text-right flex-1 truncate">
                      <span className="text-white">{step.team1?.displayName || 'Folga (BYE)'}</span>
                      {step.team1?.isSeed && (
                        <span className="ml-1 text-[10px] text-amber-400 font-normal">#{step.team1.seedRank}</span>
                      )}
                    </div>

                    <span className="text-amber-500 font-extrabold text-xs px-1.5">VS</span>

                    <div className="text-left flex-1 truncate">
                      <span className="text-white">{step.team2?.displayName || 'Folga (BYE)'}</span>
                      {step.team2?.isSeed && (
                        <span className="ml-1 text-[10px] text-amber-400 font-normal">#{step.team2.seedRank}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                disabled={categoryTeams.length < 2 || isDrawing}
                onClick={handleStartDraw}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 shadow-glow-amber transition-all transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Sorteio Ao Vivo
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
