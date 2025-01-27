// Scoreboard.tsx

import React from "react";
import "./Scoreboard.css";

interface ScoreBoardProps {
  playerScore: number;
  opponentScore: number;
  opponentName: string;
  playerName: string;
  playerRecord?: { wins: number; losses: number };
  opponentRecord?: { wins: number; losses: number };
}

const Scoreboard: React.FC<ScoreBoardProps> = ({
  playerScore,
  opponentScore,
  opponentName,
  playerName,
  playerRecord,
  opponentRecord,
}) => {
  return (
    <div className="scoreboard">
      <div className="player-score">
        <h2>{playerName}</h2>
        {playerRecord && (
          <div className="player-record">
            ({playerRecord.wins}-{playerRecord.losses})
          </div>
        )}
        <div className="big-score">{playerScore}</div>
      </div>
      <div className="opponent-score">
        <h2>{opponentName}</h2>
        {opponentRecord && (
          <div className="player-record">
            ({opponentRecord.wins}-{opponentRecord.losses})
          </div>
        )}
        <div className="big-score">{opponentScore}</div>
      </div>
    </div>
  );
};

export default Scoreboard;
