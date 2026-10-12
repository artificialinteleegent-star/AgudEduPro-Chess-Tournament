import React, { useState } from 'react';
import { Player, TitleType, TournamentSettings, TournamentType } from '../types/chess';
import { UserPlus, Settings2, Trash2, Edit2, RotateCcw, Shield, Check } from 'lucide-react';
import { INITIAL_8_PLAYERS } from '../utils/fideRules';

interface PlayerManagerProps {
  players: Player[];
  settings: TournamentSettings;
  onUpdatePlayers: (players: Player[]) => void;
  onUpdateSettings: (settings: TournamentSettings) => void;
  onResetToInitial8: () => void;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  settings,
  onUpdatePlayers,
  onUpdateSettings,
  onResetToInitial8,
}) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState<number>(2000);
  const [title, setTitle] = useState<TitleType>('None');
  const [federation, setFederation] = useState('INA');
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPlayerId) {
      const updated = players.map(p => 
        p.id === editingPlayerId 
          ? { ...p, name: name.trim(), rating: Number(rating), title, federation: federation.toUpperCase() }
          : p
      );
      // Re-seed by rating
      updated.sort((a, b) => b.rating - a.rating);
      updated.forEach((p, idx) => p.seed = idx + 1);
      onUpdatePlayers(updated);
      setEditingPlayerId(null);
    } else {
      const newPlayer: Player = {
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        rating: Number(rating),
        title,
        federation: federation.toUpperCase(),
        seed: players.length + 1,
        status: 'active',
      };
      const updated = [...players, newPlayer];
      updated.sort((a, b) => b.rating - a.rating);
      updated.forEach((p, idx) => p.seed = idx + 1);
      onUpdatePlayers(updated);
    }

    setName('');
    setRating(2000);
    setTitle('None');
    setFederation('INA');
  };

  const handleEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setName(player.name);
    setRating(player.rating);
    setTitle(player.title || 'None');
    setFederation(player.federation || 'INA');
  };

  const handleDelete = (id: string) => {
    const updated = players.filter(p => p.id !== id);
    updated.forEach((p, idx) => p.seed = idx + 1);
    onUpdatePlayers(updated);
  };

  const handleBulkImport = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newOnes: Player[] = [];

    for (const line of lines) {
      // Look for rating at the end or within line
      const match = line.match(/(.*?)[\s,;]+(\d{3,4})$/);
      let pName = line;
      let pRtg = 2000;

      if (match) {
        pName = match[1].trim();
        pRtg = parseInt(match[2], 10);
      }

      // Check title prefix
      let pTitle: TitleType = 'None';
      const titles: TitleType[] = ['GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];
      for (const t of titles) {
        if (pName.startsWith(`${t} `)) {
          pTitle = t;
          pName = pName.replace(`${t} `, '');
          break;
        }
      }

      newOnes.push({
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: pName,
        rating: pRtg,
        title: pTitle,
        federation: 'INA',
        seed: 0,
        status: 'active',
      });
    }

    if (newOnes.length > 0) {
      newOnes.sort((a, b) => b.rating - a.rating);
      newOnes.forEach((p, idx) => p.seed = idx + 1);
      onUpdatePlayers(newOnes);
      setShowBulkModal(false);
      setBulkText('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Tournament Settings Configuration */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Tournament & Arbiter Configuration</h2>
          </div>
          <button
            onClick={onResetToInitial8}
            className="px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to 8-Player Swiss R1</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Tournament Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={e => onUpdateSettings({ ...settings, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Chief Arbiter</label>
            <input
              type="text"
              value={settings.chiefArbiter}
              onChange={e => onUpdateSettings({ ...settings, chiefArbiter: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Pairing System</label>
            <select
              value={settings.tournamentType}
              onChange={e => onUpdateSettings({ ...settings, tournamentType: e.target.value as TournamentType })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
            >
              <option value="swiss">Swiss-System (FIDE Dutch)</option>
              <option value="round-robin">Round-Robin (Berger Tables)</option>
              <option value="knockout">Knockout / Single Elimination</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Board 1 Color Draw</label>
            <select
              value={settings.colorDrawBoard1}
              onChange={e => onUpdateSettings({ ...settings, colorDrawBoard1: e.target.value as 'W' | 'B' })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
            >
              <option value="W">Seed 1 plays White</option>
              <option value="B">Seed 1 plays Black</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add/Edit Player Form */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              {editingPlayerId ? 'Edit Player' : 'Register New Player'}
            </h3>
            <button
              onClick={() => setShowBulkModal(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium underline"
            >
              Bulk Import
            </button>
          </div>

          <form onSubmit={handleAddPlayer} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Player Full Name</label>
              <input
                type="text"
                placeholder="e.g. GM Susanto Megaranto"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Rating</label>
                <input
                  type="number"
                  min="500"
                  max="3000"
                  value={rating}
                  onChange={e => setRating(parseInt(e.target.value) || 1000)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Title</label>
                <select
                  value={title}
                  onChange={e => setTitle(e.target.value as TitleType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="None">None</option>
                  <option value="GM">GM</option>
                  <option value="IM">IM</option>
                  <option value="FM">FM</option>
                  <option value="CM">CM</option>
                  <option value="WGM">WGM</option>
                  <option value="WIM">WIM</option>
                  <option value="WFM">WFM</option>
                  <option value="WCM">WCM</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Fed</label>
                <input
                  type="text"
                  maxLength={3}
                  value={federation}
                  onChange={e => setFederation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                {editingPlayerId ? 'Save Changes' : 'Add Player to Roster'}
              </button>
              {editingPlayerId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlayerId(null);
                    setName('');
                  }}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Player List Table */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">
              Registered Participants ({players.length})
            </h3>
            <span className="text-xs text-slate-400">
              Sorted by FIDE Rating Seeding
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">Seed</th>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-2 py-2.5 text-center">Title</th>
                  <th className="px-2 py-2.5 text-center">Fed</th>
                  <th className="px-3 py-2.5 text-right">FIDE Rtg</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-400">
                      {p.seed}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-100">
                      {p.name}
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono font-bold text-amber-400/90">
                      {p.title !== 'None' ? p.title : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono text-slate-400">
                      {p.federation}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-200">
                      {p.rating}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        p.status === 'active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950/40 text-rose-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1 text-slate-400 hover:text-amber-300 rounded"
                          title="Edit Player"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          title="Remove Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">Bulk Import Players</h3>
            <p className="text-xs text-slate-400">
              Paste one player per line. Format: <code>[Title] [Name] [Rating]</code>. Example:
              <br />
              <span className="font-mono text-slate-300">GM Susanto Megaranto 2505</span>
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="GM Susanto Megaranto 2505&#10;IM Novendra Priasmoro 2490&#10;FM Aditya Bagus Arfan 2380"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg"
              >
                Import Players
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
