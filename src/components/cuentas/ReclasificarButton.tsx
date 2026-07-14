"use client";

import { useActionState } from "react";
import { reclasificarAutomaticamenteAction } from "@/app/actions/cuentas";

interface Resultado {
  actualizadas: number;
  revisadas: number;
}

const initialState: Resultado | null = null;

export function ReclasificarButton({ empresaId }: { empresaId: string }) {
  const [state, formAction, pending] = useActionState<Resultado | null, FormData>(
    async (_prevState, formData) => reclasificarAutomaticamenteAction(formData),
    initialState
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="empresaId" value={empresaId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
      >
        {pending ? "Reclasificando…" : "Reclasificar cuentas automáticamente"}
      </button>
      {state && (
        <p className="text-xs text-neutral-600">
          {state.actualizadas > 0
            ? `Se reclasificaron ${state.actualizadas} de ${state.revisadas} cuenta(s) sin clasificar.`
            : `No había cuentas nuevas para reclasificar (${state.revisadas} revisadas).`}
        </p>
      )}
    </form>
  );
}
