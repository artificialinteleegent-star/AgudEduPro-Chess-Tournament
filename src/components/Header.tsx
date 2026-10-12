import React from 'react';
import { TournamentSettings, TournamentType } from '../types/chess';
import { Trophy, Users, FileText, Scale, RotateCcw, Share2, PlusCircle, Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  settings: TournamentSettings;
  activeTab: 'pairings' | 'standings' | 'crosstable' | 'bracket' | 'arbiter' | 'players';
  setActiveTab: (tab: 'pairings' | 'standings' | 'crosstable' | 'bracket' | 'arbiter' | 'players') => void;
  currentRound: number;
  totalRounds: number;
  playerCount: number;
  onOpenExport: () => void;
  onResetToDemo: () => void;
  onNewGame: () => void;
  onDownloadCurrentRoundPDF: () => void;
  onDownloadStandingsPDF: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  currentRound,
  totalRounds,
  playerCount,
  onOpenExport,
  onResetToDemo,
  onNewGame,
  onDownloadCurrentRoundPDF,
  onDownloadStandingsPDF,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950 text-slate-100 sticky top-0 z-30">
      {/* Top Banner with Tournament Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-lg shadow-inner">
              ♔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate max-w-sm sm:max-w-md">
                  {settings.name}
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {settings.tournamentType.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Arbiter: {settings.chiefArbiter}</span>
                <span aria-hidden="true">·</span>
                <span>{settings.timeControl}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-medium">FIDE Compliant</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* NEW GAME BUTTON */}
            <button
              onClick={onNewGame}
              className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
              title="Mulai Turnamen / Permainan Baru (New Game)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Game</span>
            </button>

            {/* Quick PDF Downloads in Header */}
            <button
              onClick={onDownloadCurrentRoundPDF}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md transition-colors flex items-center gap-1"
              title={`Download PDF Hasil Ronde ${currentRound}`}
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>PDF R{currentRound}</span>
            </button>

            <button
              onClick={onDownloadStandingsPDF}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md transition-colors flex items-center gap-1"
              title="Download PDF Klasemen Lengkap"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>PDF Klasemen</span>
            </button>

            {/* Reset to 8-player preset */}
            <button
              onClick={onResetToDemo}
              title="Kembali ke Preset 8 Pemain Swiss R1"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Preset 8-Pemain</span>
            </button>

            {/* Markdown Export */}
            <button
              onClick={onOpenExport}
              className="px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-t border-slate-850 mt-2 pt-2 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('pairings')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'pairings'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Pairings & Hasil</span>
              <span className="text-xs text-slate-400 font-mono">
                (R{currentRound}/{totalRounds})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('standings')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'standings'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Klasemen & Tie-breaks</span>
            </button>

            {settings.tournamentType === 'round-robin' && (
              <button
                onClick={() => setActiveTab('crosstable')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'crosstable'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>Crosstable Matrix</span>
              </button>
            )}

            {settings.tournamentType === 'knockout' && (
              <button
                onClick={() => setActiveTab('bracket')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'bracket'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>Brackets</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('arbiter')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'arbiter'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Chief Arbiter Console</span>
            </button>

            <button
              onClick={() => setActiveTab('players')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'players'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Roster Pemain ({playerCount})</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
