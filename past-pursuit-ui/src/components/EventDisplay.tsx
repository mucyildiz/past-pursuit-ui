// EventDisplay.tsx

import React from "react";
import Event from "../models/Event";
import Form from "./Form";
import Guess from "../models/Guess";
import "./EventDisplay.css";

interface EventDisplayProps {
  event: Event;
  onGuessSubmit: (guess: Guess) => void;
  hasSubmitted: boolean;
  guessTimer: number | null;
}

export default function EventDisplay({
  event,
  onGuessSubmit,
  hasSubmitted,
  guessTimer,
}: EventDisplayProps) {
  return (
    <div className="event-display">
      <h2>{event.event}</h2>
      {!hasSubmitted && guessTimer !== null && (
        <div className="timer-display">Time remaining: {guessTimer}s</div>
      )}
      {hasSubmitted ? (
        <div className="waiting-message">Waiting for other player...</div>
      ) : (
        <Form onSubmit={onGuessSubmit} />
      )}
    </div>
  );
}
