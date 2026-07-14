"use client";

import { useRef, useTransition } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => updateCuentaCategoriaAction(formData))}
    >
      <input type="hidden" name="empresaId" value={empresaId} />
      <input type="hidden" name="cuentaId" value={cuentaId} />
      <select
        name="categoria"
        defaultValue={categoria}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
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
    </form>
  );
}
