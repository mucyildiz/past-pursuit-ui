// ResultsScreen.tsx

import React from "react";
import Event from "../models/Event";

import "./ResultsScreen.css";
import { formatDate } from "../utils/dateUtils";

interface ResultsScreenProps {
  resultMessage: string;
  event: Event;
  countdown: number;
  gameOver: boolean;
}

const ResultsScreen = ({
  resultMessage,
  event,
  countdown,
  gameOver,
}: ResultsScreenProps) => {
  return (
    <div className="results-screen">
      <h2 className="round-winner">{resultMessage}</h2>
      <h3 className="actual-date">
        {formatDate(event.year, event.month, event.day)}
      </h3>
      {!gameOver && (
        <p className="countdown">Next round starts in {countdown} seconds...</p>
      )}
    </div>
  );
};

export default ResultsScreen;
