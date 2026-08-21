#!/usr/bin/env python3
"""
Backend API Test Suite for Onboarding, CRM Leads, and Account Plans
Tests the new backend endpoints on the FastAPI backend.
"""

import requests
import json
import random
import string
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://crm-research-flow.preview.emergentagent.com/api"

def random_email():
    """Generate a random test email"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"demoqa+{random_str}@example.com"

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def print_result(test_name, status, details=""):
    """Print test result"""
    symbol = "✅" if status == "PASS" else "❌"
    print(f"{symbol} {test_name}: {status}")
    if details:
        print(f"   {details}")

def test_onboarding_and_crm():
    """Test onboarding, CRM leads, and account plans endpoints"""
    
    print_section("ONBOARDING, CRM LEADS & ACCOUNT PLANS TEST")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.utcnow().isoformat()}Z\n")
    
    # Create a session to maintain cookies
    session = requests.Session()
    test_email = random_email()
    test_user = {
        "name": "Demo QA",
        "email": test_email,
        "password": "Test@12345"
    }
    
    # ========================================================================
    # TEST 1: Register a new test user and verify onboarded: false
    # ========================================================================
    print_section("TEST 1: User Registration with onboarded: false")
    print(f"Registering user: {test_user['name']} <{test_user['email']}>")
    
    try:
        register_response = session.post(
            f"{BASE_URL}/auth/register",
            json=test_user,
            timeout=30
        )
        
        print(f"Status Code: {register_response.status_code}")
        
        if register_response.status_code == 200:
            user_data = register_response.json()
            print(f"Response Body: {json.dumps(user_data, indent=2)}")
            
            # Check if onboarded field exists and is false
            if 'onboarded' in user_data:
                if user_data['onboarded'] == False:
                    print_result("User Registration", "PASS", f"User created with onboarded: false")
                else:
                    print_result("User Registration", "FAIL", f"Expected onboarded: false, got onboarded: {user_data['onboarded']}")
            else:
                print_result("User Registration", "FAIL", "onboarded field missing in response")
            
            # Check if cookies were set
            cookies = session.cookies.get_dict()
            print(f"\nCookies set: {list(cookies.keys())}")
            if 'access_token' in cookies or 'refresh_token' in cookies or 'session_token' in cookies:
                print_result("Auth Cookies", "PASS", "Authentication cookies set correctly")
            else:
                print_result("Auth Cookies", "WARN", "No auth cookies found")
        else:
            print(f"Response Body: {register_response.text}")
            print_result("User Registration", "FAIL", f"Expected 200, got {register_response.status_code}")
            return
            
    except Exception as e:
        print_result("User Registration", "FAIL", f"Exception: {str(e)}")
        return
    
    # ========================================================================
    # TEST 2: GET /api/crm/leads with authentication
    # ========================================================================
    print_section("TEST 2: GET /api/crm/leads (authenticated)")
    
    try:
        leads_response = session.get(f"{BASE_URL}/crm/leads", timeout=30)
        print(f"Status Code: {leads_response.status_code}")
        
        if leads_response.status_code == 200:
            leads_data = leads_response.json()
            print(f"Response Keys: {list(leads_data.keys())}")
            
            # Check if response has 'leads' and 'stats' keys
            checks = []
            
            if 'leads' in leads_data:
                leads = leads_data['leads']
                if isinstance(leads, list) and len(leads) == 20:
                    checks.append(("leads array", "PASS", f"Contains exactly 20 leads"))
                    
                    # Check first lead structure
                    if leads:
                        first_lead = leads[0]
                        required_fields = ['name', 'company', 'email', 'phone', 'source', 'status', 'value', 'date']
                        missing_fields = [f for f in required_fields if f not in first_lead]
                        
                        if not missing_fields:
                            checks.append(("lead structure", "PASS", f"All required fields present: {', '.join(required_fields)}"))
                            print(f"\nSample lead: {json.dumps(first_lead, indent=2)}")
                        else:
                            checks.append(("lead structure", "FAIL", f"Missing fields: {', '.join(missing_fields)}"))
                else:
                    checks.append(("leads array", "FAIL", f"Expected 20 leads, got {len(leads) if isinstance(leads, list) else 'not a list'}"))
            else:
                checks.append(("leads array", "FAIL", "Missing 'leads' key in response"))
            
            if 'stats' in leads_data:
                stats = leads_data['stats']
                required_stats = ['total', 'qualified', 'verified', 'pipeline']
                missing_stats = [s for s in required_stats if s not in stats]
                
                if not missing_stats:
                    checks.append(("stats object", "PASS", f"All required stats present"))
                    print(f"\nStats: {json.dumps(stats, indent=2)}")
                    
                    # Verify total is 20
                    if stats.get('total') == 20:
                        checks.append(("stats.total", "PASS", f"total = 20"))
                    else:
                        checks.append(("stats.total", "FAIL", f"Expected total = 20, got {stats.get('total')}"))
                    
                    # Verify qualified, verified, pipeline are integers
                    if isinstance(stats.get('qualified'), int):
                        checks.append(("stats.qualified", "PASS", f"qualified = {stats.get('qualified')}"))
                    else:
                        checks.append(("stats.qualified", "FAIL", f"Expected int, got {type(stats.get('qualified'))}"))
                    
                    if isinstance(stats.get('verified'), int):
                        checks.append(("stats.verified", "PASS", f"verified = {stats.get('verified')}"))
                    else:
                        checks.append(("stats.verified", "FAIL", f"Expected int, got {type(stats.get('verified'))}"))
                    
                    if isinstance(stats.get('pipeline'), (int, float)):
                        checks.append(("stats.pipeline", "PASS", f"pipeline = {stats.get('pipeline')}"))
                    else:
                        checks.append(("stats.pipeline", "FAIL", f"Expected int/float, got {type(stats.get('pipeline'))}"))
                else:
                    checks.append(("stats object", "FAIL", f"Missing stats: {', '.join(missing_stats)}"))
            else:
                checks.append(("stats object", "FAIL", "Missing 'stats' key in response"))
            
            print("\nValidation Results:")
            for check_name, status, detail in checks:
                print_result(check_name, status, detail)
            
            # Overall result
            all_passed = all(status == "PASS" for _, status, _ in checks)
            if all_passed:
                print_result("\nGET /api/crm/leads (authenticated)", "PASS", "All checks passed")
            else:
                print_result("\nGET /api/crm/leads (authenticated)", "FAIL", "Some checks failed")
        else:
            print(f"Response Body: {leads_response.text}")
            print_result("GET /api/crm/leads (authenticated)", "FAIL", f"Expected 200, got {leads_response.status_code}")
            
    except Exception as e:
        print_result("GET /api/crm/leads (authenticated)", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # TEST 3: GET /api/crm/leads without authentication (should return 401)
    # ========================================================================
    print_section("TEST 3: GET /api/crm/leads (unauthenticated)")
    
    unauth_session = requests.Session()
    
    try:
        unauth_leads = unauth_session.get(f"{BASE_URL}/crm/leads", timeout=30)
        print(f"Status Code: {unauth_leads.status_code}")
        
        if unauth_leads.status_code == 401:
            print_result("GET /api/crm/leads (unauthenticated)", "PASS", "Returns 401 as expected")
        else:
            print(f"Response Body: {unauth_leads.text}")
            print_result("GET /api/crm/leads (unauthenticated)", "FAIL", f"Expected 401, got {unauth_leads.status_code}")
            
    except Exception as e:
        print_result("GET /api/crm/leads (unauthenticated)", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # TEST 4: POST /api/account/onboard (authenticated)
    # ========================================================================
    print_section("TEST 4: POST /api/account/onboard (authenticated)")
    
    try:
        onboard_response = session.post(f"{BASE_URL}/account/onboard", timeout=30)
        print(f"Status Code: {onboard_response.status_code}")
        
        if onboard_response.status_code == 200:
            onboard_data = onboard_response.json()
            print(f"Response Body: {json.dumps(onboard_data, indent=2)}")
            
            if onboard_data.get('status') == 'ok':
                print_result("POST /api/account/onboard", "PASS", "Returns {status: ok}")
            else:
                print_result("POST /api/account/onboard", "FAIL", f"Expected {{status: ok}}, got {onboard_data}")
        else:
            print(f"Response Body: {onboard_response.text}")
            print_result("POST /api/account/onboard", "FAIL", f"Expected 200, got {onboard_response.status_code}")
            
    except Exception as e:
        print_result("POST /api/account/onboard", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # TEST 5: GET /api/auth/me to verify onboarded: true
    # ========================================================================
    print_section("TEST 5: GET /api/auth/me (verify onboarded: true)")
    
    try:
        me_response = session.get(f"{BASE_URL}/auth/me", timeout=30)
        print(f"Status Code: {me_response.status_code}")
        
        if me_response.status_code == 200:
            me_data = me_response.json()
            print(f"Response Body: {json.dumps(me_data, indent=2)}")
            
            if 'onboarded' in me_data:
                if me_data['onboarded'] == True:
                    print_result("GET /api/auth/me", "PASS", "User now has onboarded: true")
                else:
                    print_result("GET /api/auth/me", "FAIL", f"Expected onboarded: true, got onboarded: {me_data['onboarded']}")
            else:
                print_result("GET /api/auth/me", "FAIL", "onboarded field missing in response")
        else:
            print(f"Response Body: {me_response.text}")
            print_result("GET /api/auth/me", "FAIL", f"Expected 200, got {me_response.status_code}")
            
    except Exception as e:
        print_result("GET /api/auth/me", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # TEST 6: POST /api/account/onboard without authentication (should return 401)
    # ========================================================================
    print_section("TEST 6: POST /api/account/onboard (unauthenticated)")
    
    try:
        unauth_onboard = unauth_session.post(f"{BASE_URL}/account/onboard", timeout=30)
        print(f"Status Code: {unauth_onboard.status_code}")
        
        if unauth_onboard.status_code == 401:
            print_result("POST /api/account/onboard (unauthenticated)", "PASS", "Returns 401 as expected")
        else:
            print(f"Response Body: {unauth_onboard.text}")
            print_result("POST /api/account/onboard (unauthenticated)", "FAIL", f"Expected 401, got {unauth_onboard.status_code}")
            
    except Exception as e:
        print_result("POST /api/account/onboard (unauthenticated)", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # TEST 7: GET /api/account/plans (authenticated, should return empty array)
    # ========================================================================
    print_section("TEST 7: GET /api/account/plans (authenticated)")
    
    try:
        plans_response = session.get(f"{BASE_URL}/account/plans", timeout=30)
        print(f"Status Code: {plans_response.status_code}")
        
        if plans_response.status_code == 200:
            plans_data = plans_response.json()
            print(f"Response Body: {json.dumps(plans_data, indent=2)}")
            
            if 'plans' in plans_data:
                plans = plans_data['plans']
                if isinstance(plans, list):
                    if len(plans) == 0:
                        print_result("GET /api/account/plans", "PASS", "Returns {plans: []} (empty array for new user)")
                    else:
                        print_result("GET /api/account/plans", "WARN", f"Expected empty array, got {len(plans)} plans (user may have existing data)")
                else:
                    print_result("GET /api/account/plans", "FAIL", f"Expected plans to be an array, got {type(plans)}")
            else:
                print_result("GET /api/account/plans", "FAIL", "Missing 'plans' key in response")
        else:
            print(f"Response Body: {plans_response.text}")
            print_result("GET /api/account/plans", "FAIL", f"Expected 200, got {plans_response.status_code}")
            
    except Exception as e:
        print_result("GET /api/account/plans", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # TEST 8: GET /api/account/plans without authentication (should return 401)
    # ========================================================================
    print_section("TEST 8: GET /api/account/plans (unauthenticated)")
    
    try:
        unauth_plans = unauth_session.get(f"{BASE_URL}/account/plans", timeout=30)
        print(f"Status Code: {unauth_plans.status_code}")
        
        if unauth_plans.status_code == 401:
            print_result("GET /api/account/plans (unauthenticated)", "PASS", "Returns 401 as expected")
        else:
            print(f"Response Body: {unauth_plans.text}")
            print_result("GET /api/account/plans (unauthenticated)", "FAIL", f"Expected 401, got {unauth_plans.status_code}")
            
    except Exception as e:
        print_result("GET /api/account/plans (unauthenticated)", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print_section("TEST SUMMARY")
    print("Test execution completed. Review results above.")
    print(f"Test user email: {test_email}")
    print(f"Test completed at: {datetime.utcnow().isoformat()}Z")
    print("\nTested Endpoints:")
    print("  1. POST /api/auth/register - User registration with onboarded: false")
    print("  2. GET /api/crm/leads (authenticated) - 20 demo leads with stats")
    print("  3. GET /api/crm/leads (unauthenticated) - 401 response")
    print("  4. POST /api/account/onboard (authenticated) - Set onboarded to true")
    print("  5. GET /api/auth/me - Verify onboarded: true")
    print("  6. POST /api/account/onboard (unauthenticated) - 401 response")
    print("  7. GET /api/account/plans (authenticated) - Empty array for new user")
    print("  8. GET /api/account/plans (unauthenticated) - 401 response")
    print("="*80 + "\n")

if __name__ == "__main__":
    test_onboarding_and_crm()
