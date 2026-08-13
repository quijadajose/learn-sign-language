import { Card, Badge } from "flowbite-react";
import { HiCheckCircle, HiTrash } from "react-icons/hi";
import { signRecordApi } from "../../services/api";
import { toast } from "./signStudioUtils";
import type { ConfirmConfig, StudioModel } from "./types";

export interface ModelsPanelProps {
  models: StudioModel[];
  onFetchModels: () => void;
  onSetConfirmConfig: (config: ConfirmConfig) => void;
  onSetShowConfirmModal: (show: boolean) => void;
  onOpenTester: (model: StudioModel) => void;
  onOpenLogs: (model: StudioModel) => void;
}

export function ModelsPanel({
  models,
  onFetchModels,
  onSetConfirmConfig,
  onSetShowConfirmModal,
  onOpenTester,
  onOpenLogs,
}: ModelsPanelProps) {
  return (
    <Card className="h-full shadow-sm">
      <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <HiCheckCircle className="size-5 text-gray-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
            Progreso de Modelos
          </h3>
        </div>
        <button
          className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
          onClick={onFetchModels}
        >
          Actualizar
        </button>
      </div>
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
        {models.length === 0 ? (
          <div className="py-4 text-center text-xs text-gray-400">No hay modelos recientes</div>
        ) : (
          (() => {
            const groups = new Map<
              string,
              { key: string; title: string; models: StudioModel[]; latestAt: number }
            >();

            for (const m of models) {
              const baseTitle = (m.name || "")
                .replace(/\s*\[(Estático|Dinámico)\]\s*$/i, "")
                .trim();
              const lessonKey =
                m.lessonId || m.lesson?.id || (baseTitle ? `name:${baseTitle}` : `solo:${m.id}`);
              const title = m.lesson?.name || baseTitle || "Modelo personalizado";
              const existing = groups.get(lessonKey);
              if (existing) {
                existing.models.push(m);
                existing.latestAt = Math.max(existing.latestAt, new Date(m.createdAt!).getTime());
              } else {
                groups.set(lessonKey, {
                  key: lessonKey,
                  title,
                  models: [m],
                  latestAt: new Date(m.createdAt!).getTime(),
                });
              }
            }

            const sortedGroups = Array.from(groups.values()).sort(
              (a, b) => b.latestAt - a.latestAt,
            );

            const typeOrder = (t?: string) => (t === "static" ? 0 : t === "dynamic" ? 1 : 2);

            const groupStatus = (groupModels: StudioModel[]) => {
              if (groupModels.some((m) => m.status === "TRAINING" || m.status === "PENDING"))
                return "TRAINING";
              if (groupModels.every((m) => m.status === "READY")) return "READY";
              if (groupModels.some((m) => m.status === "FAILED")) return "FAILED";
              return groupModels[0]?.status || "PENDING";
            };

            const openTester = (m: StudioModel) => {
              const warningList = m.trainingLogs?.warnings || m.warnings || [];
              if (warningList.length > 0) {
                onSetConfirmConfig({
                  title: "Modelo con advertencias",
                  message: `${warningList.length} advertencia(s):\n• ${warningList.slice(0, 3).join("\n• ")}${warningList.length > 3 ? "\n…" : ""}\n\n¿Probar de todos modos?`,
                  color: "warning",
                  confirmLabel: "Probar igual",
                  cancelLabel: "Ver logs",
                  onConfirm: () => {
                    onSetShowConfirmModal(false);
                    onOpenTester(m);
                  },
                  onCancel: () => {
                    onSetShowConfirmModal(false);
                    onOpenLogs(m);
                  },
                });
                onSetShowConfirmModal(true);
                return;
              }
              onOpenTester(m);
            };

            return sortedGroups.map((group) => {
              const status = groupStatus(group.models);
              const ordered = [...group.models].sort(
                (a, b) => typeOrder(a.modelType) - typeOrder(b.modelType),
              );

              return (
                <div
                  key={group.key}
                  className={`rounded-lg border p-3 text-xs transition-all ${
                    status === "READY"
                      ? "border-green-200 bg-green-50/40 dark:border-green-800 dark:bg-green-900/10"
                      : status === "TRAINING"
                        ? "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-900/10"
                        : "bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span
                        className="block truncate font-bold text-gray-800 dark:text-gray-200"
                        title={group.title}
                      >
                        {group.title}
                      </span>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge color="gray" className="px-1.5 py-0.5 text-[9px]">
                          {ordered.length} modelo{ordered.length === 1 ? "" : "s"}
                        </Badge>
                        <Badge
                          color={
                            status === "READY"
                              ? "success"
                              : status === "TRAINING"
                                ? "info"
                                : status === "FAILED"
                                  ? "failure"
                                  : "gray"
                          }
                          className="px-1.5 py-0.5 text-[9px]"
                        >
                          {status === "READY"
                            ? "✅ LISTO"
                            : status === "TRAINING"
                              ? "⏳ ENTRENANDO"
                              : status === "FAILED"
                                ? "❌ ERROR"
                                : status}
                        </Badge>
                        <span className="text-[9px] text-gray-400">
                          {new Date(group.latestAt).toLocaleString([], {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {ordered.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-md border border-gray-200/80 bg-white/80 p-2 dark:border-gray-700 dark:bg-gray-900/60"
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <Badge color="purple" className="px-1.5 py-0.5 text-[9px]">
                              {m.modelType === "static"
                                ? "MLP estático"
                                : m.modelType === "dynamic"
                                  ? "LSTM dinámico"
                                  : m.modelType || "Modelo"}
                            </Badge>
                            {m.featuresSchemaVersion && (
                              <Badge color="gray" className="px-1.5 py-0.5 text-[9px]">
                                {m.featuresSchemaVersion}
                              </Badge>
                            )}
                            <Badge
                              color={
                                m.status === "READY"
                                  ? "success"
                                  : m.status === "TRAINING"
                                    ? "info"
                                    : m.status === "FAILED"
                                      ? "failure"
                                      : "gray"
                              }
                              className="px-1.5 py-0.5 text-[9px]"
                              title={
                                m.status === "FAILED"
                                  ? m.trainingLogs?.error || "Error desconocido"
                                  : undefined
                              }
                            >
                              {m.status === "READY"
                                ? "Listo"
                                : m.status === "TRAINING"
                                  ? "Entrenando"
                                  : m.status === "FAILED"
                                    ? "Error"
                                    : m.status}
                            </Badge>
                            {m.status === "READY" && m.accuracy != null && (
                              <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                                Acc: {(m.accuracy * 100).toFixed(1)}%
                              </span>
                            )}
                            {m.status === "READY" &&
                              ((m.trainingLogs?.warnings?.length ?? 0) > 0 ||
                                (m.warnings?.length ?? 0) > 0) && (
                                <button
                                  type="button"
                                  className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200"
                                  title="Ver advertencias de entrenamiento"
                                  onClick={() => onOpenLogs(m)}
                                >
                                  ⚠ {(m.trainingLogs?.warnings || m.warnings || []).length}
                                </button>
                              )}
                          </div>
                          <button
                            className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                            title="Eliminar modelo"
                            onClick={() => {
                              onSetConfirmConfig({
                                title: "¿Eliminar Modelo?",
                                message: `¿Estás seguro de que deseas eliminar el modelo ${m.modelType === "static" ? "estático" : "dinámico"} de "${group.title}"? Esta acción no se puede deshacer.`,
                                color: "failure",
                                confirmLabel: "Eliminar",
                                cancelLabel: "Cancelar",
                                onConfirm: async () => {
                                  try {
                                    const res = await signRecordApi.deleteModel(m.id);
                                    if (res.success) {
                                      toast.success("Modelo eliminado");
                                      onFetchModels();
                                      onSetShowConfirmModal(false);
                                    } else {
                                      toast.error(res.message || "Error al eliminar modelo");
                                    }
                                  } catch {
                                    toast.error("Error al eliminar modelo");
                                  }
                                },
                              });
                              onSetShowConfirmModal(true);
                            }}
                          >
                            <HiTrash className="size-3.5" />
                          </button>
                        </div>

                        {m.status === "TRAINING" && (
                          <div className="mb-2">
                            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-1.5 rounded-full bg-blue-500 transition-[width] duration-500 ease-out"
                                style={{ width: `${m.progress || 0}%` }}
                              />
                            </div>
                            <div className="mt-1 flex justify-between text-[9px] font-medium text-gray-500">
                              <span>
                                {m.progress ? `${m.progress.toFixed(0)}%` : "Iniciando..."}
                              </span>
                              {m.accuracy != null && (
                                <span>Acc: {(m.accuracy * 100).toFixed(1)}%</span>
                              )}
                            </div>
                          </div>
                        )}

                        {m.status === "READY" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="min-h-10 flex-1 rounded bg-blue-600 px-2 py-2 text-xs font-bold uppercase text-white shadow-sm transition-colors hover:bg-blue-700"
                              onClick={() => openTester(m)}
                            >
                              Probar
                            </button>
                            {m.trainingLogs && (
                              <button
                                type="button"
                                className="min-h-10 rounded bg-gray-100 px-3 py-2 text-xs font-bold uppercase text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                onClick={() => onOpenLogs(m)}
                              >
                                Logs
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </Card>
  );
}
