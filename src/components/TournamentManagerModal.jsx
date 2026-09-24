import React, { useState } from 'react';
import { 
  Trophy, 
  X, 
  PlusCircle, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  Users, 
  Layers, 
  GitBranch, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function TournamentManagerModal({
  isOpen,
  onClose,
  tournaments = [],
  activeTournamentId,
  onSelectTournament,
  onClearTournament,
  onDeleteTournament,
  onOpenCreateModal,
  isReadOnly = false,
}) {
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'CLEAR' | 'DELETE', tournament: object }

  if (!isOpen) return null;

  const handleExecuteConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'CLEAR') {
      onClearTournament(confirmAction.tournament.id);
    } else if (confirmAction.type === 'DELETE') {
      onDeleteTournament(confirmAction.tournament.id);
    }
    setConfirmAction(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-glow-amber">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                Gerenciar Torneios
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {tournaments.length} {tournaments.length === 1 ? 'torneio' : 'torneios'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Crie novos eventos sem alterar os anteriores, alterne entre eles, limpe dados ou exclua
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateModal();
                }}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-slate-950" />
                <span>Novo Torneio</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action button mobile */}
        {!isReadOnly && (
          <div className="sm:hidden px-4 pt-3 pb-1 border-b border-slate-800/80 bg-slate-950/40">
            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-glow-amber"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Criar Novo Torneio</span>
            </button>
          </div>
        )}

        {/* Tournaments List Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {tournaments.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold text-sm">Nenhum torneio encontrado</p>
              <p className="text-slate-500 text-xs mt-1">Clique em "Novo Torneio" para começar.</p>
            </div>
          ) : (
            tournaments.map((tourn) => {
              const isActive = tourn.id === activeTournamentId;
              const catsCount = Array.isArray(tourn.categories) ? tourn.categories.length : 0;
              const teamsCount = Array.isArray(tourn.teams) ? tourn.teams.length : 0;
              const bracketsCount = tourn.brackets ? Object.keys(tourn.brackets).length : 0;

              return (
                <div
                  key={tourn.id}
                  className={`p-4 sm:p-5 rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/50 shadow-glow-amber/20 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Left: Tournament Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white font-display truncate">
                          {tourn.eventInfo?.name || 'Torneio de Futvôlei'}
                        </h3>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                            Ativo no Momento
                          </span>
                        )}
                      </div>

                      {/* Metadata Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                        {tourn.eventInfo?.date && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{tourn.eventInfo.date}</span>
                          </div>
                        )}
                        {(tourn.eventInfo?.location || tourn.eventInfo?.city) && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            <span>
                              {tourn.eventInfo.location}
                              {tourn.eventInfo.location && tourn.eventInfo.city ? ' - ' : ''}
                              {tourn.eventInfo.city}
                            </span>
                          </div>
                        )}
                        {tourn.eventInfo?.organizer && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Org:</span>
                            <span className="text-slate-300 font-medium">{tourn.eventInfo.organizer}</span>
                          </div>
                        )}
                      </div>

                      {/* Metrics Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          <Layers className="w-3 h-3 text-purple-400" />
                          <strong className="text-purple-300 font-bold">{catsCount}</strong> categorias
                        </span>
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          <Users className="w-3 h-3 text-amber-400" />
                          <strong className="text-amber-300 font-bold">{teamsCount}</strong> duplas
                        </span>
                        {bracketsCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            <GitBranch className="w-3 h-3 text-cyan-400" />
                            <strong className="text-cyan-300 font-bold">{bracketsCount}</strong> chaves
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                      
                      {/* Selecionar Torneio */}
                      {!isActive ? (
                        <button
                          onClick={() => {
                            onSelectTournament(tourn.id);
                            onClose();
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all border border-slate-700 hover:border-amber-400 shadow-sm"
                          title="Abrir este torneio no painel principal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir Torneio</span>
                        </button>
                      ) : (
                        <div className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Aberto</span>
                        </div>
                      )}

                      {/* Botão Limpar Informações (Mantendo Categorias) */}
                      {!isReadOnly && (
                        <button
                          onClick={() => setConfirmAction({ type: 'CLEAR', tournament: tourn })}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-400 text-xs font-semibold transition-all"
                          title="Limpar todas as informações contidas no torneio, mantendo apenas as categorias"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Limpar</span>
                        </button>
                      )}

                      {/* Botão Excluir Torneio */}
                      {!isReadOnly && (
                        <button
                          onClick={() => setConfirmAction({ type: 'DELETE', tournament: tourn })}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 text-xs transition-all"
                          title="Excluir este torneio permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Dica: O botão <span className="text-amber-400 font-semibold">Limpar</span> remove duplas e chaves, preservando todas as categorias criadas.
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all ml-auto"
          >
            Concluir
          </button>
        </div>

      </div>

      {/* Confirmation Modal Overlay */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-2xl flex-shrink-0 ${
                  confirmAction.type === 'DELETE'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {confirmAction.type === 'DELETE' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <RotateCcw className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  {confirmAction.type === 'DELETE' ? 'Excluir Torneio?' : 'Limpar Dados do Torneio?'}
                </h4>
                <p className="text-xs text-slate-300 font-medium">
                  Torneio: <strong className="text-amber-300">{confirmAction.tournament.eventInfo?.name}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {confirmAction.type === 'DELETE' ? (
                <span>
                  Tem certeza que deseja excluir este torneio permanentemente? Todos os dados associados a ele serão apagados do sistema e esta ação não poderá ser desfeita.
                </span>
              ) : (
                <span>
                  Esta ação limpará todas as <strong className="text-white">duplas inscritas, chaveamentos, placares e jogos</strong> deste torneio, <strong className="text-amber-400">mantendo apenas as categorias cadastradas</strong> e as informações do evento intactas.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
                  confirmAction.type === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow-amber'
                }`}
              >
                {confirmAction.type === 'DELETE' ? 'Sim, Excluir Torneio' : 'Sim, Limpar Dados (Manter Categorias)'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
