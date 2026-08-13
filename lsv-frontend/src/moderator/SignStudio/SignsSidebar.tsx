import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  TextInput,
  Badge,
  Checkbox,
  Label,
} from "flowbite-react";
import {
  HiPencil,
  HiTrash,
  HiSearch,
  HiOutlineCloudUpload,
  HiPlus,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";
import type { Sign, TrainingMode } from "./types";

export interface SignsSidebarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filteredAndSortedSigns: Sign[];
  selectedSignId: string;
  onSelectSign: (id: string) => void;
  selectedTrainingSignIds: string[];
  onSelectedTrainingSignIdsChange: React.Dispatch<React.SetStateAction<string[]>>;
  sortKey: "name" | "createdAt";
  sortDirection: "asc" | "desc";
  onToggleSort: (key: "name" | "createdAt") => void;
  onRenameSign: (id: string, name: string) => void;
  onDeleteSign: (id: string) => void;
  selectedLessonId: string;
  totalSigns: number;
  signsPerPage: number;
  isTraining: boolean;
  selectedStageId: string;
  selectedLanguageId: string;
  onTriggerTraining: (mode: TrainingMode) => void;
  onAddSign: () => void;
}

function sortAria(sortKey: "name" | "createdAt", key: "name" | "createdAt", direction: "asc" | "desc") {
  if (sortKey !== key) return "none" as const;
  return direction === "asc" ? ("ascending" as const) : ("descending" as const);
}

