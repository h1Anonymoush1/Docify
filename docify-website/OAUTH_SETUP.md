# OAuth Setup Guide for Docify

This guide explains how to set up Google and GitHub OAuth authentication for your Docify application using Appwrite.

## What Was Implemented

I've successfully implemented a complete OAuth authentication system with the following components:

### 1. Appwrite Configuration
- Updated `appwrite.json` to enable OAuth providers (Google and GitHub)
- Added OAuth configuration to the auth settings

### 2. Authentication Context
- Created `src/lib/auth-context.tsx` - A React context provider for managing authentication state
- Provides user data, loading states, and authentication methods throughout the app

### 3. OAuth Functions
- Enhanced `src/lib/appwrite.js` with OAuth login functions
- Added `loginWithGoogle()` and `loginWithGitHub()` functions
- Added `handleOAuthCallback()` for processing OAuth redirects

### 4. Authentication Pages
- **`/auth/callback`** - Handles OAuth redirect after authentication
- **`/auth/error`** - Displays authentication errors
- **`/auth/login`** - Alternative login page (optional)

### 5. Protected Routes
- Created `AuthGuard` component for protecting authenticated routes
- Updated dashboard page to require authentication

### 6. Updated UI Components
- Modified `AuthButtons` component to use actual OAuth functions
- Updated `get-started` page to use the authentication system

## Setup Instructions

### Step 1: Configure Environment Variables

Create or update your `.env` file with the following variables:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID=documents
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=documents
```

### Step 2: Set Up OAuth Providers in Appwrite Console

1. **Go to your Appwrite Console** at https://nyc.cloud.appwrite.io
2. **Navigate to your project**
3. **Go to Auth > Settings**
4. **Enable OAuth2 providers**

#### For Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://nyc.cloud.appwrite.io/v1/account/sessions/oauth/google`
6. Copy Client ID and Client Secret
7. In Appwrite Console > Auth > Providers > Google:
   - Enable Google provider
   - Paste your Client ID and Client Secret

#### For GitHub OAuth:
1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to:
   - `https://nyc.cloud.appwrite.io/v1/account/sessions/oauth/github`
4. Copy Client ID and Client Secret
5. In Appwrite Console > Auth > Providers > GitHub:
   - Enable GitHub provider
   - Paste your Client ID and Client Secret

### Step 3: Update Appwrite Configuration

The `appwrite.json` has been updated with OAuth configuration. Deploy your changes:

```bash
appwrite deploy
```

### Step 4: Test the Authentication

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to `/get-started`** in your browser

3. **Click "Continue with Google"** or **"Continue with GitHub"**

4. **You should be redirected** to the OAuth provider for authentication

5. **After authentication**, you'll be redirected back to `/auth/callback`

6. **Upon success**, you'll be redirected to `/dashboard`

## Troubleshooting OAuth Issues

### 404 Route Not Found Error

If you get a "Route not found" error when clicking the OAuth buttons, this is usually caused by:

1. **Incorrect SDK Usage**: The app now uses the proper Appwrite SDK methods:
   ```javascript
   await account.createOAuth2Session(
       OAuthProvider.Google,
       `${window.location.origin}/auth/callback`,
       `${window.location.origin}/auth/error`
   );
   ```

2. **Missing OAuth Providers**: Ensure OAuth providers are enabled in your Appwrite console

3. **Environment Variables**: Make sure your `.env` file has the correct values:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   ```

### Common Issues:

- **"Route not found"**: Check that OAuth providers are enabled in Appwrite console
- **"Invalid credentials"**: Verify your OAuth provider credentials are correct
- **"Redirect URI mismatch"**: Ensure redirect URIs are properly configured in OAuth provider settings
- **Session errors**: Clear browser cookies and try again

## How It Works

### Authentication Flow:
1. User clicks "Sign in with Google/GitHub" on `/get-started`
2. App redirects to Appwrite OAuth endpoint
3. Appwrite redirects to Google/GitHub OAuth
4. User authenticates with the provider
5. Provider redirects back to Appwrite with auth code
6. Appwrite exchanges code for user data and creates session
7. Appwrite redirects to `/auth/callback` with session
8. App processes the callback and gets user session
9. User is redirected to `/dashboard`

### Context Usage:
- `useAuth()` hook provides access to:
  - `user` - Current user data
  - `loading` - Authentication loading state
  - `isAuthenticated` - Boolean indicating auth status
  - `loginWithGoogle()` - Function to start Google OAuth
  - `loginWithGitHub()` - Function to start GitHub OAuth
  - `logout()` - Function to log out user

### Protecting Routes:
Use the `AuthGuard` component to protect routes:

```tsx
<AuthGuard requireAuth={true}>
  <YourProtectedComponent />
</AuthGuard>
```

## Troubleshooting

### Common Issues:

1. **404 on `/auth`**: This is fixed - buttons now use actual OAuth flow
2. **OAuth redirect errors**: Check that redirect URLs are correctly configured in OAuth provider settings
3. **Session not found**: Ensure cookies are enabled and not blocked
4. **Provider not configured**: Make sure OAuth providers are enabled in Appwrite console

### Debug Tips:
- Check browser console for error messages
- Verify environment variables are loaded correctly
- Ensure Appwrite project ID matches your console project
- Check that OAuth provider credentials are correct

## Next Steps

Once OAuth is working, you can:
1. Add more OAuth providers (Facebook, Twitter, etc.)
2. Implement user profile management
3. Add role-based access control
4. Create user-specific dashboards
5. Implement session persistence across browser sessions

The authentication system is now fully integrated with Next.js best practices using React Context for state management and follows Appwrite's recommended OAuth implementation patterns.
