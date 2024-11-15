// EventDisplay.tsx

import React from "react";
import Event from "../models/Event";
import Form from "./Form";
import Guess from "../models/Guess";
import "./EventDisplay.css";

interface EventDisplayProps {
  event: Event;
  onGuessSubmit: (guess: Guess) => void;
}

const EventDisplay = ({ event, onGuessSubmit }: EventDisplayProps) => {
  return (
    <div className="event-display">
      <h3 className="event">{event.event}</h3>
      <Form onSubmit={onGuessSubmit} />
    </div>
  );
};

export default EventDisplay;
