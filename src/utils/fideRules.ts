import { Player, MatchPairing, MatchResult } from '../types/chess';

export interface FideLawSummary {
  article: string;
  title: string;
  category: 'Time & Default' | 'Illegal Moves' | 'Touch Move' | 'Draw Claims' | 'Fair Play & Electronics' | 'Swiss Pairings';
  summary: string;
  arbiterAction: string;
}

export const FIDE_LAWS_SUMMARY: FideLawSummary[] = [
  {
    article: 'Article 6.7',
    title: 'Default Time & Forfeit',
    category: 'Time & Default',
    summary: 'Any player who arrives at the chessboard after the default time (zero-tolerance or as declared by the Chief Arbiter) loses the game unless the arbiter decides otherwise.',
    arbiterAction: 'Award win to opponent as "1-0 (FF)" or "0-1 (FF)". If both players fail to arrive within default time, score is "0-0 (FF)".',
  },
  {
    article: 'Article 7.5.5',
    title: 'Illegal Moves (Standard & Rapid)',
    category: 'Illegal Moves',
    summary: 'If a player completes an illegal move (pressing the clock): on the first completed illegal move, the arbiter shall give two minutes extra time to the opponent; on the second completed illegal move by the same player in the same game, the arbiter shall declare the game lost by that player.',
    arbiterAction: '1st offense: Restore position before the illegal move, award 2 min extra time to opponent. 2nd offense: Declare game lost by the offending player (provided opponent has mating material).',
  },
  {
    article: 'Article 4.3 - 4.4',
    title: 'The Touch-Move Rule',
    category: 'Touch Move',
    summary: 'If the player having the move touches with the intention of moving or capturing: one or more of their own pieces, they must move the first touched piece; an opponent piece, they must capture it if legal.',
    arbiterAction: 'If player disputes touching a piece, arbiter rules based on credible witness or video evidence. If touch was accidental ("J\'adoube" / "I adjust" declared beforehand), no penalty.',
  },
  {
    article: 'Article 11.3.2.1',
    title: 'Electronic Devices & Mobile Phones',
    category: 'Fair Play & Electronics',
    summary: 'During a game, a player is forbidden to have any electronic device not specifically approved by the arbiter in the playing venue. If a mobile phone rings or makes a sound, the player loses the game.',
    arbiterAction: 'Immediate forfeiture of the game. Score recorded as forfeit loss (-/+ or +/-). Arbiter may report incident to the Fair Play Commission.',
  },
  {
    article: 'Article 9.1 - 9.3',
    title: 'Draw Claims (3-fold & 50-move)',
    category: 'Draw Claims',
    summary: 'A player may claim a draw if the exact same position is about to appear for the 3rd time (writing move on sheet before playing) or has appeared 3 times; or if at least 50 consecutive moves have been made without a pawn move or capture.',
    arbiterAction: 'Stop clock to verify scoresheet. If claim is valid, declare draw. If claim is incorrect, add 2 minutes to opponent\'s remaining time.',
  },
  {
    article: 'FIDE Handbook C.04',
    title: 'Basic Swiss Pairing Rules (Dutch System)',
    category: 'Swiss Pairings',
    summary: '1. Two players shall not meet more than once. 2. A player who has received a bye or forfeit win unplayed shall not receive another bye. 3. Absolute color difference |W - B| must not exceed 2. 4. No player shall receive the same color three times in a row.',
    arbiterAction: 'Audit pairing engine flags prior to round publication. Approve floats only when unavoidable within the score group.',
  },
];

export const INITIAL_8_PLAYERS: Player[] = [
  { id: 'p1', name: 'GM Susanto Megaranto', rating: 2505, title: 'GM', federation: 'INA', seed: 1, status: 'active' },
  { id: 'p2', name: 'GM Utut Adianto', rating: 2540, title: 'GM', federation: 'INA', seed: 2, status: 'active' },
  { id: 'p3', name: 'IM Novendra Priasmoro', rating: 2490, title: 'IM', federation: 'INA', seed: 3, status: 'active' },
  { id: 'p4', name: 'IM Sean Winshand Cuhendi', rating: 2420, title: 'IM', federation: 'INA', seed: 4, status: 'active' },
  { id: 'p5', name: 'FM Aditya Bagus Arfan', rating: 2380, title: 'FM', federation: 'INA', seed: 5, status: 'active' },
  { id: 'p6', name: 'IM Gilbert Elroy Tarigan', rating: 2350, title: 'IM', federation: 'INA', seed: 6, status: 'active' },
  { id: 'p7', name: 'WGM Irene Kharisma Sukandar', rating: 2370, title: 'WGM', federation: 'INA', seed: 7, status: 'active' },
  { id: 'p8', name: 'WGM Medina Warda Aulia', rating: 2360, title: 'WGM', federation: 'INA', seed: 8, status: 'active' },
];

