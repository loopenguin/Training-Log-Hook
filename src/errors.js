export class PipelineStepError extends Error {
  constructor(step, message, cause) {
    super(message);
    this.name = "PipelineStepError";
    this.step = step;
    this.cause = cause;
  }
}

export function normalizeError(error) {
  if (error instanceof PipelineStepError) {
    return error;
  }

  const fallbackMessage = error instanceof Error ? error.message : String(error);
  return new PipelineStepError("UNKNOWN", fallbackMessage, error);
}
