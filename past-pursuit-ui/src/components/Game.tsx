// Game.tsx

import React, { useState, useEffect, useCallback } from "react";
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
  const [guessTimer, setGuessTimer] = useState<number | null>(null);
  const [rematchProposed, setRematchProposed] = useState(false);
  const [rematchVotes, setRematchVotes] = useState(0);
  const [rematchTimer, setRematchTimer] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setPlayerName(user.name);
      setIsLoggedIn(true);
    }
  }, []);

  const handleGameState = useCallback(
    (gameState: GameState) => {
      if (gameState.gameCode !== gameCode) return;

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
          setGuessTimer(null);
          setGameStartCountdown(3);
          setIsJoining(true);
          break;
        case "WAITING_FOR_GUESSES":
          setWaitingForOpponent(false);
          setShowResults(false);
          setHasSubmitted(false);
          setPlayerGuess(null);
          setOpponentGuess(null);
          if (gameState.currentEvent) {
            setEvent(gameState.currentEvent);
          }
          setGuessTimer(null);

          const currentId = currentUser?.id;
          if (currentId !== undefined) {
            const playerScore = gameState.playerScores[currentId];
            setPlayerScore(playerScore);
            const opponent = gameState.users.find((u) => u.id !== currentId);
            if (opponent) {
              const opponentScore = gameState.playerScores[opponent.id];
              setOpponentScore(opponentScore);
              setRound(playerScore + opponentScore);
            }
          }
          break;
        case "ROUND_OVER":
          setWaitingForOpponent(false);
          setShowResults(true);
          setHasSubmitted(false);
          setGuessTimer(null);

          const scores = gameState.playerScores;
          const users = gameState.users;
          const guesses = gameState.currentGuesses;

          const currentUserId = currentUser?.id;
          if (currentUserId === undefined) return;
          const opponentUser = users.find((u) => u.id !== currentUserId);
          if (!opponentUser) return;

          setPlayerScore(scores[currentUserId]);
          setOpponentScore(scores[opponentUser.id]);

          setOpponentGuess({
            player: { name: opponentUser.name },
            year: guesses[opponentUser.id].guess,
          });

          const playerGuess = guesses[currentUserId]?.guess;
          const opponentGuess = guesses[opponentUser.id]?.guess;

          if (playerGuess === null && opponentGuess === null) {
            setResult("It's a tie - both players ran out of time!");
          } else if (playerGuess === null) {
            setResult(`${opponentUser.name} wins!`);
          } else if (opponentGuess === null) {
            setResult("You win!");
          } else if (event) {
            const playerDiff = Math.abs(playerGuess - event.year);
            const opponentDiff = Math.abs(opponentGuess - event.year);

            if (playerDiff < opponentDiff) {
              setResult("You win!");
            } else if (opponentDiff < playerDiff) {
              setResult(`${opponentUser.name} wins!`);
            } else {
              const playerTimestamp = guesses[currentUserId].timestamp;
              const opponentTimestamp = guesses[opponentUser.id].timestamp;

              if (playerTimestamp < opponentTimestamp) {
                setResult("You win!");
              } else if (opponentTimestamp < playerTimestamp) {
                setResult(`${opponentUser.name} wins!`);
              } else {
                setResult("It's a perfect tie!");
              }
            }
          }
          break;
        case "GAME_OVER":
          setGameOver(true);
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

          if (!gameState.currentGuesses[timerUserId]) {
            setGuessTimer(5);
          }
          break;
        case "GAME_EXIT":
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
          setGuessTimer(null);
          setIsJoining(true);
          setJoinFlow("initial");
          setGameCode("");
          break;
        case "REMATCH_PROPOSED":
          setRematchProposed(true);
          setRematchVotes(1);
          setRematchTimer(30);
          break;
      }
    },
    [gameCode, playerName, currentUser, event]
  );

  useEffect(() => {
    webSocketService.addMessageHandler(handleGameState);

    return () => {
      webSocketService.removeMessageHandler(handleGameState);
    };
  }, [handleGameState]);

  useEffect(() => {
    if (gameStartCountdown === null) return;

    if (gameStartCountdown > 0) {
      const timer = setTimeout(() => {
        setGameStartCountdown((prev) => prev! - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const userInfo = currentUser || {
        id: 0,
        name: playerName,
        wins: 0,
        losses: 0,
      };
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
        timer = setTimeout(() => {
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);
      } else {
        setTimeout(() => {
          setShowResults(false);
          setPlayerGuess(null);
          setOpponentGuess(null);
          setCountdown(3);

          if (!currentUser) return;
          webSocketService.sendMessage({
            eventType: GameEventType.ROUND_START,
            gameCode: gameCode,
            user: currentUser,
          });
        }, 1000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, showResults, gameOver, currentUser, gameCode]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (guessTimer !== null) {
      if (guessTimer > 0) {
        timer = setTimeout(() => {
          setGuessTimer((prev) => prev! - 1);
        }, 1000);
      } else {
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

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (rematchTimer !== null && rematchTimer > 0) {
      timer = setTimeout(() => {
        setRematchTimer((prev) => prev! - 1);
      }, 1000);
    } else if (rematchTimer === 0) {
      setRematchProposed(false);
      setRematchVotes(0);
      setRematchTimer(null);
      setIsJoining(true);
      setJoinFlow("initial");
      setGameCode("");
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [rematchTimer]);

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
    setGuessTimer(null);
    setIsJoining(true);
    setJoinFlow("initial");
    setGameCode("");
  };

  const startNewGame = () => {
    const code = generateGameCode();
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
    localStorage.setItem("user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPlayerName("");
    setIsLoggedIn(false);
    localStorage.removeItem("user");
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
    setGuessTimer(null);
    setIsJoining(true);
    setJoinFlow("initial");
    setGameCode("");
  };

  const handleRematch = () => {
    if (!currentUser) return;
    webSocketService.sendMessage({
      eventType: GameEventType.REMATCH_PROPOSAL,
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
          {isJoining && joinFlow === "initial" && (
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          )}
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
                      <button
                        className="back-button"
                        onClick={() => {
                          if (currentUser) {
                            webSocketService.sendMessage({
                              eventType: GameEventType.PLAYER_LEFT,
                              gameCode: gameCode,
                              user: currentUser,
                              timestamp: new Date().getTime(),
                            });
                          }
                          setJoinFlow("initial");
                          setGameCode("");
                        }}
                      >
                        Back
                      </button>
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
                rematchProposed={rematchProposed}
                rematchVotes={rematchVotes}
                totalPlayers={2}
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
