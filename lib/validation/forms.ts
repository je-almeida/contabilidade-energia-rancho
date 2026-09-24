export function parseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function canShowWellCalculations(input: { bill: string; wellCurrent: string }): boolean {
  return parseNumber(input.bill) !== null && parseNumber(input.wellCurrent) !== null;
}

export function canShowResidentCalculations(input: {
  bill: string;
  wellCurrent: string;
  energyCurrent: string;
  waterCurrent: string;
  adjustment: string;
  energyPrevious?: number;
  waterPrevious?: number;
}): boolean {
  const baseReady =
    parseNumber(input.bill) !== null &&
    parseNumber(input.wellCurrent) !== null;
  const residentReady =
    parseNumber(input.energyCurrent) !== null &&
    parseNumber(input.waterCurrent) !== null &&
    (input.adjustment.trim() === "" || parseNumber(input.adjustment) !== null);

  return baseReady && residentReady;
}

export function requiredText(value: string, label: string): string | null {
  if (!value.trim()) return `${label} é obrigatório.`;
  return null;
}

export interface FieldErrors {
  [key: string]: string;
}

export function validateResidentForm(input: {
  name: string;
  unit: string;
  activeCount: number;
  isNew: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  const nameErr = requiredText(input.name, "Nome");
  if (nameErr) errors.name = nameErr;
  const unitErr = requiredText(input.unit, "Identificação/unidade");
  if (unitErr) errors.unit = unitErr;
  if (input.isNew && input.activeCount >= 20) {
    errors.form = "O máximo de 20 moradores já foi atingido.";
  }
  return errors;
}

export function validateReadings(input: {
  energyBillReais: string;
  wellCurrent: string;
  wellPrevious: number;
  residents: {
    id: string;
    energyCurrent: string;
    waterCurrent: string;
    energyPrevious: number;
    waterPrevious: number;
    adjustmentReais: string;
  }[];
}): FieldErrors {
  const errors: FieldErrors = {};
  const bill = parseNumber(input.energyBillReais);
  if (bill === null) {
    errors.energyBill = "Informe um valor numérico válido para a conta.";
  } else if (bill < 0) {
    errors.energyBill = "A conta de energia não pode ser negativa.";
  }

  const well = parseNumber(input.wellCurrent);
  if (well === null) {
    errors.wellCurrent = "Informe a leitura atual do poço.";
  } else if (well < input.wellPrevious) {
    errors.wellCurrent = `A leitura atual (${well}) não pode ser menor que a anterior (${input.wellPrevious}).`;
  }

  for (const r of input.residents) {
    const energy = parseNumber(r.energyCurrent);
    if (energy === null) {
      errors[`energy-${r.id}`] = "Informe a leitura de energia.";
    } else if (energy < r.energyPrevious) {
      errors[`energy-${r.id}`] =
        `A leitura atual não pode ser menor que a anterior (${r.energyPrevious}).`;
    }

    const water = parseNumber(r.waterCurrent);
    if (water === null) {
      errors[`water-${r.id}`] = "Informe a leitura de água.";
    } else if (water < r.waterPrevious) {
      errors[`water-${r.id}`] =
        `A leitura atual não pode ser menor que a anterior (${r.waterPrevious}).`;
    }

    const adj = r.adjustmentReais.trim() === "" ? 0 : parseNumber(r.adjustmentReais);
    if (adj === null) {
      errors[`adj-${r.id}`] = "Informe um ajuste numérico válido.";
    }
  }

  return errors;
}

export function validateMonthYear(month: number, year: number): FieldErrors {
  const errors: FieldErrors = {};
  if (month < 1 || month > 12) errors.month = "Mês inválido.";
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    errors.year = "Ano inválido.";
  }
  return errors;
}
