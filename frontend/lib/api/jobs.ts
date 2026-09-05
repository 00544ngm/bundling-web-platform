import { apiFetch } from "./client";
import type {
  JobSummary,
  JobDetail,
  JobListResponse,
  HypothesisJobCreate,
  JudgmentJobCreate,
  BatchJobCreate,
  JobAttempt,
} from "./types";

export async function submitHypothesis(payload: HypothesisJobCreate): Promise<JobSummary> {
  return apiFetch<JobSummary>("/jobs/hypothesis", {
    method: "POST",
    body: payload,
  });
}

export async function submitJudgment(payload: JudgmentJobCreate): Promise<JobSummary> {
  return apiFetch<JobSummary>("/jobs/judgment", {
    method: "POST",
    body: payload,
  });
}

export async function submitBatch(payload: BatchJobCreate): Promise<JobSummary> {
  return apiFetch<JobSummary>("/jobs/batch", {
    method: "POST",
    body: payload,
  });
}

export async function listJobs(params?: {
  page?: number;
  page_size?: number;
  mode?: string;
  status?: string;
}): Promise<JobListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.page_size) searchParams.set("page_size", String(params.page_size));
  if (params?.mode) searchParams.set("mode", params.mode);
  if (params?.status) searchParams.set("status", params.status);
  const qs = searchParams.toString();
  return apiFetch<JobListResponse>(`/jobs${qs ? `?${qs}` : ""}`);
}

export async function getJob(jobId: string): Promise<JobDetail> {
  return apiFetch<JobDetail>(`/jobs/${jobId}`);
}

export async function listJobAttempts(jobId: string): Promise<JobAttempt[]> {
  return apiFetch<JobAttempt[]>(`/jobs/${jobId}/attempts`);
}

export async function retryJob(jobId: string): Promise<JobSummary> {
  return apiFetch<JobSummary>(`/jobs/${jobId}/retry`, { method: "POST" });
}

export async function renameJob(jobId: string, name: string | null): Promise<JobSummary> {
  return apiFetch<JobSummary>(`/jobs/${jobId}/name`, {
    method: "PATCH",
    body: { name },
  });
}

export async function getJobResult(jobId: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/jobs/${jobId}/result`);
}

export async function downloadArtifact(jobId: string, kind: "json" | "excel"): Promise<Blob> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"}/api/v1/jobs/${jobId}/artifacts/${kind}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${kind} artifact`);
  return response.blob();
}
