const BACKEND_URL = 'http://192.168.1.11:8000';

export interface CommonIssue {
  issue_id: number;
  issue_name: string;
  category: string;
  confidence: number;
  severity: string;
  diy_difficulty: string;
  estimated_time: number;
  parts_needed?: string;
  tools_required?: string;
  symptoms?: string;
  possible_causes?: string;
  affected_parts_3d?: string;
}

export interface ErrorCodeInfo {
  code: string;
  meaning: string;
  severity: string;
  possible_causes?: string;
  general_action?: string;
}

export interface DiagnosisResult {
  issue: CommonIssue;
  confidence: number;
  errorCode?: ErrorCodeInfo;
}

export async function fetchDiagnosis(
  complaint: string,
  errorCode?: string
): Promise<DiagnosisResult[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint,
        error_code: errorCode ?? null,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    const issues = data.suggested_issues as CommonIssue[];
    const maxConf = issues[0]?.confidence ?? 1;

    return issues.map((issue) => ({
      issue,
      confidence: Math.round((issue.confidence / maxConf) * 87),
      errorCode: data.error_code_match ?? undefined,
    }));

  } catch (e) {
    console.error('Diagnosis API error:', e);
    return [];
  }
}