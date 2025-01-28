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
        <div className="scoreboard-name">{playerName}</div>
        {playerRecord && (
          <div className="player-record">
            ({playerRecord.wins}-{playerRecord.losses})
          </div>
        )}
        <div className="big-score">{playerScore}</div>
      </div>
      <div className="opponent-score">
        <div className="scoreboard-name">{opponentName}</div>
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
