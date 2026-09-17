import React, { useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Sparkles, Share2, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FinalStandings({ 
  bracket, 
  category, 
  onGoToBracket 
}) {
  const standings = bracket?.standings || [];

  useEffect(() => {
    if (standings.length > 0) {
      try {
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    }
  }, [standings]);

  if (!bracket || standings.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-display text-white">
          Pódio em Disputa
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          A Grande Final da categoria <strong className="text-amber-400">{category?.name || 'do torneio'}</strong> ainda não foi finalizada. Acompanhe os confrontos na chave de eliminatória dupla.
        </p>
        <button
          onClick={onGoToBracket}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-amber transition-all"
        >
          Ver Chave em Andamento
        </button>
      </div>
    );
  }

  const champion = standings.find(s => s.place === 1)?.team;
  const runnerUp = standings.find(s => s.place === 2)?.team;
  const thirdPlace = standings.find(s => s.place === 3)?.team;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Celebration Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl text-center relative overflow-hidden border border-amber-500/30">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          RESULTADO OFICIAL DO TORNEIO
        </span>

        <h2 className="text-2xl sm:text-4xl font-black font-display text-white tracking-tight">
          Quadro de Honra & Campeões
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Categoria <strong className="text-amber-400">{category?.name}</strong> • Eliminatória Dupla Finalizada
        </p>
      </div>

      {/* 3D-styled Olympic Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        
        {/* 2nd Place (Vice-Campeão) */}
        {runnerUp && (
          <div className="order-2 md:order-1 glass-card p-6 rounded-3xl border border-slate-700/80 text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 text-slate-950 flex items-center justify-center mx-auto font-black text-xl shadow-lg">
              <Medal className="w-8 h-8 text-slate-900" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mt-3">
              2º LUGAR — PRATA 🥈
            </span>
            <h3 className="text-xl font-extrabold font-display text-white mt-1">
              {runnerUp.displayName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {runnerUp.player1?.name} & {runnerUp.player2?.name}
            </p>
            {runnerUp.city && (
              <span className="text-[11px] text-slate-500 mt-1 block">{runnerUp.city}</span>
            )}
          </div>
        )}

        {/* 1st Place (Campeão Ouro) */}
        {champion && (
          <div className="order-1 md:order-2 glass-panel p-8 rounded-3xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 text-center relative shadow-glow-amber scale-105 z-10">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 px-4 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg">
              <Crown className="w-4 h-4" /> GRANDE CAMPEÃO 🏆
            </div>

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 flex items-center justify-center mx-auto font-black text-3xl shadow-glow-amber mt-2">
              <Trophy className="w-10 h-10 text-slate-950 fill-current" />
            </div>

            <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest block mt-4">
              1º LUGAR — OURO
            </span>

            <h3 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
              {champion.displayName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {champion.player1?.name} & {champion.player2?.name}
            </p>
            {champion.city && (
              <span className="text-xs text-amber-400/80 font-semibold mt-1 block">{champion.city}</span>
            )}
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {thirdPlace && (
          <div className="order-3 md:order-3 glass-card p-6 rounded-3xl border border-amber-800/40 text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100 flex items-center justify-center mx-auto font-black text-xl shadow-lg">
              <Award className="w-8 h-8 text-amber-200" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-wider block mt-3">
              3º LUGAR — BRONZE 🥉
            </span>
            <h3 className="text-xl font-extrabold font-display text-white mt-1">
              {thirdPlace.displayName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {thirdPlace.player1?.name} & {thirdPlace.player2?.name}
            </p>
            {thirdPlace.city && (
              <span className="text-[11px] text-slate-500 mt-1 block">{thirdPlace.city}</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
