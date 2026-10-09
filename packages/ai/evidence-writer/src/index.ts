export {
  buildPrompt,
  isRetryable,
  parseEvidenceOutput,
  runEvidenceVerification,
  validateSourceRefs,
  WriterValidationError,
} from "./writer.ts";
export type { WriterDeps } from "./writer.ts";
export { DEFAULT_WRITER_OPTIONS } from "./types.ts";
export type {
  EvidenceVerificationOutput,
  StructuredClaim,
  StructuredFact,
  WriterOptions,
  WriterRequest,
} from "./types.ts";
