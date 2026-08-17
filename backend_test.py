#!/usr/bin/env python3
"""
Backend API Test Suite for High On AI
Tests health check endpoints for Kubernetes deployment
"""

import requests
import json
import sys

# Backend URL from environment
BACKEND_URL = "https://sholabs-ai.preview.emergentagent.com"

def test_health_endpoints():
    """Test the health check endpoints added for Kubernetes probes"""
    
    print("=" * 80)
    print("TESTING HEALTH CHECK ENDPOINTS")
    print("=" * 80)
    
    results = {
        "passed": [],
        "failed": []
    }
    
    # Test 1: GET /health (root level, WITHOUT /api prefix)
    print("\n[TEST 1] GET /health (root level, no /api prefix)")
    print(f"URL: {BACKEND_URL}/health")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "ok":
                    print("✅ PASS: Root /health endpoint returns 200 with correct JSON")
                    results["passed"].append("GET /health")
                else:
                    print(f"❌ FAIL: Root /health returned 200 but wrong JSON: {data}")
                    results["failed"].append("GET /health - wrong response body")
            except json.JSONDecodeError:
                print(f"❌ FAIL: Root /health returned 200 but invalid JSON")
                results["failed"].append("GET /health - invalid JSON")
        else:
            print(f"❌ FAIL: Root /health returned {response.status_code} instead of 200")
            results["failed"].append(f"GET /health - status {response.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception occurred: {e}")
        results["failed"].append(f"GET /health - exception: {e}")
    
    # Test 2: GET /api/health
    print("\n[TEST 2] GET /api/health")
    print(f"URL: {BACKEND_URL}/api/health")
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "ok":
                    print("✅ PASS: /api/health endpoint returns 200 with correct JSON")
                    results["passed"].append("GET /api/health")
                else:
                    print(f"❌ FAIL: /api/health returned 200 but wrong JSON: {data}")
                    results["failed"].append("GET /api/health - wrong response body")
            except json.JSONDecodeError:
                print(f"❌ FAIL: /api/health returned 200 but invalid JSON")
                results["failed"].append("GET /api/health - invalid JSON")
        else:
            print(f"❌ FAIL: /api/health returned {response.status_code} instead of 200")
            results["failed"].append(f"GET /api/health - status {response.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception occurred: {e}")
        results["failed"].append(f"GET /api/health - exception: {e}")
    
    # Test 3: GET /api/ (existing root route)
    print("\n[TEST 3] GET /api/ (existing root route)")
    print(f"URL: {BACKEND_URL}/api/")
    try:
        response = requests.get(f"{BACKEND_URL}/api/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("message") == "High On AI API":
                    print("✅ PASS: /api/ endpoint still works correctly")
                    results["passed"].append("GET /api/")
                else:
                    print(f"❌ FAIL: /api/ returned 200 but wrong JSON: {data}")
                    results["failed"].append("GET /api/ - wrong response body")
            except json.JSONDecodeError:
                print(f"❌ FAIL: /api/ returned 200 but invalid JSON")
                results["failed"].append("GET /api/ - invalid JSON")
        else:
            print(f"❌ FAIL: /api/ returned {response.status_code} instead of 200")
            results["failed"].append(f"GET /api/ - status {response.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception occurred: {e}")
        results["failed"].append(f"GET /api/ - exception: {e}")
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Passed: {len(results['passed'])}")
    for test in results['passed']:
        print(f"   - {test}")
    print(f"\n❌ Failed: {len(results['failed'])}")
    for test in results['failed']:
        print(f"   - {test}")
    print("=" * 80)
    
    return len(results['failed']) == 0

if __name__ == "__main__":
    success = test_health_endpoints()
    sys.exit(0 if success else 1)
