import React, { useState, useEffect } from 'react';
import { Trophy, Check, X, ShieldAlert, Award, Clock, Flame, Coffee, Lock, AlertTriangle, UserX, Activity } from 'lucide-react';
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
  const [finishType, setFinishType] = useState('NORMAL'); // 'NORMAL', 'WO', 'RETIREMENT'
  const [woWinner, setWoWinner] = useState('team1'); // 'team1' | 'team2'
  const [retiredTeam, setRetiredTeam] = useState('team2'); // 'team1' | 'team2'

  const isBye = Boolean(
    match?.isBye || 
    match?.team1?.isBye || 
    match?.team2?.isBye || 
    match?.team1?.id?.startsWith('BYE') || 
    match?.team2?.id?.startsWith('BYE')
  );

  const targetPoints = category?.pointsToWin || 18;

  useEffect(() => {
    if (match) {
      const s1 = (match.status === 'COMPLETED' && match.score1 !== null && match.score1 !== undefined) ? String(match.score1) : '';
      const s2 = (match.status === 'COMPLETED' && match.score2 !== null && match.score2 !== undefined) ? String(match.score2) : '';
      setScore1(s1);
      setScore2(s2);

      if (match.isWO) {
        setFinishType('WO');
        setWoWinner(match.score1 > match.score2 ? 'team1' : 'team2');
      } else if (match.isRetirement) {
        setFinishType('RETIREMENT');
        setRetiredTeam(match.score1 > match.score2 ? 'team2' : 'team1');
      } else {
        setFinishType('NORMAL');
      }
    }
  }, [match]);

  if (!isOpen || !match) return null;

  // Lógica quando o tipo de encerramento muda
  const handleSelectFinishType = (type) => {
    setFinishType(type);

    if (type === 'WO') {
      // W.O.: Vencedora recebe 18 e perdedora recebe 0
      if (woWinner === 'team1') {
        setScore1(String(targetPoints));
        setScore2('0');
      } else {
        setScore1('0');
        setScore2(String(targetPoints));
      }
    } else if (type === 'RETIREMENT') {
      // Retirada: Perdedora fica com os pontos que estava, vencedora recebe 18
      if (retiredTeam === 'team1') {
        // Team 1 se retirou: Team 1 mantém pontos, Team 2 ganha 18
        const current1 = score1 !== '' ? score1 : '0';
        setScore1(current1);
        setScore2(String(targetPoints));
      } else {
        // Team 2 se retirou: Team 2 mantém pontos, Team 1 ganha 18
        const current2 = score2 !== '' ? score2 : '0';
        setScore1(String(targetPoints));
        setScore2(current2);
      }
    }
  };

  // Lógica quando o vencedor do W.O. é alterado
  const handleWoWinnerChange = (winner) => {
    setWoWinner(winner);
    if (winner === 'team1') {
      setScore1(String(targetPoints));
      setScore2('0');
    } else {
      setScore1('0');
      setScore2(String(targetPoints));
    }
  };

  // Lógica quando a equipe que se retirou é alterada
  const handleRetiredTeamChange = (retTeam) => {
    setRetiredTeam(retTeam);
    if (retTeam === 'team1') {
      // Team 1 se retirou: Team 1 mantém seus pontos, Team 2 recebe 18
      const current1 = score1 !== '' ? score1 : '0';
      setScore1(current1);
      setScore2(String(targetPoints));
    } else {
      // Team 2 se retirou: Team 2 mantém seus pontos, Team 1 recebe 18
      const current2 = score2 !== '' ? score2 : '0';
      setScore1(String(targetPoints));
      setScore2(current2);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isBye) return;

    let finalScore1 = Number(score1) || 0;
    let finalScore2 = Number(score2) || 0;

    if (finishType === 'WO') {
      finalScore1 = woWinner === 'team1' ? targetPoints : 0;
      finalScore2 = woWinner === 'team2' ? targetPoints : 0;
    } else if (finishType === 'RETIREMENT') {
      if (retiredTeam === 'team1') {
        finalScore2 = targetPoints;
      } else {
        finalScore1 = targetPoints;
      }
    }

    if (finalScore1 === finalScore2) {
      alert('No futvôlei não pode haver empate. Registre o vencedor com pelo menos 1 ponto a mais.');
      return;
    }

    onSaveScore(
      match.id, 
      finalScore1, 
      finalScore2, 
      [{ s1: finalScore1, s2: finalScore2 }],
      match.categoryId,
      {
        isWO: finishType === 'WO',
        woWinner: finishType === 'WO' ? woWinner : null,
        isRetirement: finishType === 'RETIREMENT',
        retiredTeam: finishType === 'RETIREMENT' ? retiredTeam : null
      }
    );

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    onClose();
  };

  const t1Name = match.team1?.displayName || (match.team1?.isBye ? 'Folga' : 'Dupla 1');
  const t2Name = match.team2?.displayName || (match.team2?.isBye ? 'Folga' : 'Dupla 2');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-5 relative">
        
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

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">

          {/* Special Finish Mode Selector: Normal vs W.O. vs Retirada */}
          {!isBye && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleSelectFinishType('NORMAL')}
                className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all ${
                  finishType === 'NORMAL'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Jogo Normal
              </button>
              <button
                type="button"
                onClick={() => handleSelectFinishType('WO')}
                className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  finishType === 'WO'
                    ? 'bg-amber-500 text-slate-950 shadow-glow-amber'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Vitória W.O.</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectFinishType('RETIREMENT')}
                className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  finishType === 'RETIREMENT'
                    ? 'bg-rose-500 text-white shadow-glow-rose'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Retirada / Lesão</span>
              </button>
            </div>
          )}

          {/* W.O. Configuration Options & Notice */}
          {finishType === 'WO' && !isBye && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>Selecionar Equipe Vencedora do W.O.:</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  {targetPoints} x 0
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleWoWinnerChange('team1')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all truncate ${
                    woWinner === 'team1'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50'
                  }`}
                >
                  <span className="block text-[9px] uppercase tracking-wider opacity-80">Vencedor (18)</span>
                  <span className="truncate block mt-0.5">{t1Name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWoWinnerChange('team2')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all truncate ${
                    woWinner === 'team2'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50'
                  }`}
                >
                  <span className="block text-[9px] uppercase tracking-wider opacity-80">Vencedor (18)</span>
                  <span className="truncate block mt-0.5">{t2Name}</span>
                </button>
              </div>

              <p className="text-[11px] text-amber-200/90 leading-tight">
                ⚡ <strong>Regra Oficial:</strong> A equipe perdedora receberá automaticamente o placar contrário (<strong>0 x 18</strong>) em todas as outras partidas seguintes da repescagem.
              </p>
            </div>
          )}

          {/* Retirada (Abandono no meio do jogo) Configuration */}
          {finishType === 'RETIREMENT' && !isBye && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>Selecionar Equipe que se Retirou:</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                  Vencedora: {targetPoints} pts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRetiredTeamChange('team1')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all truncate ${
                    retiredTeam === 'team1'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md font-extrabold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-rose-500/50'
                  }`}
                >
                  <span className="block text-[9px] uppercase tracking-wider opacity-80">Se Retirou (Mantém pts)</span>
                  <span className="truncate block mt-0.5">{t1Name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRetiredTeamChange('team2')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all truncate ${
                    retiredTeam === 'team2'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md font-extrabold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-rose-500/50'
                  }`}
                >
                  <span className="block text-[9px] uppercase tracking-wider opacity-80">Se Retirou (Mantém pts)</span>
                  <span className="truncate block mt-0.5">{t2Name}</span>
                </button>
              </div>

              <p className="text-[11px] text-rose-200/90 leading-tight">
                🩹 <strong>Regra Oficial:</strong> A equipe perdedora fica com os pontos que fez até o momento e a equipe vencedora recebe o valor de <strong>{targetPoints}</strong>.
              </p>
            </div>
          )}

          {/* Confrontation Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Team 1 Card */}
            <div className={`p-4 rounded-2xl border text-center transition-all ${
              match.team1?.isBye || match.team1?.id?.startsWith('BYE')
                ? 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500'
                : isBye
                ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                : Number(score1) > Number(score2)
                ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/20'
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dupla 1</span>
                {finishType === 'WO' && woWinner === 'team1' && (
                  <span className="text-[9px] font-bold text-amber-400 uppercase">W.O. Ganho</span>
                )}
                {finishType === 'RETIREMENT' && retiredTeam === 'team1' && (
                  <span className="text-[9px] font-bold text-rose-400 uppercase">Retirada</span>
                )}
              </div>
              <p className={`font-extrabold text-sm mt-1 truncate ${
                match.team1?.isBye || match.team1?.id?.startsWith('BYE') ? 'italic text-slate-500' : 'text-white'
              }`}>
                {t1Name}
              </p>
              {match.team1?.isSeed && (
                <span className="text-[10px] text-amber-400 font-semibold">Cabeça #{match.team1.seedRank}</span>
              )}

              {/* Number Input */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team2')}
                  onClick={() => setScore1(String(Math.max(0, (Number(score1) || 0) - 1)))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team2')
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
                  disabled={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team2')}
                  readOnly={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team2')}
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
                  disabled={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team2')}
                  onClick={() => setScore1(String((Number(score1) || 0) + 1))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team2')
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  +
                </button>
              </div>

              {/* Quick Preset */}
              {finishType === 'NORMAL' && (
                <button
                  type="button"
                  disabled={isBye}
                  onClick={() => setScore1(String(targetPoints))}
                  className="mt-2 text-[10px] text-slate-400 hover:text-amber-400 underline transition-all"
                >
                  Set fechado ({targetPoints} pts)
                </button>
              )}
            </div>

            {/* Team 2 Card */}
            <div className={`p-4 rounded-2xl border text-center transition-all ${
              match.team2?.isBye || match.team2?.id?.startsWith('BYE')
                ? 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500'
                : isBye
                ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                : Number(score2) > Number(score1)
                ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/20'
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dupla 2</span>
                {finishType === 'WO' && woWinner === 'team2' && (
                  <span className="text-[9px] font-bold text-amber-400 uppercase">W.O. Ganho</span>
                )}
                {finishType === 'RETIREMENT' && retiredTeam === 'team2' && (
                  <span className="text-[9px] font-bold text-rose-400 uppercase">Retirada</span>
                )}
              </div>
              <p className={`font-extrabold text-sm mt-1 truncate ${
                match.team2?.isBye || match.team2?.id?.startsWith('BYE') ? 'italic text-slate-500' : 'text-white'
              }`}>
                {t2Name}
              </p>
              {match.team2?.isSeed && (
                <span className="text-[10px] text-amber-400 font-semibold">Cabeça #{match.team2.seedRank}</span>
              )}

              {/* Number Input */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team1')}
                  onClick={() => setScore2(String(Math.max(0, (Number(score2) || 0) - 1)))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team1')
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
                  disabled={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team1')}
                  readOnly={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team1')}
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
                  disabled={isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team1')}
                  onClick={() => setScore2(String((Number(score2) || 0) + 1))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${
                    isBye || finishType === 'WO' || (finishType === 'RETIREMENT' && retiredTeam === 'team1')
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  +
                </button>
              </div>

              {/* Quick Preset */}
              {finishType === 'NORMAL' && (
                <button
                  type="button"
                  disabled={isBye}
                  onClick={() => setScore2(String(targetPoints))}
                  className="mt-2 text-[10px] text-slate-400 hover:text-amber-400 underline transition-all"
                >
                  Set fechado ({targetPoints} pts)
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
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
