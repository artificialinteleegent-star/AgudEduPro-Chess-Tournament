import { Player, Round, MatchPairing, TournamentSettings, PlayerStats } from '../types/chess';
import { calculateTournamentStats } from './tiebreaks';

interface ColorPreference {
  preferred: 'W' | 'B' | 'any';
  isStrict: boolean; // true if must NOT receive opposite (e.g. already 2 in a row or diff = +/-2)
  reason?: string;
}

/**
 * Computes FIDE color preference for a player based on past rounds
 */
export function getColorPreference(stats?: PlayerStats): ColorPreference {
  if (!stats || stats.colorHistory.length === 0) {
    return { preferred: 'any', isStrict: false };
  }

  const validColors = stats.colorHistory.filter(c => c === 'W' || c === 'B');
  if (validColors.length === 0) {
    return { preferred: 'any', isStrict: false };
  }

  const lastColor = validColors[validColors.length - 1];
  const secondLastColor = validColors.length >= 2 ? validColors[validColors.length - 2] : null;

  // Strict FIDE Rule: No 3 consecutive games of the same color
  if (lastColor === 'W' && secondLastColor === 'W') {
    return { preferred: 'B', isStrict: true, reason: 'Already 2 Whites in a row (FIDE 3-in-a-row rule)' };
  }
  if (lastColor === 'B' && secondLastColor === 'B') {
    return { preferred: 'W', isStrict: true, reason: 'Already 2 Blacks in a row (FIDE 3-in-a-row rule)' };
  }

  // Strict FIDE Rule: Absolute color difference cannot exceed 2
  if (stats.colorDifference >= 2) {
    return { preferred: 'B', isStrict: true, reason: 'Color difference +2 (W-B)' };
  }
  if (stats.colorDifference <= -2) {
    return { preferred: 'W', isStrict: true, reason: 'Color difference -2 (W-B)' };
  }

  // Mild preference: equalize color difference
  if (stats.colorDifference > 0) {
    return { preferred: 'B', isStrict: false, reason: 'Equalize color balance (currently +1)' };
  }
  if (stats.colorDifference < 0) {
    return { preferred: 'W', isStrict: false, reason: 'Equalize color balance (currently -1)' };
  }

  // Alternation rule: alternate color from previous round
  if (lastColor === 'W') {
    return { preferred: 'B', isStrict: false, reason: 'Color alternation after White' };
  } else {
    return { preferred: 'W', isStrict: false, reason: 'Color alternation after Black' };
  }
}

/**
 * Decides colors for a pairing between Player A and Player B
 * Returns { whiteId, blackId, anomalies }
 */
