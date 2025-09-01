# Credits System Implementation

## Overview

The Docify website now includes a comprehensive credits system that allows users to claim welcome credits and manage their credit balance. This system is built using Appwrite's account preferences feature, providing a simple and efficient way to store user credit data without requiring a separate database collection.

## Features

### 🎁 Welcome Credits
- **5 Free Credits**: New users can claim 5 welcome credits upon first login
- **One-time Claim**: Each user can only claim the welcome credits once
- **Automatic Tracking**: The system tracks whether a user has already claimed their welcome credits

### 💳 Credit Management
- **Real-time Balance**: Credits are stored in user account preferences and updated in real-time
- **Spend Credits**: Users can spend credits on premium features
- **Add Credits**: System supports adding credits (for admin purposes or future features)

## Technical Implementation

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Homepage UI   │───▶│  Credits Store   │───▶│ Appwrite Account│
│                 │    │                  │    │   Preferences   │
│ Claim 5 Credits │    │ State Management │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### File Structure

```
src/
├── lib/
│   └── stores/
│       └── credits.js          # Credits state management
└── routes/
    └── +page.svelte           # Homepage with claim button
```

### Data Structure

Credits are stored in Appwrite account preferences with the following structure:

```json
{
  "prefs": {
    "credits": 5,              // Current credit balance
    "creditsClaimed": true     // Whether welcome credits were claimed
  }
}
```

## API Reference

### Credits Store (`src/lib/stores/credits.js`)

#### State Variables
- `credits`: Writable store containing current credit balance
- `isLoading`: Loading state for async operations
- `error`: Error state for handling failures

#### Functions

##### `initializeCredits()`
Initializes the credits store with the user's current credit balance from Appwrite account preferences.

```javascript
await initializeCredits();
```

##### `claimCredits()`
Claims 5 welcome credits for the authenticated user. Can only be called once per user.

```javascript
const result = await claimCredits();
// Returns: { success: true, newCredits: 5 }
```

**Throws:**
- `User not authenticated` - If no user is logged in
- `You have already claimed your welcome credits!` - If user already claimed

##### `hasClaimedCredits()`
Checks if the current user has already claimed their welcome credits.

```javascript
const claimed = await hasClaimedCredits();
// Returns: boolean
```

##### `spendCredits(amount)`
Deducts the specified amount from the user's credit balance.

```javascript
const result = await spendCredits(3);
// Returns: { success: true, newCredits: 2 }
```

**Throws:**
- `User not authenticated` - If no user is logged in
- `Insufficient credits` - If user doesn't have enough credits

##### `addCredits(amount)`
Adds the specified amount to the user's credit balance.

```javascript
const result = await addCredits(10);
// Returns: { success: true, newCredits: 15 }
```

## User Experience

### Homepage Integration

The credits system is integrated into the homepage with:

1. **Claim Button**: Prominent "🎁 Claim 5 Credits" button in the hero section
2. **Smart Redirect**: If user is not logged in, clicking the button redirects to `/auth`
3. **Status Feedback**: Real-time status messages showing success/error states
4. **Visual States**: Button changes to "✅ Credits Claimed" after successful claim

### Button States

- **Default**: "🎁 Claim 5 Credits" (golden gradient)
- **Loading**: "Claiming..." with spinner
- **Success**: "✅ Credits Claimed" (disabled)
- **Error**: Shows error message below button

## Security Considerations

### Authentication Required
- All credit operations require user authentication
- Unauthenticated users are redirected to the auth page

### One-time Claim Protection
- Welcome credits can only be claimed once per user
- System tracks claim status in account preferences
- Prevents duplicate claims through server-side validation

### Data Integrity
- Credits are stored in Appwrite account preferences (server-side)
- All operations are atomic and validated
- Error handling prevents inconsistent states

## Error Handling

The system includes comprehensive error handling:

### Common Errors
- **Authentication Errors**: User not logged in
- **Already Claimed**: User trying to claim credits twice
- **Insufficient Credits**: Not enough credits for spending
- **Network Errors**: Appwrite API failures

### Error Display
- Errors are shown in user-friendly messages
- Technical errors are logged to console for debugging
- Users receive clear feedback on what went wrong

## Future Enhancements

### Planned Features
1. **Credit Display**: Show current balance in navbar/user profile
2. **Credit History**: Track credit transactions
3. **Premium Features**: Use credits for advanced functionality
4. **Admin Panel**: Manage user credits
5. **Credit Packages**: Allow users to purchase additional credits

### Database Migration
If the system grows beyond account preferences capacity, it can be migrated to a dedicated Appwrite database collection with minimal code changes.

## Testing

### Manual Testing Checklist
- [ ] Unauthenticated user clicks claim button → redirects to auth
- [ ] Authenticated user claims credits → receives 5 credits
- [ ] User tries to claim again → gets "already claimed" error
- [ ] Credits are persisted after page refresh
- [ ] Error states display correctly
- [ ] Loading states work properly

### Test Scenarios
1. **New User Flow**: Sign up → claim credits → verify balance
2. **Returning User**: Login → see "already claimed" state
3. **Error Handling**: Test with network issues, invalid auth

## Deployment Notes

### Environment Requirements
- Appwrite project with account preferences enabled
- User authentication system configured
- Proper CORS settings for frontend

### Configuration
No additional environment variables required. The system uses existing Appwrite configuration.

## Troubleshooting

### Common Issues

#### Credits Not Loading
- Check user authentication status
- Verify Appwrite account preferences are enabled
- Check browser console for API errors

#### Claim Button Not Working
- Ensure user is authenticated
- Check if credits were already claimed
- Verify Appwrite API connectivity

#### Credits Not Persisting
- Check Appwrite account preferences permissions
- Verify user has write access to their preferences
- Check for JavaScript errors in console

### Debug Information
Enable debug logging by checking browser console for:
- Credit initialization logs
- API call responses
- Error messages with stack traces

## Support

For issues or questions about the credits system:
1. Check this documentation
2. Review browser console for errors
3. Verify Appwrite configuration
4. Test with a fresh user account

---

*Last updated: January 2025*
*Version: 1.0.0*