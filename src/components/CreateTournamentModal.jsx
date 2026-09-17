import React, { useState } from 'react';
import { Trophy, X, AlertTriangle, Sparkles, PlusCircle } from 'lucide-react';

export default function CreateTournamentModal({
  isOpen,
  onClose,
  onCreateTournament,
}) {
  const [name, setName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateTournament({
      name: name.trim() || 'Novo Torneio de Futvôlei',
      organizer: organizer.trim(),
      location: location.trim(),
      date: date.trim(),
    });
    setName('');
    setOrganizer('');
    setLocation('');
    setDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-glow-amber">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              Criar Novo Torneio
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inicie um torneio 100% do zero para seu novo evento esportivo
            </p>
          </div>
        </div>

        {/* Warning Alert Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-semibold block mb-1">
              Atenção: Novo Torneio do Zero
            </strong>
            Ao confirmar, todas as categorias, duplas, chaveamentos e placares do torneio anterior serão apagados. Você iniciará com um evento totalmente limpo para configurar as novas categorias.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Torneio *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: 1º Circuito Open de Futvôlei"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Organizador / Arena
              </label>
              <input
                type="text"
                placeholder="Ex: Arena DB Sports"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Local / Cidade
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo - SP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Data do Evento
            </label>
            <input
              type="text"
              placeholder="Ex: 25 e 26 de Outubro de 2026"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-glow-amber transition-all transform hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              Criar Torneio do Zero
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
