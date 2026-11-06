export interface SignRecordNotificationPort {
  /** languageId null => solo admins reciben el evento (BE-16). */
  sendProgress(
    modelId: string,
    languageId: string | null,
    progress: number,
    accuracy?: number,
  ): void;
  sendModelReady(
    modelId: string,
    languageId: string | null,
    modelData: Record<string, unknown>,
  ): void;
  emitStatusChange(
    modelId: string,
    languageId: string | null,
    status: string,
  ): void;
}
