"use client";

import { useActionState } from "react";
import { updateEmpresaAction } from "@/app/actions/empresas";
import type { ActionState } from "@/app/actions/auth";

const initialState: ActionState = {};

export function EditEmpresaForm({
  empresaId,
  nombre,
  rut,
}: {
  empresaId: string;
  nombre: string;
  rut: string | null;
}) {
  const action = updateEmpresaAction.bind(null, empresaId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700">
          Nombre de la empresa
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={nombre}
          className="mt-1 w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="rut" className="block text-sm font-medium text-neutral-700">
          RUT (opcional)
        </label>
        <input
          id="rut"
          name="rut"
          type="text"
          defaultValue={rut ?? ""}
          className="mt-1 w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
