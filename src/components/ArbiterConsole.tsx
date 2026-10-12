import React, { useState } from 'react';
import { Player, Round, ArbiterIncident, PlayerStats } from '../types/chess';
import { FIDE_LAWS_SUMMARY } from '../utils/fideRules';
import { Scale, AlertTriangle, ShieldCheck, Clock, BookOpen, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface ArbiterConsoleProps {
  players: Player[];
  rounds: Round[];
  statsMap: Map<string, PlayerStats>;
  incidents: ArbiterIncident[];
  onAddIncident: (incident: ArbiterIncident) => void;
  onDeleteIncident: (id: string) => void;
  onUpdatePlayerStatus: (playerId: string, status: 'active' | 'withdrawn' | 'disqualified') => void;
}

export const ArbiterConsole: React.FC<ArbiterConsoleProps> = ({
  players,
  rounds,
  statsMap,
  incidents,
  onAddIncident,
  onDeleteIncident,
  onUpdatePlayerStatus,
}) => {
  const [searchRule, setSearchRule] = useState('');
  const [newIncidentType, setNewIncidentType] = useState<ArbiterIncident['type']>('illegal_move');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [boardNum, setBoardNum] = useState<number>(1);
  const [roundNum, setRoundNum] = useState<number>(rounds.length || 1);
  const [ruling, setRuling] = useState('');
  const [penalty, setPenalty] = useState('');
  const [notes, setNotes] = useState('');

  // Pairing Audit
  const auditResults: { type: 'error' | 'warning' | 'info'; message: string }[] = [];

  // Check for rematches across all rounds
  const playedPairs = new Set<string>();
  for (const r of rounds) {
    for (const m of r.pairings) {
      if (m.blackPlayerId === 'BYE') continue;
      const key = [m.whitePlayerId, m.blackPlayerId].sort().join('::');
      if (playedPairs.has(key)) {
        auditResults.push({
          type: 'error',
          message: `FIDE Violation: Rematch detected between players in Round ${r.roundNumber}!`,
        });
      }
      playedPairs.add(key);
    }
  }

  // Check color balance & 3-in-a-row
  for (const p of players) {
    const s = statsMap.get(p.id);
    if (!s) continue;

    // Check color difference
    if (Math.abs(s.colorDifference) > 2) {
      auditResults.push({
        type: 'error',
        message: `FIDE Color Imbalance: ${p.name} has color difference of ${s.colorDifference} (Exceeds |2| limit)!`,
      });
    }

    // Check 3 consecutive colors
    const colors = s.colorHistory.filter(c => c === 'W' || c === 'B');
    for (let i = 0; i < colors.length - 2; i++) {
      if (colors[i] === colors[i + 1] && colors[i + 1] === colors[i + 2]) {
        auditResults.push({
          type: 'error',
          message: `FIDE 3-in-a-Row Breach: ${p.name} was assigned 3 consecutive ${colors[i] === 'W' ? 'Whites' : 'Blacks'}!`,
        });
      }
    }
  }

  if (auditResults.length === 0) {
    auditResults.push({
      type: 'info',
      message: 'All rounds comply with FIDE Swiss pairing invariants (no rematches, color diff <= 2, no 3-in-a-row).',
    });
  }

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !ruling) return;

    const newInc: ArbiterIncident = {
      id: `inc_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      roundNumber: roundNum,
      boardNumber: boardNum,
      playerIds: [selectedPlayerId],
      type: newIncidentType,
      ruling: ruling,
      penalty: penalty || 'Official Warning logged',
      notes: notes,
    };

    onAddIncident(newInc);
    setRuling('');
    setPenalty('');
    setNotes('');
  };

  const filteredRules = FIDE_LAWS_SUMMARY.filter(r => 
    r.title.toLowerCase().includes(searchRule.toLowerCase()) ||
    r.article.toLowerCase().includes(searchRule.toLowerCase()) ||
    r.summary.toLowerCase().includes(searchRule.toLowerCase()) ||
    r.category.toLowerCase().includes(searchRule.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Chief Arbiter Administration & FIDE Compliance
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rulebook enforcement, illegal move penalties, default times, and pairing audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            FIDE Handbook Edition
          </span>
        </div>
      </div>

      {/* Pairing Audit Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Automated FIDE Pairing Audit & Anomaly Detection
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {rounds.length} Round(s) Analyzed
          </span>
        </div>

        <div className="space-y-2">
          {auditResults.map((audit, i) => (
            <div
              key={i}
              className={`text-xs p-3 rounded-lg border flex items-start gap-2.5 ${
                audit.type === 'error'
                  ? 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                  : audit.type === 'warning'
                  ? 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                  : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
              }`}
            >
              {audit.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{audit.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arbiter Incident Logger & Active Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Log Form */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            Log Arbiter Incident / Penalty
          </h3>

          <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Round</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={roundNum}
                  onChange={e => setRoundNum(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Board</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={boardNum}
                  onChange={e => setBoardNum(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Player Involved</label>
              <select
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Seed {p.seed}, Rtg {p.rating})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Violation Type</label>
              <select
                value={newIncidentType}
                onChange={e => setNewIncidentType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              >
                <option value="illegal_move">Illegal Move (FIDE Art. 7.5.5)</option>
                <option value="default_time">Default Time / Late Arrival (Art. 6.7)</option>
                <option value="touch_move">Touch-Move Infraction (Art. 4.3)</option>
                <option value="mobile_device">Mobile Phone / Device Sound (Art. 11.3)</option>
                <option value="conduct">Unsportsmanlike Conduct (Art. 12.1)</option>
                <option value="draw_claim">Incorrect Draw Claim (Art. 9.1)</option>
                <option value="other">Other Arbiter Intervention</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Arbiter Ruling</label>
              <input
                type="text"
                placeholder="e.g. 1st illegal move completed by player"
                value={ruling}
                onChange={e => setRuling(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Penalty Imposed</label>
              <input
                type="text"
                placeholder="e.g. +2 min extra time added to opponent's clock"
                value={penalty}
                onChange={e => setPenalty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Additional Notes</label>
              <textarea
                rows={2}
                placeholder="Position restored to move 24 before illegal pawn move..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              Record Arbiter Ruling
            </button>
          </form>
        </div>

        {/* Incidents History */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Tournament Incident & Penalty Log
            </h3>
            <span className="text-xs text-slate-400">
              {incidents.length} Recorded
            </span>
          </div>

          {incidents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/40 border border-slate-850 rounded-lg">
              No disciplinary incidents or penalties recorded for this tournament.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {incidents.map(inc => {
                const player = players.find(p => p.id === inc.playerIds[0]);
                return (
                  <div
                    key={inc.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">
                          R{inc.roundNumber} / B{inc.boardNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-200">
                          {player?.name || 'Player'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="uppercase text-[10px] tracking-wider text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {inc.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{inc.timestamp}</span>
                        <button
                          onClick={() => onDeleteIncident(inc.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-200 font-medium">
                      {inc.ruling}
                    </div>

                    <div className="text-emerald-400 font-mono text-[11px]">
                      Penalty: {inc.penalty}
                    </div>

                    {inc.notes && (
                      <div className="text-slate-400 text-[11px] italic">
                        Note: {inc.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FIDE Laws of Chess Reference */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              FIDE Laws of Chess Quick Arbiter Handbook
            </h3>
          </div>
          <input
            type="text"
            placeholder="Search rules (illegal move, touch-move, default)..."
            value={searchRule}
            onChange={e => setSearchRule(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 w-full sm:w-64"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map(law => (
            <div
              key={law.article}
              className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3.5 text-xs space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-mono text-amber-400 font-semibold">{law.article}</span>
                  <span className="text-[10px] text-slate-400">{law.category}</span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm mb-1">{law.title}</h4>
                <p className="text-slate-400 leading-relaxed">{law.summary}</p>
              </div>

              <div className="pt-2 border-t border-slate-850 mt-2 text-[11px]">
                <span className="font-semibold text-emerald-400">Chief Arbiter Action: </span>
                <span className="text-slate-300">{law.arbiterAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
