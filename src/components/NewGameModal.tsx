import React, { useState } from 'react';
import { Player, TournamentSettings, TournamentType } from '../types/chess';
import { INITIAL_8_PLAYERS } from '../utils/fideRules';
import { X, Sparkles, Users, PlusCircle } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewTournament: (settings: TournamentSettings, players: Player[]) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartNewTournament,
}) => {
  const [tournamentName, setTournamentName] = useState('New Chess Championship 2026');
  const [chiefArbiter, setChiefArbiter] = useState('Chief Arbiter FIDE');
  const [systemType, setSystemType] = useState<TournamentType>('swiss');
  const [roundsCount, setRoundsCount] = useState<number>(5);
  const [playersText, setPlayersText] = useState(
    INITIAL_8_PLAYERS.map(p => `${p.title && p.title !== 'None' ? p.title + ' ' : ''}${p.name} ${p.rating}`).join('\n')
  );

  if (!isOpen) return null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = playersText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedPlayers: Player[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/(.*?)[\s,;]+(\d{3,4})$/);
      let pName = line;
      let pRtg = 2000;

      if (match) {
        pName = match[1].trim();
        pRtg = parseInt(match[2], 10);
      }

      let pTitle: any = 'None';
      const titles = ['GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];
      for (const t of titles) {
        if (pName.startsWith(`${t} `)) {
          pTitle = t;
          pName = pName.replace(`${t} `, '');
          break;
        }
      }

      parsedPlayers.push({
        id: `p_${Date.now()}_${idx}`,
        name: pName,
        rating: pRtg,
        title: pTitle,
        federation: 'INA',
        seed: 0,
        status: 'active',
      });
    });

    // Sort by rating
    parsedPlayers.sort((a, b) => b.rating - a.rating);
    parsedPlayers.forEach((p, idx) => p.seed = idx + 1);

    const newSettings: TournamentSettings = {
      id: `tourney_${Date.now()}`,
      name: tournamentName.trim() || 'New Chess Tournament',
      location: 'Tournament Hall',
      chiefArbiter: chiefArbiter.trim() || 'Chief Arbiter',
      timeControl: '90m + 30s',
      tournamentType: systemType,
      totalRounds: roundsCount,
      colorDrawBoard1: 'W',
      byePoints: 1.0,
      tieBreaks: ['direct_encounter', 'buchholz', 'sonneborn_berger', 'wins', 'progressive'],
    };

    onStartNewTournament(newSettings, parsedPlayers);
    onClose();
  };

  const handleQuickPreset = (type: TournamentType) => {
    setSystemType(type);
    if (type === 'round-robin') {
      setRoundsCount(7);
      setTournamentName('FIDE Masters Round-Robin Berger');
    } else if (type === 'knockout') {
      setRoundsCount(3);
      setTournamentName('FIDE Masters Knockout Cup');
    } else {
      setRoundsCount(5);
      setTournamentName('FIDE Masters Swiss Championship 2026');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Buat Turnamen Baru (New Game)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleQuickPreset('swiss')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              systemType === 'swiss'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Swiss (FIDE)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('round-robin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              systemType === 'round-robin'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Round-Robin
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('knockout')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              systemType === 'knockout'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Knockout
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Nama Turnamen</label>
            <input
              type="text"
              value={tournamentName}
              onChange={e => setTournamentName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Chief Arbiter</label>
              <input
                type="text"
                value={chiefArbiter}
                onChange={e => setChiefArbiter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Jumlah Ronde</label>
              <input
                type="number"
                min="1"
                max="15"
                value={roundsCount}
                onChange={e => setRoundsCount(parseInt(e.target.value) || 5)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Daftar Pemain (1 baris: [Gelar] [Nama] [Rating])
            </label>
            <textarea
              rows={6}
              value={playersText}
              onChange={e => setPlayersText(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
            >
              Mulai Turnamen (Start New Game)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
