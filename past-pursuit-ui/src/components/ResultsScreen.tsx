// ResultsScreen.tsx

import React from "react";
import Event from "../models/Event";

import "./ResultsScreen.css";
import { formatDate } from "../utils/dateUtils";

interface ResultsScreenProps {
  resultMessage: string;
  event: Event | null;
  countdown: number;
  gameOver: boolean;
  playerGuess?: number;
  opponentGuess?: number;
  playerName: string;
  opponentName: string;
}

export default function ResultsScreen({
  resultMessage,
  event,
  countdown,
  gameOver,
  playerGuess,
  opponentGuess,
  playerName,
  opponentName,
}: ResultsScreenProps) {
  if (!event) {
    return (
      <div className="results-screen">
        <h2>Loading results...</h2>
      </div>
    );
  }

  const getYearDifference = (guess: number) => {
    return Math.abs(guess - event.year);
  };

  return (
    <div className="results-screen">
      <div className="event-container">
        <h2 className="event-description">{event.event}</h2>
        <div className="year-display">
          <div className="player-side">
            <h3>{playerName}'s Guess</h3>
            <div className="guess-value">
              {playerGuess !== undefined ? playerGuess : "-"}
            </div>
            <div className="difference">
              {playerGuess !== undefined
                ? `(${Math.abs(playerGuess - event.year)} years off)`
                : "(no guess)"}
            </div>
          </div>
          <div className="actual-year">
            <h3>Actual Year</h3>
            <div className="year">{event.year}</div>
            <div
              className={`result-message ${
                resultMessage.includes("You've won")
                  ? "player-win"
                  : resultMessage.includes("has won")
                  ? "opponent-win"
                  : "tie"
              }`}
            >
              {resultMessage}
            </div>
          </div>
          <div className="opponent-side">
            <h3>{opponentName}'s Guess</h3>
            <div className="guess-value">
              {opponentGuess !== undefined ? opponentGuess : "-"}
            </div>
            <div className="difference">
              {opponentGuess !== undefined
                ? `(${Math.abs(opponentGuess - event.year)} years off)`
                : "(no guess)"}
            </div>
          </div>
        </div>
      </div>
      {!gameOver && (
        <div className="countdown">Next round in {countdown}...</div>
      )}
    </div>
  );
}
