# Docify Authentication Setup

This document provides instructions for setting up the modern Appwrite authentication system with OTP and GitHub OAuth.

## Features

- **Magic Link (OTP) Authentication**: Passwordless authentication via email
- **GitHub OAuth**: Social authentication with GitHub
- **User Profile Management**: Update profile information
- **Protected Routes**: Automatic redirect to login for protected pages

## Appwrite Configuration

### 1. Project Setup

1. Create a new project in your Appwrite console
2. Note your Project ID and Endpoint URL
3. Update your `.env` file with the correct values:

```env
PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
PUBLIC_APPWRITE_PROJECT_NAME=Docify
```

### 2. Authentication Settings

In your Appwrite console, configure the following:

#### Magic Link Authentication
1. Go to **Auth** → **Settings**
2. Enable **Magic URL** authentication
3. Set the redirect URL to: `http://localhost:5173/auth/verify` (for development)
4. For production, update to your domain: `https://yourdomain.com/auth/verify`

#### GitHub OAuth
1. Go to **Auth** → **Settings** → **OAuth Providers**
2. Add **GitHub** provider
3. Configure with your GitHub OAuth app credentials:
   - **Client ID**: From your GitHub OAuth app
   - **Client Secret**: From your GitHub OAuth app
4. Set redirect URLs:
   - Success: `http://localhost:5173/auth/success`
   - Error: `http://localhost:5173/auth/error`
   - For production, update to your domain

### 3. GitHub OAuth App Setup

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create a new OAuth App with:
   - **Application name**: Docify
   - **Homepage URL**: `http://localhost:5173` (or your domain)
   - **Authorization callback URL**: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/your_project_id`
3. Copy the Client ID and Client Secret to your Appwrite console

## File Structure

```
src/
├── lib/
│   ├── appwrite.js                 # Appwrite client configuration
│   ├── stores/
│   │   └── auth.js                 # Authentication store and methods
│   └── components/
│       └── auth/
│           ├── LoginForm.svelte    # Login component
│           ├── SignupForm.svelte   # Signup component
│           ├── OTPVerification.svelte # OTP verification
│           └── UserProfile.svelte  # User profile dropdown
└── routes/
    ├── +layout.svelte              # Main layout with auth state
    └── auth/
        ├── login/+page.svelte      # Login page
        ├── signup/+page.svelte     # Signup page
        ├── verify/+page.svelte     # OTP verification page
        ├── success/+page.svelte    # OAuth success page
        └── error/+page.svelte      # OAuth error page
```

## Usage

### Authentication Store

The authentication store provides reactive state and methods:

```javascript
import { user, isAuthenticated, auth } from '$lib/stores/auth.js';

// Check if user is authenticated
$: if ($isAuthenticated) {
  console.log('User is logged in:', $user);
}

// Send magic link for OTP authentication
await auth.sendOTP('user@example.com');

// Sign in with GitHub OAuth
await auth.signInWithGitHub();

// Sign out
await auth.signOut();
```

### Protected Routes

Routes are automatically protected based on the `protectedRoutes` array in `+layout.svelte`:

```javascript
const protectedRoutes = ['/dashboard', '/profile', '/settings'];
```

### User Profile Component

The `UserProfile` component automatically shows login/signup buttons for unauthenticated users and a profile dropdown for authenticated users.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Appwrite configuration

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

1. Update your Appwrite OAuth redirect URLs to use your production domain
2. Update the magic link redirect URL in Appwrite settings
3. Ensure your environment variables are set correctly in production

## Security Notes

- Never commit your `.env` file to version control
- Use HTTPS in production
- Regularly rotate your OAuth client secrets
- Monitor authentication logs in your Appwrite console
- Consider implementing rate limiting for authentication endpoints

## Troubleshooting

### Common Issues

1. **OAuth redirect mismatch**: Ensure redirect URLs in Appwrite match your GitHub OAuth app settings
2. **Magic link not working**: Check that the redirect URL is correctly configured in Appwrite
3. **CORS errors**: Ensure your domain is whitelisted in Appwrite console
4. **Authentication state not persisting**: Check that cookies are enabled and not blocked

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
PUBLIC_DEBUG=true
```

This will log authentication events to the console.