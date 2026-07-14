"use client";

import { useState } from "react";

export function ReportTabs({
  balance,
  resultados,
}: {
  balance: React.ReactNode;
  resultados: React.ReactNode;
}) {
  const [tab, setTab] = useState<"resultados" | "balance">("resultados");

  return (
    <div>
      <div className="flex gap-1 border-b border-neutral-200">
        <button
          onClick={() => setTab("resultados")}
          className={
            "rounded-t-md px-4 py-2 text-sm font-medium " +
            (tab === "resultados" ? "bg-white text-neutral-900 border border-b-0 border-neutral-200" : "text-neutral-500 hover:text-neutral-900")
          }
        >
          Estado de Resultados
        </button>
        <button
          onClick={() => setTab("balance")}
          className={
            "rounded-t-md px-4 py-2 text-sm font-medium " +
            (tab === "balance" ? "bg-white text-neutral-900 border border-b-0 border-neutral-200" : "text-neutral-500 hover:text-neutral-900")
          }
        >
          Balance de Comprobación
        </button>
      </div>
      <div className={tab === "resultados" ? "block" : "hidden"}>{resultados}</div>
      <div className={tab === "balance" ? "block" : "hidden"}>{balance}</div>
    </div>
  );
}