export function resolveColors(
  playerA: Player,
  playerB: Player,
  statsA?: PlayerStats,
  statsB?: PlayerStats
): { whiteId: string; blackId: string; anomalies: string[] } {
  const anomalies: string[] = [];
  const prefA = getColorPreference(statsA);
  const prefB = getColorPreference(statsB);

  // If one strictly requires a color and other doesn't conflict strictly
  if (prefA.isStrict && prefA.preferred === 'W') {
    if (prefB.isStrict && prefB.preferred === 'W') {
      anomalies.push(`Color clash: Both ${playerA.name} and ${playerB.name} strongly require White`);
      // Higher seed or higher rank gets preference
      return { whiteId: playerA.id, blackId: playerB.id, anomalies };
    }
    return { whiteId: playerA.id, blackId: playerB.id, anomalies };
  }

  if (prefA.isStrict && prefA.preferred === 'B') {
    if (prefB.isStrict && prefB.preferred === 'B') {
      anomalies.push(`Color clash: Both ${playerA.name} and ${playerB.name} strongly require Black`);
      return { whiteId: playerB.id, blackId: playerA.id, anomalies };
    }
    return { whiteId: playerB.id, blackId: playerA.id, anomalies };
  }

  if (prefB.isStrict && prefB.preferred === 'W') {
    return { whiteId: playerB.id, blackId: playerA.id, anomalies };
  }

  if (prefB.isStrict && prefB.preferred === 'B') {
    return { whiteId: playerA.id, blackId: playerB.id, anomalies };
  }

  // Normal preferences
  if (prefA.preferred === 'W' && prefB.preferred === 'B') {
    return { whiteId: playerA.id, blackId: playerB.id, anomalies };
  }
  if (prefA.preferred === 'B' && prefB.preferred === 'W') {
    return { whiteId: playerB.id, blackId: playerA.id, anomalies };
  }

  // Both prefer the same color or any: prioritize player with larger color imbalance
  const diffA = Math.abs(statsA?.colorDifference || 0);
  const diffB = Math.abs(statsB?.colorDifference || 0);

  if (diffA > diffB) {
    if (prefA.preferred === 'W') return { whiteId: playerA.id, blackId: playerB.id, anomalies };
    if (prefA.preferred === 'B') return { whiteId: playerB.id, blackId: playerA.id, anomalies };
  } else if (diffB > diffA) {
    if (prefB.preferred === 'W') return { whiteId: playerB.id, blackId: playerA.id, anomalies };
    if (prefB.preferred === 'B') return { whiteId: playerA.id, blackId: playerB.id, anomalies };
  }

  // Equal preferences: alternate seed or give higher seed alternation
  // If player A played Black last, give White
  const lastA = statsA?.colorHistory[statsA.colorHistory.length - 1];
  if (lastA === 'B') {
    return { whiteId: playerA.id, blackId: playerB.id, anomalies };
  } else if (lastA === 'W') {
    return { whiteId: playerB.id, blackId: playerA.id, anomalies };
  }

  // Default: higher seed gets White
  if (playerA.seed <= playerB.seed) {
    return { whiteId: playerA.id, blackId: playerB.id, anomalies };
  } else {
    return { whiteId: playerB.id, blackId: playerA.id, anomalies };
  }
}

/**
 * Generates Swiss Round 1 Pairing (FIDE Dutch System)
 * Top half vs Bottom half with alternating colors
 */
export function generateSwissRound1(
  activePlayers: Player[],
  colorDrawSeed1: 'W' | 'B' = 'W'
): MatchPairing[] {
  // Sort players by rating descending (then seed ascending)
  const sorted = [...activePlayers].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.seed - b.seed;
  });

  const pairings: MatchPairing[] = [];
  const n = sorted.length;
  let byePlayer: Player | null = null;
  let eligiblePlayers = [...sorted];

  // If odd number of players, lowest rated player gets the full-point bye
  if (n % 2 !== 0) {
    byePlayer = eligiblePlayers.pop()!;
  }

  const half = eligiblePlayers.length / 2;
  const topHalf = eligiblePlayers.slice(0, half);
  const bottomHalf = eligiblePlayers.slice(half);

  for (let i = 0; i < half; i++) {
    const pTop = topHalf[i];
    const pBottom = bottomHalf[i];
    const boardNum = i + 1;

    // FIDE Round 1 Alternation:
    // Board 1 gets the drawn color for top seed.
    // Subsequent boards alternate: Board 2 opposite, Board 3 same, etc.
    const isEvenBoard = (boardNum % 2 === 0);
    const topSeedGetsWhite = isEvenBoard ? (colorDrawSeed1 === 'B') : (colorDrawSeed1 === 'W');

    pairings.push({
      boardNumber: boardNum,
      roundNumber: 1,
      whitePlayerId: topSeedGetsWhite ? pTop.id : pBottom.id,
      blackPlayerId: topSeedGetsWhite ? pBottom.id : pTop.id,
      result: 'pending',
      anomalies: [],
    });
  }

  // Add bye if applicable
  if (byePlayer) {
    pairings.push({
      boardNumber: half + 1,
      roundNumber: 1,
      whitePlayerId: byePlayer.id,
      blackPlayerId: 'BYE',
      result: 'BYE',
      anomalies: ['1.0 Pt Unpaired Bye (Lowest Seed)'],
    });
  }

  return pairings;
}