/**
 * Generates structured Markdown format as requested:
 * [Board Number] | [White Player Name (Rating) [Points]] vs [Black Player Name (Rating) [Points]] | Result (if finished)
 */
export function formatPairingsToMarkdown(
  roundNumber: number,
  pairings: MatchPairing[],
  playerMap: Map<string, Player>,
  tournamentName: string,
  statsMap?: Map<string, any>
): string {
  let md = `### Tournament: ${tournamentName}\n`;
  md += `#### Pairings & Results - Round ${roundNumber}\n`;
  md += `*(Urutan papan berdasarkan peringkat skor tertinggi)*\n\n`;
  md += `| Board | White Player (Rating) [Pts] | Black Player (Rating) [Pts] | Result |\n`;
  md += `| :---: | :--- | :--- | :---: |\n`;

  for (const m of pairings) {
    const white = playerMap.get(m.whitePlayerId);
    const whitePts = statsMap ? statsMap.get(m.whitePlayerId)?.points : undefined;
    const whitePtsStr = whitePts !== undefined ? ` [${whitePts.toFixed(1)} pt]` : '';
    const whiteDesc = white ? `${white.title && white.title !== 'None' ? white.title + ' ' : ''}${white.name} (${white.rating})${whitePtsStr}` : 'Unknown';

    if (m.blackPlayerId === 'BYE') {
      md += `| Board ${m.boardNumber} | ${whiteDesc} | **BYE (1.0 Pt)** | 1 - 0 (BYE) |\n`;
    } else {
      const black = playerMap.get(m.blackPlayerId);
      const blackPts = statsMap ? statsMap.get(m.blackPlayerId)?.points : undefined;
      const blackPtsStr = blackPts !== undefined ? ` [${blackPts.toFixed(1)} pt]` : '';
      const blackDesc = black ? `${black.title && black.title !== 'None' ? black.title + ' ' : ''}${black.name} (${black.rating})${blackPtsStr}` : 'Unknown';
      const resultText = m.result === 'pending' ? '*' : m.result;
      md += `| Board ${m.boardNumber} | ${whiteDesc} | ${blackDesc} | ${resultText} |\n`;
    }
  }

  md += `\n**FIDE Chief Arbiter Pairing Analysis:**\n`;
  md += `- Urutan Papan: Terurut dari nilai/skor tertinggi ke terendah.\n`;
  md += `- Rematch Rule: 0 duplicate encounters (Pemain tidak bertemu lawan yang pernah dihadapi).\n`;
  md += `- Total Boards: ${pairings.length}\n`;

  return md;
}

export function formatStandingsToMarkdown(
  ranked: { player: Player; stats: any }[],
  currentRound: number
): string {
  let md = `### FIDE Standings after Round ${currentRound}\n\n`;
  md += `| Rk | Name | Fed | Rtg | Pts | Buchholz | Sonne-Berg | DirEnc | Wins | ColDiff |\n`;
  md += `| :-: | :--- | :-: | :-: | :-: | :------: | :--------: | :----: | :--: | :-----: |\n`;

  for (const item of ranked) {
    const p = item.player;
    const s = item.stats;
    const titleStr = p.title && p.title !== 'None' ? `${p.title} ` : '';
    const colDiffStr = s.colorDifference > 0 ? `+${s.colorDifference}` : `${s.colorDifference}`;
    md += `| ${s.rank} | ${titleStr}${p.name} | ${p.federation || 'FID'} | ${p.rating} | **${s.points}** | ${s.buchholz.toFixed(1)} | ${s.sonnebornBerger.toFixed(2)} | ${s.directEncounterScore} | ${s.wins} | ${colDiffStr} |\n`;
  }

  return md;
}
