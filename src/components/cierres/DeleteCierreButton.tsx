"use client";

import { deleteCierreAction } from "@/app/actions/cierres";

export function DeleteCierreButton({ empresaId, cierreId }: { empresaId: string; cierreId: string }) {
  return (
    <form
      action={deleteCierreAction}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar este cierre y todos sus asientos? Esta acción no se puede deshacer.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="empresaId" value={empresaId} />
      <input type="hidden" name="cierreId" value={cierreId} />
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Eliminar cierre
      </button>
    </form>
  );
}
