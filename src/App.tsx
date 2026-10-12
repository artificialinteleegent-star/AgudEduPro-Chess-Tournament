import React, { useState, useMemo } from 'react';
import { Player, Round, TournamentSettings, ArbiterIncident, MatchResult } from './types/chess';
import { INITIAL_8_PLAYERS } from './utils/fideRules';
import { generateSwissRound1, generateSwissSubsequentRound, generateRoundRobinSchedule, generateKnockoutBracket } from './utils/pairingEngine';
import { calculateTournamentStats } from './utils/tiebreaks';
import { exportRoundToPDF, exportStandingsToPDF } from './utils/pdfGenerator';
import { Header } from './components/Header';
import { PairingView } from './components/PairingView';
import { StandingsView } from './components/StandingsView';
import { CrosstableView } from './components/CrosstableView';
import { KnockoutBracketView } from './components/KnockoutBracketView';
import { ArbiterConsole } from './components/ArbiterConsole';
import { PlayerManager } from './components/PlayerManager';
import { ExportModal } from './components/ExportModal';
import { NewGameModal } from './components/NewGameModal';
import { CheckCircle2, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';

export default function App() {
  // Sort initial players by rating descending
  const defaultSortedPlayers = useMemo(() => {
    const list = [...INITIAL_8_PLAYERS].sort((a, b) => b.rating - a.rating);
    list.forEach((p, idx) => {
      p.seed = idx + 1;
    });
    return list;
  }, []);

  const [players, setPlayers] = useState<Player[]>(defaultSortedPlayers);

  const [settings, setSettings] = useState<TournamentSettings>({
    id: 'fide_masters_2026',
    name: 'FIDE Masters Swiss Championship 2026',
    location: 'Jakarta Grand Ballroom, Indonesia',
    chiefArbiter: 'IA Subiantoro (International Arbiter FIDE)',
    timeControl: '90m + 30s / move',
    tournamentType: 'swiss',
    totalRounds: 5,
    colorDrawBoard1: 'W',
    byePoints: 1.0,
    tieBreaks: ['direct_encounter', 'buchholz', 'sonneborn_berger', 'wins', 'progressive'],
  });

  // Generate initial Round 1 pairing
  const initialRound1Pairings = useMemo(() => {
    return generateSwissRound1(defaultSortedPlayers, 'W');
  }, [defaultSortedPlayers]);

  const [rounds, setRounds] = useState<Round[]>([
    {
      roundNumber: 1,
      pairings: initialRound1Pairings,
      isCompleted: false,
    },
  ]);

  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'pairings' | 'standings' | 'crosstable' | 'bracket' | 'arbiter' | 'players'>('pairings');
  const [incidents, setIncidents] = useState<ArbiterIncident[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Stats calculation
  const statsMap = useMemo(() => {
    return calculateTournamentStats(players, rounds, settings.byePoints);
  }, [players, rounds, settings.byePoints]);

  // Update match result
  const handleUpdateResult = (roundNum: number, boardNum: number, result: MatchResult) => {
    setRounds(prevRounds =>
      prevRounds.map(r => {
        if (r.roundNumber !== roundNum) return r;
        const newPairings = r.pairings.map(m => {
          if (m.boardNumber !== boardNum) return m;
          return { ...m, result };
        });
        const allDone = newPairings.every(m => m.result !== 'pending');
        return {
          ...r,
          pairings: newPairings,
          isCompleted: allDone,
        };
      })
    );
  };

  // Reset scores in a round (Tombol Reset Round)
  const handleResetRoundScores = (roundNum: number) => {
    setRounds(prevRounds =>
      prevRounds.map(r => {
        if (r.roundNumber !== roundNum) return r;
        const clearedPairings = r.pairings.map(m => ({
          ...m,
          result: m.blackPlayerId === 'BYE' ? ('BYE' as MatchResult) : ('pending' as MatchResult),
        }));
        return {
          ...r,
          pairings: clearedPairings,
          isCompleted: false,
        };
      })
    );
  };

  // Manual color swap
  const handleSwapColors = (roundNum: number, boardNum: number) => {
    setRounds(prevRounds =>
      prevRounds.map(r => {
        if (r.roundNumber !== roundNum) return r;
        const newPairings = r.pairings.map(m => {
          if (m.boardNumber !== boardNum || m.blackPlayerId === 'BYE') return m;
          return {
            ...m,
            whitePlayerId: m.blackPlayerId,
            blackPlayerId: m.whitePlayerId,
          };
        });
        return { ...r, pairings: newPairings };
      })
    );
  };

  // Generate Next Round
  const handleGenerateNextRound = () => {
    const nextRoundNum = rounds.length + 1;
    if (nextRoundNum > settings.totalRounds) {
      alert(`Turnamen telah menyelesaikan seluruh ${settings.totalRounds} ronde! Periksa klasemen akhir.`);
      setActiveTab('standings');
      return;
    }

    if (settings.tournamentType === 'swiss') {
      const nextPairings = generateSwissSubsequentRound(
        players,
        rounds,
        nextRoundNum,
        settings
      );

      const newRound: Round = {
        roundNumber: nextRoundNum,
        pairings: nextPairings,
        isCompleted: false,
      };

      setRounds(prev => [...prev, newRound]);
      setCurrentRoundNumber(nextRoundNum);
      setSelectedRoundNumber(nextRoundNum);
    } else if (settings.tournamentType === 'round-robin') {
      if (selectedRoundNumber < rounds.length) {
        setSelectedRoundNumber(selectedRoundNumber + 1);
      }
    }
  };

  // Reset to initial 8 players
  const handleResetToDemo = () => {
    const resetPlayers = [...INITIAL_8_PLAYERS].sort((a, b) => b.rating - a.rating);
    resetPlayers.forEach((p, idx) => p.seed = idx + 1);
    setPlayers(resetPlayers);

    const r1 = generateSwissRound1(resetPlayers, 'W');
    setRounds([
      {
        roundNumber: 1,
        pairings: r1,
        isCompleted: false,
      },
    ]);
    setCurrentRoundNumber(1);
    setSelectedRoundNumber(1);
    setIncidents([]);
    setActiveTab('pairings');
  };

  // Start fresh tournament from New Game Modal
  const handleStartNewTournament = (newSettings: TournamentSettings, newPlayers: Player[]) => {
    setSettings(newSettings);
    setPlayers(newPlayers);
    setIncidents([]);

    if (newSettings.tournamentType === 'round-robin') {
      const rrRounds = generateRoundRobinSchedule(newPlayers);
      setRounds(rrRounds);
      setCurrentRoundNumber(rrRounds.length);
      setSelectedRoundNumber(1);
    } else if (newSettings.tournamentType === 'knockout') {
      const koRounds = generateKnockoutBracket(newPlayers);
      setRounds(koRounds);
      setCurrentRoundNumber(1);
      setSelectedRoundNumber(1);
    } else {
      const r1 = generateSwissRound1(newPlayers, newSettings.colorDrawBoard1);
      setRounds([{ roundNumber: 1, pairings: r1, isCompleted: false }]);
      setCurrentRoundNumber(1);
      setSelectedRoundNumber(1);
    }

    setActiveTab('pairings');
  };

  // Download PDF handlers
  const handleDownloadCurrentRoundPDF = () => {
    const currentRound = rounds.find(r => r.roundNumber === selectedRoundNumber) || rounds[0];
    if (currentRound) {
      const ok = exportRoundToPDF(currentRound, players, statsMap, settings);
      if (ok) {
        showToast(`PDF Ronde ${selectedRoundNumber} berhasil diproses! File terunduh ke perangkat Anda.`);
      }
    }
  };

  const handleDownloadStandingsPDF = () => {
    const ok = exportStandingsToPDF(players, statsMap, selectedRoundNumber, settings);
    if (ok) {
      showToast('PDF Klasemen Resmi & Tie-breaks berhasil diproses dan diunduh!');
    }
  };

  const handleUpdateSettings = (newSettings: TournamentSettings) => {
    setSettings(newSettings);
  };

  const handleAddIncident = (incident: ArbiterIncident) => {
    setIncidents(prev => [incident, ...prev]);
  };

  const handleDeleteIncident = (id: string) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdatePlayerStatus = (playerId: string, status: 'active' | 'withdrawn' | 'disqualified') => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status } : p));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header Navigation */}
      <Header
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRound={selectedRoundNumber}
        totalRounds={settings.totalRounds}
        playerCount={players.length}
        onOpenExport={() => setIsExportOpen(true)}
        onResetToDemo={handleResetToDemo}
        onNewGame={() => setIsNewGameOpen(true)}
        onDownloadCurrentRoundPDF={handleDownloadCurrentRoundPDF}
        onDownloadStandingsPDF={handleDownloadStandingsPDF}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between sticky top-[61px] z-20 shadow-md">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 ml-4 font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Indonesian Prompt Special Banner & Arbiter Verification */}
        {selectedRoundNumber === 1 && rounds.length === 1 && (
          <div className="bg-gradient-to-r from-amber-950/25 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 relative overflow-hidden shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                    Laporan Chief Arbiter FIDE · Pairing Ronde 1 (Sistem Swiss 8 Pemain)
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white">
                  Distribusi Warna Adil & Terverifikasi (4 Putih / 4 Hitam)
                </h2>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Unggulan atas (Seed 1–4) berhadapan dengan unggulan bawah (Seed 5–8) dengan rotasi warna selang-seling setiap papan.
                  Tampilan telah diringkas (mode kompak) agar arbitrase dapat memasukkan skor secara instan dengan 1 kali klik.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadCurrentRoundPDF}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors"
                >
                  Download PDF R1
                </button>
                <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> FIDE Dutch C.04
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'pairings' && (
          <PairingView
            rounds={rounds}
            currentRoundNumber={currentRoundNumber}
            selectedRoundNumber={selectedRoundNumber}
            setSelectedRoundNumber={setSelectedRoundNumber}
            players={players}
            statsMap={statsMap}
            settings={settings}
            onUpdateResult={handleUpdateResult}
            onGenerateNextRound={handleGenerateNextRound}
            onSwapColors={handleSwapColors}
            onResetRoundScores={handleResetRoundScores}
          />
        )}

        {activeTab === 'standings' && (
          <StandingsView
            players={players}
            statsMap={statsMap}
            currentRoundNumber={selectedRoundNumber}
            settings={settings}
          />
        )}

        {activeTab === 'crosstable' && (
          <CrosstableView
            players={players}
            rounds={rounds}
            statsMap={statsMap}
          />
        )}

        {activeTab === 'bracket' && (
          <KnockoutBracketView
            players={players}
            rounds={rounds}
            onUpdateResult={handleUpdateResult}
          />
        )}

        {activeTab === 'arbiter' && (
          <ArbiterConsole
            players={players}
            rounds={rounds}
            statsMap={statsMap}
            incidents={incidents}
            onAddIncident={handleAddIncident}
            onDeleteIncident={handleDeleteIncident}
            onUpdatePlayerStatus={handleUpdatePlayerStatus}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManager
            players={players}
            settings={settings}
            onUpdatePlayers={setPlayers}
            onUpdateSettings={handleUpdateSettings}
            onResetToInitial8={handleResetToDemo}
          />
        )}
      </main>

      {/* New Game Modal */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
        onStartNewTournament={handleStartNewTournament}
      />

      {/* Export & Markdown Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        settings={settings}
        players={players}
        rounds={rounds}
        statsMap={statsMap}
        currentRoundNumber={selectedRoundNumber}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">ArbiterPro</span>
            <span aria-hidden="true">·</span>
            <span>FIDE Chess Tournament Management & Pairing System</span>
          </div>
          <div>
            <span>Tie-breaks: Buchholz · Sonneborn-Berger · Direct Encounter · Progressive</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
