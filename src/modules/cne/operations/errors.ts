export class CneError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
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
      message: known ? error.message : "The CNE operation failed.",
      ...(known && error.details !== undefined
        ? { details: error.details }
        : {}),
    },
  };
}
