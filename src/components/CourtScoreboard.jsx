import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  ArrowLeftRight, 
  Volume2, 
  Trophy, 
  Timer, 
  Flame,
  Award,
  Coffee,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CourtScoreboard({ 
  match, 
  category, 
  isOpen, 
  onClose, 
  onSaveScore 
}) {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [servingTeam, setServingTeam] = useState('team1'); // 'team1' or 'team2'
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [switchSideAlert, setSwitchSideAlert] = useState(false);

  const isBye = Boolean(
    match?.isBye || 
    match?.team1?.isBye || 
    match?.team2?.isBye || 
    match?.team1?.id?.startsWith('BYE') || 
    match?.team2?.id?.startsWith('BYE')
  );

  useEffect(() => {
    if (match) {
      setScore1(match.score1 || 0);
      setScore2(match.score2 || 0);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setSwitchSideAlert(false);
    }
  }, [match]);

  // Stopwatch timer interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Check side switch rule on points change (e.g. every 6 points in 18-point match, or every 7 in 21-point match)
  const switchInterval = (category?.pointsToWin === 21) ? 7 : 6;
  const totalPoints = score1 + score2;

  const handlePointChange = (team, delta) => {
    if (isBye) return;
    if (team === 'team1') {
      const next = Math.max(0, score1 + delta);
      setScore1(next);
      checkSideSwitch(next + score2);
    } else {
      const next = Math.max(0, score2 + delta);
      setScore2(next);
      checkSideSwitch(score1 + next);
    }
  };

  const checkSideSwitch = (total) => {
    if (total > 0 && total % switchInterval === 0) {
      setSwitchSideAlert(true);
      setTimeout(() => setSwitchSideAlert(false), 5000);
    }
  };

  if (!isOpen || !match) return null;

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishMatch = () => {
    if (isBye) return;
    if (score1 === score2) {
      alert('Não pode haver empate no resultado final.');
      return;
    }
    if (window.confirm(`Confirmar vitória de ${score1 > score2 ? match.team1?.displayName : match.team2?.displayName} por ${score1} x ${score2}?`)) {
      onSaveScore(match.id, score1, score2, [{ s1: score1, s2: score2 }]);
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A10] flex flex-col justify-between p-4 sm:p-6 text-white select-none animate-in fade-in">
      
      {/* Top Bar Navigation & Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950">
            {match.court || 'Quadra Central'}
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white font-display">
              {match.roundName} • Jogo #{match.matchNumber}
            </h2>
            <p className="text-xs text-slate-400">
              {category?.name} • Set até {category?.pointsToWin || 18} pts
            </p>
          </div>
        </div>

        {/* Stopwatch & Close */}
        <div className="flex items-center gap-3">
          {/* Game Timer */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Timer className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-sm sm:text-base text-white">
              {formatTimer(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Side Switch Alert Banner */}
      {switchSideAlert && (
        <div className="bg-amber-500 text-slate-950 font-black text-center py-2 px-4 rounded-xl shadow-glow-amber flex items-center justify-center gap-2 animate-bounce">
          <ArrowLeftRight className="w-5 h-5" />
          <span>TROCA DE LADO DE QUADRA! (Múltiplo de {switchInterval} pontos)</span>
        </div>
      )}

      {/* BYE Highlight Banner */}
      {isBye && (
        <div className="bg-purple-950/90 border border-purple-500/60 text-purple-200 py-3 px-5 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg">
          <Coffee className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-sm">Partida com Folga (BYE) • Digitação e alteração de placar desabilitadas</span>
          <Lock className="w-4 h-4 text-purple-300 ml-1" />
        </div>
      )}

      {/* Main Scoreboard Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 my-auto max-w-5xl mx-auto w-full">
        
        {/* Team 1 Side */}
        <div className={`p-6 sm:p-8 rounded-3xl border text-center flex flex-col justify-between transition-all duration-300 ${
          isBye
            ? 'bg-slate-900/40 border-slate-800 opacity-80'
            : servingTeam === 'team1'
            ? 'bg-slate-900/90 border-amber-500/80 shadow-glow-amber ring-2 ring-amber-500/20'
            : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div>
            {/* Serve indicator button */}
            <button
              onClick={() => !isBye && setServingTeam('team1')}
              disabled={isBye}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isBye
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : servingTeam === 'team1'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🏐 {servingTeam === 'team1' ? 'No Saque' : 'Passar Saque'}
            </button>

            <h3 className="text-xl sm:text-3xl font-black font-display text-white mt-3 truncate">
              {match.team1?.displayName || 'Dupla 1'}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {match.team1?.player1?.name} & {match.team1?.player2?.name}
            </p>
          </div>

          {/* Huge Score Number */}
          <div className="my-4">
            <span className="font-mono text-7xl sm:text-9xl font-black text-amber-400 tracking-tighter drop-shadow-md">
              {isBye ? '-' : score1}
            </span>
          </div>

          {/* Increment / Decrement Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handlePointChange('team1', -1)}
              disabled={isBye}
              className={`py-4 rounded-2xl font-black text-2xl transition-transform ${
                isBye
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95'
              }`}
            >
              - 1
            </button>
            <button
              onClick={() => handlePointChange('team1', 1)}
              disabled={isBye}
              className={`py-4 rounded-2xl font-black text-2xl transition-transform ${
                isBye
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-glow-amber active:scale-95'
              }`}
            >
              + 1
            </button>
          </div>
        </div>

        {/* Team 2 Side */}
        <div className={`p-6 sm:p-8 rounded-3xl border text-center flex flex-col justify-between transition-all duration-300 ${
          isBye
            ? 'bg-slate-900/40 border-slate-800 opacity-80'
            : servingTeam === 'team2'
            ? 'bg-slate-900/90 border-amber-500/80 shadow-glow-amber ring-2 ring-amber-500/20'
            : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div>
            {/* Serve indicator button */}
            <button
              onClick={() => !isBye && setServingTeam('team2')}
              disabled={isBye}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isBye
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : servingTeam === 'team2'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🏐 {servingTeam === 'team2' ? 'No Saque' : 'Passar Saque'}
            </button>

            <h3 className="text-xl sm:text-3xl font-black font-display text-white mt-3 truncate">
              {match.team2?.displayName || 'Dupla 2'}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {match.team2?.player1?.name} & {match.team2?.player2?.name}
            </p>
          </div>

          {/* Huge Score Number */}
          <div className="my-4">
            <span className="font-mono text-7xl sm:text-9xl font-black text-amber-400 tracking-tighter drop-shadow-md">
              {isBye ? '-' : score2}
            </span>
          </div>

          {/* Increment / Decrement Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handlePointChange('team2', -1)}
              disabled={isBye}
              className={`py-4 rounded-2xl font-black text-2xl transition-transform ${
                isBye
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95'
              }`}
            >
              - 1
            </button>
            <button
              onClick={() => handlePointChange('team2', 1)}
              disabled={isBye}
              className={`py-4 rounded-2xl font-black text-2xl transition-transform ${
                isBye
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-glow-amber active:scale-95'
              }`}
            >
              + 1
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Bar Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isBye) return;
              setScore1(0);
              setScore2(0);
            }}
            disabled={isBye}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${
              isBye ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Zerar Placar
          </button>

          <button
            onClick={() => !isBye && setSwitchSideAlert(true)}
            disabled={isBye}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${
              isBye ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' : 'bg-slate-900 hover:bg-slate-800 text-cyan-400'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Trocar Lado
          </button>
        </div>

        <button
          onClick={handleFinishMatch}
          disabled={isBye}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all ${
            isBye
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald transform hover:scale-105 active:scale-95'
          }`}
        >
          {isBye ? (
            <>
              <Lock className="w-5 h-5 text-purple-400" />
              Partida de Folga • Digitação Bloqueada
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Encerrar Partida & Salvar Súmula
            </>
          )}
        </button>
      </div>

    </div>
  );
}
