import type { CompetencyStatus } from "../types";

export function competencyKey(year: number, month: number): number {
  return year * 12 + month;
}

export function isBefore(
  year: number,
  month: number,
  otherYear: number,
  otherMonth: number,
): boolean {
  return competencyKey(year, month) < competencyKey(otherYear, otherMonth);
}

export interface ReadingHistoryItem {
  year: number;
  month: number;
  status: CompetencyStatus;
  value: number;
}

/** Last non-cancelled reading strictly before the given competency. First launch = 0. */
export function lastValidPrevious(
  history: ReadingHistoryItem[],
  year: number,
  month: number,
): number {
  const prior = history
    .filter(
      (item) =>
        item.status !== "cancelled" &&
        isBefore(item.year, item.month, year, month),
    )
    .sort(
      (a, b) => competencyKey(b.year, b.month) - competencyKey(a.year, a.month),
    );
  if (prior.length === 0) return 0;
  return prior[0].value;
}
