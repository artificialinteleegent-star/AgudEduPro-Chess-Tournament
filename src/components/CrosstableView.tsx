import React from 'react';
import { Player, Round, PlayerStats } from '../types/chess';
import { getPointsFromResult } from '../utils/tiebreaks';

interface CrosstableViewProps {
  players: Player[];
  rounds: Round[];
  statsMap: Map<string, PlayerStats>;
}

export const CrosstableView: React.FC<CrosstableViewProps> = ({
  players,
  rounds,
  statsMap,
}) => {
  // Sort players by initial seed or rating
  const sortedPlayers = [...players].sort((a, b) => a.seed - b.seed);

  // Helper to find result between player i and player j
  const getEncounterResult = (p1Id: string, p2Id: string) => {
    if (p1Id === p2Id) return { text: '—', bg: 'bg-slate-950/40 text-slate-400' };

    for (const r of rounds) {
      for (const m of r.pairings) {
        if (m.whitePlayerId === p1Id && m.blackPlayerId === p2Id) {
          if (m.result === 'pending') return { text: '·', bg: 'text-slate-400' };
          const pts = getPointsFromResult(m.result, true);
          return {
            text: pts === 0.5 ? '½' : pts.toString(),
            color: 'w',
            bg: pts === 1 ? 'bg-emerald-950/30 text-emerald-300 font-bold' : pts === 0.5 ? 'bg-amber-950/20 text-amber-300' : 'text-slate-400',
          };
        }
        if (m.blackPlayerId === p1Id && m.whitePlayerId === p2Id) {
          if (m.result === 'pending') return { text: '·', bg: 'text-slate-400' };
          const pts = getPointsFromResult(m.result, false);
          return {
            text: pts === 0.5 ? '½' : pts.toString(),
            color: 'b',
            bg: pts === 1 ? 'bg-emerald-950/30 text-emerald-300 font-bold' : pts === 0.5 ? 'bg-amber-950/20 text-amber-300' : 'text-slate-400',
          };
        }
      }
    }
    return { text: '', bg: '' };
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Berger / Crosstable Grid Matrix</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Head-to-head encounter scores for all participating players
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 1.0 (Win)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> ½ (Draw)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span> 0.0 (Loss)</span>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
            <tr>
              <th className="px-3 py-3 text-center w-10">#</th>
              <th className="px-3 py-3 min-w-[180px]">Player</th>
              <th className="px-2 py-3 text-right">Rtg</th>
              {sortedPlayers.map((p, idx) => (
                <th key={p.id} className="px-2 py-3 text-center w-10 font-mono">
                  {idx + 1}
                </th>
              ))}
              <th className="px-3 py-3 text-right font-bold text-amber-300">Pts</th>
              <th className="px-3 py-3 text-right">SB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {sortedPlayers.map((p1, idx1) => {
              const s1 = statsMap.get(p1.id);
              return (
                <tr key={p1.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-400">
                    {idx1 + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-slate-100">{p1.name}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-amber-400/80">
                    {p1.rating}
                  </td>
                  {sortedPlayers.map((p2) => {
                    const encounter = getEncounterResult(p1.id, p2.id);
                    return (
                      <td
                        key={p2.id}
                        className={`px-2 py-2.5 text-center font-mono text-xs ${encounter.bg}`}
                      >
                        {encounter.text}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-300 text-sm">
                    {s1?.points.toFixed(1) ?? '0.0'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400">
                    {s1?.sonnebornBerger.toFixed(2) ?? '0.00'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
