import {
  Button, Card, Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from "flowbite-react";
import type { StudioModel } from "./types";

export interface TrainingLogsModalProps {
  show: boolean;
  onClose: () => void;
  selectedLogsModel: StudioModel | null;
}

export function TrainingLogsModal({ show, onClose, selectedLogsModel }: TrainingLogsModalProps) {
  return (
<Modal show={show} onClose={onClose} size="lg">
        <ModalHeader>
          Métricas de Entrenamiento:{" "}
          <span className="text-blue-500">{selectedLogsModel?.name}</span>
        </ModalHeader>
        <ModalBody>
          {selectedLogsModel?.trainingLogs ? (
            (() => {
              const logs = selectedLogsModel.trainingLogs;
              const lastAcc = logs.categorical_accuracy?.slice(-1)[0] ?? 0;
              const lastValAcc = logs.val_categorical_accuracy?.slice(-1)[0] ?? 0;
              const lastLoss = logs.loss?.slice(-1)[0];
              const lastValLoss = logs.val_loss?.slice(-1)[0];
              const epochCount = logs.loss?.length ?? 0;

              return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 p-2 text-center dark:bg-green-900/10">
                  <p className="text-[10px] font-bold uppercase text-gray-500">
                    Categorical Accuracy
                  </p>
                  <h3 className="text-2xl font-black text-green-600">
                    {(lastAcc * 100).toFixed(1)}%
                  </h3>
                </Card>
                <Card className="bg-blue-50 p-2 text-center dark:bg-blue-900/10">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Val Accuracy</p>
                  <h3 className="text-2xl font-black text-blue-600">
                    {(lastValAcc * 100).toFixed(1)}%
                  </h3>
                </Card>
              </div>

              {!!logs.warnings?.length && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
                  <p className="mb-1 font-bold uppercase tracking-wide">Advertencias</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs">
                    {logs.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {logs.classMetrics && (
                <div className="overflow-x-auto rounded-lg border">
                  <Table striped>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell className="text-[10px]">Clase</TableHeadCell>
                        <TableHeadCell className="text-[10px]">Precision</TableHeadCell>
                        <TableHeadCell className="text-[10px]">Recall</TableHeadCell>
                        <TableHeadCell className="text-[10px]">Support</TableHeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="divide-y text-xs">
                      {Object.entries(logs.classMetrics).map(([label, metrics]) => (
                        <TableRow key={label}>
                          <TableCell className="font-bold">{label}</TableCell>
                          <TableCell>{(metrics.precision * 100).toFixed(0)}%</TableCell>
                          <TableCell
                            className={metrics.recall <= 0 ? "font-bold text-red-600" : undefined}
                          >
                            {(metrics.recall * 100).toFixed(0)}%
                          </TableCell>
                          <TableCell>{metrics.support}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                <Table striped>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell className="text-[10px]">Métrica</TableHeadCell>
                      <TableHeadCell className="text-[10px]">Entrenamiento</TableHeadCell>
                      <TableHeadCell className="text-[10px]">Validación</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y text-xs">
                    <TableRow>
                      <TableCell className="font-bold">Loss (Pérdida)</TableCell>
                      <TableCell>
                        {lastLoss != null ? lastLoss.toFixed(4) : "—"}
                      </TableCell>
                      <TableCell>
                        {lastValLoss != null ? lastValLoss.toFixed(4) : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Accuracy</TableCell>
                      <TableCell>{(lastAcc * 100).toFixed(1)}%</TableCell>
                      <TableCell>{(lastValAcc * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-4 font-mono text-[10px] dark:bg-gray-800">
                <p className="mb-2 font-bold">
                  Resumen de Épocas (Total: {epochCount})
                </p>
                {logs.categorical_accuracy?.flatMap((acc, epochIndex) => {
                  const epoch = epochIndex + 1;
                  if ((epoch - 1) % 10 !== 0 && epoch !== epochCount) {
                    return [];
                  }
                  const valAcc = logs.val_categorical_accuracy?.[epochIndex] ?? 0;
                  return [
                    <div
                      key={`epoch-${epoch}-acc-${acc}-val-${valAcc}`}
                      className="flex justify-between border-b py-1 dark:border-gray-700"
                    >
                      <span>Epoch {epoch}</span>
                      <span className="text-green-500">
                        Acc: {(acc * 100).toFixed(1)}%
                      </span>
                      <span className="text-blue-500">
                        Val: {(valAcc * 100).toFixed(1)}%
                      </span>
                    </div>,
                  ];
                })}
              </div>
            </div>
              );
            })()
          ) : (
            <p className="py-10 text-center italic text-gray-500">
              No hay logs disponibles para este modelo.
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>
  );
}
