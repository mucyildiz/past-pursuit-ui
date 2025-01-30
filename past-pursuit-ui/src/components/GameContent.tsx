import React from "react";
import Event from "../models/Event";
import Guess from "../models/Guess";
import EventDisplay from "./EventDisplay";
import ResultsScreen from "./ResultsScreen";

interface GameContentProps {
  gameOver: boolean;
  round: number;
  showResults: boolean;
  event: Event | null;
  waitingForOpponent: boolean;
  result: string;
  countdown: number;
  playerGuess: Guess | null;
  opponentGuess: Guess | null;
  playerName: string;
  opponentName: string;
  playerScore: number;
  onGuessSubmit: (guess: Guess) => void;
  hasSubmitted: boolean;
  resetGame: () => void;
  guessTimer: number | null;
  onRematch: () => void;
  rematchProposed: boolean;
  rematchVotes: number;
  totalPlayers: number;
}

export default function GameContent({
  gameOver,
  round,
  showResults,
  event,
  waitingForOpponent,
  result,
  countdown,
  playerGuess,
  opponentGuess,
  playerName,
  opponentName,
  playerScore,
  onGuessSubmit,
  hasSubmitted,
  resetGame,
  guessTimer,
  onRematch,
  rematchProposed,
  rematchVotes,
  totalPlayers,
}: GameContentProps) {
  if (gameOver && event) {
    return (
      <div className="game-over">
        <h1
          className={`winner-banner ${playerScore === 4 ? "" : "opponent-win"}`}
        >
          {playerScore === 4
            ? "Congratulations! You've Won!"
            : `${opponentName} Wins!`}
        </h1>
        <div className="final-event">
          <h2>Final Event</h2>
          <p>{event.event}</p>
          <p className="event-year">Correct year: {event.year}</p>
        </div>
        <div className="game-over-buttons">
          <button
            onClick={onRematch}
            className={`rematchButton ${rematchProposed ? "proposed" : ""}`}
          >
            Rematch
            {rematchProposed && (
              <span className="rematch-badge">
                {rematchVotes}/{totalPlayers}
              </span>
            )}
          </button>
          <button onClick={resetGame} className="resetButton">
            New Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="round">Round {round + 1}</div>
      <GameDisplay
        showResults={showResults}
        event={event}
        waitingForOpponent={waitingForOpponent}
        result={result}
        countdown={countdown}
        playerGuess={playerGuess}
        opponentGuess={opponentGuess}
        playerName={playerName}
        opponentName={opponentName}
        onGuessSubmit={onGuessSubmit}
        hasSubmitted={hasSubmitted}
        gameOver={gameOver}
        guessTimer={guessTimer}
      />
    </div>
  );
}

interface GameDisplayProps {
  showResults: boolean;
  event: Event | null;
  waitingForOpponent: boolean;
  result: string;
  countdown: number;
  playerGuess: Guess | null;
  opponentGuess: Guess | null;
  playerName: string;
  opponentName: string;
  onGuessSubmit: (guess: Guess) => void;
  hasSubmitted: boolean;
  gameOver: boolean;
  guessTimer: number | null;
}

function GameDisplay({
  showResults,
  event,
  waitingForOpponent,
  result,
  countdown,
  playerGuess,
  opponentGuess,
  playerName,
  opponentName,
  onGuessSubmit,
  hasSubmitted,
  gameOver,
  guessTimer,
}: GameDisplayProps) {
  if (showResults) {
    return (
      <ResultsScreen
        resultMessage={result}
        event={event}
        countdown={countdown}
        gameOver={gameOver}
        playerGuess={playerGuess?.year}
        opponentGuess={opponentGuess?.year}
        playerName={playerName}
        opponentName={opponentName}
      />
    );
  }

  if (!event) {
    return (
      <div className="countdown">
        <h2>Game starting in...</h2>
        <h1>{countdown}</h1>
      </div>
    );
  }

  if (waitingForOpponent && (!playerGuess || !opponentGuess) && !showResults) {
    return (
      <div className="waiting-message">
        <h2>Waiting for opponent's guess...</h2>
      </div>
    );
  }

  return (
    <EventDisplay
      event={event}
      onGuessSubmit={onGuessSubmit}
      hasSubmitted={hasSubmitted}
      guessTimer={guessTimer}
    />
  );
}
