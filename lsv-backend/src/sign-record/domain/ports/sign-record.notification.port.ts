export interface SignRecordNotificationPort {
  sendProgress(modelId: string, progress: number, accuracy?: number): void;
  sendModelReady(modelId: string, modelData: any): void;
  emitStatusChange(modelId: string, status: string): void;
}
