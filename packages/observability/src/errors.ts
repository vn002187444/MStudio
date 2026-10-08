export interface JobErrorEnvelope {
  code: string;
  message: string;
  jobId?: string;
  jobType?: string;
  attempt: number;
  maxAttempts: number;
  retryable: boolean;
  correlationId?: string;
  timestamp: string;
  cause?: unknown;
}

export interface JobErrorInput {
  code: string;
  message: string;
  jobId?: string;
  jobType?: string;
  attempt?: number;
  maxAttempts?: number;
  retryable?: boolean;
  correlationId?: string;
  cause?: unknown;
}

export function jobError(input: JobErrorInput): JobErrorEnvelope {
  return {
    code: input.code,
    message: input.message,
    jobId: input.jobId,
    jobType: input.jobType,
    attempt: input.attempt ?? 1,
    maxAttempts: input.maxAttempts ?? 1,
    retryable: input.retryable ?? false,
    correlationId: input.correlationId,
    timestamp: new Date().toISOString(),
    cause: input.cause,
  };
}

export function jobErrorResponse(
  envelope: JobErrorEnvelope,
  status = 500,
): Response {
  return Response.json({ error: envelope }, { status });
}
