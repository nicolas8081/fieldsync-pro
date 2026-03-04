from fastapi import APIRouter, HTTPException
from supabase import Client
from app.models.diagnosis import (
    DiagnoseRequest,
    DiagnoseResponse,
    ErrorCodeMatch,
    SuggestedIssue
)
from app.services.diagnosis_service import diagnose_issue

# Create router
router = APIRouter()


@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(request: DiagnoseRequest):
    """
    Diagnose washing machine issues based on customer complaint.
    
    **Request:**
    ```json
    {
        "complaint": "Water won't drain, clothes soaking wet",
        "error_code": "F21"  // Optional
    }
    ```
    
    **Response:**
    ```json
    {
        "error_code_match": {
            "code": "F21",
            "meaning": "Drain pump unable to evacuate water",
            "severity": "high"
        },
        "suggested_issues": [
            {
                "issue_id": 70,
                "issue_name": "Washer won't drain at all",
                "confidence": 0.95,
                "severity": "high",
                "diy_difficulty": "moderate",
                "estimated_time": 40
            }
        ],
        "recommendation": "schedule_technician"
    }
    ```
    
    **Algorithm:**
    1. Look up error code if provided
    2. Match complaint text against common_issues keywords
    3. Return top 3 matches with confidence scores
    4. Recommend DIY or technician based on severity/difficulty
    """
    # Import supabase from main module
    from main import supabase
    
    try:
        # Call service layer to do actual diagnosis
        error_match, issues, recommendation = diagnose_issue(
            supabase=supabase,
            complaint=request.complaint,
            error_code=request.error_code
        )
        
        # Convert to response models
        error_code_match = None
        if error_match:
            error_code_match = ErrorCodeMatch(**error_match)
        
        suggested_issues = [SuggestedIssue(**issue) for issue in issues]
        
        return DiagnoseResponse(
            error_code_match=error_code_match,
            suggested_issues=suggested_issues,
            recommendation=recommendation
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Diagnosis failed: {str(e)}"
        )