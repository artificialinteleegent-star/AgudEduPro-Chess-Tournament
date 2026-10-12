export type TournamentType = 'swiss' | 'round-robin' | 'knockout';

export type TitleType = 'GM' | 'IM' | 'FM' | 'CM' | 'WGM' | 'WIM' | 'WFM' | 'WCM' | 'None';

export type MatchResult = 
  | 'pending'
  | '1-0'
  | '0-1'
  | '1/2-1/2'
  | '1-0 (FF)' // Forfeit win for White
  | '0-1 (FF)' // Forfeit win for Black
  | '0-0 (FF)' // Double forfeit
  | 'BYE';     // Assigned bye

export interface Player {
  id: string;
  name: string;
  rating: number;
  title?: TitleType;
  federation?: string;
  seed: number;
  status: 'active' | 'withdrawn' | 'disqualified';
  requestedHalfPointByes?: number[]; // round numbers where player requested 0.5 bye in advance
}

export interface PlayerStats {
  playerId: string;
  points: number;
  buchholz: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  progressiveScore: number;
  directEncounterScore: number;
  wins: number;
  blackWins: number;
  gamesPlayed: number;
  colorHistory: ('W' | 'B' | '-')[];
  colorDifference: number; // positive = more whites, negative = more blacks
  opponents: string[]; // player ids or 'BYE'
  floats: ('up' | 'down')[]; // upfloats or downfloats experienced
  rank: number;
}

export interface MatchPairing {
  boardNumber: number;
  roundNumber: number;
  whitePlayerId: string;
  blackPlayerId: string; // 'BYE' if full-point bye assigned
  result: MatchResult;
  anomalies?: string[]; // e.g. "Downfloat (1.0 vs 0.5)", "Color repeated: W-W", "Color diff: +2"
  notes?: string;
}

export interface Round {
  roundNumber: number;
  pairings: MatchPairing[];
  isCompleted: boolean;
}

export interface ArbiterIncident {
  id: string;
  timestamp: string;
  roundNumber: number;
  boardNumber?: number;
  playerIds: string[];
  type: 'illegal_move' | 'touch_move' | 'mobile_device' | 'default_time' | 'conduct' | 'draw_claim' | 'other';
  ruling: string;
  penalty: string;
  notes?: string;
}

export interface TournamentSettings {
  id: string;
  name: string;
  location: string;
  chiefArbiter: string;
  timeControl: string;
  tournamentType: TournamentType;
  totalRounds: number;
  colorDrawBoard1: 'W' | 'B'; // Seed 1 gets White or Black in Round 1
  byePoints: 1 | 0.5;
  tieBreaks: ('buchholz' | 'buchholz_cut1' | 'sonneborn_berger' | 'direct_encounter' | 'progressive' | 'wins')[];
}