/**
 * Checks if two players have already played against each other in any previous round
 */
export function havePlayedBefore(playerAId: string, playerBId: string, previousRounds: Round[]): boolean {
  for (const round of previousRounds) {
    for (const match of round.pairings) {
      if (
        (match.whitePlayerId === playerAId && match.blackPlayerId === playerBId) ||
        (match.whitePlayerId === playerBId && match.blackPlayerId === playerAId)
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generates Swiss Round N Pairing (FIDE Dutch System)
 */
export function generateSwissSubsequentRound(
  activePlayers: Player[],
  previousRounds: Round[],
  nextRoundNumber: number,
  settings: TournamentSettings
): MatchPairing[] {
  const statsMap = calculateTournamentStats(activePlayers, previousRounds, settings.byePoints);

  // Group active players into Score Brackets
  const playerList = [...activePlayers].filter(p => p.status === 'active');
  const byeHistory = new Set<string>();
  for (const round of previousRounds) {
    for (const m of round.pairings) {
      if (m.blackPlayerId === 'BYE') {
        byeHistory.add(m.whitePlayerId);
      }
    }
  }

  // Sort players by score descending, then rating/seed
  playerList.sort((a, b) => {
    const sA = statsMap.get(a.id)?.points || 0;
    const sB = statsMap.get(b.id)?.points || 0;
    if (sB !== sA) return sB - sA;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.seed - b.seed;
  });

  const pairings: MatchPairing[] = [];
  const assigned = new Set<string>();

  // If odd number of active players, allocate Bye
  if (playerList.length % 2 !== 0) {
    // FIDE rule: Lowest score player who hasn't had a bye yet
    for (let i = playerList.length - 1; i >= 0; i--) {
      const candidate = playerList[i];
      if (!byeHistory.has(candidate.id)) {
        assigned.add(candidate.id);
        pairings.push({
          boardNumber: 0, // will renumber at end
          roundNumber: nextRoundNumber,
          whitePlayerId: candidate.id,
          blackPlayerId: 'BYE',
          result: 'BYE',
          anomalies: ['1.0 Pt Pairing Bye (FIDE lowest score unawarded)'],
        });
        break;
      }
    }
  }

  const unassigned = playerList.filter(p => !assigned.has(p.id));

  // Score brackets pairing with backtracking: strictly avoid rematch and minimize score delta
  function pairBracket(remaining: Player[]): [Player, Player][] | null {
    if (remaining.length === 0) return [];
    if (remaining.length % 2 !== 0) return null;

    const p1 = remaining[0];
    const s1Pts = statsMap.get(p1.id)?.points || 0;
    const rest = remaining.slice(1);

    // Filter only opponents p1 has NEVER played before
    const eligibleOpponents = rest.filter(p2 => !havePlayedBefore(p1.id, p2.id, previousRounds));

    // Sort eligible opponents by score difference (prefer same score bracket), then color compatibility, then seed
    eligibleOpponents.sort((a, b) => {
      const ptsA = statsMap.get(a.id)?.points || 0;
      const ptsB = statsMap.get(b.id)?.points || 0;
      const diffA = Math.abs(s1Pts - ptsA);
      const diffB = Math.abs(s1Pts - ptsB);
      if (diffA !== diffB) return diffA - diffB;
      return a.seed - b.seed;
    });

    for (const p2 of eligibleOpponents) {
      const nextRemaining = rest.filter(p => p.id !== p2.id);
      const subResult = pairBracket(nextRemaining);
      if (subResult !== null) {
        return [[p1, p2], ...subResult];
      }
    }

    return null;
  }

  let pairs = pairBracket(unassigned);

  // If strict bracket was impossible, try full permutation search ensuring NO rematch
  if (!pairs) {
    function pairAnyWithoutRematch(pool: Player[]): [Player, Player][] | null {
      if (pool.length === 0) return [];
      if (pool.length % 2 !== 0) return null;
      const p1 = pool[0];
      const rest = pool.slice(1);
      const validOpps = rest.filter(p2 => !havePlayedBefore(p1.id, p2.id, previousRounds));
      for (const p2 of validOpps) {
        const nextPool = rest.filter(p => p.id !== p2.id);
        const sub = pairAnyWithoutRematch(nextPool);
        if (sub !== null) return [[p1, p2], ...sub];
      }
      return null;
    }
    pairs = pairAnyWithoutRematch(unassigned);
  }

  // Extreme fallback only if mathematically all players have played everyone
  if (!pairs) {
    pairs = [];
    const pool = [...unassigned];
    while (pool.length >= 2) {
      const p1 = pool.shift()!;
      let partnerIdx = pool.findIndex(p => !havePlayedBefore(p1.id, p.id, previousRounds));
      if (partnerIdx === -1) partnerIdx = 0;
      const [p2] = pool.splice(partnerIdx, 1);
      pairs.push([p1, p2]);
    }
  }

  // Prepare pairings with resolved colors and score metadata
  interface PairDetail {
    whiteId: string;
    blackId: string;
    anomalies: string[];
    maxScore: number;
    totalScore: number;
    topSeed: number;
  }

  const preparedPairs: PairDetail[] = [];

  for (const [p1, p2] of pairs) {
    const s1 = statsMap.get(p1.id);
    const s2 = statsMap.get(p2.id);
    const { whiteId, blackId, anomalies } = resolveColors(p1, p2, s1, s2);

    const pts1 = s1?.points ?? 0;
    const pts2 = s2?.points ?? 0;
    if (pts1 !== pts2) {
      const higher = pts1 > pts2 ? p1.name : p2.name;
      const lower = pts1 > pts2 ? p2.name : p1.name;
      anomalies.push(`Score float: ${higher} (${Math.max(pts1, pts2)}) downfloated to ${lower} (${Math.min(pts1, pts2)})`);
    }

    // Color sequence warning
    const wStat = whiteId === p1.id ? s1 : s2;
    const bStat = blackId === p1.id ? s1 : s2;

    if (wStat && wStat.colorHistory.length >= 2) {
      const last2 = wStat.colorHistory.slice(-2);
      if (last2[0] === 'W' && last2[1] === 'W') {
        anomalies.push(`Warning: White player has 3 Whites in sequence`);
      }
    }

    if (bStat && bStat.colorHistory.length >= 2) {
      const last2 = bStat.colorHistory.slice(-2);
      if (last2[0] === 'B' && last2[1] === 'B') {
        anomalies.push(`Warning: Black player has 3 Blacks in sequence`);
      }
    }

    preparedPairs.push({
      whiteId,
      blackId,
      anomalies,
      maxScore: Math.max(pts1, pts2),
      totalScore: pts1 + pts2,
      topSeed: Math.min(p1.seed, p2.seed),
    });
  }

  // STRICT BOARD ORDERING: Sort boards from highest points to lowest points!
  preparedPairs.sort((a, b) => {
    // 1. Highest points on board descending
    if (b.maxScore !== a.maxScore) {
      return b.maxScore - a.maxScore;
    }
    // 2. Total points on board descending
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // 3. Best seed on board ascending
    return a.topSeed - b.topSeed;
  });

  const sortedPairings: MatchPairing[] = [];
  let boardIdx = 1;

  for (const pair of preparedPairs) {
    sortedPairings.push({
      boardNumber: boardIdx++,
      roundNumber: nextRoundNumber,
      whitePlayerId: pair.whiteId,
      blackPlayerId: pair.blackId,
      result: 'pending',
      anomalies: pair.anomalies.length > 0 ? pair.anomalies : undefined,
    });
  }

  // Place Bye on the last board
  for (const byeMatch of pairings.filter(p => p.blackPlayerId === 'BYE')) {
    byeMatch.boardNumber = boardIdx++;
    sortedPairings.push(byeMatch);
  }

  return sortedPairings;
}

/**
 * Berger Tables Round-Robin Schedule Generator
 * Canonical FIDE Berger algorithm
 */
export function generateRoundRobinSchedule(players: Player[]): Round[] {
  const n = players.length;
  const isOdd = n % 2 !== 0;
  const count = isOdd ? n + 1 : n;
  const roundsCount = count - 1;

  // Working array of player IDs or 'BYE'
  const playerIds: (string | 'BYE')[] = players.map(p => p.id);
  if (isOdd) {
    playerIds.push('BYE');
  }

  const rounds: Round[] = [];

  for (let r = 0; r < roundsCount; r++) {
    const pairings: MatchPairing[] = [];
    let boardNum = 1;

    for (let i = 0; i < count / 2; i++) {
      const p1Index = (r + i) % (count - 1);
      let p2Index = (count - 1 - i + r) % (count - 1);

      if (i === 0) {
        p2Index = count - 1;
      }

      const id1 = playerIds[p1Index];
      const id2 = playerIds[p2Index];

      if (id1 === 'BYE' || id2 === 'BYE') {
        const realPlayerId = id1 === 'BYE' ? id2 : id1;
        pairings.push({
          boardNumber: count / 2, // Bye at bottom
          roundNumber: r + 1,
          whitePlayerId: realPlayerId,
          blackPlayerId: 'BYE',
          result: 'BYE',
          anomalies: ['Round-Robin Scheduled Bye'],
        });
        continue;
      }

      // Berger color alternation
      // When i === 0, alternate whether the fixed player (p2Index) is White or Black
      let whiteId = id1;
      let blackId = id2;

      if (i === 0) {
        if (r % 2 === 1) {
          whiteId = id2;
          blackId = id1;
        }
      } else {
        if ((i + r) % 2 === 1) {
          whiteId = id2;
          blackId = id1;
        }
      }

      pairings.push({
        boardNumber: boardNum++,
        roundNumber: r + 1,
        whitePlayerId: whiteId,
        blackPlayerId: blackId,
        result: 'pending',
      });
    }

    // Sort pairings by boardNumber
    pairings.sort((a, b) => a.boardNumber - b.boardNumber);

    rounds.push({
      roundNumber: r + 1,
      pairings,
      isCompleted: false,
    });
  }

  return rounds;
}

/**
 * Knockout / Single Elimination Bracket Generation
 */
export function generateKnockoutBracket(players: Player[]): Round[] {
  // Sort by seeding 1..N
  const sorted = [...players].sort((a, b) => a.seed - b.seed);
  
  // Find nearest power of 2
  let size = 2;
  while (size < sorted.length) {
    size *= 2;
  }

  // Bracket pairings for Round 1: standard tournament seeding
  // e.g. for 8: 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6
  const getBracketSeeds = (bracketSize: number): number[] => {
    let seeds = [1, 2];
    while (seeds.length < bracketSize) {
      const nextSeeds: number[] = [];
      const currentSum = seeds.length * 2 + 1;
      for (const s of seeds) {
        nextSeeds.push(s);
        nextSeeds.push(currentSum - s);
      }
      seeds = nextSeeds;
    }
    return seeds;
  };

  const seedOrder = getBracketSeeds(size);
  const pairings: MatchPairing[] = [];

  for (let i = 0; i < seedOrder.length; i += 2) {
    const seed1 = seedOrder[i];
    const seed2 = seedOrder[i + 1];

    const p1 = sorted.find(p => p.seed === seed1);
    const p2 = sorted.find(p => p.seed === seed2);

    if (p1 && p2) {
      pairings.push({
        boardNumber: i / 2 + 1,
        roundNumber: 1,
        whitePlayerId: p1.id,
        blackPlayerId: p2.id,
        result: 'pending',
      });
    } else if (p1 && !p2) {
      // Bye into next round
      pairings.push({
        boardNumber: i / 2 + 1,
        roundNumber: 1,
        whitePlayerId: p1.id,
        blackPlayerId: 'BYE',
        result: 'BYE',
        anomalies: ['First-round Bye to next stage'],
      });
    }
  }

  return [{
    roundNumber: 1,
    pairings,
    isCompleted: false,
  }];
}
