export interface Player {
  id: string;
  userId: number;
  firstName: string;
  lastName: string;
  isReady: boolean;
  isAI: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  status: 'waiting' | 'in_game' | 'finished';
  field: number[];
  mines: number[];
  playerSelection: number | null;
  opponentSelection: number | null;
  openedCells: Set<number>;
}
