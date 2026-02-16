from pydantic import BaseModel
from typing import Optional, List

class DiagnoseRequest(BaseModel):
    complaint: str
    error_code: Optional[str] = None

class ErrorCodeMatch(BaseModel):
    code: str
    meaning: str
    severity: str
    possible_causes: Optional[str] = None
    general_action: Optional[str] = None

class SuggestedIssue(BaseModel):
    issue_id: int
    issue_name: str
    category: str
    confidence: float
    severity: str
    diy_difficulty: str
    estimated_time: int
    parts_needed: Optional[str] = None
    tools_required: Optional[str] = None
    symptoms: Optional[str] = None
    possible_causes: Optional[str] = None

class DiagnoseResponse(BaseModel):
    error_code_match: Optional[ErrorCodeMatch] = None
    suggested_issues: List[SuggestedIssue]
    recommendation: str  # "try_diy" or "schedule_technician"