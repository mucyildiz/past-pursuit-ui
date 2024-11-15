import Guess from "../models/Guess";
import Event from "../models/Event";

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

export const formatDate = (
  year: number,
  month: number,
  day: number
): string => {
  const monthName = getMonthName(month);
  const dayString = day ? `${day}` : "";
  const absYear = Math.abs(year);
  const bcAd = year < 0 ? " BC" : "";
  return `${monthName} ${dayString}, ${absYear}${bcAd}`.trim();
};

export const getDateDifference = (guess: Guess, event: Event): number => {
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
