import React, { useState } from 'react';
import { Player, PlayerStats, TournamentSettings } from '../types/chess';
import { rankPlayers } from '../utils/tiebreaks';
import { exportStandingsToPDF } from '../utils/pdfGenerator';
import { Trophy, Download, Info } from 'lucide-react';

interface StandingsViewProps {
  players: Player[];
  statsMap: Map<string, PlayerStats>;
  currentRoundNumber: number;
  settings: TournamentSettings;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  players,
  statsMap,
  currentRoundNumber,
  settings,
}) => {
  const [activeTiebreakInfo, setActiveTiebreakInfo] = useState<string | null>(null);

  const rankedData = rankPlayers(players, statsMap);

  const handleDownloadPDF = () => {
    exportStandingsToPDF(players, statsMap, currentRoundNumber, settings);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Klasemen Resmi & Tie-Break FIDE (Ronde {currentRoundNumber})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dihitung otomatis: 1. Poin · 2. Direct Encounter · 3. Buchholz · 4. Sonneborn-Berger · 5. Most Wins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            title="Download PDF Klasemen & Tie-breaks"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Klasemen</span>
          </button>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-center w-10">Rk</th>
                <th scope="col" className="px-2 py-2.5 text-center w-10">Seed</th>
                <th scope="col" className="px-3 py-2.5 min-w-[170px]">Nama Pemain</th>
                <th scope="col" className="px-2 py-2.5 text-center w-10">Fed</th>
                <th scope="col" className="px-3 py-2.5 text-right w-14">Rtg</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold text-amber-300 w-16">Pts</th>
                <th scope="col" className="px-3 py-2.5 text-right w-14" title="Buchholz: Jumlah total poin lawan">
                  <span className="flex items-center justify-end gap-1">
                    BH
                    <Info className="w-3 h-3 text-slate-500 cursor-pointer" onClick={() => setActiveTiebreakInfo('Buchholz: Total poin seluruh lawan yang dihadapi.')} />
                  </span>
                </th>
                <th scope="col" className="px-3 py-2.5 text-right w-14" title="Buchholz Cut-1: Buchholz dikurangi nilai terendah lawan">
                  BH-1
                </th>
                <th scope="col" className="px-3 py-2.5 text-right w-16" title="Sonneborn-Berger: Poin lawan yang dikalahkan + 0.5x poin lawan yang remis">
                  <span className="flex items-center justify-end gap-1">
                    SB
                    <Info className="w-3 h-3 text-slate-500 cursor-pointer" onClick={() => setActiveTiebreakInfo('Sonneborn-Berger: Poin lawan yang dikalahkan ditambah setengah poin lawan yang bermain imbang.')} />
                  </span>
                </th>
                <th scope="col" className="px-3 py-2.5 text-right w-12" title="Direct encounter">
                  DE
                </th>
                <th scope="col" className="px-3 py-2.5 text-right w-12" title="Progressive score">
                  Prog
                </th>
                <th scope="col" className="px-3 py-2.5 text-center w-12" title="Menang">
                  +
                </th>
                <th scope="col" className="px-3 py-2.5 text-center w-16" title="Selisih Warna (Putih - Hitam)">
                  Col
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {rankedData.map((item, index) => {
                const p = item.player;
                const s = item.stats;
                const isMedalist = index < 3;
                const medalColors = ['text-amber-300 bg-amber-500/10', 'text-slate-300 bg-slate-400/10', 'text-amber-600 bg-amber-700/10'];

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-850/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-center font-bold font-mono">
                      {isMedalist ? (
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold text-xs ${medalColors[index]}`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-slate-400">{index + 1}</span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-center font-mono text-slate-400">
                      {p.seed}
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 truncate">
                        {p.title && p.title !== 'None' && (
                          <span className="text-[11px] font-bold text-amber-400/90 font-mono">
                            {p.title}
                          </span>
                        )}
                        <span className="font-semibold text-slate-100 truncate">
                          {p.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-2 py-2 text-center text-xs font-mono text-slate-400">
                      {p.federation || 'INA'}
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-amber-400/90 font-medium">
                      {p.rating}
                    </td>

                    <td className="px-3 py-2 text-right font-mono font-bold text-sm text-amber-300">
                      {s.points.toFixed(1)}
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-slate-300">
                      {s.buchholz.toFixed(1)}
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-slate-400">
                      {s.buchholzCut1.toFixed(1)}
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-slate-300">
                      {s.sonnebornBerger.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-slate-400">
                      {s.directEncounterScore.toFixed(1)}
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-slate-400">
                      {s.progressiveScore.toFixed(1)}
                    </td>

                    <td className="px-3 py-2 text-center font-mono text-emerald-400 font-semibold">
                      {s.wins}
                    </td>

                    <td className="px-3 py-2 text-center font-mono text-xs">
                      {s.colorDifference > 0 ? (
                        <span className="text-slate-300">+{s.colorDifference} W</span>
                      ) : s.colorDifference < 0 ? (
                        <span className="text-slate-300">{s.colorDifference} B</span>
                      ) : (
                        <span className="text-slate-400">0 (=)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeTiebreakInfo && (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg flex items-center justify-between text-xs text-slate-300">
          <span>{activeTiebreakInfo}</span>
          <button
            onClick={() => setActiveTiebreakInfo(null)}
            className="text-slate-400 hover:text-white ml-3 underline"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};
