import { Client, Account, Databases, Storage } from 'appwrite';

// Appwrite configuration
const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id');

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export the client for direct use
export { client };

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

export const loginWithEmail = async (email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error) {
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
