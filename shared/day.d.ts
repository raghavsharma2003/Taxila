export const DAY_START_HOUR: 4;
export function partOfDay(hour: number): "morning" | "afternoon" | "evening";
export function learningDay(now?: Date, tz?: string): { day: string; hour: number };
