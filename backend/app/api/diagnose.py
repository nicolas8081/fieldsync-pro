from fastapi import APIRouter
from app.models.diagnosis import (
    DiagnoseRequest,
    DiagnoseResponse,
    ErrorCodeMatch,
    SuggestedIssue
)
from app.services.diagnosis_service import diagnose_issue

router = APIRouter()

@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(request: DiagnoseRequest):
    from main import supabase
    
    error_match, issues, recommendation = diagnose_issue(
        supabase=supabase,
        complaint=request.complaint,
        error_code=request.error_code
    )
    
    error_code_match = None
    if error_match:
        error_code_match = ErrorCodeMatch(**error_match)
    
    suggested_issues = [SuggestedIssue(**issue) for issue in issues]
    
    return DiagnoseResponse(
        error_code_match=error_code_match,
        suggested_issues=suggested_issues,
        recommendation=recommendation
    )