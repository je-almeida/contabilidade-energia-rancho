"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCompetency, formatMoneyCents, formatRate, formatReading } from "@/lib/format";
import { latestDashboardCompetency, getSnapshot } from "@/lib/repositories/periods";
import { listActiveResidents } from "@/lib/repositories/residents";
import { ensureSettings } from "@/lib/repositories/settings";
import type { Competency, CompetencySnapshot } from "@/lib/types";

export function DashboardScreen() {
  const [propertyName, setPropertyName] = useState("Propriedade");
  const [competency, setCompetency] = useState<Competency | null>(null);
  const [snapshot, setSnapshot] = useState<CompetencySnapshot | null>(null);
  const [activeResidents, setActiveResidents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [settings, active, current] = await Promise.all([
        ensureSettings(),
        listActiveResidents(),
        latestDashboardCompetency(),
      ]);
      if (cancelled) return;
      setPropertyName(settings.propertyName);
      setActiveResidents(active.length);
      setCompetency(current ?? null);

      if (current) {
        const snap = await getSnapshot(current.id);
        if (!cancelled) setSnapshot(snap ?? null);
      } else {
        if (!cancelled) setSnapshot(null);
      }
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="muted">Carregando painel…</p>;
  }

  return (
    <section>
      <h2 className="page-title">Dashboard</h2>
      <p className="lede">
        Visão geral da {propertyName} e do último ciclo operacional.
      </p>

      {competency && snapshot ? (
        <>
          <div className="card">
            <h3>{formatCompetency(competency.year, competency.month)}</h3>
            <div className="metrics-grid">
              <div className="stat">
                <span>Valor da conta</span>
                <strong>{formatMoneyCents(snapshot.energyBillCents)}</strong>
              </div>
              <div className="stat">
                <span>Consumo total energia</span>
                <strong>{formatReading(snapshot.totalEnergyConsumption)}</strong>
              </div>
              <div className="stat">
                <span>R$/kWh</span>
                <strong>{formatRate(snapshot.rateKwh ?? null, 6)}</strong>
              </div>
              <div className="stat">
                <span>Consumo de energia do poço</span>
                <strong>{formatReading(snapshot.wellConsumption)}</strong>
              </div>
              <div className="stat">
                <span>Custo do poço</span>
                <strong>{formatMoneyCents(snapshot.wellCostCents ?? null)}</strong>
              </div>
              <div className="stat">
                <span>Consumo total água</span>
                <strong>{formatReading(snapshot.totalWaterConsumption)}</strong>
              </div>
              <div className="stat">
                <span>R$/m³</span>
                <strong>{formatRate(snapshot.rateM3 ?? null, 6)}</strong>
              </div>
              <div className="stat">
                <span>Moradores ativos</span>
                <strong>{activeResidents}</strong>
              </div>
              <div className="stat">
                <span>Total geral</span>
                <strong>{formatMoneyCents(snapshot.grandTotalCents ?? null)}</strong>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <p className="lede">Ainda não há competência calculada para exibir.</p>
          <Link className="btn primary" href="/lancamento">
            Criar lançamento
          </Link>
        </div>
      )}
    </section>
  );
}
