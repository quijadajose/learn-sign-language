import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Select,
  Label,
  TextInput,
  Checkbox,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import type { SignDetectionType } from "../../utils/signDetection";
import {
  parseBulkSignLines,
  summarizeBulkDrafts,
  type BulkSignDraft,
} from "./signCatalogPresets";
import { toast } from "./signStudioUtils";

export type AddSignMode = "single" | "bulk";

export interface AddSignModalProps {
  show: boolean;
  onClose: () => void;
  newSignName: string;
  onNewSignNameChange: (name: string) => void;
  newSignDetectionType: SignDetectionType;
  onNewSignDetectionTypeChange: (type: SignDetectionType) => void;
  isNewSignGlobal: boolean;
  onIsNewSignGlobalChange: (value: boolean) => void;
  onAddSign: () => void;
  onAddSignsBulk: (drafts: BulkSignDraft[]) => void;
  isSubmitting?: boolean;
  hasLessonSelected: boolean;
}

function mergeDrafts(
  current: BulkSignDraft[],
  incoming: BulkSignDraft[],
): BulkSignDraft[] {
  const seen = new Set(current.map((d) => d.name.toLocaleLowerCase("es")));
  const next = [...current];
  for (const item of incoming) {
    const key = item.name.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

export function AddSignModal(props: AddSignModalProps) {
  const {
    show,
    onClose,
    newSignName,
    onNewSignNameChange,
    newSignDetectionType,
    onNewSignDetectionTypeChange,
    isNewSignGlobal,
    onIsNewSignGlobalChange,
    onAddSign,
    onAddSignsBulk,
    isSubmitting = false,
    hasLessonSelected,
  } = props;

  const [mode, setMode] = useState<AddSignMode>("single");
  const [bulkDrafts, setBulkDrafts] = useState<BulkSignDraft[]>([]);
  const [paintType, setPaintType] = useState<SignDetectionType>("dynamic");
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!show) {
      setMode("single");
      setBulkDrafts([]);
      setPaintType("dynamic");
      setDraftName("");
    }
  }, [show]);

  const bulkSummary = useMemo(
    () => summarizeBulkDrafts(bulkDrafts),
    [bulkDrafts],
  );

  const addDraftName = () => {
    const parsed = parseBulkSignLines(draftName, "static").map((d) => ({
      name: d.name,
      detectionType: "static" as const,
    }));
    if (parsed.length === 0) return;
    setBulkDrafts((prev) => mergeDrafts(prev, parsed));
    setDraftName("");
  };

  const paintDraft = (index: number) => {
    setBulkDrafts((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, detectionType: paintType } : item,
      ),
    );
  };

  const removeDraft = (index: number) => {
    setBulkDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal show={show} onClose={onClose} size="2xl">
      <ModalHeader>Agregar señas</ModalHeader>
      <ModalBody>
        <div className="mb-4 flex gap-2">
          <Button
            size="sm"
            color={mode === "single" ? "blue" : "gray"}
            onClick={() => setMode("single")}
          >
            Una
          </Button>
          <Button
            size="sm"
            color={mode === "bulk" ? "blue" : "gray"}
            onClick={() => setMode("bulk")}
          >
            Varias
          </Button>
        </div>

        {mode === "single" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="signName">
                Nombre de la seña (ej: Hola, Casa, A)
              </Label>
              <TextInput
                id="signName"
                placeholder="Nombre..."
                value={newSignName}
                onChange={(e) => onNewSignNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddSign()}
              />
            </div>
            <div>
              <Label htmlFor="detectionType">Tipo de detección</Label>
              <Select
                id="detectionType"
                value={newSignDetectionType}
                onChange={(e) =>
                  onNewSignDetectionTypeChange(
                    e.target.value as SignDetectionType,
                  )
                }
              >
                <option value="static">
                  Estática (letras, números — mantener pose)
                </option>
                <option value="dynamic">
                  Dinámica (palabras — capturar movimiento)
                </option>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <Checkbox
                id="isGlobal"
                checked={isNewSignGlobal}
                onChange={(e) => onIsNewSignGlobalChange(e.target.checked)}
              />
              <Label htmlFor="isGlobal" className="cursor-pointer">
                <span className="font-semibold">Seña Global (Capa Base)</span>
                <p className="text-xs font-normal text-gray-500">
                  Ruido de fondo o poses iniciales (ej: &quot;none&quot;). Siempre
                  visible.
                </p>
              </Label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <Label htmlFor="draftName" className="sr-only">
                  Agregar seña
                </Label>
                <TextInput
                  id="draftName"
                  placeholder="Hola, Casa Gracias… (espacio o coma)"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraftName();
                    }
                  }}
                />
              </div>
              <Button
                color="light"
                onClick={addDraftName}
                disabled={!draftName.trim()}
              >
                Agregar
              </Button>
            </div>

            {bulkDrafts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Al hacer clic en una seña, se marca como:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    color={paintType === "static" ? "blue" : "gray"}
                    onClick={() => setPaintType("static")}
                  >
                    Estática
                  </Button>
                  <Button
                    size="sm"
                    color={paintType === "dynamic" ? "purple" : "gray"}
                    onClick={() => setPaintType("dynamic")}
                  >
                    Dinámica
                  </Button>
                </div>
              </div>
            )}

            {bulkDrafts.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Escribe nombres separados por espacio o coma y pulsa Agregar.
                Luego marca Estática o Dinámica en cada botón.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 p-3 pt-4 dark:border-gray-700">
                <div className="flex flex-wrap gap-2.5">
                  {bulkDrafts.map((draft, index) => {
                    const isDynamic = draft.detectionType === "dynamic";
                    return (
                      <div
                        key={`${draft.name}-${index}`}
                        className="relative inline-flex"
                      >
                        <button
                          type="button"
                          onClick={() => paintDraft(index)}
                          title={`${draft.name}: ${isDynamic ? "dinámica" : "estática"}. Clic para marcar como ${paintType === "dynamic" ? "dinámica" : "estática"}.`}
                          aria-pressed={isDynamic}
                          className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            isDynamic
                              ? "bg-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-500"
                              : "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-500"
                          }`}
                        >
                          {draft.name}
                          <span className="ml-1.5 text-[10px] font-medium opacity-80">
                            {isDynamic ? "DIN" : "EST"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="absolute -right-1 -top-1 z-10 flex size-5 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-white shadow hover:bg-red-600"
                          title={`Quitar ${draft.name}`}
                          aria-label={`Quitar ${draft.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDraft(index);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {bulkSummary.total === 0
                ? "Sin señas todavía."
                : `${bulkSummary.total} botones · ${bulkSummary.staticCount} estáticas (azul) · ${bulkSummary.dynamicCount} dinámicas (morado).`}
            </p>
          </div>
        )}
      </ModalBody>
      <ModalFooter className="relative z-20 gap-2">
        {mode === "single" ? (
          <Button
            type="button"
            onClick={onAddSign}
            disabled={!newSignName || isSubmitting}
          >
            Crear Seña
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              if (bulkSummary.total === 0) {
                toast.error("Agrega al menos una seña a la lista");
                return;
              }
              if (!hasLessonSelected) {
                toast.error(
                  "Selecciona una lección en el filtro 3. Lección y vuelve a intentar",
                );
                return;
              }
              onAddSignsBulk(bulkDrafts);
            }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creando…"
              : `Crear catálogo (${bulkSummary.total})`}
          </Button>
        )}
        <Button
          type="button"
          color="gray"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
