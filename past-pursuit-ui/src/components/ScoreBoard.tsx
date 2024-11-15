// ScoreBoard.tsx

import React from "react";
import Guess from "../models/Guess";
import Event from "../models/Event";
import "./ScoreBoard.css";
import { formatDate, getDateDifference } from "../utils/dateUtils";

interface ScoreBoardProps {
  playerName: string;
  score: number;
  guess: Guess | null;
  isOpponent?: boolean;
  event: Event | null;
  showResults: boolean;
}

const ScoreBoard = ({
  playerName,
  score,
  guess,
  isOpponent = false,
  event,
  showResults,
}: ScoreBoardProps) => {
  return (
    <div className={`score-board ${isOpponent ? "opponent" : "player"}`}>
      <h2>{playerName}</h2>
      <div className="big-score">{score}</div>
      {showResults && guess && event && (
        <div className="guess-display">
          <h3>{isOpponent ? `${playerName}'s Guess` : "Your Guess"}</h3>
          <p className="guess-date">
            {formatDate(guess.year!, guess.month!, guess.day!)}
          </p>
          <p className="guess-difference">
            {getDateDifference(guess, event)} days off
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
