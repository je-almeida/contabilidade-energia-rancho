"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCompetency, formatDateTime, formatMoneyCents, formatRate, formatReading, statusLabel } from "@/lib/format";
import { buildHistoryPdfHtml } from "@/lib/pdf";
import { cancelPeriod, closePeriod, getCompetency, getReadings, getSnapshot, getWellReading, listCompetencies, reopenPeriod } from "@/lib/repositories/periods";
import { listResidents } from "@/lib/repositories/residents";
import type { Competency, CompetencySnapshot, Reading, Resident, WellReading } from "@/lib/types";

export function HistoryScreen() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [snapshot, setSnapshot] = useState<CompetencySnapshot | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [well, setWell] = useState<WellReading | null>(null);
  const [residents, setResidents] = useState<Map<string, Resident>>(new Map());
  const [status, setStatus] = useState<string | null>(null);

  const loadCompetency = useCallback(async (id: string) => {
    const [item, snap, values, wellReading] = await Promise.all([
      getCompetency(id),
      getSnapshot(id),
      getReadings(id),
      getWellReading(id),
    ]);
    setSelectedCompetency(item ?? null);
    setSnapshot(snap ?? null);
    setReadings(values);
    setWell(wellReading ?? null);
  }, []);

  const load = useCallback(async () => {
    const [items, residentList] = await Promise.all([
      listCompetencies(),
      listResidents(),
    ]);
    setCompetencies(items);
    setResidents(new Map(residentList.map((r) => [r.id, r])));
    if (items[0]) {
      setSelectedId(items[0].id);
      await loadCompetency(items[0].id);
    }
  }, [loadCompetency]);

  useEffect(() => {
    let active = true;

    void (async () => {
      await load();
      if (!active) return;
    })();

    return () => {
      active = false;
    };
  }, [load]);

  async function handleSelect(id: string) {
    setSelectedId(id);
    await loadCompetency(id);
  }

  async function handleClose(id: string) {
    await closePeriod(id);
    setStatus("Competência fechada.");
    await load();
  }

  async function handleReopen(id: string) {
    await reopenPeriod(id);
    setStatus("Competência reaberta.");
    await load();
  }

  async function handleCancel(id: string) {
    await cancelPeriod(id, "Cancelamento do histórico");
    setStatus("Competência cancelada.");
    await load();
  }

  function handleExportPdf() {
    if (!selectedCompetency || !snapshot) return;

    const html = buildHistoryPdfHtml({
      competency: selectedCompetency,
      snapshot,
      readings,
      residents,
      well,
    });

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      setStatus("O navegador bloqueou a abertura da janela de exportação.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return (
    <section>
      <h2 className="page-title">Histórico</h2>
      <p className="lede">Consulte dados e status das competências anteriores.</p>
      {status ? <div className="alert">{status}</div> : null}

      <div className="card">
        <h3>Competências</h3>
        <div className="list">
          {competencies.map((item) => (
            <button
              key={item.id}
              type="button"
              className={selectedId === item.id ? "btn primary" : "btn ghost"}
              onClick={() => void handleSelect(item.id)}
            >
              {formatCompetency(item.year, item.month)} · {statusLabel(item.status)}
            </button>
          ))}
        </div>
      </div>

      {selectedCompetency && snapshot ? (
        <div className="card">
          <h3>{formatCompetency(selectedCompetency.year, selectedCompetency.month)}</h3>
          <div className="metrics-grid">
            <div className="stat"><span>Valor da conta</span><strong>{formatMoneyCents(snapshot.energyBillCents)}</strong></div>
            <div className="stat"><span>Consumo total energia</span><strong>{formatReading(snapshot.totalEnergyConsumption)}</strong></div>
            <div className="stat"><span>R$/kWh</span><strong>{formatRate(snapshot.rateKwh ?? null, 6)}</strong></div>
            <div className="stat"><span>Poço</span><strong>{formatReading(snapshot.wellConsumption)}</strong></div>
            <div className="stat"><span>Custo do poço</span><strong>{formatMoneyCents(snapshot.wellCostCents ?? null)}</strong></div>
            <div className="stat"><span>Água</span><strong>{formatReading(snapshot.totalWaterConsumption)}</strong></div>
            <div className="stat"><span>R$/m³</span><strong>{formatRate(snapshot.rateM3 ?? null, 6)}</strong></div>
            <div className="stat"><span>Total geral</span><strong>{formatMoneyCents(snapshot.grandTotalCents ?? null)}</strong></div>
          </div>

          <div className="row-actions">
            <button type="button" className="btn primary" onClick={handleExportPdf}>Exportar PDF</button>
            {selectedCompetency.status === "open" ? (
              <button type="button" className="btn primary" onClick={() => void handleClose(selectedCompetency.id)}>Fechar competência</button>
            ) : null}
            {selectedCompetency.status === "closed" ? (
              <button type="button" className="btn ghost" onClick={() => void handleReopen(selectedCompetency.id)}>Reabrir competência</button>
            ) : null}
            {selectedCompetency.status !== "cancelled" ? (
              <button type="button" className="btn danger" onClick={() => void handleCancel(selectedCompetency.id)}>Cancelar competência</button>
            ) : null}
          </div>

          <p className="muted">
            Criado em: {formatDateTime(selectedCompetency.createdAt)} · Alterado em: {formatDateTime(selectedCompetency.updatedAt)}
          </p>
          <p className="muted">
            Fechamento: {formatDateTime(selectedCompetency.closedAt)} · Cancelamento: {formatDateTime(selectedCompetency.cancelledAt)}
          </p>

          {well ? (
            <div className="card">
              <h3>Poço</h3>
              <p>Anterior: {formatReading(well.previous)} · Atual: {formatReading(well.current)} · Consumo: {formatReading(well.consumption)}</p>
            </div>
          ) : null}

          <div className="card">
            <h3>Moradores</h3>
            <div className="list">
              {readings.map((reading) => {
                const resident = residents.get(reading.residentId);
                return (
                  <div key={reading.id} className="list-item">
                    <strong>{resident?.name ?? "Morador"}</strong>
                    <div className="muted">
                      Energia: {formatMoneyCents(reading.energyCostCents ?? null)} ({formatReading(reading.energyConsumption)} kWh) · Água: {formatMoneyCents(reading.waterCostCents ?? null)} ({formatReading(reading.waterConsumption)} m³) · Total: {formatMoneyCents(reading.totalCents ?? null)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
