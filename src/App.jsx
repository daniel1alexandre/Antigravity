import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CategoryManager from './components/CategoryManager';
import TeamsManager from './components/TeamsManager';
import PaymentControl from './components/PaymentControl';
import TournamentBracket from './components/TournamentBracket';
import MatchScoreModal from './components/MatchScoreModal';
import CourtScoreboard from './components/CourtScoreboard';
import ArenaLiveDisplay from './components/ArenaLiveDisplay';
import FinalStandings from './components/FinalStandings';
import ReportsCenter from './components/ReportsCenter';
import DrawModal from './components/DrawModal';
import SettingsBackupModal from './components/SettingsBackupModal';

import { loadTournamentData, saveTournamentData } from './utils/storage';
import { updateMatchScore } from './utils/doubleEliminationEngine';

export default function App() {
  // Main State
  const [dataLoaded, setDataLoaded] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [brackets, setBrackets] = useState({});

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [activeTab, setActiveTab] = useState('teams');

  // Modals & Overlay States
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isArenaLiveOpen, setIsArenaLiveOpen] = useState(false);

  const [scoreModalMatch, setScoreModalMatch] = useState(null);
  const [courtScoreboardMatch, setCourtScoreboardMatch] = useState(null);
  const [targetMatchId, setTargetMatchId] = useState(null);
  const [targetPaymentAthlete, setTargetPaymentAthlete] = useState(null); // { teamId, playerNum }

  // Navigate directly from Duplas / Card to specific athlete in Financial Control
  const handleNavigateToPaymentAthlete = (teamId, playerNum = 1) => {
    setTargetPaymentAthlete({ teamId, playerNum });
    setActiveTab('payments');

    // Clear highlight after a few seconds
    setTimeout(() => {
      setTargetPaymentAthlete(null);
    }, 4500);
  };

  // Navigate directly from Telão / Próxima Chamada to Bracket Match
  const handleNavigateToMatch = (categoryId, matchId) => {
    setSelectedCategoryId(categoryId);
    setTargetMatchId(matchId);
    setActiveTab('bracket');
    setIsArenaLiveOpen(false);

    // Reset target highlight after a few seconds
    setTimeout(() => {
      setTargetMatchId(null);
    }, 4500);
  };

  // Open Score Modal directly for a match (e.g. from Telão Live Court)
  const handleOpenScoreModalForMatch = (categoryId, match) => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
    setScoreModalMatch({ ...match, categoryId });
  };

  // Initial Load from Storage
  useEffect(() => {
    const loaded = loadTournamentData();
    setEventInfo(loaded.eventInfo);
    setCategories(loaded.categories);
    setTeams(loaded.teams);
    setBrackets(loaded.brackets);

    if (loaded.categories.length > 0) {
      setSelectedCategoryId(loaded.categories[0].id);
    }
    setDataLoaded(true);
  }, []);

  // Save to Storage on changes
  useEffect(() => {
    if (!dataLoaded) return;
    saveTournamentData({
      eventInfo,
      categories,
      teams,
      brackets,
    });
  }, [eventInfo, categories, teams, brackets, dataLoaded]);

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-amber-400 font-bold text-lg">
        Carregando Torneio de Futvôlei...
      </div>
    );
  }

  const currentCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
  const currentBracket = brackets[selectedCategoryId] || null;
  const currentCategoryTeams = teams.filter(t => t.categoryId === selectedCategoryId);

  // Update Match Score & Advance Bracket (supports match from any category)
  const handleSaveScore = (matchId, score1, score2, sets, matchCategoryId) => {
    const targetCatId = matchCategoryId || scoreModalMatch?.categoryId || selectedCategoryId;
    const targetBracket = brackets[targetCatId];
    if (!targetBracket) return;

    try {
      const updatedBracket = updateMatchScore(targetBracket, matchId, score1, score2, sets);
      setBrackets({
        ...brackets,
        [targetCatId]: updatedBracket,
      });

      // Update the active match object if court scoreboard is open
      if (courtScoreboardMatch && courtScoreboardMatch.id === matchId) {
        setCourtScoreboardMatch(updatedBracket.matches[matchId]);
      }
    } catch (err) {
      alert('Erro ao atualizar placar: ' + err.message);
    }
  };

  // Update Assigned Court (Disallow court if already in use)
  const handleUpdateCourt = (matchId, court) => {
    if (!currentBracket) return;
    const match = currentBracket.matches[matchId];
    if (!match) return;

    if (court) {
      // Check if court is currently being used by any active match across all categories
      let isCourtInUse = false;
      let inUseMatchDesc = '';

      Object.values(brackets).forEach(b => {
        if (!b || !b.matches) return;
        Object.values(b.matches).forEach(m => {
          if (m.id !== matchId && m.court === court && m.status !== 'COMPLETED' && !m.isBye) {
            isCourtInUse = true;
            inUseMatchDesc = `Jogo #${m.matchNumber} (${b.categoryName || 'Torneio'})`;
          }
        });
      });

      if (isCourtInUse) {
        alert(`A ${court} já está sendo utilizada no momento pelo ${inUseMatchDesc}! Finalize o jogo anterior ou selecione outra quadra.`);
        return;
      }
    }

    const updatedMatches = {
      ...currentBracket.matches,
      [matchId]: {
        ...match,
        court: court || null,
        status: court ? (match.status === 'READY' || match.status === 'PENDING' ? 'WARMUP' : match.status) : (match.team1 && match.team2 ? 'READY' : 'PENDING'),
      },
    };

    setBrackets({
      ...brackets,
      [selectedCategoryId]: {
        ...currentBracket,
        matches: updatedMatches,
      },
    });
  };

  // Reset category bracket
  const handleResetBracket = () => {
    if (window.confirm(`Deseja resetar a chave de Eliminatória Dupla da categoria "${currentCategory?.name}"?`)) {
      const newBrackets = { ...brackets };
      delete newBrackets[selectedCategoryId];
      setBrackets(newBrackets);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between">
      
      {/* Top Navbar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        onOpenDrawModal={() => setIsDrawModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAddTeamModal={() => setIsAddTeamModalOpen(true)}
        teamsCount={currentCategoryTeams.length}
        hasBracket={Boolean(currentBracket)}
      />

      {/* Main App Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* TAB 1: Duplas e Atletas */}
        {activeTab === 'teams' && (
          <TeamsManager
            teams={teams}
            setTeams={setTeams}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            isAddModalOpen={isAddTeamModalOpen}
            setIsAddModalOpen={setIsAddTeamModalOpen}
            eventInfo={eventInfo}
            onGoToPayments={handleNavigateToPaymentAthlete}
          />
        )}

        {/* TAB 2: Financeiro e PIX */}
        {activeTab === 'payments' && (
          <PaymentControl
            teams={teams}
            setTeams={setTeams}
            categories={categories}
            eventInfo={eventInfo}
            setEventInfo={setEventInfo}
            targetPaymentAthlete={targetPaymentAthlete}
          />
        )}

        {/* TAB 3: Chave Eliminatória Dupla */}
        {activeTab === 'bracket' && (
          <TournamentBracket
            bracket={currentBracket}
            allBrackets={brackets}
            category={currentCategory}
            courts={eventInfo?.courts}
            targetMatchId={targetMatchId}
            onOpenScoreModal={(match) => setScoreModalMatch(match)}
            onOpenCourtScoreboard={(match) => setCourtScoreboardMatch(match)}
            onOpenDrawModal={() => setIsDrawModalOpen(true)}
            onResetBracket={handleResetBracket}
            onOpenLiveArena={() => setIsArenaLiveOpen(true)}
            onUpdateCourt={handleUpdateCourt}
          />
        )}

        {/* TAB 4: Pódio e Campeões */}
        {activeTab === 'standings' && (
          <FinalStandings
            bracket={currentBracket}
            category={currentCategory}
            onGoToBracket={() => setActiveTab('bracket')}
          />
        )}

        {/* TAB 5: Gestão de Categorias */}
        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            setCategories={setCategories}
            teams={teams}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        )}

        {/* TAB 6: Relatórios & Impressão */}
        {activeTab === 'reports' && (
          <ReportsCenter
            teams={teams}
            categories={categories}
            brackets={brackets}
            eventInfo={eventInfo}
          />
        )}

        {/* TAB 7: Modo Telão / Arena Live */}
        {activeTab === 'arena' && (
          <ArenaLiveDisplay
            eventInfo={eventInfo}
            brackets={brackets}
            categories={categories}
            isOpen={true}
            onClose={() => setActiveTab('bracket')}
            onSelectUpcomingMatch={handleNavigateToMatch}
            onOpenScoreModal={handleOpenScoreModalForMatch}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {eventInfo?.name || 'Futvôlei Pro Arena'} — Organização: <strong className="text-slate-400">{eventInfo?.organizer || 'DB Sports'}</strong>
          </p>
          <p className="text-[11px] text-slate-600">
            Eliminatória Dupla Oficial • Double Elimination Engine v2.0
          </p>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* GLOBAL MODALS */}
      {/* ============================================================ */}

      {/* Draw / Sorteio Modal */}
      <DrawModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        teams={teams}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        setBrackets={setBrackets}
        setActiveTab={setActiveTab}
      />

      {/* Settings / Backup Modal */}
      <SettingsBackupModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        eventInfo={eventInfo}
        setEventInfo={setEventInfo}
        categories={categories}
        setCategories={setCategories}
        teams={teams}
        setTeams={setTeams}
        brackets={brackets}
        setBrackets={setBrackets}
        setSelectedCategoryId={setSelectedCategoryId}
      />

      {/* Match Score Entry Modal */}
      <MatchScoreModal
        match={scoreModalMatch}
        isOpen={Boolean(scoreModalMatch)}
        onClose={() => setScoreModalMatch(null)}
        onSaveScore={handleSaveScore}
        category={categories.find(c => c.id === scoreModalMatch?.categoryId) || currentCategory}
      />

      {/* Fullscreen Court Referee Scoreboard */}
      <CourtScoreboard
        match={courtScoreboardMatch}
        category={categories.find(c => c.id === courtScoreboardMatch?.categoryId) || currentCategory}
        isOpen={Boolean(courtScoreboardMatch)}
        onClose={() => setCourtScoreboardMatch(null)}
        onSaveScore={handleSaveScore}
      />

      {/* Pop-up Live Arena Display when clicked from toolbar */}
      {isArenaLiveOpen && activeTab !== 'arena' && (
        <ArenaLiveDisplay
          eventInfo={eventInfo}
          brackets={brackets}
          categories={categories}
          isOpen={isArenaLiveOpen}
          onClose={() => setIsArenaLiveOpen(false)}
          onSelectUpcomingMatch={handleNavigateToMatch}
          onOpenScoreModal={handleOpenScoreModalForMatch}
        />
      )}

    </div>
  );
}
