"use client";

import { useState } from "react";

export function ReportTabs({
  resultados,
  eff,
  balance,
  validacion,
}: {
  resultados: React.ReactNode;
  eff: React.ReactNode;
  balance: React.ReactNode;
  validacion?: React.ReactNode;
}) {
  const [tab, setTab] = useState<"resultados" | "eff" | "balance" | "validacion">("resultados");

  const tabs = [
    { id: "resultados" as const, label: "Estado de Resultados" },
    { id: "eff" as const, label: "Estado de Situación Financiera" },
    { id: "balance" as const, label: "Balance de Comprobación" },
    ...(validacion ? [{ id: "validacion" as const, label: "Validar contra iContador" }] : []),
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "rounded-t-md px-4 py-2 text-sm font-medium " +
              (tab === t.id
                ? "bg-white text-neutral-900 border border-b-0 border-neutral-200"
                : "text-neutral-500 hover:text-neutral-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={tab === "resultados" ? "block" : "hidden"}>{resultados}</div>
      <div className={tab === "eff" ? "block" : "hidden"}>{eff}</div>
      <div className={tab === "balance" ? "block" : "hidden"}>{balance}</div>
      {validacion && <div className={tab === "validacion" ? "block" : "hidden"}>{validacion}</div>}
    </div>
  );
}
