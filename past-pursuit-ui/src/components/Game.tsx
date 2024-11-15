// Game.tsx

import React, { useState, useEffect } from "react";
import Form from "./Form";
import Guess from "../models/Guess";
import Event from "../models/Event";
import "./Game.css";
import ScoreBoard from "./ScoreBoard";
import ResultsScreen from "./ResultsScreen";
import EventDisplay from "./EventDisplay";

const EVENTS_URL: string = "http://localhost:8080/past-pursuit/events";

export default function Game() {
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState("");
  const [round, setRound] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [event, setEvent] = useState<Event | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [opponentGuess, setOpponentGuess] = useState<Guess | null>(null);
  const [playerGuess, setPlayerGuess] = useState<Guess | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchNewEvent();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (showResults && !gameOver) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);
      } else {
        // Proceed to the next round
        setShowResults(false);
        setRound((prevRound) => prevRound + 1);
        setPlayerGuess(null);
        setOpponentGuess(null);
        setCountdown(3); // Reset countdown for next time

        if (nextEvent) {
          setEvent(nextEvent);
          setNextEvent(null);
        } else {
          // In case nextEvent is not loaded yet, fetch a new event
          fetchNewEvent();
        }
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showResults, countdown, gameOver]);

  useEffect(() => {
    let isMounted = true;

    if (showResults) {
      fetch(EVENTS_URL)
        .then((response) => response.json())
        .then((data) => {
          if (isMounted) {
            const randomIndex = Math.floor(Math.random() * data.length);
            setNextEvent(data[randomIndex]);
          }
        })
        .catch((error) => {
          console.error("Error fetching next event:", error);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [showResults]);

  const fetchNewEvent = () => {
    fetch(EVENTS_URL)
      .then((response) => response.json())
      .then((data) => {
        const randomIndex = Math.floor(Math.random() * data.length);
        setEvent(data[randomIndex]);
      })
      .catch((error) => {
        console.error("Error fetching event:", error);
      });
  };

  const getDateDifference = (guess: Guess, event: Event): number => {
    const guessDate = new Date(
      guess.year || 0,
      (guess.month || 1) - 1,
      guess.day || 1
    );
    const eventDate = new Date(event.year, event.month - 1, event.day);
    const diffInTime = Math.abs(guessDate.getTime() - eventDate.getTime());
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
    return diffInDays;
  };

  const getMonthName = (monthNumber: number): string => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[monthNumber - 1] || "";
  };

  const formatDate = (year: number, month: number, day: number): string => {
    const monthName = getMonthName(month);
    const dayString = day ? `${day}` : "";
    const absYear = Math.abs(year);
    const bcAd = year < 0 ? " BC" : "";
    return `${monthName} ${dayString}, ${absYear}${bcAd}`.trim();
  };

  const getRoundWinner = (playerGuesses: Guess[], event: Event): string => {
    let currWinner = "";
    let currWinnerDiff = Number.MAX_VALUE;
    playerGuesses.forEach((guess) => {
      const guessDiff = getDateDifference(guess, event);
      if (guessDiff < currWinnerDiff) {
        currWinner = guess.player.name;
        currWinnerDiff = guessDiff;
      }
    });
    return currWinner;
  };

  const getOpponentGuess = (): Guess => {
    // In the future, this function can be modified to receive real opponent's guess
    return {
      player: { name: opponentName },
      year: Math.floor(Math.random() * 2023), // Random year between 0 and 2022
      month: Math.floor(Math.random() * 12) + 1, // Random month between 1 and 12
      day: Math.floor(Math.random() * 31) + 1, // Random day between 1 and 31
    };
  };

  const onGuessSubmit = (guess: Guess) => {
    if (!event) return;

    guess.player = { name: "Player" };
    setPlayerGuess(guess);

    const opponentGuess = getOpponentGuess();
    setOpponentGuess(opponentGuess);

    const roundWinner = getRoundWinner([guess, opponentGuess], event);

    // Calculate new scores
    const newPlayerScore =
      roundWinner === "Player" ? playerScore + 1 : playerScore;
    const newOpponentScore =
      roundWinner === opponentName ? opponentScore + 1 : opponentScore;

    // Update scores using functional updates
    if (roundWinner === "Player") {
      setPlayerScore((prevScore) => prevScore + 1);
    } else if (roundWinner === opponentName) {
      setOpponentScore((prevScore) => prevScore + 1);
    }

    // Set the result message
    setResult(
      roundWinner === "Player"
        ? `You've won the round!`
        : `You've lost the round.`
    );

    // Check for game over using the new scores
    if (newPlayerScore === 4 || newOpponentScore === 4) {
      setGameOver(true);
    }

    setShowResults(true);
    setCountdown(5);
  };

  const resetGame = () => {
    setGameOver(false);
    setResult("");
    setRound(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setEvent(null);
    setPlayerGuess(null);
    setOpponentGuess(null);
    setShowResults(false);
    setEvent(null);
    setNextEvent(null);

    fetchNewEvent();
  };

  return (
    <div className="game-container">
      {/* Left column: Player's score and guess */}
      <div className="score-left">
        <ScoreBoard
          playerName="Player"
          score={playerScore}
          guess={playerGuess}
          event={event}
          showResults={showResults}
        />
      </div>

      {/* Middle column: Game content */}
      <div className="game-content">
        {!gameOver && (
          <div>
            <h2 className="round">Round {round + 1}</h2>
            {event ? (
              <>
                {!showResults ? (
                  <EventDisplay event={event} onGuessSubmit={onGuessSubmit} />
                ) : (
                  <ResultsScreen
                    resultMessage={result}
                    event={event}
                    countdown={countdown}
                    gameOver={gameOver}
                  />
                )}
              </>
            ) : (
              <div className="loading">Loading...</div>
            )}
          </div>
        )}
        {gameOver && (
          <div>
            <h3 className="result">
              {playerScore === 4
                ? "Congratulations! You've won the game!"
                : `${opponentName} has won the game.`}
            </h3>
            <button onClick={resetGame} className="resetButton">
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Right column: Opponent's score and guess */}
      <div className="score-right">
        <ScoreBoard
          playerName={opponentName}
          score={opponentScore}
          guess={opponentGuess}
          isOpponent={true}
          event={event}
          showResults={showResults}
        />
      </div>
    </div>
  );
}
