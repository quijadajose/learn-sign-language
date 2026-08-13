import { Badge } from "flowbite-react";
import { HiVideoCamera, HiTrash, HiSearch } from "react-icons/hi";
import { recordingHandFrameRatio } from "../../utils/signDetection";
import { ThumbnailCanvas } from "./LandmarkCanvases";
import type { SignRecording } from "./types";

interface RecordingHistoryGridProps {
  signRecordings: SignRecording[];
  onOpenPlayback: (rec: SignRecording) => void;
  onDeleteRecording: (id: string) => void;
}

export function RecordingHistoryGrid({
  signRecordings,
  onOpenPlayback,
  onDeleteRecording,
}: RecordingHistoryGridProps) {
  return (
              <div className="mt-12 border-t border-gray-100 pt-8 dark:border-gray-700">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
                  <HiSearch className="text-blue-500" />
                  Historial de Envíos ({signRecordings.length})
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {signRecordings.map((rec) => (
                    <div
                      key={rec.id}
                      className="group relative aspect-square overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-900 shadow-lg transition-[border-color,transform] hover:border-blue-500 dark:border-gray-800"
                    >
                      <button
                        type="button"
                        aria-label={`Reproducir grabación ${rec.id.substring(0, 4).toUpperCase()}`}
                        className="relative size-full cursor-pointer overflow-hidden text-left"
                        onClick={() => onOpenPlayback(rec)}
                      >
                        <div className="flex size-full items-center justify-center transition-transform group-hover:scale-110">
                          <ThumbnailCanvas landmarks={rec.landmarks} />
                        </div>

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-gray-300">
                              #{rec.id.substring(0, 4).toUpperCase()}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {new Date(rec.createdAt!).toLocaleDateString()}
                            </span>
                            <Badge
                              color={
                                recordingHandFrameRatio(rec.landmarks) > 0.5
                                  ? "success"
                                  : "failure"
                              }
                              size="xs"
                              className="mt-1 w-fit"
                            >
                              {recordingHandFrameRatio(rec.landmarks) > 0.5
                                ? "Manos OK"
                                : "Sin manos"}
                            </Badge>
                          </div>
                        </div>

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-blue-600/20 opacity-0 transition-opacity group-hover:opacity-100">
                          <HiVideoCamera className="size-8 text-white" />
                        </div>
                      </button>

                      <button
                        type="button"
                        aria-label="Eliminar grabación"
                        className="absolute right-2 top-2 z-10 rounded-lg bg-red-600/90 p-2 text-white opacity-100 transition-opacity hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        onClick={() => onDeleteRecording(rec.id)}
                        title="Eliminar grabación"
                      >
                        <HiTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
  );
}
