#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime
import tempfile
import os

class EcoleDesGeniesAPITester:
    def __init__(self, base_url="https://92d0f233-b260-4385-8f08-7318b67c32de.preview.emergentagent.com"):
        self.base_url = base_url
        self.parent_token = None
        self.teacher_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.parent_user_id = None
        self.teacher_user_id = None
        self.admin_user_id = None
        self.created_sheet_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    file_headers = {k: v for k, v in default_headers.items() if k != 'Content-Type'}
                    response = requests.post(url, data=data, files=files, headers=file_headers)
                else:
                    response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_parent_registration(self):
        """Test parent registration"""
        test_email = f"parent_test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Parent Registration",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "first_name": "Parent",
                "last_name": "Test",
                "user_type": "parent"
            }
        )
        if success and 'token' in response:
            self.parent_token = response['token']
            self.parent_user_id = response['user']['id']
            print(f"   Parent token obtained: {self.parent_token[:20]}...")
        return success

    def test_teacher_registration(self):
        """Test teacher registration"""
        test_email = f"teacher_test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Teacher Registration",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "first_name": "Teacher",
                "last_name": "Test",
                "user_type": "teacher"
            }
        )
        if success and 'token' in response:
            self.teacher_token = response['token']
            self.teacher_user_id = response['user']['id']
            print(f"   Teacher token obtained: {self.teacher_token[:20]}...")
        return success

    def test_parent_login(self):
        """Test parent login with existing credentials"""
        success, response = self.run_test(
            "Parent Login",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": f"parent_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!"
            }
        )
        return success

    def test_get_profile_parent(self):
        """Test getting parent profile"""
        if not self.parent_token:
            print("❌ Skipping - No parent token available")
            return False
            
        success, response = self.run_test(
            "Get Parent Profile",
            "GET",
            "api/user/profile",
            200,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        return success

    def test_get_profile_teacher(self):
        """Test getting teacher profile"""
        if not self.teacher_token:
            print("❌ Skipping - No teacher token available")
            return False
            
        success, response = self.run_test(
            "Get Teacher Profile",
            "GET",
            "api/user/profile",
            200,
            headers={'Authorization': f'Bearer {self.teacher_token}'}
        )
        return success

    def test_get_pedagogical_sheets_parent(self):
        """Test getting pedagogical sheets as parent"""
        if not self.parent_token:
            print("❌ Skipping - No parent token available")
            return False
            
        success, response = self.run_test(
            "Get Pedagogical Sheets (Parent)",
            "GET",
            "api/pedagogical-sheets",
            200,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        return success

    def test_get_pedagogical_sheets_teacher(self):
        """Test getting pedagogical sheets as teacher"""
        if not self.teacher_token:
            print("❌ Skipping - No teacher token available")
            return False
            
        success, response = self.run_test(
            "Get Pedagogical Sheets (Teacher)",
            "GET",
            "api/pedagogical-sheets",
            200,
            headers={'Authorization': f'Bearer {self.teacher_token}'}
        )
        return success

    def test_get_pedagogical_sheets_with_filters(self):
        """Test getting pedagogical sheets with filters"""
        if not self.parent_token:
            print("❌ Skipping - No parent token available")
            return False
            
        success, response = self.run_test(
            "Get Pedagogical Sheets (Filtered by Level)",
            "GET",
            "api/pedagogical-sheets?level=CP",
            200,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        
        if success:
            success2, response2 = self.run_test(
                "Get Pedagogical Sheets (Filtered by Subject)",
                "GET",
                "api/pedagogical-sheets?subject=mathématiques",
                200,
                headers={'Authorization': f'Bearer {self.parent_token}'}
            )
            return success and success2
        return success

    def test_premium_subscription(self):
        """Test premium subscription simulation"""
        if not self.parent_token:
            print("❌ Skipping - No parent token available")
            return False
            
        success, response = self.run_test(
            "Premium Subscription Simulation",
            "POST",
            "api/subscription/simulate",
            200,
            data={},
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        return success

    def test_teacher_verification_upload(self):
        """Test teacher verification document upload"""
        if not self.teacher_token:
            print("❌ Skipping - No teacher token available")
            return False
        
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            temp_file.write("Test verification document content")
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('verification.txt', f, 'text/plain')}
                success, response = self.run_test(
                    "Teacher Verification Upload",
                    "POST",
                    "api/teacher/verification",
                    200,
                    files=files,
                    headers={'Authorization': f'Bearer {self.teacher_token}'}
                )
        finally:
            os.unlink(temp_file_path)
        
        return success

    def test_file_download(self):
        """Test file download"""
        if not self.parent_token:
            print("❌ Skipping - No parent token available")
            return False
            
        success, response = self.run_test(
            "File Download",
            "GET",
            "api/files/sample_couleurs.pdf",
            200,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        success, response = self.run_test(
            "Unauthorized Access to Profile",
            "GET",
            "api/user/profile",
            401
        )
        return success

    def test_admin_registration(self):
        """Test admin registration with Marine Alves email"""
        # Try to register first, if it fails, try to login
        success, response = self.run_test(
            "Admin Registration (Marine Alves)",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": "marine.alves1995@gmail.com",
                "password": "AdminPass123!",
                "first_name": "Marine",
                "last_name": "Alves",
                "user_type": "teacher"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user']['id']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            # Verify admin status
            if response['user'].get('is_admin', False):
                print("✅ Admin privileges automatically granted")
            else:
                print("❌ Admin privileges NOT granted")
                return False
            return True
        else:
            # If registration fails (user exists), try login
            print("   Registration failed, trying login...")
            return self.test_admin_login()

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": "marine.alves1995@gmail.com",
                "password": "AdminPass123!"
            }
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user']['id']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            # Verify admin status
            if response['user'].get('is_admin', False):
                print("✅ Admin privileges confirmed")
            else:
                print("❌ Admin privileges NOT found")
                return False
        return success

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        if not self.admin_token:
            print("❌ Skipping - No admin token available")
            return False
            
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "api/admin/stats",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and isinstance(response, dict):
            # Verify stats structure
            if 'users' in response and 'sheets' in response:
                print("✅ Stats structure is correct")
                print(f"   Users: {response['users']}")
                print(f"   Sheets: {response['sheets']}")
            else:
                print("❌ Stats structure is incorrect")
                return False
        return success

    def test_admin_get_all_sheets(self):
        """Test admin get all pedagogical sheets"""
        if not self.admin_token:
            print("❌ Skipping - No admin token available")
            return False
            
        success, response = self.run_test(
            "Admin Get All Sheets",
            "GET",
            "api/admin/pedagogical-sheets",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def test_admin_create_sheet(self):
        """Test admin create pedagogical sheet"""
        if not self.admin_token:
            print("❌ Skipping - No admin token available")
            return False
        
        # Create a temporary test PDF file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False) as temp_file:
            temp_file.write("Test PDF content for pedagogical sheet")
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_sheet.pdf', f, 'application/pdf')}
                data = {
                    'title': 'Test Admin Sheet',
                    'description': 'Test sheet created by admin',
                    'level': 'CP',
                    'subject': 'mathématiques',
                    'is_premium': 'true',
                    'is_teacher_only': 'false'
                }
                success, response = self.run_test(
                    "Admin Create Sheet",
                    "POST",
                    "api/admin/pedagogical-sheets",
                    200,
                    data=data,
                    files=files,
                    headers={'Authorization': f'Bearer {self.admin_token}'}
                )
                
                if success and isinstance(response, dict) and 'sheet' in response:
                    self.created_sheet_id = response['sheet']['id']
                    print(f"   Created sheet ID: {self.created_sheet_id}")
        finally:
            os.unlink(temp_file_path)
        
        return success

    def test_admin_delete_sheet(self):
        """Test admin delete pedagogical sheet"""
        if not self.admin_token or not self.created_sheet_id:
            print("❌ Skipping - No admin token or sheet ID available")
            return False
            
        success, response = self.run_test(
            "Admin Delete Sheet",
            "DELETE",
            f"api/admin/pedagogical-sheets/{self.created_sheet_id}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def test_admin_reset_user_password(self):
        """Test admin password reset functionality"""
        if not self.admin_token:
            print("❌ Skipping - No admin token available")
            return False
        
        # First, register a test user to reset password for
        test_email = f"reset_test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Register Test User for Password Reset",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "OriginalPass123!",
                "first_name": "Reset",
                "last_name": "Test",
                "user_type": "parent"
            }
        )
        
        if not success:
            print("❌ Failed to create test user for password reset")
            return False
        
        # Test admin password reset
        data = {
            'email': test_email,
            'new_password': 'NewPassword123!'
        }
        success, response = self.run_test(
            "Admin Reset User Password",
            "POST",
            "api/admin/reset-user-password",
            200,
            data=data,
            files={},  # This will trigger form-data handling
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            # Verify the password was actually changed by trying to login with new password
            success2, response2 = self.run_test(
                "Login with New Password",
                "POST",
                "api/auth/login",
                200,
                data={
                    "email": test_email,
                    "password": "NewPassword123!"
                }
            )
            
            if success2:
                print("✅ Password reset verified - login successful with new password")
                
                # Verify old password no longer works
                success3, response3 = self.run_test(
                    "Login with Old Password (Should Fail)",
                    "POST",
                    "api/auth/login",
                    401,
                    data={
                        "email": test_email,
                        "password": "OriginalPass123!"
                    }
                )
                return success and success2 and success3
            else:
                print("❌ Password reset failed - cannot login with new password")
                return False
        
        return success

    def test_admin_reset_marine_password(self):
        """Test specific Marine.alves1995@gmail.com password reset to Marine77"""
        if not self.admin_token:
            print("❌ Skipping - No admin token available")
            return False
        
        # First register Marine.alves1995@gmail.com if not exists
        marine_email = "Marine.alves1995@gmail.com"
        success, response = self.run_test(
            "Register Marine Alves Account",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": marine_email,
                "password": "TempPassword123!",
                "first_name": "Marine",
                "last_name": "Alves",
                "user_type": "teacher"
            }
        )
        
        # It's OK if this fails (user might already exist)
        print(f"   Marine registration result: {'Success' if success else 'User may already exist'}")
        
        # Test admin password reset to Marine77
        data = {
            'email': marine_email,
            'new_password': 'Marine77'
        }
        success, response = self.run_test(
            "Admin Reset Marine Password to Marine77",
            "POST",
            "api/admin/reset-user-password",
            200,
            data=data,
            files={},  # This will trigger form-data handling
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            # Verify login with Marine77
            success2, response2 = self.run_test(
                "Login Marine with Marine77",
                "POST",
                "api/auth/login",
                200,
                data={
                    "email": marine_email,
                    "password": "Marine77"
                }
            )
            
            if success2:
                print("✅ Marine password reset verified - login successful with Marine77")
                # Check if admin privileges are maintained
                if response2.get('user', {}).get('is_admin', False):
                    print("✅ Admin privileges maintained after password reset")
                else:
                    print("❌ Admin privileges lost after password reset")
                    return False
            else:
                print("❌ Marine password reset failed - cannot login with Marine77")
                return False
        
        return success and success2

    def test_non_admin_access_to_admin_routes(self):
        """Test that non-admin users cannot access admin routes"""
        if not self.parent_token:
            print("❌ Skipping - No parent token available")
            return False
            
        success, response = self.run_test(
            "Non-Admin Access to Admin Stats (Should Fail)",
            "GET",
            "api/admin/stats",
            403,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        
        if success:
            success2, response2 = self.run_test(
                "Non-Admin Access to Admin Sheets (Should Fail)",
                "GET",
                "api/admin/pedagogical-sheets",
                403,
                headers={'Authorization': f'Bearer {self.parent_token}'}
            )
            return success and success2
        return success

    def test_invalid_login(self):
        """Test invalid login credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={
                "email": "nonexistent@test.com",
                "password": "wrongpassword"
            }
        )
        return success

def main():
    print("🚀 Starting L'École des Génies API Tests (Including Admin Features)")
    print("=" * 70)
    
    tester = EcoleDesGeniesAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Parent Registration", tester.test_parent_registration),
        ("Teacher Registration", tester.test_teacher_registration),
        ("Admin Registration", tester.test_admin_registration),
        ("Parent Profile", tester.test_get_profile_parent),
        ("Teacher Profile", tester.test_get_profile_teacher),
        ("Pedagogical Sheets (Parent)", tester.test_get_pedagogical_sheets_parent),
        ("Pedagogical Sheets (Teacher)", tester.test_get_pedagogical_sheets_teacher),
        ("Pedagogical Sheets (Filtered)", tester.test_get_pedagogical_sheets_with_filters),
        ("Premium Subscription", tester.test_premium_subscription),
        ("Teacher Verification Upload", tester.test_teacher_verification_upload),
        ("File Download", tester.test_file_download),
        ("Admin Stats", tester.test_admin_stats),
        ("Admin Get All Sheets", tester.test_admin_get_all_sheets),
        ("Admin Create Sheet", tester.test_admin_create_sheet),
        ("Admin Delete Sheet", tester.test_admin_delete_sheet),
        ("Admin Password Reset", tester.test_admin_reset_user_password),
        ("Admin Reset Marine Password", tester.test_admin_reset_marine_password),
        ("Non-Admin Access Protection", tester.test_non_admin_access_to_admin_routes),
        ("Unauthorized Access", tester.test_unauthorized_access),
        ("Invalid Login", tester.test_invalid_login),
    ]
    
    print(f"\n📋 Running {len(tests)} test categories...")
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test category failed with exception: {str(e)}")
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())