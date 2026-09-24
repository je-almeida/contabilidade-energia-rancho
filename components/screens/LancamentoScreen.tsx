"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AutoLabel, ConfirmBar, FieldError, StatusBadge } from "@/components/Ui";
import { calculatePeriod } from "@/lib/calc/energy-water";
import {
  formatCompetency,
  formatMoneyCents,
  formatRate,
  formatReading,
} from "@/lib/format";
import { MONTHS } from "@/lib/types";
import {
  canShowResidentCalculations,
  canShowWellCalculations,
  parseNumber,
  validateMonthYear,
  validateReadings,
} from "@/lib/validation/forms";
import { reaisToCents } from "@/lib/money";
import {
  cancelPeriod,
  closePeriod,
  DomainError,
  findCompetencyByMonth,
  getCompetency,
  getReadings,
  getSnapshot,
  getWellReading,
  previousResidentReadings,
  previousWellReading,
  reopenPeriod,
  savePeriod,
} from "@/lib/repositories/periods";
import { listActiveResidents, listResidents } from "@/lib/repositories/residents";
import { ensureSettings } from "@/lib/repositories/settings";
import type { CalcResult, Resident } from "@/lib/types";

type Row = {
  residentId: string;
  name: string;
  unit: string;
  energyCurrent: string;
  waterCurrent: string;
  adjustment: string;
  energyPrevious: number;
  waterPrevious: number;
};

