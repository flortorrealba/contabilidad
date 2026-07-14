"use client";

import { useActionState } from "react";
import { addMemberAction } from "@/app/actions/empresas";
import type { ActionState } from "@/app/actions/auth";

const initialState: ActionState = {};

export function AddMemberForm({ empresaId }: { empresaId: string }) {
  const action = addMemberAction.bind(null, empresaId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Correo del usuario a invitar
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-72 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
