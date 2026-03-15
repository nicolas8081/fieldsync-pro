from typing import List, Dict, Optional, Tuple
from supabase import Client
import pickle
import os


# Load trained models at startup
MODEL_DIR = "models"
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer_latest.pkl")
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "naive_bayes_classifier_latest.pkl")

# Global model variables (loaded once)
vectorizer = None
classifier = None


def load_models():
    """Load trained AI models from disk"""
    global vectorizer, classifier
    
    if vectorizer is None or classifier is None:
        try:
            with open(VECTORIZER_PATH, 'rb') as f:
                vectorizer = pickle.load(f)
            with open(CLASSIFIER_PATH, 'rb') as f:
                classifier = pickle.load(f)
            print("✅ AI models loaded successfully")
        except FileNotFoundError:
            print("⚠️  AI models not found, falling back to keyword matching")
            vectorizer = None
            classifier = None
        except Exception as e:
            print(f"⚠️  Error loading AI models: {e}")
            vectorizer = None
            classifier = None


def preprocess_text(text: str) -> str:
    """Preprocess text for AI model (same as training)"""
    text = text.lower()
    text = ' '.join(text.split())
    return text


def ai_predict_issue(complaint: str, top_n: int = 3) -> List[Dict]:
    """
    Use AI model to predict issues
    
    Args:
        complaint: Customer complaint text
        top_n: Number of top predictions to return
        
    Returns:
        List of predictions with confidence scores
    """
    # Load models if not already loaded
    if vectorizer is None or classifier is None:
        load_models()
    
    # If models still not available, return empty
    if vectorizer is None or classifier is None:
        return []
    
    # Preprocess
    complaint_clean = preprocess_text(complaint)
    
    # Vectorize
    complaint_tfidf = vectorizer.transform([complaint_clean])
    
    # Predict probabilities
    probabilities = classifier.predict_proba(complaint_tfidf)[0]
    
    # Get top N predictions
    top_indices = probabilities.argsort()[-top_n:][::-1]
    
    predictions = []
    for idx in top_indices:
        issue_id = classifier.classes_[idx]
        confidence = probabilities[idx]
        
        predictions.append({
            "issue_id": int(issue_id),
            "confidence": round(float(confidence), 2)
        })
    
    return predictions


def calculate_keyword_score(complaint_text: str, keywords: str) -> float:
    """
    FALLBACK: Calculate similarity score based on keyword matching.
    Used if AI models are not available.
    
    Args:
        complaint_text: Customer's complaint text
        keywords: Pipe-separated keywords from common_issues table
        
    Returns:
        Score between 0.0 and 1.0
    """
    if not keywords:
        return 0.0
    
    complaint_lower = complaint_text.lower()
    complaint_words = set(complaint_lower.split())
    
    keyword_phrases = [k.strip() for k in keywords.split('|')]
    
    matches = 0
    total_keywords = len(keyword_phrases)
    
    for phrase in keyword_phrases:
        phrase_lower = phrase.lower()
        
        if phrase_lower in complaint_lower:
            matches += 2
        else:
            phrase_words = set(phrase_lower.split())
            overlap = len(complaint_words & phrase_words)
            if overlap > 0:
                matches += (overlap / len(phrase_words))
    
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
    Main diagnosis logic - uses AI model if available, falls back to keyword matching.
    
    Args:
        supabase: Supabase client for database queries
        complaint: Customer's complaint text
        error_code: Optional error code from washer display
        
    Returns:
        Tuple of (error_code_match, suggested_issues, recommendation)
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
            print(f"Error code lookup failed: {e}")
    
    # Step 2: Get all common issues from database
    try:
        issues_result = supabase.table("common_issues").select("*").execute()
        all_issues = issues_result.data
        
        # Create lookup dict for quick access
        issues_by_id = {issue["id"]: issue for issue in all_issues}
        
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")
    
    # Step 3: Try AI prediction first
    ai_predictions = ai_predict_issue(complaint, top_n=3)
    
    if ai_predictions:
        # Use AI predictions
        print("✅ Using AI model predictions")
        
        for prediction in ai_predictions:
            issue_id = prediction["issue_id"]
            confidence = prediction["confidence"]
            
            # Boost confidence if error code matches
            if error_code and issue_id in issues_by_id:
                issue = issues_by_id[issue_id]
                if issue.get("related_error_codes") and error_code.upper() in issue["related_error_codes"].upper():
                    confidence = min(confidence + 0.2, 1.0)
            
            # Get issue details
            if issue_id in issues_by_id:
                issue = issues_by_id[issue_id]
                suggested_issues.append({
                    "issue_id": issue["id"],
                    "issue_name": issue["issue_name"],
                    "category": issue.get("category", "Other"),
                    "confidence": confidence,
                    "severity": issue.get("severity", "medium"),
                    "diy_difficulty": issue.get("diy_difficulty", "moderate"),
                    "estimated_time": issue.get("estimated_time_minutes", 30),
                    "parts_needed": issue.get("parts_needed"),
                    "tools_required": issue.get("tools_required"),
                    "symptoms": issue.get("symptoms"),
                    "possible_causes": issue.get("possible_causes")
                })
    
    else:
        # Fallback to keyword matching
        print("⚠️  AI models not available, using keyword matching")
        
        scored_issues = []
        
        for issue in all_issues:
            keywords = issue.get("keywords", "")
            base_score = calculate_keyword_score(complaint, keywords)
            
            # Boost score if error code matches
            if error_code and issue.get("related_error_codes"):
                related_codes = issue["related_error_codes"]
                if error_code.upper() in related_codes.upper():
                    base_score = min(base_score + 0.3, 1.0)
            
            if base_score > 0:
                scored_issues.append({
                    "issue": issue,
                    "score": base_score
                })
        
        # Sort and get top 3
        scored_issues.sort(key=lambda x: x["score"], reverse=True)
        top_issues = scored_issues[:3]
        
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
    
    # Step 4: Determine recommendation
    if error_code_match and error_code_match["severity"] == "high":
        recommendation = "schedule_technician"
    elif len(suggested_issues) > 0:
        top_issue = suggested_issues[0]
        recommendation = get_recommendation(
            top_issue["severity"],
            top_issue["diy_difficulty"]
        )
    else:
        recommendation = "schedule_technician"
    
    return error_code_match, suggested_issues, recommendation


# Load models when module is imported
load_models()