function currentMonthYear() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function LancamentoScreen({ competencyId }: { competencyId?: string }) {
  const initial = currentMonthYear();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [bill, setBill] = useState("");
  const [wellCurrent, setWellCurrent] = useState("");
  const [wellPrevious, setWellPrevious] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"open" | "closed" | "cancelled" | "new">(
    "new",
  );
  const [savedId, setSavedId] = useState<string | undefined>(competencyId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<null | "close" | "cancel" | "reopen" | "clear">(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [rateDecimals, setRateDecimals] = useState(6);

  const locked = status === "closed" || status === "cancelled";

  const loadPrevious = useCallback(
    async (y: number, m: number, residents: Resident[]) => {
      const well = await previousWellReading(y, m);
      setWellPrevious(well);
      const prev = await previousResidentReadings(
        y,
        m,
        residents.map((r) => r.id),
      );
      setRows((current) =>
        current.map((row) => ({
          ...row,
          energyPrevious: prev[row.residentId]?.energy ?? 0,
          waterPrevious: prev[row.residentId]?.water ?? 0,
        })),
      );
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      const settings = await ensureSettings();
      if (!cancelled) setRateDecimals(settings.rateDecimalPlaces);
      if (competencyId) {
        const c = await getCompetency(competencyId);
        if (!c || cancelled) {
          if (!cancelled) setFormError("Competência não encontrada.");
          setLoading(false);
          return;
        }
        const [readings, well, allResidents] = await Promise.all([
          getReadings(c.id),
          getWellReading(c.id),
          listResidents(),
        ]);
        const byId = new Map(allResidents.map((r) => [r.id, r]));
        const mapped: Row[] = readings.map((r) => {
          const res = byId.get(r.residentId);
          return {
            residentId: r.residentId,
            name: res?.name ?? "Morador removido",
            unit: res?.unit ?? "—",
            energyCurrent: String(r.energyCurrent).replace(".", ","),
            waterCurrent: String(r.waterCurrent).replace(".", ","),
            adjustment: String(r.adjustmentCents / 100).replace(".", ","),
            energyPrevious: r.energyPrevious,
            waterPrevious: r.waterPrevious,
          };
        });
        if (c.status === "open") {
          const active = await listActiveResidents();
          for (const a of active) {
            if (!mapped.some((m) => m.residentId === a.id)) {
              mapped.push({
                residentId: a.id,
                name: a.name,
                unit: a.unit,
                energyCurrent: "",
                waterCurrent: "",
                adjustment: "0",
                energyPrevious: 0,
                waterPrevious: 0,
              });
            }
          }
        }
        if (cancelled) return;
        setSavedId(c.id);
        setYear(c.year);
        setMonth(c.month);
        setBill(String(c.energyBillCents / 100).replace(".", ","));
        setWellCurrent(String((well?.current ?? c.wellCurrentReading)).replace(".", ","));
        setWellPrevious(well?.previous ?? 0);
        setRows(mapped.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
        setStatus(c.status);
        if (c.status === "open") {
          await loadPrevious(c.year, c.month, mapped.map((m) => ({
            id: m.residentId,
            name: m.name,
            unit: m.unit,
            status: "active",
            createdAt: "",
            updatedAt: "",
          })));
        }
      } else {
        const active = await listActiveResidents();
        if (cancelled) return;
        setRows(
          active.map((r) => ({
            residentId: r.id,
            name: r.name,
            unit: r.unit,
            energyCurrent: "",
            waterCurrent: "",
            adjustment: "0",
            energyPrevious: 0,
            waterPrevious: 0,
          })),
        );
        await loadPrevious(initial.year, initial.month, active);
      }
      if (!cancelled) setLoading(false);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [competencyId, loadPrevious, initial.year, initial.month]);

  useEffect(() => {
    if (status !== "new" && status !== "open") return;
    void (async () => {
      const ids = rows.map((r) => r.residentId);
      if (ids.length === 0) return;
      const well = await previousWellReading(year, month);
      setWellPrevious(well);
      const prev = await previousResidentReadings(year, month, ids);
      setRows((current) =>
        current.map((row) => ({
          ...row,
          energyPrevious: prev[row.residentId]?.energy ?? 0,
          waterPrevious: prev[row.residentId]?.water ?? 0,
        })),
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const calc: CalcResult | null = useMemo(() => {
    const billN = parseNumber(bill);
    const wellN = parseNumber(wellCurrent);
    if (billN === null || wellN === null) return null;
    const residents = rows.map((r) => {
      const energy = parseNumber(r.energyCurrent);
      const water = parseNumber(r.waterCurrent);
      const adjRaw = r.adjustment.trim() === "" ? 0 : parseNumber(r.adjustment);
      if (energy === null || water === null || adjRaw === null) return null;
      return {
        residentId: r.residentId,
        energyCurrent: energy,
        energyPrevious: r.energyPrevious,
        waterCurrent: water,
        waterPrevious: r.waterPrevious,
        adjustmentCents: reaisToCents(adjRaw),
      };
    });
    if (residents.some((r) => r === null)) return null;
    return calculatePeriod({
      energyBillCents: reaisToCents(billN),
      wellCurrent: wellN,
      wellPrevious,
      residents: residents as NonNullable<(typeof residents)[number]>[],
    });
  }, [bill, wellCurrent, wellPrevious, rows]);

  const showWellCalculations = canShowWellCalculations({ bill, wellCurrent });

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.residentId === id ? { ...r, ...patch } : r)));
  }

  async function onSave() {
    setFormError(null);
    setInfo(null);
    const my = validateMonthYear(month, year);
    const re = validateReadings({
      energyBillReais: bill,
      wellCurrent,
      wellPrevious,
      residents: rows.map((r) => ({
        id: r.residentId,
        energyCurrent: r.energyCurrent,
        waterCurrent: r.waterCurrent,
        energyPrevious: r.energyPrevious,
        waterPrevious: r.waterPrevious,
        adjustmentReais: r.adjustment,
      })),
    });
    const next = { ...my, ...re };
    setErrors(next);
    if (Object.keys(next).length) return;
    if (rows.length === 0) {
      setFormError("Cadastre ao menos um morador ativo para lançar.");
      return;
    }
    try {
      if (!savedId) {
        const existing = await findCompetencyByMonth(year, month);
        if (existing) {
          setFormError("Já existe uma competência para este mês/ano.");
          return;
        }
      }
      const billN = parseNumber(bill)!;
      const wellN = parseNumber(wellCurrent)!;
      const id = await savePeriod({
        id: savedId,
        year,
        month,
        energyBillCents: reaisToCents(billN),
        wellCurrent: wellN,
        residents: rows.map((r) => ({
          residentId: r.residentId,
          energyCurrent: parseNumber(r.energyCurrent)!,
          waterCurrent: parseNumber(r.waterCurrent)!,
          adjustmentCents: reaisToCents(parseNumber(r.adjustment) ?? 0),
        })),
      });
      setSavedId(id);
      setStatus("open");
      setInfo("Lançamento salvo neste dispositivo.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  async function doClose() {
    if (!savedId) {
      setFormError("Salve o lançamento antes de fechar.");
      setConfirm(null);
      return;
    }
    try {
      await onSave();
      const snap = await getSnapshot(savedId);
      if (!snap || snap.rateKwh === null || snap.rateM3 === null) {
        setFormError(
          "Não é possível fechar enquanto o cálculo não puder ser realizado.",
        );
        setConfirm(null);
        return;
      }
      await closePeriod(savedId);
      setStatus("closed");
      setInfo("Competência fechada.");
    } catch (e) {
      setFormError(e instanceof DomainError || e instanceof Error ? e.message : "Erro ao fechar.");
    }
    setConfirm(null);
  }

  async function doCancel() {
    if (!savedId) {
      setFormError("Salve o lançamento antes de cancelar.");
      setConfirm(null);
      return;
    }
    try {
      await cancelPeriod(savedId, cancelReason);
      setStatus("cancelled");
      setInfo("Competência cancelada. O histórico foi preservado.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao cancelar.");
    }
    setConfirm(null);
  }

  async function doReopen() {
    if (!savedId) return;
    try {
      await reopenPeriod(savedId);
      setStatus("open");
      setInfo("Competência reaberta. Você pode corrigir e recalcular.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao reabrir.");
    }
    setConfirm(null);
  }

  function doClear() {
    setBill("");
    setWellCurrent("");
    setRows((rs) =>
      rs.map((r) => ({
        ...r,
        energyCurrent: "",
        waterCurrent: "",
        adjustment: "0",
      })),
    );
    setErrors({});
    setInfo(null);
    setConfirm(null);
  }

  if (loading) return <p className="muted">Carregando…</p>;

  if (rows.length === 0 && status === "new") {
    return (
      <section>
        <h2 className="page-title">Lançamento mensal</h2>
        <p className="lede">Cadastre moradores ativos antes de lançar leituras.</p>
        <Link className="btn primary" href="/moradores">
          Ir para moradores
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h2 className="page-title">
        {status === "new" ? "Novo lançamento" : formatCompetency(year, month)}
      </h2>
      <p className="lede">
        Preencha a conta e as leituras atuais. Consumos e custos são calculados
        automaticamente.
      </p>
      {status !== "new" ? (
        <p>
          <StatusBadge status={status} />
        </p>
      ) : null}
      {formError ? <div className="alert">{formError}</div> : null}
      {info ? <div className="alert">{info}</div> : null}
      {calc?.errors.map((e) => (
        <div className="alert" key={e}>
          {e}
        </div>
      ))}

      <div className="card">
        <h3>Competência e conta</h3>
        <div className="form-2">
          <label className="field">
            Mês
            <select
              value={month}
              disabled={locked || Boolean(savedId)}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <FieldError message={errors.month} />
          </label>
          <label className="field">
            Ano
            <input
              type="number"
              value={year}
              disabled={locked || Boolean(savedId)}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <FieldError message={errors.year} />
          </label>
        </div>
        <label className="field">
          Valor da conta de energia (R$)
          <input
            inputMode="decimal"
            value={bill}
            disabled={locked}
            onChange={(e) => setBill(e.target.value)}
          />
          <FieldError message={errors.energyBill} />
        </label>
      </div>

      <div className="card">
        <h3>Poço (somente energia)</h3>
        <div className="form-2">
          <div className="field">
            <AutoLabel>Leitura anterior</AutoLabel>
            <div className="readonly">{formatReading(wellPrevious)}</div>
          </div>
          <label className="field">
            Leitura atual
            <input
              inputMode="decimal"
              value={wellCurrent}
              disabled={locked}
              onChange={(e) => setWellCurrent(e.target.value)}
            />
            <FieldError message={errors.wellCurrent} />
          </label>
        </div>
        {showWellCalculations ? (
          <div className="form-2">
            <div className="field">
              <AutoLabel>Consumo</AutoLabel>
              <div className="readonly">
                {formatReading(calc?.wellConsumption)}
              </div>
            </div>
            <div className="field">
              <AutoLabel>Custo do poço</AutoLabel>
              <div className="readonly">
                {formatMoneyCents(calc?.wellCostCents ?? null)}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {rows.map((row) => {
        const result = calc?.residents.find((r) => r.residentId === row.residentId);
        const showResidentCalculations = canShowResidentCalculations({
          bill,
          wellCurrent,
          energyCurrent: row.energyCurrent,
          waterCurrent: row.waterCurrent,
          adjustment: row.adjustment,
        });
        return (
          <div className="resident-card" key={row.residentId}>
            <h3>
              {row.name}{" "}
              <span className="muted">{row.unit}</span>
            </h3>
            <div className="resident-grid">
              <label className="field">
                Energia atual
                <input
                  inputMode="decimal"
                  disabled={locked}
                  value={row.energyCurrent}
                  onChange={(e) =>
                    updateRow(row.residentId, { energyCurrent: e.target.value })
                  }
                />
                <FieldError message={errors[`energy-${row.residentId}`]} />
              </label>
              <label className="field">
                Água atual
                <input
                  inputMode="decimal"
                  disabled={locked}
                  value={row.waterCurrent}
                  onChange={(e) =>
                    updateRow(row.residentId, { waterCurrent: e.target.value })
                  }
                />
                <FieldError message={errors[`water-${row.residentId}`]} />
              </label>
              <label className="field">
                Ajuste (R$)
                <input
                  inputMode="decimal"
                  disabled={locked}
                  value={row.adjustment}
                  onChange={(e) =>
                    updateRow(row.residentId, { adjustment: e.target.value })
                  }
                />
                <FieldError message={errors[`adj-${row.residentId}`]} />
              </label>
              <div className="field">
                <AutoLabel>Energia anterior</AutoLabel>
                <div className="readonly">{formatReading(row.energyPrevious)}</div>
              </div>
              <div className="field">
                <AutoLabel>Água anterior</AutoLabel>
                <div className="readonly">{formatReading(row.waterPrevious)}</div>
              </div>
              {showResidentCalculations ? (
                <>
                  <div className="field">
                    <AutoLabel>Consumo energia</AutoLabel>
                    <div className="readonly">
                      {formatReading(result?.energyConsumption)}
                    </div>
                  </div>
                  <div className="field">
                    <AutoLabel>Custo energia</AutoLabel>
                    <div className="readonly">
                      {formatMoneyCents(result?.energyCostCents ?? null)}
                    </div>
                  </div>
                  <div className="field">
                    <AutoLabel>Consumo água</AutoLabel>
                    <div className="readonly">
                      {formatReading(result?.waterConsumption)}
                    </div>
                  </div>
                  <div className="field">
                    <AutoLabel>Custo água</AutoLabel>
                    <div className="readonly">
                      {formatMoneyCents(result?.waterCostCents ?? null)}
                    </div>
                  </div>
                  <div className="field">
                    <AutoLabel>Total</AutoLabel>
                    <div className="readonly">
                      {formatMoneyCents(result?.totalCents ?? null)}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        );
      })}

      {calc ? (
        <div className="card">
          <h3>Resumo</h3>
          <div className="grid-kpis">
            <div className="kpi">
              <AutoLabel>Consumo total energia</AutoLabel>
              <strong>{formatReading(calc.totalEnergyConsumption)}</strong>
            </div>
            <div className="kpi">
              <AutoLabel>R$/kWh</AutoLabel>
              <strong>{formatRate(calc.rateKwh ?? null, rateDecimals)}</strong>
            </div>
            <div className="kpi">
              <AutoLabel>Consumo poço</AutoLabel>
              <strong>{formatReading(calc.wellConsumption)}</strong>
            </div>
            <div className="kpi">
              <AutoLabel>Custo poço</AutoLabel>
              <strong>{formatMoneyCents(calc.wellCostCents ?? null)}</strong>
            </div>
            <div className="kpi">
              <AutoLabel>Consumo total água</AutoLabel>
              <strong>{formatReading(calc.totalWaterConsumption)}</strong>
            </div>
            <div className="kpi">
              <AutoLabel>R$/m³</AutoLabel>
              <strong>{formatRate(calc.rateM3 ?? null, rateDecimals)}</strong>
            </div>
            <div className="kpi">
              <AutoLabel>Total geral</AutoLabel>
              <strong>{formatMoneyCents(calc.grandTotalCents ?? null)}</strong>
            </div>
          </div>
        </div>
      ) : null}

      <div className="row-actions">
        {status !== "cancelled" && status !== "closed" ? (
          <>
            <button className="btn primary" type="button" onClick={() => void onSave()}>
              Salvar lançamento
            </button>
            <button className="btn ghost" type="button" onClick={() => setConfirm("clear")}>
              Limpar formulário
            </button>
            <button className="btn ghost" type="button" onClick={() => setConfirm("close")}>
              Fechar competência
            </button>
            {savedId ? (
              <button className="btn danger" type="button" onClick={() => setConfirm("cancel")}>
                Cancelar competência
              </button>
            ) : null}
          </>
        ) : null}
        {status === "closed" ? (
          <>
            <button className="btn ghost" type="button" onClick={() => setConfirm("reopen")}>
              Reabrir competência
            </button>
            <button className="btn danger" type="button" onClick={() => setConfirm("cancel")}>
              Cancelar competência
            </button>
          </>
        ) : null}
      </div>

      {confirm === "close" ? (
        <ConfirmBar
          title="Fechar competência?"
          body="Após o fechamento, os valores ficam bloqueados até uma reabertura confirmada."
          confirmLabel="Fechar"
          onCancel={() => setConfirm(null)}
          onConfirm={() => void doClose()}
        />
      ) : null}
      {confirm === "reopen" ? (
        <ConfirmBar
          title="Reabrir competência?"
          body="A competência voltará a ficar aberta para correções e recálculo."
          confirmLabel="Reabrir"
          onCancel={() => setConfirm(null)}
          onConfirm={() => void doReopen()}
        />
      ) : null}
      {confirm === "clear" ? (
        <ConfirmBar
          title="Limpar formulário?"
          body="As leituras atuais e o valor da conta serão apagados desta tela (nada é excluído do histórico até você salvar)."
          confirmLabel="Limpar"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={doClear}
        />
      ) : null}
      {confirm === "cancel" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>Cancelar competência?</h2>
            <p>
              Os dados não serão apagados. A competência sai dos cálculos ativos e
              suas leituras não serão usadas como anteriores.
            </p>
            <label className="field">
              Motivo (opcional)
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>
            <div className="row-actions">
              <button className="btn ghost" type="button" onClick={() => setConfirm(null)}>
                Voltar
              </button>
              <button className="btn danger" type="button" onClick={() => void doCancel()}>
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
