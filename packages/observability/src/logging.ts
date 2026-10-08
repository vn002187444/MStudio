export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
  environment: string;
  logLevel?: LogLevel;
  correlationId?: string;
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

export function createLogger(options: LoggerOptions): Logger {
  const threshold = LOG_LEVELS.indexOf(options.logLevel ?? "info");
  const base: Record<string, unknown> = {
    environment: options.environment,
    correlationId: options.correlationId,
  };

  function emit(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (LOG_LEVELS.indexOf(level) < threshold) return;
    console.log(JSON.stringify({ level, message, ...base, ...data }));
  }

  return {
    debug: (message, data) => emit("debug", message, data),
    info: (message, data) => emit("info", message, data),
    warn: (message, data) => emit("warn", message, data),
    error: (message, data) => emit("error", message, data),
  };
}
