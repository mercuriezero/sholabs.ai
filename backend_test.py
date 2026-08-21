#!/usr/bin/env python3
"""
Backend API Test Suite for USD Payment Order Creation
Tests the Razorpay USD payment flow on the FastAPI backend.
"""

import requests
import json
import random
import string
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://sholabs-ai.preview.emergentagent.com/api"

def random_email():
    """Generate a random test email"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"paytest+{random_str}@example.com"

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

def test_auth_and_payments():
    """Test authentication and USD payment order creation"""
    
    print_section("USD PAYMENT ORDER CREATION TEST")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.utcnow().isoformat()}Z\n")
    
    # Create a session to maintain cookies
    session = requests.Session()
    test_email = random_email()
    test_user = {
        "name": "Pay Tester",
        "email": test_email,
        "password": "Test@12345"
    }
    
    # ========================================================================
    # TEST 1: Register a new test user
    # ========================================================================
    print_section("TEST 1: User Registration")
    print(f"Registering user: {test_user['name']} <{test_user['email']}>")
    
    try:
        register_response = session.post(
            f"{BASE_URL}/auth/register",
            json=test_user,
            timeout=30
        )
        
        print(f"Status Code: {register_response.status_code}")
        print(f"Response Headers: {dict(register_response.headers)}")
        
        if register_response.status_code == 200:
            user_data = register_response.json()
            print(f"Response Body: {json.dumps(user_data, indent=2)}")
            print_result("User Registration", "PASS", f"User ID: {user_data.get('user_id')}")
            
            # Check if cookies were set
            cookies = session.cookies.get_dict()
            print(f"\nCookies set: {list(cookies.keys())}")
            if 'access_token' in cookies or 'refresh_token' in cookies:
                print_result("Auth Cookies", "PASS", "access_token and/or refresh_token set")
            else:
                print_result("Auth Cookies", "WARN", "No JWT cookies found, but registration succeeded")
        else:
            print(f"Response Body: {register_response.text}")
            print_result("User Registration", "FAIL", f"Expected 200, got {register_response.status_code}")
            return
            
    except Exception as e:
        print_result("User Registration", "FAIL", f"Exception: {str(e)}")
        return
    
    # ========================================================================
    # TEST 2: Verify authentication with GET /api/auth/me
    # ========================================================================
    print_section("TEST 2: Authentication Verification (GET /api/auth/me)")
    
    try:
        me_response = session.get(f"{BASE_URL}/auth/me", timeout=30)
        print(f"Status Code: {me_response.status_code}")
        
        if me_response.status_code == 200:
            me_data = me_response.json()
            print(f"Response Body: {json.dumps(me_data, indent=2)}")
            
            if me_data.get('email') == test_email:
                print_result("Auth Verification", "PASS", f"Authenticated as {me_data.get('email')}")
            else:
                print_result("Auth Verification", "FAIL", f"Email mismatch: expected {test_email}, got {me_data.get('email')}")
        else:
            print(f"Response Body: {me_response.text}")
            print_result("Auth Verification", "FAIL", f"Expected 200, got {me_response.status_code}")
            return
            
    except Exception as e:
        print_result("Auth Verification", "FAIL", f"Exception: {str(e)}")
        return
    
    # ========================================================================
    # TEST 3: Create payment order with amount_usd=120
    # ========================================================================
    print_section("TEST 3: Create Payment Order (120 USD)")
    
    order_payload_1 = {
        "amount_usd": 120,
        "package_name": "Trial Pack · 4 hours"
    }
    
    print(f"Request Payload: {json.dumps(order_payload_1, indent=2)}")
    
    try:
        order_response_1 = session.post(
            f"{BASE_URL}/payments/create-order",
            json=order_payload_1,
            timeout=30
        )
        
        print(f"Status Code: {order_response_1.status_code}")
        print(f"Response Body: {order_response_1.text}")
        
        if order_response_1.status_code == 200:
            order_data = order_response_1.json()
            print(f"\nParsed Response: {json.dumps(order_data, indent=2)}")
            
            # Verify response structure
            checks = []
            
            # Check order_id
            order_id = order_data.get('order_id', '')
            if order_id and order_id.startswith('order_'):
                checks.append(("order_id format", "PASS", f"'{order_id}'"))
            else:
                checks.append(("order_id format", "FAIL", f"Expected 'order_*', got '{order_id}'"))
            
            # Check amount (should be 12000 cents)
            amount = order_data.get('amount')
            if amount == 12000:
                checks.append(("amount", "PASS", f"{amount} cents (120 USD)"))
            else:
                checks.append(("amount", "FAIL", f"Expected 12000, got {amount}"))
            
            # Check currency
            currency = order_data.get('currency')
            if currency == 'USD':
                checks.append(("currency", "PASS", f"'{currency}'"))
            else:
                checks.append(("currency", "FAIL", f"Expected 'USD', got '{currency}'"))
            
            # Check key_id
            key_id = order_data.get('key_id', '')
            if key_id:
                checks.append(("key_id", "PASS", f"Present (length: {len(key_id)})"))
            else:
                checks.append(("key_id", "FAIL", "Missing or empty"))
            
            print("\nValidation Results:")
            for check_name, status, detail in checks:
                print_result(check_name, status, detail)
            
            # Overall result
            all_passed = all(status == "PASS" for _, status, _ in checks)
            if all_passed:
                print_result("\nPayment Order Creation (120 USD)", "PASS", "All checks passed")
            else:
                print_result("\nPayment Order Creation (120 USD)", "FAIL", "Some checks failed")
                
        elif order_response_1.status_code == 502:
            print_result("Payment Order Creation (120 USD)", "FAIL", 
                        "502 Payment gateway error - Razorpay account likely does NOT have International/USD payments enabled")
            
            # Try with different amount as instructed
            print_section("TEST 3b: Retry with 690 USD to confirm behavior")
            
            order_payload_2 = {
                "amount_usd": 690,
                "package_name": "Starter Pack · 25 hours"
            }
            
            print(f"Request Payload: {json.dumps(order_payload_2, indent=2)}")
            
            order_response_2 = session.post(
                f"{BASE_URL}/payments/create-order",
                json=order_payload_2,
                timeout=30
            )
            
            print(f"Status Code: {order_response_2.status_code}")
            print(f"Response Body: {order_response_2.text}")
            
            if order_response_2.status_code == 502:
                print_result("Payment Order Creation (690 USD)", "FAIL", 
                            "502 Payment gateway error - CONFIRMED: Razorpay account does NOT have International/USD payments enabled")
            else:
                print_result("Payment Order Creation (690 USD)", "UNEXPECTED", 
                            f"Got {order_response_2.status_code} instead of 502")
        else:
            print_result("Payment Order Creation (120 USD)", "FAIL", 
                        f"Unexpected status code: {order_response_1.status_code}")
            
    except Exception as e:
        print_result("Payment Order Creation (120 USD)", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # TEST 4: Verify unauthorized access returns 401
    # ========================================================================
    print_section("TEST 4: Unauthorized Access Check")
    
    # Create a new session without auth
    unauth_session = requests.Session()
    
    try:
        # Test GET /api/auth/me without auth
        unauth_me = unauth_session.get(f"{BASE_URL}/auth/me", timeout=30)
        print(f"GET /api/auth/me (no auth)")
        print(f"Status Code: {unauth_me.status_code}")
        
        if unauth_me.status_code == 401:
            print_result("Unauthorized /auth/me", "PASS", "Returns 401 as expected")
        else:
            print_result("Unauthorized /auth/me", "FAIL", f"Expected 401, got {unauth_me.status_code}")
        
        # Test POST /api/payments/create-order without auth
        unauth_order = unauth_session.post(
            f"{BASE_URL}/payments/create-order",
            json={"amount_usd": 120, "package_name": "Test"},
            timeout=30
        )
        print(f"\nPOST /api/payments/create-order (no auth)")
        print(f"Status Code: {unauth_order.status_code}")
        
        if unauth_order.status_code == 401:
            print_result("Unauthorized /payments/create-order", "PASS", "Returns 401 as expected")
        else:
            print_result("Unauthorized /payments/create-order", "FAIL", f"Expected 401, got {unauth_order.status_code}")
            
    except Exception as e:
        print_result("Unauthorized Access Check", "FAIL", f"Exception: {str(e)}")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print_section("TEST SUMMARY")
    print("Test execution completed. Review results above.")
    print(f"Test user email: {test_email}")
    print(f"Test completed at: {datetime.utcnow().isoformat()}Z")
    print("\nNOTE: This test does NOT attempt to complete, capture, or verify real payments.")
    print("      Only order creation is tested to avoid charging real money.")
    print("="*80 + "\n")

if __name__ == "__main__":
    test_auth_and_payments()
