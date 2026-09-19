import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Trophy, 
  Play, 
  Flame, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Tv, 
  Printer, 
  Shuffle, 
  ShieldAlert, 
  Crown,
  Sparkles,
  ArrowRight,
  Maximize2,
  XCircle,
  Coffee,
  Lock
} from 'lucide-react';

export default function TournamentBracket({ 
  bracket, 
  allBrackets,
  category, 
  courts,
  targetMatchId,
  onOpenScoreModal, 
  onOpenCourtScoreboard, 
  onOpenDrawModal,
  onResetBracket,
  onOpenLiveArena,
  onUpdateCourt,
  isReadOnly = false
}) {
  const [activeBracketView, setActiveBracketView] = useState('ALL'); // 'ALL', 'WINNERS', 'LOSERS', 'FINAL'

  // Auto-scroll and highlight target match when redirected from Telão
  useEffect(() => {
    if (targetMatchId) {
      setTimeout(() => {
        const el = document.getElementById(`match-card-${targetMatchId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [targetMatchId, bracket]);

  if (!category) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-8 border border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center mx-auto">
          <GitBranch className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-display text-white">
          Nenhuma Categoria Cadastrada
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          Cadastre ao menos uma categoria e suas duplas para gerar e acompanhar o chaveamento oficial do torneio.
        </p>
      </div>
    );
  }

  if (!bracket || !bracket.matches) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <GitBranch className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-display text-white">
          Chave de Eliminatória Dupla não gerada
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          A chave da categoria <strong className="text-amber-400">{category?.name}</strong> ainda não foi sorteada. Clique no botão abaixo para realizar o sorteio oficial dos confrontos.
        </p>
        <button
          onClick={onOpenDrawModal}
          disabled={isReadOnly}
          title={isReadOnly ? 'Apenas visualização: faça login para realizar o sorteio' : 'Realizar Sorteio'}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-glow-amber transition-all transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Shuffle className="w-4 h-4" />
          Realizar Sorteio da Chave
        </button>
      </div>
    );
  }

  const { matches, winnersRounds, losersRounds, grandFinal } = bracket;

  // Collect all courts currently in use in active matches across all categories
  const occupiedCourtsMap = {};
  const currentBracketsList = allBrackets ? Object.values(allBrackets) : [bracket];
  currentBracketsList.forEach(b => {
    if (!b || !b.matches) return;
    Object.values(b.matches).forEach(m => {
      if (m.court && m.status !== 'COMPLETED' && !m.isBye) {
        occupiedCourtsMap[m.court] = {
          matchNumber: m.matchNumber,
          categoryName: b.categoryName || '',
          matchId: m.id
        };
      }
    });
  });

  // Render individual match card
  const renderMatchCard = (matchId) => {
    const match = matches[matchId];
    if (!match) return null;

    const t1 = match.team1;
    const t2 = match.team2;
    const isCompleted = match.status === 'COMPLETED';
    const isLive = match.status === 'LIVE';
    const isReady = match.status === 'READY';
    const isBye = Boolean(
      match.isBye || 
      match.team1?.isBye || 
      match.team2?.isBye || 
      match.team1?.id?.startsWith('BYE') || 
      match.team2?.id?.startsWith('BYE')
    );
    const hasCourtAssigned = Boolean(match.court) && !isCompleted && !isBye;
    const isTarget = targetMatchId === match.id;
    // Highlight upcoming match in sequence: ready with both teams, no court yet
    const isUpcomingSequence = isReady && !hasCourtAssigned && !isCompleted && !isBye && t1 && t2 && !t1.isBye && !t2.isBye;

    const t1IsBye = Boolean(t1?.isBye || t1?.id?.startsWith('BYE'));
    const t2IsBye = Boolean(t2?.isBye || t2?.id?.startsWith('BYE'));
    const advancedTeam = isBye ? (!t1IsBye && t1 ? t1 : (!t2IsBye && t2 ? t2 : null)) : null;

    const t1IsWinner = isCompleted && match.winnerId && match.winnerId === t1?.id;
    const t2IsWinner = isCompleted && match.winnerId && match.winnerId === t2?.id;

    // Formatting for unplayed scores: keep clean waiting for score input
    const displayScore1 = (match.score1 !== null && match.score1 !== undefined && (isCompleted || isLive) && !isBye) ? match.score1 : '-';
    const displayScore2 = (match.score2 !== null && match.score2 !== undefined && (isCompleted || isLive) && !isBye) ? match.score2 : '-';

    return (
      <div
        key={match.id}
        id={`match-card-${match.id}`}
        className={`w-80 sm:w-[340px] rounded-2xl p-4 transition-all duration-300 relative group flex flex-col justify-between border ${
          isTarget
            ? 'bg-gradient-to-b from-amber-500/25 via-slate-900/95 to-slate-900 border-amber-400 ring-4 ring-amber-400/60 shadow-2xl scale-[1.02] z-10'
            : isBye
            ? 'bg-gradient-to-b from-purple-950/40 via-slate-900/95 to-slate-950 border-purple-500/50 shadow-lg shadow-purple-950/25 ring-1 ring-purple-500/30'
            : hasCourtAssigned
            ? 'bg-gradient-to-b from-emerald-950/80 via-slate-900/95 to-slate-900/95 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/25'
            : isUpcomingSequence
            ? 'bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 border-amber-500/80 ring-2 ring-amber-500/30 shadow-md hover:border-amber-400 hover:scale-[1.01]'
            : isLive
            ? 'bg-slate-900/95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-glow-emerald'
            : isCompleted
            ? 'bg-slate-900/80 border-slate-700/60 opacity-90'
            : isReady
            ? 'bg-slate-900/90 border-amber-500/50 hover:border-amber-500 shadow-md'
            : 'bg-slate-950/60 border-slate-800/80 opacity-70'
        }`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`font-mono px-1.5 py-0.5 rounded border ${
              isBye
                ? 'text-purple-300 bg-purple-950/80 border-purple-500/60'
                : hasCourtAssigned 
                ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/60' 
                : isUpcomingSequence
                ? 'text-amber-300 bg-amber-950/70 border-amber-500/60 animate-pulse'
                : 'text-amber-400 bg-slate-800 border-slate-700'
            }`}>
              JOGO {match.matchNumber}
            </span>
            <span className="text-slate-400 font-normal">{match.roundName}</span>
          </div>

          {/* Status Badge */}
          {isBye ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-200 border border-purple-400/40 flex items-center gap-1 shadow-sm">
              <Coffee className="w-3 h-3 text-purple-400" />
              FOLGA (BYE)
            </span>
          ) : hasCourtAssigned ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-glow-emerald animate-pulse">
              <Flame className="w-3 h-3 fill-current" /> EM JOGO • {match.court}
            </span>
          ) : isUpcomingSequence ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
              <Clock className="w-3 h-3" /> PRÓXIMO DA FILA
            </span>
          ) : isLive ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 flex items-center gap-1 animate-pulse">
              <Flame className="w-3 h-3 fill-current" /> AO VIVO
            </span>
          ) : isCompleted ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              FINALIZADO
            </span>
          ) : isReady ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PRONTO
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/50 text-slate-500">
              AGUARDANDO
            </span>
          )}
        </div>

        {/* Bye Informative Banner */}
        {isBye && (
          <div className="my-1.5 p-2 rounded-xl bg-purple-950/45 border border-purple-500/30 flex items-center gap-2">
            <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 flex-shrink-0">
              <Coffee className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-purple-200 truncate">
                {advancedTeam ? `${advancedTeam.displayName} em folga` : 'Confronto com Folga (BYE)'}
              </p>
              <p className="text-[10px] text-purple-300/80">
                Avançou direto • Digitação desabilitada
              </p>
            </div>
          </div>
        )}

        {/* Teams & Scores */}
        <div className="space-y-1.5 py-1">
          {/* Team 1 */}
          <div
            className={`p-2 rounded-xl flex items-center justify-between gap-2 transition-all ${
              t1IsBye
                ? 'bg-slate-950/40 border border-dashed border-slate-800/80 text-slate-500'
                : isBye && t1
                ? 'bg-purple-950/30 border border-purple-500/40 text-purple-200'
                : t1IsWinner
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                : hasCourtAssigned
                ? 'bg-slate-950/90 border border-emerald-500/30 text-slate-200'
                : isUpcomingSequence
                ? 'bg-slate-950/90 border border-amber-500/30 text-slate-200'
                : 'bg-slate-950/70 border border-slate-800/80 text-slate-300'
            }`}
          >
            <div className="min-w-0 flex items-center gap-1.5">
              {isBye && t1 && !t1IsBye ? (
                <Crown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              ) : t1IsWinner ? (
                <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              ) : null}
              <span className={`text-xs truncate ${
                t1IsBye
                  ? 'italic text-slate-500'
                  : isBye && t1
                  ? 'font-bold text-purple-100'
                  : t1IsWinner
                  ? 'font-black text-white'
                  : t1
                  ? 'font-semibold text-slate-200'
                  : 'italic text-slate-500'
              }`}>
                {t1 ? (t1IsBye ? 'Folga (Sem adversário)' : t1.displayName) : 'A definir'}
              </span>
              {t1?.isSeed && (
                <span className="text-[10px] text-amber-400 font-bold">#{t1.seedRank}</span>
              )}
              {isBye && t1 && !t1IsBye && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 font-bold border border-purple-400/30 flex-shrink-0">
                  Classificado
                </span>
              )}
            </div>
            <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
              t1IsBye
                ? 'bg-slate-900/80 text-slate-600 border border-slate-800'
                : isBye && t1
                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px]'
                : t1IsWinner
                ? 'bg-amber-500 text-slate-950'
                : hasCourtAssigned
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {t1IsBye ? '-' : isBye && t1 ? 'BYE' : displayScore1}
            </span>
          </div>

          {/* Team 2 */}
          <div
            className={`p-2 rounded-xl flex items-center justify-between gap-2 transition-all ${
              t2IsBye
                ? 'bg-slate-950/40 border border-dashed border-slate-800/80 text-slate-500'
                : isBye && t2
                ? 'bg-purple-950/30 border border-purple-500/40 text-purple-200'
                : t2IsWinner
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                : hasCourtAssigned
                ? 'bg-slate-950/90 border border-emerald-500/30 text-slate-200'
                : isUpcomingSequence
                ? 'bg-slate-950/90 border border-amber-500/30 text-slate-200'
                : 'bg-slate-950/70 border border-slate-800/80 text-slate-300'
            }`}
          >
            <div className="min-w-0 flex items-center gap-1.5">
              {isBye && t2 && !t2IsBye ? (
                <Crown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              ) : t2IsWinner ? (
                <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              ) : null}
              <span className={`text-xs truncate ${
                t2IsBye
                  ? 'italic text-slate-500'
                  : isBye && t2
                  ? 'font-bold text-purple-100'
                  : t2IsWinner
                  ? 'font-black text-white'
                  : t2
                  ? 'font-semibold text-slate-200'
                  : 'italic text-slate-500'
              }`}>
                {t2 ? (t2IsBye ? 'Folga (Sem adversário)' : t2.displayName) : 'A definir'}
              </span>
              {t2?.isSeed && (
                <span className="text-[10px] text-amber-400 font-bold">#{t2.seedRank}</span>
              )}
              {isBye && t2 && !t2IsBye && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 font-bold border border-purple-400/30 flex-shrink-0">
                  Classificado
                </span>
              )}
            </div>
            <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
              t2IsBye
                ? 'bg-slate-900/80 text-slate-600 border border-slate-800'
                : isBye && t2
                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px]'
                : t2IsWinner
                ? 'bg-amber-500 text-slate-950'
                : hasCourtAssigned
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {t2IsBye ? '-' : isBye && t2 ? 'BYE' : displayScore2}
            </span>
          </div>
        </div>

        {/* Footer & Court Selection & Score trigger */}
        {isBye ? (
          <div className="mt-3.5 pt-2.5 border-t border-purple-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-500 text-[11px] font-semibold select-none cursor-not-allowed">
              <Coffee className="w-3.5 h-3.5 text-purple-400/70" />
              <span>Não requer quadra</span>
            </div>

            <div 
              title="Partida resolvida por Folga (BYE). Placar e súmula desabilitados para digitação."
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold select-none cursor-not-allowed shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Digitação Bloqueada</span>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
            {/* Court selector with occupied status */}
            <select
              value={match.court || ''}
              onChange={(e) => onUpdateCourt(match.id, e.target.value)}
              className={`text-xs font-bold rounded-xl px-3 py-2 border transition-all focus:outline-none flex-1 truncate min-w-[130px] ${
                hasCourtAssigned
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                  : isUpcomingSequence
                  ? 'bg-amber-950/80 border-amber-500/70 text-amber-300 focus:border-amber-400'
                  : 'bg-slate-950 border-slate-700/80 text-slate-300 focus:border-amber-500'
              }`}
            >
              <option value="">{hasCourtAssigned ? 'Liberar Quadra' : '+ Chamar Quadra'}</option>
              {(courts || []).map(c => {
                const courtName = c.name;
                const occupiedInfo = occupiedCourtsMap[courtName];
                const isOccupiedByAnother = occupiedInfo && occupiedInfo.matchId !== match.id;

                return (
                  <option 
                    key={c.id || courtName} 
                    value={courtName}
                    disabled={isOccupiedByAnother}
                  >
                    {courtName} {isOccupiedByAnother ? `(Ocupada - Jogo #${occupiedInfo.matchNumber})` : ''}
                  </option>
                );
              })}
            </select>

            {/* Action buttons */}
            {t1 && t2 && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onOpenCourtScoreboard(match)}
                  title="Placar Digital para Celular do Árbitro / TV"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 border border-slate-700/90 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Placar</span>
                </button>

                <button
                  onClick={() => !isReadOnly && onOpenScoreModal(match)}
                  disabled={isReadOnly}
                  title={isReadOnly ? 'Apenas visualização: faça login para lançar súmula' : 'Lançar Súmula Rápida'}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black shadow-glow-amber transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Súmula</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bracket Header Toolbar */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category?.color || '#F59E0B' }}
            />
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
              Chave: {category?.name}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Eliminatória Dupla Oficial
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cada dupla tem direito a uma repescagem. São necessárias 2 derrotas para a eliminação total.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveBracketView('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeBracketView === 'ALL' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveBracketView('WINNERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeBracketView === 'WINNERS' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vencedores
          </button>
          <button
            onClick={() => setActiveBracketView('LOSERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeBracketView === 'LOSERS' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Repescagem
          </button>
          <button
            onClick={() => setActiveBracketView('FINAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeBracketView === 'FINAL' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Grande Final
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            title="Imprimir Súmula e Tabela"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenLiveArena}
            title="Abrir Modo Telão da Arena"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Tv className="w-4 h-4" /> Telão
          </button>
          <button
            onClick={onResetBracket}
            disabled={isReadOnly}
            title={isReadOnly ? 'Apenas visualização: faça login para cancelar o sorteio' : `Cancelar sorteio da categoria ${category?.name || ''}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 hover:text-rose-200 border border-rose-800/80 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Cancelar Sorteio</span>
          </button>
        </div>
      </div>

      {/* 1. WINNERS BRACKET (CHAVE DOS VENCEDORES) */}
      {(activeBracketView === 'ALL' || activeBracketView === 'WINNERS') && (
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-amber-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Chave Principal dos Vencedores (Winners Bracket)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Quem vencer segue em frente rumo à Grande Final</span>
          </div>

          {/* Horizontal Rounds Flow */}
          <div className="overflow-x-auto pb-4 pt-2">
            <div className="flex items-start gap-8 min-w-max">
              {winnersRounds.map((roundObj, rIdx) => (
                <div key={roundObj.round} className="space-y-4">
                  <div className="text-center bg-slate-950/80 py-1.5 px-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold font-display text-amber-400 uppercase tracking-wider">
                      {roundObj.name}
                    </span>
                  </div>

                  <div className="flex flex-col justify-around gap-6 h-full">
                    {roundObj.matchIds.map((mId) => renderMatchCard(mId))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. LOSERS BRACKET (CHAVE DE REPESCAGEM) */}
      {(activeBracketView === 'ALL' || activeBracketView === 'LOSERS') && (
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-cyan-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Chave de Repescagem (Losers Bracket — 2ª Chance)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Perdedores da chave principal lutam pelo pódio e vaga na Final</span>
          </div>

          {/* Horizontal Rounds Flow */}
          <div className="overflow-x-auto pb-4 pt-2">
            <div className="flex items-start gap-8 min-w-max">
              {losersRounds.map((roundObj, lrIdx) => (
                <div key={roundObj.round} className="space-y-4">
                  <div className="text-center bg-slate-950/80 py-1.5 px-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold font-display text-cyan-400 uppercase tracking-wider">
                      {roundObj.name}
                    </span>
                  </div>

                  <div className="flex flex-col justify-around gap-6 h-full">
                    {roundObj.matchIds.map((mId) => renderMatchCard(mId))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. GRAND FINAL (GRANDE FINAL) */}
      {(activeBracketView === 'ALL' || activeBracketView === 'FINAL') && (
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black">
                <Crown className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Grande Decisão — Disputa do Título
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-semibold">Campeão dos Vencedores vs Campeão da Repescagem</span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            {grandFinal.map((mId) => renderMatchCard(mId))}
          </div>
        </div>
      )}

    </div>
  );
}
