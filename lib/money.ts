/** Round half away from zero to the nearest integer. */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(value));
}

export function reaisToCents(reais: number): number {
  if (!Number.isFinite(reais)) return 0;
  return roundHalfUp(Math.round(reais * 10000) / 100);
}

export function centsToReais(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return cents / 100;
}

/** Charge line: consumption × rate, stored as integer cents (HALF_UP). */
export function chargeCents(consumption: number, rateReais: number): number {
  if (!Number.isFinite(consumption) || !Number.isFinite(rateReais)) return 0;
  return reaisToCents(consumption * rateReais);
}
