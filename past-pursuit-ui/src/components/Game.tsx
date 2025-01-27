// Game.tsx

import React, { useState, useEffect } from "react";
import {
  webSocketService,
  GameState,
  GameEventType,
} from "../services/WebSocketService";
import { generateGameCode } from "../utils/gameUtils";
import User from "../models/User";
import Login from "./Login";
import GameContent from "./GameContent";
import Event from "../models/Event";
import Guess from "../models/Guess";
import "./Game.css";
import ScoreBoard from "./ScoreBoard";

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
  const [countdown, setCountdown] = useState<number>(3);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [gameCode, setGameCode] = useState<string>("");
  const [isJoining, setIsJoining] = useState(true);
  const [inputGameCode, setInputGameCode] = useState("");
  const [playerName, setPlayerName] = useState<string>("");
  const [gameStartCountdown, setGameStartCountdown] = useState<number | null>(
    null
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [playerRecord, setPlayerRecord] = useState<
    { wins: number; losses: number } | undefined
  >();
  const [opponentRecord, setOpponentRecord] = useState<
    { wins: number; losses: number } | undefined
  >();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joinFlow, setJoinFlow] = useState<"initial" | "joining" | "creating">(
    "initial"
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [completedEvent, setCompletedEvent] = useState<Event | null>(null);
  const [guessTimer, setGuessTimer] = useState<number | null>(null);

  useEffect(() => {
    const handleGameState = (gameState: GameState) => {
      if (gameState.gameCode !== gameCode) return;
      console.log("Received game state:", gameState.currentState);
      console.log("completedEvent:", completedEvent);

      // Set current user info when we find ourselves in the users array
      const user = gameState.users.find((u) => u.name === playerName);
      if (user && !currentUser) {
        setCurrentUser(user);
      }

      gameState.users.forEach((user) => {
        if (user.name === playerName) {
          setPlayerRecord({ wins: user.wins, losses: user.losses });
        } else {
          setOpponentRecord({ wins: user.wins, losses: user.losses });
          setOpponentName(user.name);
        }
      });

      switch (gameState.currentState) {
        case "WAITING_FOR_PLAYERS":
          setEvent(null);
          break;
        case "GAME_START":
          console.log("Starting countdown");
          // Reset game state
          setGameOver(false);
          setResult("");
          setRound(0);
          setPlayerScore(0);
          setOpponentScore(0);
          setEvent(null);
          setOpponentGuess(null);
          setPlayerGuess(null);
          setShowResults(false);
          setCountdown(3);
          setHasSubmitted(false);
          setWaitingForOpponent(false);
          setCompletedEvent(null);
          setGuessTimer(null);
          // Start new game countdown - use gameStartCountdown instead of countdown
          setGameStartCountdown(3);
          setIsJoining(true); // Add this to show the countdown screen
          break;
        case "WAITING_FOR_GUESSES":
          console.log("game state", gameState);
          setWaitingForOpponent(false);
          setShowResults(false);
          setHasSubmitted(false);
          setPlayerGuess(null);
          setOpponentGuess(null);
          setEvent(gameState.currentEvent || null);
          if (gameState.currentEvent) {
            setCompletedEvent(gameState.currentEvent);
          }
          setGuessTimer(null);

          // Update scores
          const currentId = currentUser?.id;
          if (currentId !== undefined) {
            setPlayerScore(gameState.playerScores[currentId]);
            const opponent = gameState.users.find((u) => u.id !== currentId);
            if (opponent) {
              setOpponentScore(gameState.playerScores[opponent.id]);
            }
          }
          break;
        case "ROUND_OVER":
          if (!completedEvent) {
            console.error("completedEvent is null during ROUND_OVER");
            return;
          }
          setWaitingForOpponent(false);
          setShowResults(true);
          setHasSubmitted(false);
          setEvent(null);
          setGuessTimer(null);

          // Update scores based on gameState
          const scores = gameState.playerScores;
          const users = gameState.users;
          const guesses = gameState.currentGuesses;

          const currentUserId = currentUser?.id;
          if (currentUserId === undefined) return;
          const opponentUser = users.find((u) => u.id !== currentUserId);
          if (!opponentUser) return;

          // Update scores immediately
          setPlayerScore(scores[currentUserId]);
          setOpponentScore(scores[opponentUser.id]);

          // Set opponent's guess - handle new guess format
          setOpponentGuess({
            player: { name: opponentUser.name },
            year: guesses[opponentUser.id].guess,
          });

          const playerGuess = guesses[currentUserId]?.guess;
          const opponentGuess = guesses[opponentUser.id]?.guess;

          // Set result message based on guesses
          if (playerGuess === null && opponentGuess === null) {
            setResult("It's a tie - both players ran out of time!");
          } else if (playerGuess === null) {
            setResult(`${opponentUser.name} wins - you ran out of time!`);
          } else if (opponentGuess === null) {
            setResult("You win - opponent ran out of time!");
          } else {
            const playerDiff = Math.abs(playerGuess - completedEvent.year);
            const opponentDiff = Math.abs(opponentGuess - completedEvent.year);

            if (playerDiff < opponentDiff) {
              setResult(
                `You win! (${playerDiff} years off vs ${opponentDiff})`
              );
            } else if (opponentDiff < playerDiff) {
              setResult(
                `${opponentUser.name} wins! (${opponentDiff} years off vs ${playerDiff})`
              );
            } else {
              // It's a tie in years - check timestamps
              const playerTimestamp = guesses[currentUserId].timestamp;
              const opponentTimestamp = guesses[opponentUser.id].timestamp;
              const timeDiff = Math.abs(playerTimestamp - opponentTimestamp);

              if (playerTimestamp < opponentTimestamp) {
                setResult(
                  `You win! (Both ${playerDiff} years off - you guessed ${(
                    timeDiff / 1000
                  ).toFixed(1)}s faster)`
                );
              } else if (opponentTimestamp < playerTimestamp) {
                setResult(
                  `${
                    opponentUser.name
                  } wins! (Both ${playerDiff} years off - guessed ${(
                    timeDiff / 1000
                  ).toFixed(1)}s faster)`
                );
              } else {
                setResult("It's a perfect tie!"); // Extremely unlikely
              }
            }
          }
          break;
        case "GAME_OVER":
          setGameOver(true);
          // Update final scores
          const finalScores = gameState.playerScores;
          const finalCurrentUserId = currentUser?.id;
          if (finalCurrentUserId !== undefined) {
            setPlayerScore(finalScores[finalCurrentUserId]);
            const opponentUser = gameState.users.find(
              (u) => u.id !== finalCurrentUserId
            );
            if (opponentUser) {
              setOpponentScore(finalScores[opponentUser.id]);
            }
          }
          break;
        case "TIMER_START":
          const timerUserId = currentUser?.id;
          if (timerUserId === undefined) return;

          // Only start timer if we haven't guessed yet
          if (!gameState.currentGuesses[timerUserId]) {
            setGuessTimer(5);
          }
          break;
        case "GAME_EXIT":
          // Reset game state
          setGameOver(false);
          setResult("");
          setRound(0);
          setPlayerScore(0);
          setOpponentScore(0);
          setEvent(null);
          setOpponentGuess(null);
          setPlayerGuess(null);
          setShowResults(false);
          setCountdown(3);
          setHasSubmitted(false);
          setWaitingForOpponent(false);
          setCompletedEvent(null);
          setGuessTimer(null);
          // Take user back to game selection screen
          setIsJoining(true);
          setJoinFlow("initial");
          setGameCode("");
          break;
      }
    };

    webSocketService.addMessageHandler(handleGameState);

    return () => {
      webSocketService.removeMessageHandler(handleGameState);
    };
  }, [gameCode, playerName, currentUser]);

  useEffect(() => {
    if (gameStartCountdown === null) return;
    console.log("Countdown value:", gameStartCountdown);

    if (gameStartCountdown > 0) {
      const timer = setTimeout(() => {
        setGameStartCountdown((prev) => prev! - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      console.log("Sending ROUND_START");
      const userInfo = { id: 0, name: playerName, wins: 0, losses: 0 };
      webSocketService.sendMessage({
        eventType: GameEventType.ROUND_START,
        gameCode: gameCode,
        user: userInfo,
      });
      setGameStartCountdown(null);
      setIsJoining(false);
    }
  }, [gameStartCountdown, gameCode, playerName]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (showResults && !gameOver) {
      if (countdown > 0) {
        // Set a full 1-second delay
        timer = setTimeout(() => {
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);
      } else {
        // Only proceed after countdown is fully complete
        setTimeout(() => {
          setShowResults(false);
          setRound((prevRound) => prevRound + 1);
          setPlayerGuess(null);
          setOpponentGuess(null);
          setCountdown(3);

          if (!currentUser) return;
          webSocketService.sendMessage({
            eventType: GameEventType.ROUND_START,
            gameCode: gameCode,
            user: currentUser,
          });
        }, 1000); // Add delay before starting next round
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showResults, countdown, gameOver, currentUser, gameCode]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (guessTimer !== null) {
      if (guessTimer > 0) {
        timer = setTimeout(() => {
          setGuessTimer((prev) => prev! - 1);
        }, 1000);
      } else {
        // Time's up - auto submit if we haven't already
        if (!hasSubmitted && currentUser) {
          webSocketService.sendMessage({
            eventType: GameEventType.GUESS,
            gameCode: gameCode,
            user: currentUser,
            data: null,
            timestamp: new Date().getTime(),
          });
          setHasSubmitted(true);
          setWaitingForOpponent(true);
        }
        setGuessTimer(null);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [guessTimer, hasSubmitted, currentUser, gameCode]);

  const onGuessSubmit = (guess: Guess) => {
    if (!event) return;

    const sendMessage = (type: GameEventType, data?: string) => {
      if (!currentUser) return;
      webSocketService.sendMessage({
        eventType: type,
        gameCode: gameCode,
        user: currentUser,
        data: data,
        timestamp: new Date().getTime(),
      });
    };

    sendMessage(GameEventType.GUESS, guess.year.toString());
    setPlayerGuess(guess);
    setHasSubmitted(true);
    setWaitingForOpponent(true);
  };

  const resetGame = () => {
    if (currentUser) {
      webSocketService.sendMessage({
        eventType: GameEventType.PLAYER_LEFT,
        gameCode: gameCode,
        user: currentUser,
        timestamp: new Date().getTime(),
      });
    }
    // Reset game state instead of reloading
    setGameOver(false);
    setResult("");
    setRound(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setEvent(null);
    setOpponentGuess(null);
    setPlayerGuess(null);
    setShowResults(false);
    setCountdown(3);
    setHasSubmitted(false);
    setWaitingForOpponent(false);
    setCompletedEvent(null);
    setGuessTimer(null);
    setIsJoining(true);
    setJoinFlow("initial");
    setGameCode("");
  };

  const startNewGame = () => {
    const code = generateGameCode();
    console.log("Starting new game with code:", code);
    setGameCode(code);
    if (!currentUser) return;
    webSocketService.sendMessage({
      eventType: GameEventType.PLAYER_JOINED,
      gameCode: code,
      user: currentUser,
    });
    setJoinFlow("creating");
  };

  const joinGame = (code: string) => {
    console.log("Joining game with code:", code);
    setGameCode(code);
    if (!currentUser) return;
    webSocketService.sendMessage({
      eventType: GameEventType.PLAYER_JOINED,
      gameCode: code,
      user: currentUser,
    });
  };

  const handleLogin = (user: User) => {
    setPlayerName(user.name);
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleRematch = () => {
    if (!currentUser) return;
    webSocketService.sendMessage({
      eventType: GameEventType.REMATCH,
      gameCode: gameCode,
      user: currentUser,
      timestamp: new Date().getTime(),
    });
  };

  return (
    <>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="game-container">
          <div id="logo">Past Pursuit</div>
          {isJoining ? (
            <div className="join-container">
              {gameStartCountdown !== null ? (
                <div className="countdown">
                  <h2>Game starting in...</h2>
                  <h1>{gameStartCountdown}</h1>
                </div>
              ) : (
                <>
                  {joinFlow === "initial" && (
                    <div className="join-options">
                      <button onClick={startNewGame}>Start New Game</button>
                      <button onClick={() => setJoinFlow("joining")}>
                        Join Game
                      </button>
                    </div>
                  )}

                  {joinFlow === "joining" && (
                    <div className="join-game">
                      <h2>Enter Game Code</h2>
                      <div className="join-input">
                        <input
                          type="text"
                          value={inputGameCode}
                          onChange={(e) =>
                            setInputGameCode(e.target.value.toUpperCase())
                          }
                          placeholder="Enter Code"
                        />
                        <button onClick={() => joinGame(inputGameCode)}>
                          Join
                        </button>
                      </div>
                      <button
                        className="back-button"
                        onClick={() => setJoinFlow("initial")}
                      >
                        Back
                      </button>
                    </div>
                  )}

                  {joinFlow === "creating" && (
                    <div className="create-game">
                      <h2>Waiting for Players</h2>
                      <div className="game-code">
                        <p>Share this code with your opponent:</p>
                        <h1>{gameCode}</h1>
                      </div>
                      {!gameCode && (
                        <button
                          className="back-button"
                          onClick={() => setJoinFlow("initial")}
                        >
                          Back
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="game-content">
              <GameContent
                gameOver={gameOver}
                round={round}
                showResults={showResults}
                completedEvent={completedEvent}
                event={event}
                waitingForOpponent={waitingForOpponent}
                result={result}
                countdown={countdown}
                playerGuess={playerGuess}
                opponentGuess={opponentGuess}
                playerName={playerName}
                opponentName={opponentName}
                playerScore={playerScore}
                opponentScore={opponentScore}
                onGuessSubmit={onGuessSubmit}
                hasSubmitted={hasSubmitted}
                resetGame={resetGame}
                guessTimer={guessTimer}
                onRematch={handleRematch}
              />
            </div>
          )}
          {!isJoining && (
            <div className="scoreboard-wrapper">
              <ScoreBoard
                playerScore={playerScore}
                opponentScore={opponentScore}
                opponentName={opponentName}
                playerName={playerName}
                playerRecord={playerRecord}
                opponentRecord={opponentRecord}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
