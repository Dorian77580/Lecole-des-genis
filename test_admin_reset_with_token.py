#!/usr/bin/env python3
import requests
import sys
import json

class AdminResetWithTokenTester:
    def __init__(self, base_url="https://92d0f233-b260-4385-8f08-7318b67c32de.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

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

    def reset_marine_password_with_token(self):
        """Use the password reset token to set Marine's password"""
        # Token from the email log
        reset_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1hcmluZS5hbHZlczE5OTVAZ21haWwuY29tIiwidHlwZSI6InBhc3N3b3JkX3Jlc2V0IiwiZXhwIjoxNzU1MTEwNjgyfQ.h_1ljTS3zjd6IumZaiRMHQNw2tpxUAiUBXyHJtSpE1E"
        
        success, response = self.run_test(
            "Reset Marine Password with Token",
            "POST",
            "api/auth/reset-password",
            200,
            data={
                "token": reset_token,
                "new_password": "Marine123!"
            }
        )
        
        return success

    def login_as_admin(self):
        """Login as Marine with the new password"""
        success, response = self.run_test(
            "Login as Admin (Marine)",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": "marine.alves1995@gmail.com",
                "password": "Marine123!"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            if response['user'].get('is_admin', False):
                print("✅ Admin privileges confirmed")
                return True
            else:
                print("❌ Admin privileges not found")
                return False
        
        return success

    def test_admin_password_reset_functionality(self):
        """Test the admin password reset functionality"""
        if not self.admin_token:
            print("❌ Skipping - No admin token available")
            return False
        
        # Create a test user to reset password for
        test_email = "test.user@example.com"
        success, response = self.run_test(
            "Create Test User",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "OriginalPass123!",
                "first_name": "Test",
                "last_name": "User",
                "user_type": "parent"
            }
        )
        
        if not success:
            print("   Test user might already exist, continuing...")
        
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
            # Verify the password was actually changed
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
                return True
            else:
                print("❌ Password reset failed - cannot login with new password")
                return False
        
        return success

    def test_marine_password_reset_to_marine77(self):
        """Test resetting Marine's password to Marine77 (the specific test case)"""
        if not self.admin_token:
            print("❌ Skipping - No admin token available")
            return False
        
        marine_email = "marine.alves1995@gmail.com"
        
        # Test admin password reset to Marine77
        data = {
            'email': marine_email,
            'new_password': 'Marine77'
        }
        success, response = self.run_test(
            "Reset Marine Password to Marine77",
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
                print("✅ Marine password reset to Marine77 verified!")
                # Check if admin privileges are maintained
                if response2.get('user', {}).get('is_admin', False):
                    print("✅ Admin privileges maintained after password reset")
                    
                    # Update our admin token to the new one
                    self.admin_token = response2['token']
                    return True
                else:
                    print("❌ Admin privileges lost after password reset")
                    return False
            else:
                print("❌ Marine password reset failed - cannot login with Marine77")
                return False
        
        return success

def main():
    print("🚀 Testing Admin Password Reset with Reset Token")
    print("=" * 60)
    
    tester = AdminResetWithTokenTester()
    
    # Test sequence
    tests = [
        ("Reset Marine Password with Token", tester.reset_marine_password_with_token),
        ("Login as Admin", tester.login_as_admin),
        ("Test Admin Password Reset Functionality", tester.test_admin_password_reset_functionality),
        ("Test Marine Password Reset to Marine77", tester.test_marine_password_reset_to_marine77),
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
        print("🎉 All admin password reset tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())