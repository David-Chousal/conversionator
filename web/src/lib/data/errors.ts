export type DataSourceErrorCode = "not_found" | "not_connected" | "already_connected" | "needs_reconnect" | "sync_in_progress" | "invalid_input";

/** An expected failure with a message that can be shown to the user as-is. */
export class DataSourceError extends Error {
  readonly code: DataSourceErrorCode;

  constructor(code: DataSourceErrorCode, message: string) {
    super(message);
    this.name = "DataSourceError";
    this.code = code;
  }
}
