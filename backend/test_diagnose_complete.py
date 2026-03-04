import requests
import json

BASE_URL = "http://localhost:8000"

# Test cases using real complaints from your training data
test_cases = [
    {
        "name": "Drain issue with F21 error code",
        "complaint": "Water won't drain, clothes soaking wet",
        "error_code": "F21"
    },
    {
        "name": "Door won't close - no error code",
        "complaint": "Door keeps popping open during cycle",
        "error_code": None
    },
    {
        "name": "Excessive vibration",
        "complaint": "Loud banging noise when spinning, machine shaking violently",
        "error_code": None
    },
    {
        "name": "Won't start",
        "complaint": "Washer won't turn on, no lights, completely dead",
        "error_code": None
    },
    {
        "name": "Detergent residue",
        "complaint": "Clothes have white residue after wash, detergent not rinsing out",
        "error_code": None
    },
    {
        "name": "Samsung door lock error",
        "complaint": "Door won't unlock after cycle finished",
        "error_code": "dE"
    }
]


def test_health():
    """Test health endpoint first"""
    print("\n" + "="*80)
    print("TESTING /health ENDPOINT")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        data = response.json()
        
        if data.get("status") == "healthy":
            print("✅ Health check PASSED")
            print(f"   Database: {data.get('database')}")
            print(f"   Environment: {data.get('environment')}")
        else:
            print("❌ Health check FAILED")
            print(f"   Status: {data.get('status')}")
            print(f"   Error: {data.get('error')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("   Make sure server is running: uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    return True


def test_diagnose():
    """Test diagnose endpoint with multiple cases"""
    print("\n" + "="*80)
    print("TESTING /api/diagnose ENDPOINT")
    print("="*80)
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'─'*80}")
        print(f"Test {i}/{len(test_cases)}: {test['name']}")
        print(f"{'─'*80}")
        print(f"Complaint: \"{test['complaint']}\"")
        if test['error_code']:
            print(f"Error Code: {test['error_code']}")
        
        # Build request payload
        payload = {"complaint": test['complaint']}
        if test['error_code']:
            payload['error_code'] = test['error_code']
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/diagnose",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Print error code match if found
                if data.get('error_code_match'):
                    print(f"\n🔍 Error Code Match:")
                    ec = data['error_code_match']
                    print(f"   Code: {ec['code']}")
                    print(f"   Meaning: {ec['meaning']}")
                    print(f"   Severity: {ec['severity'].upper()}")
                
                # Print suggested issues
                issues = data.get('suggested_issues', [])
                if issues:
                    print(f"\n💡 Top {len(issues)} Suggested Issues:")
                    for idx, issue in enumerate(issues, 1):
                        print(f"\n   {idx}. {issue['issue_name']}")
                        print(f"      Category: {issue['category']}")
                        print(f"      Confidence: {issue['confidence']:.0%}")
                        print(f"      Severity: {issue['severity']} | DIY: {issue['diy_difficulty']}")
                        print(f"      Estimated Time: {issue['estimated_time']} minutes")
                        if issue.get('parts_needed'):
                            print(f"      Parts: {issue['parts_needed']}")
                else:
                    print("\n⚠️  No matching issues found")
                
                # Print recommendation
                rec = data.get('recommendation', 'unknown')
                if rec == "try_diy":
                    print(f"\n✅ Recommendation: TRY DIY FIRST")
                elif rec == "schedule_technician":
                    print(f"\n📞 Recommendation: SCHEDULE TECHNICIAN")
                else:
                    print(f"\n❓ Recommendation: {rec}")
                
                print("\n✅ Test PASSED")
                
            elif response.status_code == 422:
                print(f"\n❌ Validation Error (422)")
                print(f"   {response.json()}")
                
            else:
                print(f"\n❌ Error {response.status_code}")
                print(f"   {response.text}")
                
        except requests.exceptions.Timeout:
            print("\n❌ Request timeout - server took too long")
        except Exception as e:
            print(f"\n❌ Request failed: {e}")


def test_empty_complaint():
    """Test error handling with empty complaint"""
    print("\n" + "="*80)
    print("TESTING ERROR HANDLING")
    print("="*80)
    
    print("\nTest: Empty complaint (should fail validation)")
    try:
        response = requests.post(
            f"{BASE_URL}/api/diagnose",
            json={"complaint": ""},
            timeout=5
        )
        
        if response.status_code == 422:
            print("✅ Correctly rejected empty complaint")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    print("\n" + "🧪 "*20)
    print("FieldSync Pro - Diagnosis Endpoint Test Suite")
    print("🧪 "*20)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ Server not running. Exiting.")
        exit(1)
    
    # Test 2: Diagnose endpoint
    test_diagnose()
    
    # Test 3: Error handling
    test_empty_complaint()
    
    print("\n" + "="*80)
    print("✅ ALL TESTS COMPLETE")
    print("="*80)
    print("\nNext steps:")
    print("1. Check if confidence scores make sense")
    print("2. Verify recommendations are appropriate")
    print("3. Test with actual error codes from your database")
    print("\n")