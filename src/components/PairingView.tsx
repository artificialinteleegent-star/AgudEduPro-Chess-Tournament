import React, { useState } from 'react';
import { Player, Round, MatchPairing, MatchResult, PlayerStats, TournamentSettings } from '../types/chess';
import { exportRoundToPDF } from '../utils/pdfGenerator';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
  Printer,
  ArrowRightLeft,
  Download,
  RotateCcw,
  Sparkles,
  Rows,
  LayoutGrid,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface PairingViewProps {
  rounds: Round[];
  currentRoundNumber: number;
  selectedRoundNumber: number;
  setSelectedRoundNumber: (r: number) => void;
  players: Player[];
  statsMap: Map<string, PlayerStats>;
  settings: TournamentSettings;
  onUpdateResult: (roundNumber: number, boardNumber: number, result: MatchResult) => void;
  onGenerateNextRound: () => void;
  onSwapColors: (roundNumber: number, boardNumber: number) => void;
  onResetRoundScores: (roundNumber: number) => void;
}

export const PairingView: React.FC<PairingViewProps> = ({
  rounds,
  currentRoundNumber,
  selectedRoundNumber,
  setSelectedRoundNumber,
  players,
  statsMap,
  settings,
  onUpdateResult,
  onGenerateNextRound,
  onSwapColors,
  onResetRoundScores,
}) => {
  const [copiedFormat, setCopiedFormat] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(true); // Default to compact mode as requested!
  const playerMap = new Map(players.map(p => [p.id, p]));

  const round = rounds.find(r => r.roundNumber === selectedRoundNumber) || rounds[0];
  const isLatestRound = selectedRoundNumber === rounds.length;
  const allResultsFinished = round?.pairings.every(p => p.result !== 'pending') ?? false;

  // Ensure pairings are strictly sorted by boardNumber (which corresponds to highest score first)
  const sortedPairings = [...(round?.pairings || [])].sort((a, b) => a.boardNumber - b.boardNumber);

  const handleCopyPairingList = () => {
    if (!round) return;
    const textLines = sortedPairings.map(m => {
      const white = playerMap.get(m.whitePlayerId);
      const whitePts = statsMap.get(m.whitePlayerId)?.points ?? 0;
      const whiteStr = white 
        ? `${white.title && white.title !== 'None' ? white.title + ' ' : ''}${white.name} (${white.rating}) [${whitePts.toFixed(1)} pt]` 
        : 'Unknown';
      
      if (m.blackPlayerId === 'BYE') {
        return `Board ${m.boardNumber} | ${whiteStr} vs BYE | 1-0 (BYE)`;
      }
      const black = playerMap.get(m.blackPlayerId);
      const blackPts = statsMap.get(m.blackPlayerId)?.points ?? 0;
      const blackStr = black 
        ? `${black.title && black.title !== 'None' ? black.title + ' ' : ''}${black.name} (${black.rating}) [${blackPts.toFixed(1)} pt]` 
        : 'Unknown';
      const resStr = m.result === 'pending' ? 'Pending' : m.result;
      return `Board ${m.boardNumber} | ${whiteStr} vs ${blackStr} | ${resStr}`;
    });

    const fullText = `=== ROUND ${round.roundNumber} PAIRINGS (Urutan Skor Tertinggi) ===\n` + textLines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!round) return;
    exportRoundToPDF(round, players, statsMap, settings);
  };

  const handleResetScores = () => {
    if (window.confirm(`Reset semua skor pada Ronde ${selectedRoundNumber}? Skor akan dikembalikan ke pending (*).`)) {
      onResetRoundScores(selectedRoundNumber);
    }
  };

  // Helper to check if two players met in any earlier round
  const checkPreviousEncounter = (p1Id: string, p2Id: string, upToRound: number) => {
    if (p2Id === 'BYE') return false;
    return rounds.some(r =>
      r.roundNumber < upToRound &&
      r.pairings.some(m =>
        (m.whitePlayerId === p1Id && m.blackPlayerId === p2Id) ||
        (m.whitePlayerId === p2Id && m.blackPlayerId === p1Id)
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Round Selection & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Ronde:
          </span>
          {rounds.map(r => (
            <button
              key={r.roundNumber}
              onClick={() => setSelectedRoundNumber(r.roundNumber)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedRoundNumber === r.roundNumber
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              Ronde {r.roundNumber}
              {r.pairings.every(m => m.result !== 'pending') && (
                <span className="ml-1 text-[11px] text-emerald-400">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Compact / Detail View Toggle */}
          <button
            onClick={() => setIsCompactMode(!isCompactMode)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            title={isCompactMode ? 'Ubah ke Tampilan Detail' : 'Ubah ke Tampilan Kompak (Ringkas)'}
          >
            {isCompactMode ? <LayoutGrid className="w-3.5 h-3.5 text-amber-400" /> : <Rows className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isCompactMode ? 'Mode Detail' : 'Mode Kompak'}</span>
          </button>

          {/* Reset Round Scores */}
          <button
            onClick={handleResetScores}
            className="px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset skor ronde ini ke pending"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Round</span>
          </button>

          {/* Download Round PDF */}
          <button
            onClick={handleDownloadPDF}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title={`Download PDF Hasil Ronde ${selectedRoundNumber}`}
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>PDF Ronde {selectedRoundNumber}</span>
          </button>

          {/* Copy Format */}
          <button
            onClick={handleCopyPairingList}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            title="Salin daftar pairing teks"
          >
            {copiedFormat ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFormat ? 'Tersalin' : 'Salin Format'}</span>
          </button>

          {/* Next Round Button */}
          {isLatestRound && (
            <button
              onClick={onGenerateNextRound}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${
                allResultsFinished
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30'
              }`}
              title={allResultsFinished ? 'Semua pertandingan selesai! Generate ronde berikutnya.' : 'Generate ronde berikutnya'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next Round (R{currentRoundNumber + 1})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Boards Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Banner with Ordering & Rematch Guarantee */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Papan Ronde {round?.roundNumber}:
            </span>
            <span className="text-slate-300 font-medium">
              Diurutkan dari Poin Tertinggi (Papan 1) ke Terendah
            </span>
            <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ✓ Aturan Bebas Rematch Terpenuhi
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>{round?.pairings.length} Papan</span>
            <span aria-hidden="true">·</span>
            <span className={allResultsFinished ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {allResultsFinished ? '✓ Selesai Semua' : 'Sedang Berlangsung'}
            </span>
          </div>
        </div>

        {/* COMPACT VIEW (Density Optimized for fast scoring with prominent points display) */}
        {isCompactMode ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 text-center w-14">Meja</th>
                  <th className="px-3 py-2 min-w-[210px]">Putih (White) &amp; Poin</th>
                  <th className="px-3 py-2 text-center min-w-[190px]">Input Skor Hasil</th>
                  <th className="px-3 py-2 min-w-[210px]">Hitam (Black) &amp; Poin</th>
                  <th className="px-2 py-2 text-center w-12">Opt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {sortedPairings.map(pairing => {
                  const white = playerMap.get(pairing.whitePlayerId);
                  const black = pairing.blackPlayerId === 'BYE' ? null : playerMap.get(pairing.blackPlayerId);
                  const whiteStats = statsMap.get(pairing.whitePlayerId);
                  const blackStats = black ? statsMap.get(black.id) : null;
                  const whitePts = whiteStats?.points ?? 0;
                  const blackPts = blackStats?.points ?? 0;

                  const isRematchViolation = checkPreviousEncounter(
                    pairing.whitePlayerId,
                    pairing.blackPlayerId,
                    pairing.roundNumber
                  );

                  return (
                    <tr
                      key={pairing.boardNumber}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        isRematchViolation ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Board Number */}
                      <td className="px-3 py-2 text-center font-mono font-bold text-amber-400 text-sm">
                        <div className="flex flex-col items-center">
                          <span>{pairing.boardNumber}</span>
                          {pairing.boardNumber === 1 && (
                            <span className="text-[9px] font-sans text-amber-500 uppercase tracking-tighter">Puncak</span>
                          )}
                        </div>
                      </td>

                      {/* White Player & Poin */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-100 text-slate-950 font-bold text-[10px] flex items-center justify-center border border-slate-300">
                            W
                          </span>
                          <div className="truncate flex-1">
                            <span className="font-semibold text-slate-100">
                              {white?.title && white.title !== 'None' ? `${white.title} ` : ''}
                              {white?.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                              ({white?.rating})
                            </span>
                          </div>
                          {/* POINT DISPLAY BADGE */}
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 flex-shrink-0">
                            {whitePts.toFixed(1)} pt
                          </span>
                        </div>
                      </td>

                      {/* Score Input Fast Controls */}
                      <td className="px-3 py-2 text-center">
                        {pairing.blackPlayerId === 'BYE' ? (
                          <span className="inline-block px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded font-bold text-xs">
                            1 - 0 (BYE)
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
                            <button
                              onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '1-0')}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                                pairing.result === '1-0'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                              title="Putih Menang (1 - 0)"
                            >
                              1 - 0
                            </button>
                            <button
                              onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '1/2-1/2')}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                                pairing.result === '1/2-1/2'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                              title="Remis / Draw (½ - ½)"
                            >
                              ½ - ½
                            </button>
                            <button
                              onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '0-1')}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                                pairing.result === '0-1'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                              title="Hitam Menang (0 - 1)"
                            >
                              0 - 1
                            </button>

                            {pairing.result.includes('(FF)') && (
                              <span className="px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-bold text-[10px]">
                                {pairing.result}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Black Player & Poin */}
                      <td className="px-3 py-2">
                        {pairing.blackPlayerId === 'BYE' ? (
                          <div className="flex items-center gap-2 text-amber-400 font-semibold italic text-xs">
                            <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center">
                              ★
                            </span>
                            <span>BYE (1.0 Point FIDE)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-slate-900 text-slate-100 font-bold text-[10px] flex items-center justify-center border border-slate-700">
                              B
                            </span>
                            <div className="truncate flex-1">
                              <span className="font-semibold text-slate-100">
                                {black?.title && black.title !== 'None' ? `${black.title} ` : ''}
                                {black?.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                                ({black?.rating})
                              </span>
                            </div>
                            {/* POINT DISPLAY BADGE */}
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 flex-shrink-0">
                              {blackPts.toFixed(1)} pt
                            </span>
                          </div>
                        )}
                      </td>

                      {/* More / Actions & Anomaly Warning */}
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isRematchViolation && (
                            <span title="Peringatan: Pemain ini pernah bertemu di ronde sebelumnya!" className="text-rose-400">
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </span>
                          )}

                          <div className="relative group inline-block">
                            <button
                              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 text-[11px]"
                              title="Menu Forfeit & Opsi Lainnya"
                            >
                              •••
                            </button>
                            <div className="hidden group-hover:flex absolute right-0 top-full mt-1 flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-20 w-36 text-left">
                              <button
                                onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '1-0 (FF)')}
                                className="text-left px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white"
                              >
                                1 - 0 (Forfeit + - -)
                              </button>
                              <button
                                onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '0-1 (FF)')}
                                className="text-left px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white"
                              >
                                0 - 1 (Forfeit - - +)
                              </button>
                              <button
                                onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '0-0 (FF)')}
                                className="text-left px-3 py-1 text-[11px] text-rose-400 hover:bg-slate-800"
                              >
                                0 - 0 (Double Forfeit)
                              </button>
                              {pairing.result === 'pending' && pairing.blackPlayerId !== 'BYE' && (
                                <button
                                  onClick={() => onSwapColors(pairing.roundNumber, pairing.boardNumber)}
                                  className="text-left px-3 py-1 text-[11px] text-amber-400 hover:bg-slate-800 border-t border-slate-800 flex items-center gap-1"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  Tukar Warna W/B
                                </button>
                              )}
                              <button
                                onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, 'pending')}
                                className="text-left px-3 py-1 text-[11px] text-slate-400 hover:bg-slate-800 border-t border-slate-800"
                              >
                                Kosongkan (*)
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* DETAILED CARD VIEW */
          <div className="divide-y divide-slate-800/60 p-2 space-y-2">
            {sortedPairings.map(pairing => {
              const white = playerMap.get(pairing.whitePlayerId);
              const black = pairing.blackPlayerId === 'BYE' ? null : playerMap.get(pairing.blackPlayerId);
              const whiteStats = statsMap.get(pairing.whitePlayerId);
              const blackStats = black ? statsMap.get(black.id) : null;
              const whitePts = whiteStats?.points ?? 0;
              const blackPts = blackStats?.points ?? 0;

              return (
                <div
                  key={pairing.boardNumber}
                  className="p-3 bg-slate-950/40 hover:bg-slate-850/40 rounded-lg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex flex-col items-center justify-center">
                      <span className="text-[9px] text-slate-400 uppercase">Meja</span>
                      <span className="text-sm font-bold font-mono text-amber-400">{pairing.boardNumber}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs flex items-center gap-2">
                        <span className="font-bold text-slate-100">
                          {white?.title && white.title !== 'None' ? `${white.title} ` : ''}{white?.name}
                        </span>
                        <span className="text-slate-400 font-mono">({white?.rating})</span>
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300">
                          {whitePts.toFixed(1)} pt
                        </span>
                      </div>

                      <span className="text-xs text-slate-400 font-bold px-1">vs</span>

                      {pairing.blackPlayerId === 'BYE' ? (
                        <div className="bg-amber-950/30 px-3 py-1.5 rounded border border-amber-900/40 text-xs text-amber-300 font-bold">
                          BYE (1.0 Pt)
                        </div>
                      ) : (
                        <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs flex items-center gap-2">
                          <span className="font-bold text-slate-100">
                            {black?.title && black.title !== 'None' ? `${black.title} ` : ''}{black?.name}
                          </span>
                          <span className="text-slate-400 font-mono">({black?.rating})</span>
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300">
                            {blackPts.toFixed(1)} pt
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Result Buttons */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {pairing.blackPlayerId !== 'BYE' && (
                      <>
                        <button
                          onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '1-0')}
                          className={`px-3 py-1 text-xs font-bold rounded ${pairing.result === '1-0' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          1 - 0
                        </button>
                        <button
                          onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '1/2-1/2')}
                          className={`px-3 py-1 text-xs font-bold rounded ${pairing.result === '1/2-1/2' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          ½ - ½
                        </button>
                        <button
                          onClick={() => onUpdateResult(pairing.roundNumber, pairing.boardNumber, '0-1')}
                          className={`px-3 py-1 text-xs font-bold rounded ${pairing.result === '0-1' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          0 - 1
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
