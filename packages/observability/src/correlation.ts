export const CORRELATION_HEADER = "x-mstudio-correlation-id";

export function getCorrelationId(request: Request): string {
  const existing = request.headers.get(CORRELATION_HEADER);
  return existing ?? crypto.randomUUID();
}

export function withCorrelationId(request: Request): {
  request: Request;
  correlationId: string;
} {
  const correlationId = getCorrelationId(request);
  const headers = new Headers(request.headers);
  headers.set(CORRELATION_HEADER, correlationId);
  return { request: new Request(request, { headers }), correlationId };
}
