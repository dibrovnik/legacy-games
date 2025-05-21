export interface GameState {
  phase: number;
  eliminatedNumbers: number[];
  timeLeft: number;
  isGameOver: boolean;
  totalPlayersLeft: number;
  userSelectedNumber: number | null;
}
