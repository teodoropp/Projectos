#!/usr/bin/env python3
"""
Debug test for proposal system
"""

import requests
import json

BASE_URL = "https://angoservices.preview.emergentagent.com/api"

def test_proposal_debug():
    print("=== DEBUGGING PROPOSAL SYSTEM ===")
    
    # Login as professional
    login_data = {
        "email": "joao@email.com",
        "password": "123456"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login response: {response.status_code}")
    
    if response.status_code == 200:
        login_result = response.json()
        token = login_result['session_token']
        user_info = login_result['user']
        print(f"User type: {user_info['user_type']}")
        print(f"User ID: {user_info['user_id']}")
        
        # Check current user with token
        headers = {'Authorization': f'Bearer {token}'}
        me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Me response: {me_response.status_code}")
        if me_response.status_code == 200:
            me_data = me_response.json()
            print(f"Current user type: {me_data['user_type']}")
            print(f"Current user ID: {me_data['user_id']}")
        
        # Get an existing service request
        requests_response = requests.get(f"{BASE_URL}/service-requests")
        if requests_response.status_code == 200:
            requests_data = requests_response.json()
            if len(requests_data) > 0:
                request_id = requests_data[0]['request_id']
                print(f"Using request ID: {request_id}")
                
                # Try to create proposal
                proposal_data = {
                    "request_id": request_id,
                    "price": 75000.0,
                    "description": "Proposta de teste",
                    "estimated_days": 5
                }
                
                proposal_response = requests.post(f"{BASE_URL}/proposals", json=proposal_data, headers=headers)
                print(f"Proposal response: {proposal_response.status_code}")
                print(f"Proposal response body: {proposal_response.text}")
            else:
                print("No service requests found")
        else:
            print(f"Failed to get service requests: {requests_response.status_code}")
    else:
        print(f"Login failed: {response.text}")

if __name__ == "__main__":
    test_proposal_debug()