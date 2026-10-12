import React from 'react';
import { Player, Round, MatchResult } from '../types/chess';

interface KnockoutBracketViewProps {
  players: Player[];
  rounds: Round[];
  onUpdateResult: (roundNumber: number, boardNumber: number, result: MatchResult) => void;
}

export const KnockoutBracketView: React.FC<KnockoutBracketViewProps> = ({
  players,
  rounds,
  onUpdateResult,
}) => {
  const playerMap = new Map(players.map(p => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Knockout / Single Elimination Bracket</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Seeded single-elimination tournament with automated advancement
          </p>
        </div>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-6">
        {rounds.map((round) => (
          <div key={round.roundNumber} className="w-72 flex-shrink-0 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-center">
              Round {round.roundNumber} {round.pairings.length === 1 ? '(Finals)' : round.pairings.length === 2 ? '(Semifinals)' : ''}
            </div>

            <div className="space-y-4">
              {round.pairings.map((match) => {
                const white = playerMap.get(match.whitePlayerId);
                const black = match.blackPlayerId === 'BYE' ? null : playerMap.get(match.blackPlayerId);

                const whiteWon = match.result === '1-0' || match.result === '1-0 (FF)' || match.blackPlayerId === 'BYE';
                const blackWon = match.result === '0-1' || match.result === '0-1 (FF)';

                return (
                  <div
                    key={match.boardNumber}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-sm hover:border-slate-700 transition-colors"
                  >
                    <div className="text-[10px] text-slate-400 font-mono mb-2 flex justify-between">
                      <span>Board {match.boardNumber}</span>
                      <span>{match.result === 'pending' ? 'In Progress' : match.result}</span>
                    </div>

                    {/* White */}
                    <div className={`p-2 rounded flex items-center justify-between ${whiteWon ? 'bg-amber-500/10 text-amber-200 font-bold border border-amber-500/30' : 'bg-slate-950 text-slate-300'}`}>
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono text-slate-400">[{white?.seed}]</span>
                        <span className="text-xs truncate">{white?.name}</span>
                      </div>
                      <span className="text-xs font-mono">{match.result === '1-0' ? '1' : match.result === '1/2-1/2' ? '½' : match.result === '0-1' ? '0' : '-'}</span>
                    </div>

                    {/* Black */}
                    <div className={`p-2 rounded mt-1.5 flex items-center justify-between ${blackWon ? 'bg-amber-500/10 text-amber-200 font-bold border border-amber-500/30' : 'bg-slate-950 text-slate-300'}`}>
                      <div className="flex items-center gap-2 truncate">
                        {black ? (
                          <>
                            <span className="text-[10px] font-mono text-slate-400">[{black.seed}]</span>
                            <span className="text-xs truncate">{black.name}</span>
                          </>
                        ) : (
                          <span className="text-xs italic text-amber-400">BYE</span>
                        )}
                      </div>
                      <span className="text-xs font-mono">{match.result === '0-1' ? '1' : match.result === '1/2-1/2' ? '½' : match.result === '1-0' ? '0' : '-'}</span>
                    </div>

                    {/* Result buttons */}
                    {match.blackPlayerId !== 'BYE' && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800 justify-end">
                        <button
                          onClick={() => onUpdateResult(match.roundNumber, match.boardNumber, '1-0')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${match.result === '1-0' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                        >
                          1-0
                        </button>
                        <button
                          onClick={() => onUpdateResult(match.roundNumber, match.boardNumber, '1/2-1/2')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${match.result === '1/2-1/2' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                        >
                          ½-½
                        </button>
                        <button
                          onClick={() => onUpdateResult(match.roundNumber, match.boardNumber, '0-1')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${match.result === '0-1' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                        >
                          0-1
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
