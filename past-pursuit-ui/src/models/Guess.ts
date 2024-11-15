import Player from "./Player";

export default interface Guess {
  player: Player;
  year: number;
  month?: number;
  day?: number;
}
