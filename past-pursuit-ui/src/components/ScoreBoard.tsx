// Scoreboard.tsx

import React from "react";
import "./Scoreboard.css";

interface ScoreboardProps {
  playerScore: number;
  opponentScore: number;
  opponentName: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  playerScore,
  opponentScore,
  opponentName,
}) => {
  return (
    <div className="scoreboard">
      <div className="scoreboard-team player-team">
        <div className="team-name">Player</div>
        <div className="team-score" key={`player-${playerScore}`}>
          {playerScore}
        </div>
      </div>
      <div className="scoreboard-divider"></div>
      <div className="scoreboard-team opponent-team">
        <div className="team-name">{opponentName}</div>
        <div className="team-score" key={`opponent-${opponentScore}`}>
          {opponentScore}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
