import { format, isValid, parseISO } from "date-fns";

export function combineMatchDateTime(day: Date | undefined, time: string): string {
  if (!day || !isValid(day) || !/^\d{2}:\d{2}$/.test(time)) return "";
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return "";
  return `${format(day, "yyyy-MM-dd")}T${time}`;
}

export function matchDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

export function venueAddress(name: string, address: string): string {
  return name && !address.startsWith(name) ? `${name} · ${address}` : address;
}