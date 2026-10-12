import { Player, Round, PlayerStats } from '../types/chess';

/**
 * Calculates points for a given match result from player's perspective
 */
export function getPointsFromResult(result: string, isWhite: boolean): number {
  if (result === '1-0' || result === '1-0 (FF)') {
    return isWhite ? 1 : 0;
  }
  if (result === '0-1' || result === '0-1 (FF)') {
    return isWhite ? 0 : 1;
  }
  if (result === '1/2-1/2') {
    return 0.5;
  }
  if (result === 'BYE') {
    return 1;
  }
  if (result === '0-0 (FF)') {
    return 0;
  }
  return 0; // pending or unplayed
}

export function isWin(result: string, isWhite: boolean): boolean {
  return (result === '1-0' || result === '1-0 (FF)') ? isWhite : ((result === '0-1' || result === '0-1 (FF)') && !isWhite);
}

/**
 * Computes complete statistics and FIDE tie-breaks for all active players
 */
export function calculateTournamentStats(
  players: Player[],
  rounds: Round[],
  byeValue: number = 1
): Map<string, PlayerStats> {
  const statsMap = new Map<string, PlayerStats>();

  // 1. Initialize stats for each player
  for (const player of players) {
    statsMap.set(player.id, {
      playerId: player.id,
      points: 0,
      buchholz: 0,
      buchholzCut1: 0,
      sonnebornBerger: 0,
      progressiveScore: 0,
      directEncounterScore: 0,
      wins: 0,
      blackWins: 0,
      gamesPlayed: 0,
      colorHistory: [],
      colorDifference: 0,
      opponents: [],
      floats: [],
      rank: 0,
    });
  }

  // Track cumulative score after each completed round for progressive score
  const cumulativeScoresByRound: { [playerId: string]: number[] } = {};
  for (const player of players) {
    cumulativeScoresByRound[player.id] = [];
  }

  // 2. Accumulate base scores, opponents, and color history round by round
  for (const round of rounds) {
    for (const match of round.pairings) {
      if (match.blackPlayerId === 'BYE') {
        const whiteStat = statsMap.get(match.whitePlayerId);
        if (whiteStat) {
          whiteStat.points += (match.result === 'BYE' ? byeValue : 0);
          whiteStat.opponents.push('BYE');
          whiteStat.colorHistory.push('-');
        }
        continue;
      }

      const whiteStat = statsMap.get(match.whitePlayerId);
      const blackStat = statsMap.get(match.blackPlayerId);

      if (whiteStat) {
        whiteStat.opponents.push(match.blackPlayerId);
        whiteStat.colorHistory.push('W');
        whiteStat.colorDifference += 1;
      }

      if (blackStat) {
        blackStat.opponents.push(match.whitePlayerId);
        blackStat.colorHistory.push('B');
        blackStat.colorDifference -= 1;
      }

      if (match.result !== 'pending') {
        const whitePts = getPointsFromResult(match.result, true);
        const blackPts = getPointsFromResult(match.result, false);

        if (whiteStat) {
          whiteStat.points += whitePts;
          whiteStat.gamesPlayed += 1;
          if (isWin(match.result, true)) {
            whiteStat.wins += 1;
          }
        }

        if (blackStat) {
          blackStat.points += blackPts;
          blackStat.gamesPlayed += 1;
          if (isWin(match.result, false)) {
            blackStat.wins += 1;
            blackStat.blackWins += 1;
          }
        }
      }
    }

    // Record progressive score milestone for this round
    for (const player of players) {
      const pStat = statsMap.get(player.id);
      if (pStat) {
        cumulativeScoresByRound[player.id].push(pStat.points);
      }
    }
  }

  // Calculate progressive score sum
  for (const player of players) {
    const pStat = statsMap.get(player.id);
    if (pStat) {
      pStat.progressiveScore = cumulativeScoresByRound[player.id].reduce((a, b) => a + b, 0);
    }
  }

  // 3. Calculate Buchholz, Buchholz Cut-1, and Sonneborn-Berger
  for (const player of players) {
    const pStat = statsMap.get(player.id);
    if (!pStat) continue;

    const opponentScores: number[] = [];
    let sonneborn = 0;

    for (let rIndex = 0; rIndex < pStat.opponents.length; rIndex++) {
      const oppId = pStat.opponents[rIndex];
      if (oppId === 'BYE') continue;

      const oppStat = statsMap.get(oppId);
      const oppScore = oppStat ? oppStat.points : 0;
      opponentScores.push(oppScore);

      // Find match result between player and opp in this round
      const round = rounds[rIndex];
      if (round) {
        const match = round.pairings.find(
          m => (m.whitePlayerId === player.id && m.blackPlayerId === oppId) ||
               (m.blackPlayerId === player.id && m.whitePlayerId === oppId)
        );
        if (match && match.result !== 'pending') {
          const isWhite = match.whitePlayerId === player.id;
          const myPts = getPointsFromResult(match.result, isWhite);
          if (myPts === 1) {
            sonneborn += oppScore;
          } else if (myPts === 0.5) {
            sonneborn += oppScore * 0.5;
          }
        }
      }
    }

    pStat.sonnebornBerger = sonneborn;
    pStat.buchholz = opponentScores.reduce((acc, score) => acc + score, 0);

    if (opponentScores.length > 0) {
      const minScore = Math.min(...opponentScores);
      pStat.buchholzCut1 = pStat.buchholz - minScore;
    } else {
      pStat.buchholzCut1 = 0;
    }
  }

  // 4. Calculate Direct Encounter (Head-to-head score)
  // For each player, we evaluate encounters against players who share the exact same score
  for (const player of players) {
    const pStat = statsMap.get(player.id);
    if (!pStat) continue;

    let directPts = 0;
    for (const otherPlayer of players) {
      if (otherPlayer.id === player.id) continue;
      const otherStat = statsMap.get(otherPlayer.id);
      if (!otherStat || otherStat.points !== pStat.points) continue;

      // Check if they played each other
      for (const round of rounds) {
        const match = round.pairings.find(
          m => (m.whitePlayerId === player.id && m.blackPlayerId === otherPlayer.id) ||
               (m.blackPlayerId === player.id && m.whitePlayerId === otherPlayer.id)
        );
        if (match && match.result !== 'pending') {
          const isWhite = match.whitePlayerId === player.id;
          directPts += getPointsFromResult(match.result, isWhite);
        }
      }
    }
    pStat.directEncounterScore = directPts;
  }

  return statsMap;
}

