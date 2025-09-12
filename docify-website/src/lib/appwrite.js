import { Client, Account, Databases, Storage, ID } from 'appwrite';

// Check for required environment variables
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const documentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID;

if (!endpoint || !projectId || !databaseId || !documentsCollectionId) {
    console.warn('⚠️  Appwrite environment variables are not properly configured. Some features may not work correctly.');
    console.warn('Missing variables:', {
        NEXT_PUBLIC_APPWRITE_ENDPOINT: !endpoint,
        NEXT_PUBLIC_APPWRITE_PROJECT_ID: !projectId,
        NEXT_PUBLIC_APPWRITE_DATABASE_ID: !databaseId,
        NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID: !documentsCollectionId
    });
}

// Appwrite configuration
const client = new Client();

client
    .setEndpoint(endpoint || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(projectId || 'your-project-id');

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export the client and ID for direct use
export { client, ID };

// Appwrite service IDs (update these with your actual service IDs)
export const APPWRITE_CONFIG = {
    databaseId: databaseId || 'your-database-id',
    userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID || 'users',
    documentsCollectionId: documentsCollectionId || 'documents_table',
    storageBucketId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'documents',
};

// Helper functions
export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        console.log('No authenticated user');
        return null;
    }
};

export const getCurrentSession = async () => {
    try {
        return await account.getSession('current');
    } catch (error) {
        console.log('No active session');
        return null;
    }
};

export const refreshSession = async () => {
    try {
        const session = await account.updateSession('current');
        return session;
    } catch (error) {
        console.error('Failed to refresh session:', error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await account.deleteSession('current');
        return true;
    } catch (error) {
        throw error;
    }
};

// Email OTP functions
export const sendEmailOTP = async (email) => {
    try {
        const token = await account.createEmailToken(ID.unique(), email);
        console.log('Email OTP sent successfully');
        return token;
    } catch (error) {
        console.error('Failed to send email OTP:', error);
        throw error;
    }
};

export const verifyEmailOTP = async (userId, secret, email) => {
    try {
        const session = await account.createSession(userId, secret);
        console.log('Email OTP verified successfully');
        return session;
    } catch (error) {
        console.error('Failed to verify email OTP:', error);
        throw error;
    }
};



export const updateUserEmail = async (email) => {
    try {
        const user = await account.updateEmail(email);
        console.log('User email updated successfully');
        return user;
    } catch (error) {
        console.error('Failed to update user email:', error);
        throw error;
    }
};

export const updateUserPrefs = async (prefs) => {
    try {
        const user = await account.updatePrefs(prefs);
        console.log('User preferences updated successfully');
        return user;
    } catch (error) {
        console.error('Failed to update user preferences:', error);
        throw error;
    }
};

// Credit management functions
export const getUserCredits = async () => {
    try {
        const user = await account.get();
        const credits = user.prefs?.credits || 0;
        console.log('Current user credits:', credits);
        return credits;
    } catch (error) {
        console.error('Failed to get user credits:', error);
        throw error;
    }
};

/**
 * @param {string} reason - The reason for credit deduction
 * @param {string|null|undefined} documentId - The document ID associated with the credit deduction
 * @returns {Promise<Object>} - Result object with success status and new credit balance
 */
export const deductUserCredit = async (reason = 'document_processing', documentId) => {
    // Ensure documentId is handled properly
    const docId = documentId;
    try {
        const user = await account.get();
        const currentCredits = user.prefs?.credits || 0;

        if (currentCredits < 1) {
            throw new Error('Insufficient credits');
        }

        const newCredits = currentCredits - 1;

        // Prepare updated preferences
        const updatedPrefs = {
            ...user.prefs,
            credits: newCredits,
            last_credit_update: Math.floor(Date.now() / 1000)
        };

        // Add to credit history
        if (!updatedPrefs.credit_history) {
            updatedPrefs.credit_history = [];
        }
        updatedPrefs.credit_history.push({
            amount: -1,
            reason: reason,
            timestamp: Math.floor(Date.now() / 1000),
            document_id: docId || 'unknown'
        });

        // Update user preferences
        const updatedUser = await account.updatePrefs(updatedPrefs);

        console.log(`Credit deducted: ${currentCredits} → ${newCredits}`);
        return { success: true, credits: newCredits, user: updatedUser };

    } catch (error) {
        console.error('Failed to deduct user credit:', error);
        throw error;
    }
};
