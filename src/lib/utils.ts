import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(durationBlocks: number): string {
  const totalMinutes = durationBlocks * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}mins`;
  } else if (minutes === 0) {
    return hours === 1 ? "1hr" : `${hours}hrs`;
  } else {
    return `${hours}hr and ${minutes}mins`;
  }
}
