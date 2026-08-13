import { Button, Label, TextInput } from "flowbite-react";
import { HiPencil, HiPlus, HiSearch, HiTrash } from "react-icons/hi";
import type { Sign } from "./types";

export interface SignChipsBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  signs: Sign[];
  selectedSignId: string;
  onSelectSign: (id: string) => void;
  selectedTrainingSignIds: string[];
  onToggleTrainingSign: (id: string) => void;
  onRenameSign: (id: string, name: string) => void;
  onDeleteSign: (id: string) => void;
  selectedLessonId: string;
  onAddSign: () => void;
}

export function SignChipsBar({
  searchTerm,
  onSearchTermChange,
  signs,
  selectedSignId,
  onSelectSign,
  selectedTrainingSignIds,
  onToggleTrainingSign,
  onRenameSign,
  onDeleteSign,
  selectedLessonId,
  onAddSign,
}: SignChipsBarProps) {
  const trainingSet = new Set(selectedTrainingSignIds);
  const selected = signs.find((s) => s.id === selectedSignId);
  const isSearchMiss = signs.length === 0 && searchTerm.trim().length > 0;
  const isEmptyCatalog =
    signs.length === 0 &&
    searchTerm.trim().length === 0 &&
    Boolean(selectedLessonId);

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/60">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="w-44 shrink-0 sm:w-52">
          <Label htmlFor="sign-chip-search" className="sr-only">
            Buscar seña
          </Label>
          <TextInput
            id="sign-chip-search"
            sizing="sm"
            icon={HiSearch}
            placeholder="Buscar…"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            aria-label="Buscar seña"
          />
        </div>
        <p className="min-w-0 flex-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {signs.length} seña{signs.length === 1 ? "" : "s"}
          </span>
          {signs.length > 0 && (
            <span className="ml-2">· Clic = grabar · casilla = entrenamiento</span>
          )}
          {selected && (
            <span className="ml-2 text-blue-600 dark:text-blue-300">
              · Seleccionada: {selected.name}
            </span>
          )}
        </p>
        {selected && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              title="Renombrar"
              aria-label={`Renombrar ${selected.name}`}
              onClick={() => onRenameSign(selected.id, selected.name)}
            >
              <HiPencil className="size-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
              title="Eliminar"
              aria-label={`Eliminar ${selected.name}`}
              onClick={() => onDeleteSign(selected.id)}
            >
              <HiTrash className="size-4" />
            </button>
          </div>
        )}
      </div>

      {signs.length === 0 ? (
        <div className="px-2 py-6 text-center">
          {isSearchMiss ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ninguna seña coincide con “{searchTerm.trim()}”.
            </p>
          ) : isEmptyCatalog ? (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Esta lección aún no tiene señas
              </p>
              <Button className="mt-3" size="sm" onClick={onAddSign}>
                <HiPlus className="mr-1 size-4" />
                Crear primera seña
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecciona una lección para ver o crear señas.
            </p>
          )}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {signs.map((sign) => {
            const isSelected = selectedSignId === sign.id;
            const inTraining = trainingSet.has(sign.id);
            const isDynamic =
              (sign.detectionType ?? "static") === "dynamic";
            return (
              <div
                key={sign.id}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400 dark:border-blue-400 dark:bg-blue-900/30 dark:ring-blue-500"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-900/40 dark:hover:border-gray-500"
                }`}
              >
                <input
                  type="checkbox"
                  className="size-3.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={inTraining}
                  title={`Incluir ${sign.name} en entrenamiento`}
                  aria-label={`Incluir ${sign.name} en entrenamiento`}
                  onChange={() => onToggleTrainingSign(sign.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => onSelectSign(sign.id)}
                  aria-pressed={isSelected}
                  aria-label={`Grabar seña ${sign.name}`}
                >
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {sign.name}
                    {isSelected && (
                      <span className="ml-1 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                        GRABAR
                      </span>
                    )}
                  </span>
                  <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                    {sign.recordingsCount || 0} muestras ·{" "}
                    {isDynamic ? "DIN" : "EST"}
                    {sign.isGlobal ? " · GLOBAL" : ""}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
