#!/usr/bin/env python3
"""
Backend API Testing for Marketplace de Serviços Angola
Tests all main endpoints according to the review request
"""

import requests
import json
import sys
from datetime import datetime
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url() + "/api"
print(f"Testing API at: {BASE_URL}")

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.admin_token = None
        self.professional_token = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def test_endpoint(self, method, endpoint, data=None, headers=None, expected_status=200, test_name=None):
        """Generic endpoint tester"""
        if not test_name:
            test_name = f"{method} {endpoint}"
            
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if headers is None:
                headers = {}
                # Only add default auth token if no headers provided
                if self.auth_token:
                    headers['Authorization'] = f'Bearer {self.auth_token}'
            
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                headers['Content-Type'] = 'application/json'
                response = self.session.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                headers['Content-Type'] = 'application/json'
                response = self.session.put(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if response.status_code == expected_status:
                try:
                    response_data = response.json()
                    self.log_result(test_name, True, f"Status {response.status_code}", response_data)
                    return response_data
                except:
                    self.log_result(test_name, True, f"Status {response.status_code}", response.text)
                    return response.text
            else:
                try:
                    error_data = response.json()
                    self.log_result(test_name, False, f"Expected {expected_status}, got {response.status_code}", error_data)
                except:
                    self.log_result(test_name, False, f"Expected {expected_status}, got {response.status_code}", response.text)
                return None
                
        except requests.exceptions.RequestException as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
            return None
        except Exception as e:
            self.log_result(test_name, False, f"Unexpected error: {str(e)}")
            return None

    def test_seed_data(self):
        """Test seed endpoint to create test data"""
        print("\n=== SEEDING TEST DATA ===")
        result = self.test_endpoint('POST', '/seed', test_name="Seed Test Data")
        return result is not None

    def test_constants(self):
        """Test constant endpoints"""
        print("\n=== TESTING CONSTANTS ===")
        
        # Test categories
        categories = self.test_endpoint('GET', '/categories', test_name="Get Categories")
        if categories and isinstance(categories, list) and len(categories) > 0:
            self.log_result("Categories Content", True, f"Found {len(categories)} categories")
        else:
            self.log_result("Categories Content", False, "No categories returned or invalid format")
        
        # Test provinces
        provinces = self.test_endpoint('GET', '/provinces', test_name="Get Provinces")
        if provinces and isinstance(provinces, list) and len(provinces) > 0:
            self.log_result("Provinces Content", True, f"Found {len(provinces)} provinces")
        else:
            self.log_result("Provinces Content", False, "No provinces returned or invalid format")

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n=== TESTING AUTHENTICATION ===")
        
        # Test registration
        register_data = {
            "email": "teste@teste.com",
            "password": "123456",
            "name": "Teste Usuario",
            "phone": "+244923000000",
            "user_type": "cliente"
        }
        
        register_result = self.test_endpoint('POST', '/auth/register', register_data, test_name="User Registration")
        
        # Test login with existing user
        login_data = {
            "email": "joao@email.com",
            "password": "123456"
        }
        
        login_result = self.test_endpoint('POST', '/auth/login', login_data, test_name="User Login")
        
        if login_result and 'session_token' in login_result:
            self.auth_token = login_result['session_token']
            self.professional_token = login_result['session_token']
            self.log_result("Token Extraction", True, "Session token obtained")
            
            # Test /auth/me with token
            me_result = self.test_endpoint('GET', '/auth/me', test_name="Get Current User")
            if me_result and 'user_id' in me_result:
                self.log_result("User Profile", True, f"User: {me_result.get('name', 'Unknown')}")
            else:
                self.log_result("User Profile", False, "Failed to get user profile")
        else:
            self.log_result("Token Extraction", False, "No session token in login response")
        
        # Test admin login
        admin_login_data = {
            "email": "admin@servicosangola.ao",
            "password": "admin123"
        }
        
        admin_login_result = self.test_endpoint('POST', '/auth/login', admin_login_data, test_name="Admin Login")
        if admin_login_result and 'session_token' in admin_login_result:
            self.admin_token = admin_login_result['session_token']
            self.log_result("Admin Token", True, "Admin session token obtained")
        else:
            self.log_result("Admin Token", False, "Failed to get admin token")

    def test_service_requests(self):
        """Test service request endpoints"""
        print("\n=== TESTING SERVICE REQUESTS ===")
        
        # Test get service requests (public)
        requests_result = self.test_endpoint('GET', '/service-requests', test_name="Get Service Requests")
        if requests_result and isinstance(requests_result, list):
            self.log_result("Service Requests List", True, f"Found {len(requests_result)} requests")
        else:
            self.log_result("Service Requests List", False, "Invalid service requests response")
        
        # Test filtered requests
        filtered_result = self.test_endpoint('GET', '/service-requests?category=eletricista', test_name="Filter by Category")
        
        # Test create service request (requires auth)
        if self.auth_token:
            create_data = {
                "title": "Teste de Instalação Elétrica",
                "description": "Preciso de instalação elétrica para casa nova",
                "category": "eletricista",
                "province": "Luanda",
                "city": "Talatona",
                "urgency": "normal"
            }
            
            create_result = self.test_endpoint('POST', '/service-requests', create_data, test_name="Create Service Request")
            if create_result and 'request_id' in create_result:
                self.log_result("Service Request Creation", True, f"Created request: {create_result['request_id']}")
                
                # Test get specific request
                request_id = create_result['request_id']
                specific_result = self.test_endpoint('GET', f'/service-requests/{request_id}', test_name="Get Specific Request")
                
                return request_id
            else:
                self.log_result("Service Request Creation", False, "Failed to create service request")
        else:
            self.log_result("Service Request Creation", False, "No auth token available")
        
        return None

    def test_professionals(self):
        """Test professional endpoints"""
        print("\n=== TESTING PROFESSIONALS ===")
        
        # Test get professionals
        professionals_result = self.test_endpoint('GET', '/professionals', test_name="Get Professionals")
        if professionals_result and isinstance(professionals_result, list):
            self.log_result("Professionals List", True, f"Found {len(professionals_result)} professionals")
        else:
            self.log_result("Professionals List", False, "Invalid professionals response")
        
        # Test featured professionals
        featured_result = self.test_endpoint('GET', '/professionals/featured', test_name="Get Featured Professionals")
        if featured_result and isinstance(featured_result, list):
            self.log_result("Featured Professionals", True, f"Found {len(featured_result)} featured professionals")
        else:
            self.log_result("Featured Professionals", False, "Invalid featured professionals response")

    def test_proposals_system(self):
        """Test proposal system"""
        print("\n=== TESTING PROPOSALS SYSTEM ===")
        
        if not self.professional_token:
            self.log_result("Proposals System", False, "No professional token available")
            return
        
        # Get existing service requests to propose to
        requests_result = self.test_endpoint('GET', '/service-requests', test_name="Get Requests for Proposal")
        
        if requests_result and len(requests_result) > 0:
            request_id = requests_result[0]['request_id']
            
            # Create proposal using professional token directly
            proposal_data = {
                "request_id": request_id,
                "price": 75000.0,
                "description": "Proposta para instalação elétrica completa",
                "estimated_days": 5
            }
            
            # Use professional token directly in headers
            headers = {'Authorization': f'Bearer {self.professional_token}'}
            proposal_result = self.test_endpoint('POST', '/proposals', proposal_data, headers=headers, test_name="Create Proposal")
            
            if proposal_result and 'proposal_id' in proposal_result:
                self.log_result("Proposal Creation", True, f"Created proposal: {proposal_result['proposal_id']}")
                
                # Test get my proposals with professional token
                my_proposals = self.test_endpoint('GET', '/proposals/my', headers=headers, test_name="Get My Proposals")
                
                # For testing proposal acceptance, we need to be the client who created the request
                # Since the admin created the request, we need admin token
                if self.admin_token:
                    admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
                    
                    # Test get proposals for request
                    request_proposals = self.test_endpoint('GET', f'/proposals/request/{request_id}', headers=admin_headers, test_name="Get Request Proposals")
                    
                    if request_proposals and len(request_proposals) > 0:
                        proposal_id = request_proposals[0]['proposal_id']
                        
                        # Test accept proposal
                        accept_result = self.test_endpoint('PUT', f'/proposals/{proposal_id}/accept', headers=admin_headers, test_name="Accept Proposal")
                        
                        if accept_result and 'job_id' in accept_result:
                            job_id = accept_result['job_id']
                            self.log_result("Proposal Acceptance", True, f"Created job: {job_id}")
                            
                            # Test complete job
                            complete_result = self.test_endpoint('PUT', f'/jobs/{job_id}/complete', headers=admin_headers, test_name="Complete Job")
                            
                            return job_id
                        else:
                            self.log_result("Proposal Acceptance", False, "Failed to accept proposal")
                    else:
                        self.log_result("Get Request Proposals", False, "No proposals found for request")
                else:
                    self.log_result("Proposal Acceptance", False, "No admin token for proposal acceptance")
            else:
                self.log_result("Proposal Creation", False, "Failed to create proposal")
        else:
            self.log_result("Get Requests for Proposal", False, "No service requests available for proposals")

    def test_user_verification(self):
        """Test user verification system"""
        print("\n=== TESTING USER VERIFICATION ===")
        
        if not self.auth_token:
            self.log_result("User Verification", False, "No auth token available")
            return
        
        # Test upload verification documents
        verification_data = {
            "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A==",
            "bi_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A==",
            "bi_number": "123456789LA012"
        }
        
        upload_result = self.test_endpoint('POST', '/users/upload-verification', verification_data, test_name="Upload Verification Documents")
        
        if upload_result and upload_result.get('status') == 'pendente':
            self.log_result("Verification Upload", True, "Documents uploaded successfully")
        else:
            self.log_result("Verification Upload", False, "Failed to upload verification documents")

    def test_admin_panel(self):
        """Test admin panel functionality"""
        print("\n=== TESTING ADMIN PANEL ===")
        
        if not self.admin_token:
            self.log_result("Admin Panel", False, "No admin token available")
            return
        
        # Switch to admin token
        temp_token = self.auth_token
        self.auth_token = self.admin_token
        
        # Test admin stats
        stats_result = self.test_endpoint('GET', '/admin/stats', test_name="Get Admin Stats")
        if stats_result and 'total_users' in stats_result:
            self.log_result("Admin Stats", True, f"Total users: {stats_result['total_users']}")
        else:
            self.log_result("Admin Stats", False, "Failed to get admin stats")
        
        # Test get users
        users_result = self.test_endpoint('GET', '/admin/users', test_name="Get Admin Users")
        if users_result and isinstance(users_result, list):
            self.log_result("Admin Users List", True, f"Found {len(users_result)} users")
        else:
            self.log_result("Admin Users List", False, "Failed to get users list")
        
        # Test pending verifications
        pending_result = self.test_endpoint('GET', '/admin/pending-verifications', test_name="Get Pending Verifications")
        if pending_result and isinstance(pending_result, list):
            self.log_result("Pending Verifications", True, f"Found {len(pending_result)} pending verifications")
            
            # If there are pending verifications, test verification
            if len(pending_result) > 0:
                user_id = pending_result[0]['user_id']
                verify_data = {
                    "action": "verificar",
                    "reason": "Documentos válidos - teste automatizado"
                }
                
                verify_result = self.test_endpoint('PUT', f'/admin/verify-user/{user_id}', verify_data, test_name="Verify User")
        else:
            self.log_result("Pending Verifications", False, "Failed to get pending verifications")
        
        # Test transactions
        transactions_result = self.test_endpoint('GET', '/admin/transactions', test_name="Get Admin Transactions")
        if transactions_result and isinstance(transactions_result, list):
            self.log_result("Admin Transactions", True, f"Found {len(transactions_result)} transactions")
        else:
            self.log_result("Admin Transactions", False, "Failed to get transactions")
        
        # Restore original token
        self.auth_token = temp_token

    def test_subscription_system(self):
        """Test subscription/monetization system"""
        print("\n=== TESTING SUBSCRIPTION SYSTEM ===")
        
        # Test get subscription plans
        plans_result = self.test_endpoint('GET', '/subscriptions/plans', test_name="Get Subscription Plans")
        if plans_result and isinstance(plans_result, list) and len(plans_result) > 0:
            self.log_result("Subscription Plans", True, f"Found {len(plans_result)} plans")
            
            # Test subscribe to a plan
            if self.auth_token:
                subscribe_data = {
                    "plan_id": "profissional"
                }
                
                subscribe_result = self.test_endpoint('POST', '/subscriptions/subscribe', subscribe_data, test_name="Subscribe to Plan")
                if subscribe_result and 'transaction_id' in subscribe_result:
                    self.log_result("Plan Subscription", True, f"Subscribed with transaction: {subscribe_result['transaction_id']}")
                else:
                    self.log_result("Plan Subscription", False, "Failed to subscribe to plan")
            else:
                self.log_result("Plan Subscription", False, "No auth token for subscription")
        else:
            self.log_result("Subscription Plans", False, "Failed to get subscription plans")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests for Marketplace de Serviços Angola")
        print("=" * 70)
        
        # Seed test data first
        if not self.test_seed_data():
            print("⚠️  Warning: Failed to seed test data, some tests may fail")
        
        # Run all test suites
        self.test_constants()
        self.test_authentication()
        self.test_service_requests()
        self.test_professionals()
        self.test_proposals_system()
        self.test_user_verification()
        self.test_admin_panel()
        self.test_subscription_system()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)