export function SignsSidebar({
  searchTerm,
  onSearchTermChange,
  filteredAndSortedSigns,
  selectedSignId,
  onSelectSign,
  selectedTrainingSignIds,
  onSelectedTrainingSignIdsChange,
  sortKey,
  sortDirection,
  onToggleSort,
  onRenameSign,
  onDeleteSign,
  selectedLessonId,
  totalSigns,
  signsPerPage,
  isTraining,
  selectedStageId,
  selectedLanguageId,
  onTriggerTraining,
  onAddSign,
}: SignsSidebarProps) {
  const [showMoreScopes, setShowMoreScopes] = useState(false);
  const selectedTrainingSignIdSet = useMemo(
    () => new Set(selectedTrainingSignIds),
    [selectedTrainingSignIds],
  );
  const hasSigns = filteredAndSortedSigns.length > 0;
  const isSearchMiss = hasSigns === false && searchTerm.trim().length > 0;
  const isEmptyCatalog =
    hasSigns === false && searchTerm.trim().length === 0 && Boolean(selectedLessonId);
  const primaryTrainMode: TrainingMode =
    selectedTrainingSignIds.length > 0 ? "selection" : "lesson";
  const primaryTrainLabel =
    selectedTrainingSignIds.length > 0
      ? `Entrenar selección (${selectedTrainingSignIds.length})`
      : "Entrenar lección";
  const primaryTrainDisabled =
    isTraining ||
    (primaryTrainMode === "selection"
      ? selectedTrainingSignIds.length === 0
      : !selectedLessonId);

  return (
    <Card className="flex h-[min(600px,70vh)] flex-col">
      <div className="mb-3">
        <Label htmlFor="sign-search" className="sr-only">
          Buscar seña
        </Label>
        <TextInput
          id="sign-search"
          icon={HiSearch}
          placeholder="Buscar seña..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          aria-label="Buscar seña"
        />
      </div>

      {hasSigns && (
        <p className="mb-2 px-1 text-xs text-gray-500 dark:text-gray-400">
          Clic en la fila para grabar · casilla para incluir en entrenamiento
        </p>
      )}

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="mb-2 flex justify-between px-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <span>Total: {filteredAndSortedSigns.length}</span>
          {hasSigns && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Globales arriba
            </span>
          )}
        </div>
        {hasSigns && (
          <div className="overflow-x-auto">
            <Table hoverable className="min-w-full">
              <TableHead>
                <TableRow>
                  <TableHeadCell className="w-10 p-4">
                    <Checkbox
                      aria-label="Incluir todas las señas en entrenamiento"
                      title="Incluir en entrenamiento"
                      checked={
                        selectedTrainingSignIds.length ===
                          filteredAndSortedSigns.length &&
                        filteredAndSortedSigns.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          onSelectedTrainingSignIdsChange(
                            filteredAndSortedSigns.map((s) => s.id),
                          );
                        else onSelectedTrainingSignIdsChange([]);
                      }}
                    />
                  </TableHeadCell>
                  <TableHeadCell
                    aria-sort={sortAria(sortKey, "name", sortDirection)}
                    className="py-3"
                  >
                    <button
                      type="button"
                      className="font-inherit cursor-pointer text-left transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => onToggleSort("name")}
                    >
                      Seña{" "}
                      {sortKey === "name" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell
                    aria-sort={sortAria(sortKey, "createdAt", sortDirection)}
                    className="py-3 text-right"
                  >
                    <button
                      type="button"
                      className="font-inherit cursor-pointer transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => onToggleSort("createdAt")}
                      aria-label="Ordenar por fecha"
                    >
                      {sortKey === "createdAt" &&
                        (sortDirection === "asc" ? "↑" : "↓")}{" "}
                      Fecha
                    </button>
                  </TableHeadCell>
                  <TableHeadCell className="w-10 px-2">
                    <span className="sr-only">Acciones</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {filteredAndSortedSigns.map((sign) => {
                  const isSelected = selectedSignId === sign.id;
                  return (
                    <TableRow
                      key={sign.id}
                      tabIndex={0}
                      role="button"
                      aria-selected={isSelected}
                      aria-label={`Grabar seña ${sign.name}`}
                      className={`
                        ${isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-400 dark:bg-blue-900/20 dark:ring-blue-500" : "bg-white dark:bg-gray-800"}
                        cursor-pointer transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:hover:bg-gray-700/50
                      `}
                      onClick={() => onSelectSign(sign.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectSign(sign.id);
                        }
                      }}
                    >
                      <TableCell
                        className="p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          aria-label={`Incluir ${sign.name} en entrenamiento`}
                          title="Incluir en entrenamiento"
                          checked={selectedTrainingSignIdSet.has(sign.id)}
                          onChange={() => {
                            onSelectedTrainingSignIdsChange((prev) => {
                              const next = new Set(prev);
                              if (next.has(sign.id)) {
                                next.delete(sign.id);
                              } else {
                                next.add(sign.id);
                              }
                              return [...next];
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                              {sign.name}
                            </span>
                            {isSelected && (
                              <Badge
                                color="info"
                                size="xs"
                                className="px-1.5 text-[10px]"
                              >
                                GRABANDO
                              </Badge>
                            )}
                            {sign.isGlobal && (
                              <Badge
                                color="warning"
                                size="xs"
                                className="px-1.5 text-[10px]"
                              >
                                GLOBAL
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {sign.recordingsCount || 0} muestras
                            </span>
                            <Badge
                              color={
                                (sign.detectionType ?? "static") === "dynamic"
                                  ? "purple"
                                  : "info"
                              }
                              size="xs"
                              className="px-1.5 text-[10px]"
                            >
                              {(sign.detectionType ?? "static") === "dynamic"
                                ? "DINÁMICA"
                                : "ESTÁTICA"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 text-right">
                        <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                          {sign.createdAt
                            ? new Date(sign.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                },
                              )
                            : "--/--"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="p-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
                            onClick={() => onRenameSign(sign.id, sign.name)}
                            title="Renombrar"
                            aria-label={`Renombrar ${sign.name}`}
                          >
                            <HiPencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                            onClick={() => onDeleteSign(sign.id)}
                            title="Eliminar"
                            aria-label={`Eliminar ${sign.name}`}
                          >
                            <HiTrash className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {!hasSigns && (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            {isSearchMiss ? (
              <>
                <HiSearch className="mb-2 size-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ninguna seña coincide con “{searchTerm.trim()}”.
                </p>
              </>
            ) : isEmptyCatalog ? (
              <>
                <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                  Esta lección aún no tiene señas
                </p>
                <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                  Crea la primera seña para empezar a grabar muestras.
                </p>
                <Button className="mt-4" onClick={onAddSign}>
                  <HiPlus className="mr-2 size-5" />
                  Crear primera seña
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecciona una lección para ver o crear señas.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {totalSigns > signsPerPage && (
        <div className="flex justify-center border-t border-gray-100 p-4 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Página 1 de 1
          </span>
        </div>
      )}

      <div
        className={`border-t border-gray-100 p-4 dark:border-gray-700 ${
          hasSigns
            ? "bg-gray-50/80 dark:bg-gray-900/40"
            : "bg-gray-50/40 opacity-70 dark:bg-gray-900/20"
        }`}
      >
        <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <HiOutlineCloudUpload className="size-4" /> Entrenamiento
        </h4>
        {!hasSigns ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Disponible cuando la lección tenga señas con muestras.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="mb-1 flex items-center justify-between px-1 text-xs font-medium">
              <span className="text-gray-500 dark:text-gray-400">
                En entrenamiento: {selectedTrainingSignIds.length}
              </span>
              {selectedTrainingSignIds.length > 0 && (
                <button
                  type="button"
                  className="text-red-500 hover:underline"
                  onClick={() => onSelectedTrainingSignIdsChange([])}
                >
                  Limpiar
                </button>
              )}
            </div>

            <Button
              size="sm"
              color="blue"
              onClick={() => onTriggerTraining(primaryTrainMode)}
              disabled={primaryTrainDisabled}
            >
              {primaryTrainLabel}
            </Button>

            <button
              type="button"
              className="flex items-center justify-center gap-1 pt-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowMoreScopes((v) => !v)}
              aria-expanded={showMoreScopes}
            >
              {showMoreScopes ? (
                <HiChevronUp className="size-3.5" />
              ) : (
                <HiChevronDown className="size-3.5" />
              )}
              Más alcances
            </button>

            {showMoreScopes && (
              <div className="grid grid-cols-1 gap-2 pt-1">
                <Button
                  size="xs"
                  color="gray"
                  onClick={() => onTriggerTraining("stage")}
                  disabled={isTraining || !selectedStageId}
                >
                  Toda la etapa
                </Button>
                <Button
                  size="xs"
                  color="gray"
                  onClick={() => onTriggerTraining("language")}
                  disabled={isTraining || !selectedLanguageId}
                >
                  Lenguaje / región
                </Button>
                {selectedTrainingSignIds.length > 0 && (
                  <Button
                    size="xs"
                    color="gray"
                    outline
                    onClick={() => onTriggerTraining("lesson")}
                    disabled={isTraining || !selectedLessonId}
                  >
                    Solo lección (ignorar casillas)
                  </Button>
                )}
              </div>
            )}

            {isTraining && (
              <div className="mt-2 text-center text-xs font-medium text-blue-500">
                Entrenamiento en cola…
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
