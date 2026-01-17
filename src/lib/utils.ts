import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDuration(start: Date, end: Date) {
  const duration = intervalToDuration({ start, end });
  const hours = duration.hours ?? 0;
  const minutes = duration.minutes ?? 0;
  return `${hours}h ${minutes}m`;
}

export function durationInHours(start: Date, end: Date) {
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
}
