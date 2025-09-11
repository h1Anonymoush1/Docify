#!/usr/bin/env python3
"""
User Signup Credits Function
Automatically adds credits to user account preferences on signup
"""

import os
import json
import time
from typing import Dict, Any, Optional
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.users import Users
from appwrite.exception import AppwriteException

# ===== CONFIGURATION =====
CREDITS_AMOUNT = 10  # Number of credits to add on signup


def extract_user_id_from_event(context: Dict[str, Any]) -> Optional[str]:
    """
    Extract user ID from the event context
    """
    print("🔍 Extracting user ID from event context...")

    try:
        # Check for user ID in various possible locations
        if hasattr(context, 'req') and context.req:
            req_body = context.req.body if hasattr(context.req, 'body') else None

            if isinstance(req_body, dict):
                # Try different possible field names for user ID
                user_id = (req_body.get('userId') or
                          req_body.get('user_id') or
                          req_body.get('$id') or
                          req_body.get('id'))

                if user_id:
                    print(f"✅ Found user ID in request body: {user_id}")
                    return user_id

            elif isinstance(req_body, str):
                # Handle JSON string body
                try:
                    body_data = json.loads(req_body)
                    user_id = (body_data.get('userId') or
                              body_data.get('user_id') or
                              body_data.get('$id') or
                              body_data.get('id'))

                    if user_id:
                        print(f"✅ Found user ID in JSON body: {user_id}")
                        return user_id
                except json.JSONDecodeError:
                    print("⚠️ Could not parse JSON body")

        # Check headers for event information
        if hasattr(context.req, 'headers'):
            headers = context.req.headers
            print(f"📋 Available headers: {list(headers.keys()) if headers else 'None'}")

            # Look for user ID in headers (some events might include it)
            user_id_header = headers.get('x-appwrite-user-id')
            if user_id_header:
                print(f"✅ Found user ID in headers: {user_id_header}")
                return user_id_header

        print("❌ Could not extract user ID from context")
        return None

    except Exception as e:
        print(f"⚠️ Error extracting user ID: {e}")
        return None


def get_user_preferences(user_id: str, users_service) -> Dict[str, Any]:
    """
    Get current user preferences using Users service (admin access)
    """
    print(f"📖 Getting current preferences for user: {user_id}")

    try:
        # Use Users service for admin access to any user's preferences
        prefs = users_service.get_prefs(user_id)
        print(f"✅ Retrieved preferences: {prefs}")
        return prefs if prefs else {}
    except AppwriteException as e:
        print(f"⚠️ Could not retrieve preferences (might be new user): {e}")
        return {}
    except Exception as e:
        print(f"⚠️ Error getting preferences: {e}")
        return {}


def update_user_credits(user_id: str, current_prefs: Dict[str, Any], users_service) -> bool:
    """
    Update user preferences with credits using Users service (admin access)
    """
    print(f"💰 Adding {CREDITS_AMOUNT} credits to user: {user_id}")

    try:
        # Calculate new credit amount
        current_credits = current_prefs.get('credits', 0)
        new_credits = current_credits + CREDITS_AMOUNT

        # Prepare updated preferences
        updated_prefs = current_prefs.copy()
        updated_prefs['credits'] = new_credits

        # Add metadata about credit addition
        updated_prefs['last_credit_update'] = int(time.time())
        updated_prefs['credit_history'] = updated_prefs.get('credit_history', [])
        updated_prefs['credit_history'].append({
            'amount': CREDITS_AMOUNT,
            'reason': 'signup_bonus',
            'timestamp': int(time.time())
        })

        print(f"📝 Updating preferences - Current: {current_credits}, New: {new_credits}")

        # Update user preferences using Users service
        result = users_service.update_prefs(user_id, updated_prefs)

        if result:
            print(f"✅ Successfully added {CREDITS_AMOUNT} credits to user {user_id}")
            print(f"   New balance: {new_credits} credits")
            return True
        else:
            print(f"❌ Failed to update preferences for user {user_id}")
            return False

    except AppwriteException as e:
        print(f"❌ Appwrite error updating preferences: {e}")
        return False
    except Exception as e:
        print(f"❌ Error updating credits: {e}")
        return False


