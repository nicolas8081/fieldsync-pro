from typing import List, Dict, Optional, Tuple
from supabase import Client


def calculate_keyword_score(complaint_text: str, keywords: str) -> float:
    """
    Calculate similarity score based on keyword matching.
    
    Args:
        complaint_text: Customer's complaint text
        keywords: Pipe-separated keywords from common_issues table
        
    Returns:
        Score between 0.0 and 1.0
        
    Algorithm:
        - Exact phrase match in complaint = 2 points
        - Word overlap = partial points (overlap / total words in phrase)
        - Normalized to 0-1 range
    """
    if not keywords:
        return 0.0
    
    # Normalize complaint text
    complaint_lower = complaint_text.lower()
    complaint_words = set(complaint_lower.split())
    
    # Extract keywords (pipe-separated)
    keyword_phrases = [k.strip() for k in keywords.split('|')]
    
    matches = 0
    total_keywords = len(keyword_phrases)
    
    for phrase in keyword_phrases:
        phrase_lower = phrase.lower()
        
        # Check if exact phrase exists in complaint
        if phrase_lower in complaint_lower:
            matches += 2  # Exact phrase match worth more
        else:
            # Check for word overlap
            phrase_words = set(phrase_lower.split())
            overlap = len(complaint_words & phrase_words)
            if overlap > 0:
                matches += (overlap / len(phrase_words))
    
    # Normalize score to 0-1 range
    if total_keywords == 0:
        return 0.0
    
    score = min(matches / (total_keywords * 2), 1.0)
    return round(score, 2)


def get_recommendation(severity: str, diy_difficulty: str) -> str:
    """
    Determine whether to recommend DIY or technician.
    
    Args:
        severity: "low", "medium", or "high"
        diy_difficulty: "easy", "moderate", "hard", or "professional_only"
        
    Returns:
        "try_diy" or "schedule_technician"
        
    Logic:
        - High severity → always technician
        - Professional only → always technician
        - Hard difficulty + medium severity → technician
        - Everything else → try DIY
    """
    if severity == "high":
        return "schedule_technician"
    
    if diy_difficulty == "professional_only":
        return "schedule_technician"
    
    if diy_difficulty == "hard" and severity == "medium":
        return "schedule_technician"
    
    return "try_diy"


def diagnose_issue(
    supabase: Client,
    complaint: str,
    error_code: Optional[str] = None
) -> Tuple[Optional[Dict], List[Dict], str]:
    """
    Main diagnosis logic - analyzes complaint and returns suggested issues.
    
    Args:
        supabase: Supabase client for database queries
        complaint: Customer's complaint text
        error_code: Optional error code from washer display
        
    Returns:
        Tuple of (error_code_match, suggested_issues, recommendation)
        
    Algorithm:
        1. Look up error code if provided
        2. Fetch all common_issues from database
        3. Score each issue using keyword matching
        4. Boost score by +0.3 if error code matches related_error_codes
        5. Return top 3 matches
        6. Determine recommendation based on top match
    """
    error_code_match = None
    suggested_issues = []
    
    # Step 1: Look up error code if provided
    if error_code:
        try:
            result = supabase.table("error_codes")\
                .select("*")\
                .eq("error_code", error_code.upper())\
                .execute()
            
            if result.data and len(result.data) > 0:
                error_data = result.data[0]
                error_code_match = {
                    "code": error_data["error_code"],
                    "meaning": error_data["meaning"],
                    "severity": error_data["severity"],
                    "possible_causes": error_data.get("possible_causes"),
                    "general_action": error_data.get("general_action")
                }
        except Exception as e:
            # Continue even if error code lookup fails
            print(f"Error code lookup failed: {e}")
    
    # Step 2: Get all common issues from database
    try:
        issues_result = supabase.table("common_issues").select("*").execute()
        all_issues = issues_result.data
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")
    
    # Step 3: Score each issue based on keyword matching
    scored_issues = []
    
    for issue in all_issues:
        keywords = issue.get("keywords", "")
        base_score = calculate_keyword_score(complaint, keywords)
        
        # Step 4: Boost score if error code matches related_error_codes
        if error_code and issue.get("related_error_codes"):
            related_codes = issue["related_error_codes"]
            if error_code.upper() in related_codes.upper():
                base_score = min(base_score + 0.3, 1.0)
        
        # Only include issues with score > 0
        if base_score > 0:
            scored_issues.append({
                "issue": issue,
                "score": base_score
            })
    
    # Step 5: Sort by score and get top 3
    scored_issues.sort(key=lambda x: x["score"], reverse=True)
    top_issues = scored_issues[:3]
    
    # Format suggested issues
    for item in top_issues:
        issue = item["issue"]
        suggested_issues.append({
            "issue_id": issue["id"],
            "issue_name": issue["issue_name"],
            "category": issue.get("category", "Other"),
            "confidence": item["score"],
            "severity": issue.get("severity", "medium"),
            "diy_difficulty": issue.get("diy_difficulty", "moderate"),
            "estimated_time": issue.get("estimated_time_minutes", 30),
            "parts_needed": issue.get("parts_needed"),
            "tools_required": issue.get("tools_required"),
            "symptoms": issue.get("symptoms"),
            "possible_causes": issue.get("possible_causes")
        })
    
    # Step 6: Determine recommendation
    if error_code_match and error_code_match["severity"] == "high":
        recommendation = "schedule_technician"
    elif len(suggested_issues) > 0:
        top_issue = suggested_issues[0]
        recommendation = get_recommendation(
            top_issue["severity"],
            top_issue["diy_difficulty"]
        )
    else:
        # No matches found - recommend technician
        recommendation = "schedule_technician"
    
    return error_code_match, suggested_issues, recommendation