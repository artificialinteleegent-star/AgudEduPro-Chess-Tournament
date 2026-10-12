import React, { useState } from 'react';
import { Player, Round, TournamentSettings, PlayerStats } from '../types/chess';
import { formatPairingsToMarkdown, formatStandingsToMarkdown } from '../utils/fideRules';
import { rankPlayers } from '../utils/tiebreaks';
import { exportRoundToPDF, exportStandingsToPDF } from '../utils/pdfGenerator';
import { X, Copy, Check, Download, FileText, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TournamentSettings;
  players: Player[];
  rounds: Round[];
  statsMap: Map<string, PlayerStats>;
  currentRoundNumber: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  settings,
  players,
  rounds,
  statsMap,
  currentRoundNumber,
}) => {
  const [tab, setTab] = useState<'markdown' | 'standings_md' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const playerMap = new Map(players.map(p => [p.id, p]));
  const currentRound = rounds.find(r => r.roundNumber === currentRoundNumber) || rounds[0];

  const pairingsMarkdown = currentRound
    ? formatPairingsToMarkdown(currentRound.roundNumber, currentRound.pairings, playerMap, settings.name, statsMap)
    : '';

  const rankedData = rankPlayers(players, statsMap);
  const standingsMarkdown = formatStandingsToMarkdown(rankedData, currentRoundNumber);

  const jsonExport = JSON.stringify(
    {
      tournament: settings,
      players,
      rounds,
      standings: rankedData.map(r => ({
        rank: r.stats.rank,
        name: r.player.name,
        rating: r.player.rating,
        points: r.stats.points,
        buchholz: r.stats.buchholz,
        sonnebornBerger: r.stats.sonnebornBerger,
        directEncounter: r.stats.directEncounterScore,
        wins: r.stats.wins,
      })),
    },
    null,
    2
  );

  const contentToDisplay =
    tab === 'markdown'
      ? pairingsMarkdown
      : tab === 'standings_md'
      ? standingsMarkdown
      : jsonExport;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      tab === 'json'
        ? `${settings.name.replace(/\s+/g, '_')}_round${currentRoundNumber}.json`
        : `${settings.name.replace(/\s+/g, '_')}_round${currentRoundNumber}.md`;

    const blob = new Blob([contentToDisplay], { type: tab === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Export Tournament Reports & FIDE Data</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Mode Tabs */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setTab('markdown')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
              tab === 'markdown'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pairings Markdown Table
          </button>
          <button
            onClick={() => setTab('standings_md')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
              tab === 'standings_md'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standings & Tie-breaks Markdown
          </button>
          <button
            onClick={() => setTab('json')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
              tab === 'json'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JSON Raw Export
          </button>
        </div>

        {/* Content Box */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <textarea
            readOnly
            value={contentToDisplay}
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs font-mono text-slate-200 resize-none focus:outline-hidden"
          />
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (currentRound) exportRoundToPDF(currentRound, players, statsMap, settings);
              }}
              className="px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Ronde {currentRoundNumber}</span>
            </button>

            <button
              onClick={() => {
                exportStandingsToPDF(players, statsMap, currentRoundNumber, settings);
              }}
              className="px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Klasemen</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Print PDF</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File (.md/.json)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
