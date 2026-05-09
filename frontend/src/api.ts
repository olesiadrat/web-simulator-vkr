import type { ApiBugReport, Scenario, TrainerSession } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getScenarios() {
  return request<Scenario[]>("/scenarios/");
}

export function createSession(scenarioId: number) {
  return request<TrainerSession>("/sessions/", {
    method: "POST",
    body: JSON.stringify({ scenario: scenarioId }),
  });
}

export function finishSession(sessionId: number) {
  return request<TrainerSession>(`/sessions/${sessionId}/finish/`, {
    method: "PATCH",
  });
}

export function getBugReports(sessionId: number) {
  return request<ApiBugReport[]>(`/bugs/?session_id=${sessionId}`);
}

export type CreateBugReportPayload = {
  session: number;
  description: string;
  reproduction_steps: string[];
  expected: string;
  actual: string;
  ui_element: string;
};

export function createBugReport(payload: CreateBugReportPayload) {
  return request<ApiBugReport>("/bugs/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type UpdateBugReportPayload = {
  description: string;
  reproduction_steps: string[];
  expected: string;
  actual: string;
  ui_element: string;
};

export function updateBugReport(bugId: number, payload: UpdateBugReportPayload) {
  return request<ApiBugReport>(`/bugs/${bugId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function checkBugReport(bugId: number) {
  return request<ApiBugReport>(`/bugs/${bugId}/check/`, {
    method: "POST",
  });
}