def validate_environment() -> bool:
    """
    Validate that required environment variables are set (excluding API key which comes from headers)
    """
    print("🔧 Validating environment configuration...")

    required_vars = [
        'APPWRITE_FUNCTION_API_ENDPOINT',
        'APPWRITE_FUNCTION_PROJECT_ID'
    ]

    missing_vars = []
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)

    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False

    print("✅ Environment validation passed")
    return True


def main(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function handler for user signup credit assignment
    """
    start_time = time.time()

    print("=" * 60)
    print("🎉 USER SIGNUP CREDITS FUNCTION STARTED")
    print("=" * 60)
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time))}")
    print(f"Credits to add: {CREDITS_AMOUNT}")

    # Get logging functions
    log = getattr(context, 'log', print)
    error = getattr(context, 'error', print)

    try:
        # ===== DYNAMIC API KEY INITIALIZATION =====
        # Get dynamic API key from headers (as per Appwrite docs)
        api_key = None
        if hasattr(context, 'req') and context.req:
            if hasattr(context.req, 'headers') and context.req.headers:
                api_key = context.req.headers.get('x-appwrite-key')

        if not api_key:
            raise ValueError("Dynamic API key not found in x-appwrite-key header")

        # Initialize Appwrite client with dynamic API key
        client = Client()
        client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_API_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
        client.set_key(api_key)

        # Initialize Users service (for admin operations on user preferences)
        users = Users(client)
        # Step 1: Validate environment
        print("\n--- STEP 1: ENVIRONMENT VALIDATION ---")
        if not validate_environment():
            raise ValueError("Environment validation failed")

        # Step 2: Extract user ID from event
        print("\n--- STEP 2: USER ID EXTRACTION ---")
        user_id = extract_user_id_from_event(context)

        if not user_id:
            raise ValueError("Could not extract user ID from event context")

        print(f"✅ Target user: {user_id}")

        # Step 3: Get current user preferences
        print("\n--- STEP 3: GET CURRENT PREFERENCES ---")
        current_prefs = get_user_preferences(user_id, users)

        # Step 4: Update user credits
        print("\n--- STEP 4: UPDATE USER CREDITS ---")
        success = update_user_credits(user_id, current_prefs, users)

        if not success:
            raise ValueError("Failed to update user credits")

        # Calculate execution time
        execution_time = time.time() - start_time

        print("\n" + "=" * 60)
        print("🎉 USER SIGNUP CREDITS FUNCTION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(f"User: {user_id}")
        print(f"Credits Added: {CREDITS_AMOUNT}")
        print(f"Execution Time: {execution_time:.2f}s")
        print("=" * 60)

        return {
            'success': True,
            'message': f'Successfully added {CREDITS_AMOUNT} credits to user {user_id}',
            'data': {
                'userId': user_id,
                'creditsAdded': CREDITS_AMOUNT,
                'executionTime': round(execution_time, 2)
            },
            'statusCode': 200
        }

    except Exception as err:
        execution_time = time.time() - start_time

        print("\n" + "!" * 60)
        print("❌ USER SIGNUP CREDITS FUNCTION FAILED")
        print("!" * 60)
        print(f"Error: {str(err)}")
        print(f"Execution Time: {execution_time:.2f}s")
        print("!" * 60)

        error(f"User signup credits function failed: {err}")

        return {
            'success': False,
            'error': {
                'message': str(err),
                'type': type(err).__name__,
                'executionTime': round(execution_time, 2)
            },
            'statusCode': 500
        }


# ===== LEGACY COMPATIBILITY =====
def process_user_signup(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Legacy function for backward compatibility
    """
    return main(context)


# ===== LOCAL TESTING =====
if __name__ == "__main__":
    print("🚀 User Signup Credits Function")
    print("✨ Automatically adds credits to new user accounts")
    print(f"💰 Credits to add: {CREDITS_AMOUNT}")
    print("🔧 Environment check:")
    print(f"   API Endpoint: {APPWRITE_ENDPOINT or 'Not set'}")
    print(f"   Project ID: {APPWRITE_PROJECT_ID or 'Not set'}")
    print(f"   API Key: {'Set' if APPWRITE_API_KEY else 'Not set'}")
    print("\nThis function should be called through Appwrite events")
    print("Use the Appwrite CLI to deploy and test:")
    print("  appwrite functions create-deployment --functionId user-signup-credits")
