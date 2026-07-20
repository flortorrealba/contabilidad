"use client";

import { useState, useTransition } from "react";
import { updateCuentaCategoriaAction } from "@/app/actions/cuentas";
import { CATEGORIAS_BALANCE, CATEGORIAS_RESULTADO, CATEGORIA_META, GRUPO_LABEL, GRUPOS } from "@/lib/clasificacion";

const GRUPOS_BALANCE = GRUPOS.filter((g) => g !== "RESULTADO");

export function CuentaCategoriaSelect({
  empresaId,
  cuentaId,
  categoria,
}: {
  empresaId: string;
  cuentaId: string;
  categoria: string;
}) {
  const [valor, setValor] = useState(categoria);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(nuevaCategoria: string) {
    const anterior = valor;
    setValor(nuevaCategoria);
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("empresaId", empresaId);
      formData.set("cuentaId", cuentaId);
      formData.set("categoria", nuevaCategoria);
      try {
        await updateCuentaCategoriaAction(formData);
      } catch (e) {
        setValor(anterior);
        setError(e instanceof Error ? e.message : "No se pudo guardar el cambio");
      }
    });
  }

  return (
    <div>
      <select
        name="categoria"
        value={valor}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none disabled:opacity-50"
      >
        <option value="SIN_CLASIFICAR">Sin clasificar</option>
        {GRUPOS_BALANCE.map((grupo) => {
          const categorias = CATEGORIAS_BALANCE.filter((c) => CATEGORIA_META[c].grupo === grupo);
          if (categorias.length === 0) return null;
          return (
            <optgroup key={grupo} label={GRUPO_LABEL[grupo]}>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_META[c].label}
                </option>
              ))}
            </optgroup>
          );
        })}
        <optgroup label={GRUPO_LABEL.RESULTADO}>
          {CATEGORIAS_RESULTADO.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_META[c].label}
            </option>
          ))}
        </optgroup>
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
