import React, { useState, useEffect } from 'react';
import { Trophy, Check, X, ShieldAlert, Award, Clock, Flame, Coffee, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MatchScoreModal({ 
  match, 
  isOpen, 
  onClose, 
  onSaveScore, 
  category 
}) {
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [isWO, setIsWO] = useState(false);
  const [woWinner, setWoWinner] = useState('team1');

  const isBye = Boolean(
    match?.isBye || 
    match?.team1?.isBye || 
    match?.team2?.isBye || 
    match?.team1?.id?.startsWith('BYE') || 
    match?.team2?.id?.startsWith('BYE')
  );

  useEffect(() => {
    if (match) {
      // Keep inputs completely blank waiting for score entry if match is not completed or scores are null/undefined/0
      const s1 = (match.status === 'COMPLETED' && match.score1 !== null && match.score1 !== undefined) ? String(match.score1) : '';
      const s2 = (match.status === 'COMPLETED' && match.score2 !== null && match.score2 !== undefined) ? String(match.score2) : '';
      setScore1(s1);
      setScore2(s2);
      setIsWO(false);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const targetPoints = category?.pointsToWin || 18;

  const handleSave = (e) => {
    e.preventDefault();
    if (isBye) return;

    let finalScore1 = Number(score1);
    let finalScore2 = Number(score2);

    if (isWO) {
      finalScore1 = woWinner === 'team1' ? targetPoints : 0;
      finalScore2 = woWinner === 'team2' ? targetPoints : 0;
    }

    if (finalScore1 === finalScore2) {
      alert('No futvôlei não pode haver empate. Registre o vencedor com pelo menos 1 ponto a mais.');
      return;
    }

    onSaveScore(match.id, finalScore1, finalScore2, [{ s1: finalScore1, s2: finalScore2 }]);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-amber-400">
                JOGO #{match.matchNumber} • {match.roundName}
              </span>
              {isBye && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                  <Coffee className="w-3 h-3 text-purple-400" />
                  FOLGA (BYE)
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold font-display text-white mt-0.5">
              Lançamento de Súmula
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bye Alert Banner */}
        {isBye && (
          <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/40 flex items-start gap-3 shadow-inner">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 flex-shrink-0 mt-0.5">
              <Coffee className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-purple-200 uppercase tracking-wide">
                  Confronto de Folga (BYE)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-300" /> Digitação Bloqueada
                </span>
              </div>
              <p className="text-xs text-purple-200/90 mt-1 leading-relaxed">
                Esta partida é uma folga automática do chaveamento. A dupla foi promovida diretamente para a fase seguinte sem disputa, portanto este placar não pode ser digitado ou alterado.
              </p>
            </div>
          </div>
        )}

        {/* Score Inputs Form */}
        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Confrontation Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Team 1 */}
            <div className={`p-4 rounded-2xl border text-center transition-all ${
              match.team1?.isBye || match.team1?.id?.startsWith('BYE')
                ? 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500'
                : isBye
                ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                : score1 > score2
                ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/20'
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Dupla 1</span>
              <p className={`font-extrabold text-sm mt-1 truncate ${
                match.team1?.isBye || match.team1?.id?.startsWith('BYE') ? 'italic text-slate-500' : 'text-white'
              }`}>
                {match.team1 ? (match.team1.isBye || match.team1.id?.startsWith('BYE') ? 'Folga (Sem adversário)' : match.team1.displayName) : 'Dupla 1'}
              </p>
              {match.team1?.isSeed && (
                <span className="text-[10px] text-amber-400 font-semibold">Cabeça #{match.team1.seedRank}</span>
              )}

              {/* Number Input */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isBye}
                  onClick={() => setScore1(String(Math.max(0, (Number(score1) || 0) - 1)))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye 
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  disabled={isBye}
                  readOnly={isBye}
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  className={`w-16 h-12 rounded-xl border text-center font-mono font-black text-2xl focus:outline-none transition-all ${
                    isBye 
                      ? 'bg-slate-950/90 border-slate-800 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-slate-900 border-slate-700 text-amber-400 placeholder:text-slate-600 focus:border-amber-500'
                  }`}
                />
                <button
                  type="button"
                  disabled={isBye}
                  onClick={() => setScore1(String((Number(score1) || 0) + 1))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye 
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  +
                </button>
              </div>

              {/* Quick Preset */}
              <button
                type="button"
                disabled={isBye}
                onClick={() => setScore1(String(targetPoints))}
                className={`mt-2 text-[10px] transition-all ${
                  isBye 
                    ? 'text-slate-600 cursor-not-allowed opacity-40' 
                    : 'text-slate-400 hover:text-amber-400 underline'
                }`}
              >
                Set fechado ({targetPoints} pts)
              </button>
            </div>

            {/* Team 2 */}
            <div className={`p-4 rounded-2xl border text-center transition-all ${
              match.team2?.isBye || match.team2?.id?.startsWith('BYE')
                ? 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500'
                : isBye
                ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                : Number(score2) > Number(score1)
                ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/20'
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Dupla 2</span>
              <p className={`font-extrabold text-sm mt-1 truncate ${
                match.team2?.isBye || match.team2?.id?.startsWith('BYE') ? 'italic text-slate-500' : 'text-white'
              }`}>
                {match.team2 ? (match.team2.isBye || match.team2.id?.startsWith('BYE') ? 'Folga (Sem adversário)' : match.team2.displayName) : 'Dupla 2'}
              </p>
              {match.team2?.isSeed && (
                <span className="text-[10px] text-amber-400 font-semibold">Cabeça #{match.team2.seedRank}</span>
              )}

              {/* Number Input */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isBye}
                  onClick={() => setScore2(String(Math.max(0, (Number(score2) || 0) - 1)))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye 
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  disabled={isBye}
                  readOnly={isBye}
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  className={`w-16 h-12 rounded-xl border text-center font-mono font-black text-2xl focus:outline-none transition-all ${
                    isBye 
                      ? 'bg-slate-950/90 border-slate-800 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-slate-900 border-slate-700 text-amber-400 placeholder:text-slate-600 focus:border-amber-500'
                  }`}
                />
                <button
                  type="button"
                  disabled={isBye}
                  onClick={() => setScore2(String((Number(score2) || 0) + 1))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye 
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  +
                </button>
              </div>

              {/* Quick Preset */}
              <button
                type="button"
                disabled={isBye}
                onClick={() => setScore2(String(targetPoints))}
                className={`mt-2 text-[10px] transition-all ${
                  isBye 
                    ? 'text-slate-600 cursor-not-allowed opacity-40' 
                    : 'text-slate-400 hover:text-amber-400 underline'
                }`}
              >
                Set fechado ({targetPoints} pts)
              </button>
            </div>
          </div>

          {/* W.O. Checkbox */}
          {!isBye && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWO}
                  onChange={(e) => setIsWO(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                Vitória por W.O. / Desistência
              </label>

              {isWO && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Vencedor do W.O.:</span>
                  <select
                    value={woWinner}
                    onChange={(e) => setWoWinner(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  >
                    <option value="team1">{match.team1?.displayName}</option>
                    <option value="team2">{match.team2?.displayName}</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isBye}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isBye
                  ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed opacity-50'
                  : 'text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-glow-emerald transform hover:scale-105'
              }`}
            >
              {isBye ? (
                <>
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Digitação Bloqueada (Folga)</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Resultado & Avançar</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
