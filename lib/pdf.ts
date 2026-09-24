import type { Competency, CompetencySnapshot, Reading, Resident, WellReading } from "./types";
import { formatCompetency, formatMoneyCents, formatRate, formatReading } from "./format";

export interface HistoryPdfData {
  competency: Competency;
  snapshot: CompetencySnapshot;
  readings: Reading[];
  residents: Map<string, Resident>;
  well: WellReading | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function moneyCell(value: number | null | undefined): string {
  return formatMoneyCents(value ?? null);
}

function rateCell(value: number | null | undefined): string {
  return formatRate(value ?? null, 2);
}

export function buildHistoryPdfHtml(data: HistoryPdfData): string {
  const { competency, snapshot, readings, residents, well } = data;
  const competencyTitle = formatCompetency(competency.year, competency.month);

  const rows = readings.map((reading) => {
    const resident = residents.get(reading.residentId);
    const residentName = resident?.name ?? "Morador";
    return `
      <tr>
        <td>${escapeHtml(residentName)}</td>
        <td>${formatReading(reading.energyPrevious)}</td>
        <td>${formatReading(reading.energyCurrent)}</td>
        <td>${formatReading(reading.waterPrevious)}</td>
        <td>${formatReading(reading.waterCurrent)}</td>
        <td>${moneyCell(reading.energyCostCents ?? null)}</td>
        <td>${moneyCell(reading.waterCostCents ?? null)}</td>
        <td>${moneyCell(reading.totalCents ?? null)}</td>
      </tr>
    `;
  }).join("");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Histórico ${escapeHtml(competencyTitle)}</title>
        <style>
          :root {
            --blue-strong: #0b3d75;
            --blue-soft: #dfeefc;
            --blue-soft-2: #edf6ff;
            --ink: #12313c;
            --muted: #4b6470;
            --line: #bfd9f3;
            --white: #ffffff;
          }

          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #eef4fb;
            color: var(--ink);
            font-family: Arial, Helvetica, sans-serif;
            padding: 24px;
          }
          .sheet {
            max-width: 1100px;
            margin: 0 auto;
            background: var(--white);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 20px;
          }
          .header {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
          }
          .cell {
            border: 1px solid var(--line);
            border-radius: 10px;
            overflow: hidden;
          }
          .cell-title {
            background: var(--blue-strong);
            color: var(--white);
            font-weight: 700;
            font-size: 12px;
            padding: 8px 10px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .cell-value {
            background: var(--blue-soft);
            color: var(--ink);
            font-weight: 700;
            font-size: 14px;
            padding: 10px 12px;
            min-height: 44px;
            display: flex;
            align-items: center;
          }
          h1 {
            margin: 0 0 14px;
            color: var(--blue-strong);
            font-size: 24px;
          }
          h2 {
            margin: 18px 0 10px;
            color: var(--blue-strong);
            font-size: 18px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 6px;
          }
          th, td {
            border: 1px solid var(--line);
            padding: 8px 6px;
            text-align: center;
            vertical-align: middle;
          }
          th {
            background: var(--blue-strong);
            color: var(--white);
            font-weight: 700;
          }
          td {
            background: var(--blue-soft-2);
          }
          .summary {
            margin-top: 18px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .summary .cell {
            min-height: 68px;
          }
          @media print {
            body { background: white; padding: 0; }
            .sheet { border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <h1>Competência: ${escapeHtml(competencyTitle)}</h1>

          <div class="header">
            <div class="cell">
              <div class="cell-title">Competência</div>
              <div class="cell-value">${escapeHtml(competencyTitle)}</div>
            </div>
            <div class="cell">
              <div class="cell-title">Valor Unitário KW</div>
              <div class="cell-value">${rateCell(snapshot.rateKwh ?? null)}</div>
            </div>
            <div class="cell">
              <div class="cell-title">Valor Unitário M³</div>
              <div class="cell-value">${rateCell(snapshot.rateM3 ?? null)}</div>
            </div>
          </div>

          <h2>Contas</h2>
          <table>
            <thead>
              <tr>
                <th>Morador</th>
                <th>Leitura KW anterior</th>
                <th>Leitura KW atual</th>
                <th>Leitura M³ anterior</th>
                <th>Leitura M³ atual</th>
                <th>Valor KW em R$</th>
                <th>Valor M³ em R$</th>
                <th>Valor total em R$</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `
                <tr>
                  <td colspan="8">Nenhuma conta registrada para esta competência.</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="summary">
            <div class="cell">
              <div class="cell-title">Poço</div>
              <div class="cell-value">${well ? `${formatReading(well.previous)} → ${formatReading(well.current)} · ${moneyCell(well.costCents ?? null)}` : "—"}</div>
            </div>
            <div class="cell">
              <div class="cell-title">Valor total da conta</div>
              <div class="cell-value">${moneyCell(snapshot.energyBillCents ?? null)}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
