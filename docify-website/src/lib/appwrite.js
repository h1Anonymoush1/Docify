import { Client, Account, Databases, Storage, ID } from 'appwrite';

// Appwrite configuration
const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id');

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export the client and ID for direct use
export { client, ID };

// Appwrite service IDs (update these with your actual service IDs)
export const APPWRITE_CONFIG = {
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'your-database-id',
    userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID || 'users',
    documentsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID || 'documents',
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
