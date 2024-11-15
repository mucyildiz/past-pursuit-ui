// Form.tsx

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Guess from "../models/Guess";
import "./Form.css";

interface FormProps {
  onSubmit: (guess: Guess) => void;
}

export default function Form({ onSubmit }: FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<Guess>({
    defaultValues: {
      player: { name: "Player" },
      year: undefined,
      month: undefined,
      day: undefined,
    },
  });

  const yearFilled = () => {
    const year = watch("year");
    return Number.isInteger(year);
  };

  const onFormSubmit: SubmitHandler<Guess> = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} id="input-container">
      <input
        type="number"
        placeholder="Year"
        {...register("year", {
          valueAsNumber: true,
        })}
        className="input"
      />
      <input
        type="number"
        placeholder="Month"
        {...register("month", {
          valueAsNumber: true,
          min: { value: 1, message: "Month must be between 1 and 12." },
          max: { value: 12, message: "Month must be between 1 and 12." },
        })}
        className="input"
      />
      <input
        type="number"
        placeholder="Day"
        {...register("day", {
          valueAsNumber: true,
          min: { value: 1, message: "Day must be between 1 and 31." },
          max: { value: 31, message: "Day must be between 1 and 31." },
        })}
        className="input"
      />
      {errors.year && <span>{errors.year.message}</span>}
      {errors.month && <span>{errors.month.message}</span>}
      {errors.day && <span>{errors.day.message}</span>}
      {errors.root && <span>{errors.root.message}</span>}

      <button type="submit" className="submitButton" disabled={!yearFilled()}>
        Submit
      </button>
    </form>
  );
}
