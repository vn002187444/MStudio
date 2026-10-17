export interface EmailRecord {
  id: string;
  direction: "inbound" | "outbound";
  senderName?: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  preview?: string;
  category: string;
  status: string;
  starred: number;
  createdAt: string;
}

export interface RedirectRecord {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  hits: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettingRecord {
  key: string;
  value: string;
  updatedAt: string;
}

export interface GscOverviewResponse {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: { keys: string[]; clicks: number; impressions: number }[];
  fallback: boolean;
  cachedAt?: string;
  isCached?: boolean;
  quotaLocked?: boolean;
}

export interface GscHealthStatus {
  status: "connected" | "warning" | "error" | "missing";
  clientEmail?: string;
  projectId?: string;
  lastCheckedAt: string;
  indexingQuotaUsedToday: number;
  indexingQuotaLimit: number;
  analyticsStatus: "active" | "cached" | "circuit_broken" | "error";
  errorMessage?: string;
}