/**
 * Sorts players based on FIDE standard rank criteria:
 * 1. Total Points
 * 2. Direct Encounter
 * 3. Buchholz
 * 4. Sonneborn-Berger
 * 5. Most Wins
 * 6. Rating / Initial Seed
 */
export function rankPlayers(
  players: Player[],
  statsMap: Map<string, PlayerStats>
): { player: Player; stats: PlayerStats }[] {
  const combined = players.map(p => ({
    player: p,
    stats: statsMap.get(p.id) || {
      playerId: p.id,
      points: 0,
      buchholz: 0,
      buchholzCut1: 0,
      sonnebornBerger: 0,
      progressiveScore: 0,
      directEncounterScore: 0,
      wins: 0,
      blackWins: 0,
      gamesPlayed: 0,
      colorHistory: [],
      colorDifference: 0,
      opponents: [],
      floats: [],
      rank: 0,
    },
  }));

  combined.sort((a, b) => {
    // 1. Points (descending)
    if (b.stats.points !== a.stats.points) {
      return b.stats.points - a.stats.points;
    }

    // 2. Direct Encounter (if applicable)
    if (b.stats.directEncounterScore !== a.stats.directEncounterScore) {
      return b.stats.directEncounterScore - a.stats.directEncounterScore;
    }

    // 3. Buchholz (descending)
    if (b.stats.buchholz !== a.stats.buchholz) {
      return b.stats.buchholz - a.stats.buchholz;
    }

    // 4. Sonneborn-Berger (descending)
    if (b.stats.sonnebornBerger !== a.stats.sonnebornBerger) {
      return b.stats.sonnebornBerger - a.stats.sonnebornBerger;
    }

    // 5. Wins (descending)
    if (b.stats.wins !== a.stats.wins) {
      return b.stats.wins - a.stats.wins;
    }

    // 6. Progressive Score
    if (b.stats.progressiveScore !== a.stats.progressiveScore) {
      return b.stats.progressiveScore - a.stats.progressiveScore;
    }

    // 7. Initial Seed / Rating
    return a.player.seed - b.player.seed;
  });

  // Assign ranks
  combined.forEach((item, index) => {
    item.stats.rank = index + 1;
  });

  return combined;
}

/**
 * Calculates a player's accumulated score before entering a specific round
 */
export function getPointsBeforeRound(
  playerId: string,
  roundNumber: number,
  rounds: Round[],
  byeValue: number = 1.0
): number {
  if (roundNumber <= 1) return 0.0;

  let score = 0;
  for (const r of rounds) {
    if (r.roundNumber >= roundNumber) break;
    for (const m of r.pairings) {
      if (m.whitePlayerId === playerId) {
        if (m.blackPlayerId === 'BYE') {
          score += byeValue;
        } else if (m.result !== 'pending') {
          score += getPointsFromResult(m.result, true);
        }
      } else if (m.blackPlayerId === playerId) {
        if (m.result !== 'pending') {
          score += getPointsFromResult(m.result, false);
        }
      }
    }
  }
  return score;
}

