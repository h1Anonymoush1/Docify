# Docify Authentication & User Management Specification

## Overview
Docify uses Appwrite Auth for user management, providing secure authentication, session handling, and user data isolation. Users can sign up with email/password and manage their document analysis workflows.

## Authentication Flow

### User Registration
**Endpoint**: `POST /auth/signup`
**Process**:
1. User provides email, password, and optional name
2. Client validates input format
3. Appwrite creates user account
4. Email verification sent (if enabled)
5. User session established
6. Redirect to dashboard

**Validation Rules**:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false
};
```

### User Login
**Endpoint**: `POST /auth/login`
**Process**:
1. User provides email and password
2. Appwrite validates credentials
3. JWT token generated
4. Session cookie set
5. User data loaded
6. Redirect to dashboard

### Session Management
**Mechanism**: JWT tokens with refresh capability
**Storage**: HTTP-only cookies + localStorage for user data
**Expiration**: 24 hours for access tokens, 30 days for refresh tokens

```typescript
interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserData;
}

const sessionManager = {
  setSession: (session: SessionData) => {
    // Store tokens securely
    Cookies.set('accessToken', session.accessToken, { httpOnly: true });
    localStorage.setItem('user', JSON.stringify(session.user));
  },

  getSession: (): SessionData | null => {
    const accessToken = Cookies.get('accessToken');
    const userStr = localStorage.getItem('user');

    if (!accessToken || !userStr) return null;

    return {
      accessToken,
      refreshToken: '', // Retrieved separately if needed
      expiresAt: 0, // Calculated from token
      user: JSON.parse(userStr)
    };
  },

  clearSession: () => {
    Cookies.remove('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('preferences');
  }
};
```

## User Data Structure

### User Profile
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultAnalysisPrompt: string;
  notificationSettings: {
    emailOnComplete: boolean;
    emailOnError: boolean;
  };
  privacySettings: {
    allowAnalytics: boolean;
    allowErrorReporting: boolean;
  };
}
```

## Data Isolation & Security

### User Data Segregation
**Principle**: Users can only access their own data
**Implementation**: All queries include `user_id` filter

#### Database Permissions
```javascript
// Documents collection
{
  "read": ["user:$userId"],
  "write": ["user:$userId"],
  "delete": ["user:$userId"]
}

// Analysis results collection
{
  "read": ["user:$userId"],
  "write": ["role:apps"],  // Only functions can write
  "delete": ["user:$userId"]
}
```

#### API Layer Security
```typescript
const withUserAuth = (handler: Function) => async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Add user context to request
    req.user = session.user;

    return handler(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};
```

### Query Scoping
```typescript
// Always scope queries by user
const getUserDocuments = async (userId: string) => {
  return await databases.listDocuments(
    DATABASE_ID,
    DOCUMENTS_COLLECTION_ID,
    [
      Query.equal('user_id', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(20)
    ]
  );
};
```

## Password Security

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: special characters

### Password Reset Flow
1. User requests password reset
2. Email sent with reset token
3. User clicks link and sets new password
4. Old sessions invalidated

## Email Verification

### Verification Process
1. User registers with email
2. Verification email sent automatically
3. User clicks verification link
4. Account activated
5. User can now create documents

### Email Templates
```html
<!-- Verification Email -->
<h1>Welcome to Docify!</h1>
<p>Please verify your email address to get started:</p>
<a href="{{verificationUrl}}">Verify Email</a>

<!-- Password Reset Email -->
<h1>Reset Your Password</h1>
<p>Click the link below to reset your password:</p>
<a href="{{resetUrl}}">Reset Password</a>
```

## User Dashboard

### Dashboard Features
- Document overview (recent, status summary)
- Usage statistics
- Account settings
- Billing information (future)

### Navigation Structure
```
Dashboard
├── Overview
│   ├── Recent Documents
│   ├── Processing Status
│   └── Quick Stats
├── Documents
│   ├── All Documents
│   ├── Create New
│   └── Document Detail
├── Settings
│   ├── Profile
│   ├── Preferences
│   └── Security
└── Help & Support
```

## Account Management

### Profile Updates
```typescript
interface UpdateProfileData {
  name?: string;
  email?: string; // Requires re-verification
}

const updateProfile = async (data: UpdateProfileData) => {
  // Update user profile via Appwrite
  const updatedUser = await account.updateName(data.name);

  // Update local session data
  sessionManager.updateUser(updatedUser);
};
```

### Account Deletion
**Process**:
1. User requests account deletion
2. Confirmation email sent
3. 7-day grace period
4. All user data permanently deleted
5. Account deactivated

## Security Features

### Rate Limiting
- Login attempts: 5 per 15 minutes
- API calls: 1000 per hour per user
- Document creation: 10 per hour
- Password reset: 3 per hour

### Session Security
- Secure cookies with httpOnly flag
- CSRF protection on forms
- XSS prevention
- Content Security Policy headers

### Audit Logging
```typescript
interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

// Log important actions
const logAuditEvent = (event: AuditEvent) => {
  // Send to logging service
  analytics.track('audit_event', event);
};
```

## Third-Party Integration

### OAuth Providers (Future)
- Google OAuth
- GitHub OAuth
- Microsoft OAuth

### Social Login Flow
```typescript
const handleOAuthLogin = async (provider: 'google' | 'github') => {
  try {
    const oauthSession = await account.createOAuth2Session(
      provider,
      `${window.location.origin}/auth/callback`,
      `${window.location.origin}/auth/error`
    );

    // Handle successful OAuth login
    const user = await account.get();
    sessionManager.setSession({
      user,
      // OAuth tokens handled automatically by Appwrite
    });
  } catch (error) {
    // Handle OAuth error
    console.error('OAuth login failed:', error);
  }
};
```

## Privacy & Compliance

### Data Collection
- Minimal data collection (email, name only)
- No tracking without consent
- Analytics opt-in/opt-out

### GDPR Compliance
- Right to access personal data
- Right to data portability
- Right to be forgotten (account deletion)
- Data processing consent

### Data Retention
- User data: Retained until account deletion
- Session logs: 30 days
- Error logs: 90 days
- Analytics: 365 days (if consented)

## Error Handling

### Authentication Errors
```typescript
const handleAuthError = (error: AppwriteException) => {
  switch (error.code) {
    case 401:
      // Invalid credentials
      return 'Invalid email or password';
    case 403:
      // Account blocked
      return 'Account is blocked. Please contact support.';
    case 404:
      // User not found
      return 'Account not found';
    case 429:
      // Rate limited
      return 'Too many attempts. Please try again later.';
    default:
      return 'Authentication failed. Please try again.';
  }
};
```

### Session Errors
- Automatic token refresh on 401 responses
- Graceful logout on session expiration
- Clear error messages for users

## Testing Authentication

### Unit Tests
```typescript
describe('Authentication', () => {
  it('validates email format correctly', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('validates password strength', () => {
    expect(validatePassword('weak')).toBe(false);
    expect(validatePassword('StrongPass123')).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Auth Flow', () => {
  it('completes full registration flow', async () => {
    // Mock Appwrite responses
    const userData = { email: 'test@example.com', password: 'TestPass123' };

    // Test registration
    const result = await registerUser(userData);
    expect(result.success).toBe(true);

    // Test login
    const loginResult = await loginUser(userData);
    expect(loginResult.user).toBeDefined();
  });
});
```

---

*This authentication specification ensures secure user management and data isolation. All user data is properly segregated and protected according to security best practices.*
