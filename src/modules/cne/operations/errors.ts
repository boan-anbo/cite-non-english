export class CneError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CneError";
  }
}

export function errorResult(error: unknown) {
  const known = error instanceof CneError;
  return {
    error: {
      code: known ? error.code : "INTERNAL_ERROR",
      message: known
        ? error.message
        : "CNE failed unexpectedly. Read affected items before retrying a write. Check Zotero's error log if the problem persists.",
      ...(known && error.details !== undefined
        ? { details: error.details }
        : {}),
    },
  };
}
