import {
  PUBLIC_APPWRITE_ENDPOINT,
  PUBLIC_APPWRITE_PROJECT_ID,
} from "$env/static/public";

import { Client, Account, Databases, OAuthProvider } from "appwrite";

// Provide fallback values for development
const endpoint = PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = PUBLIC_APPWRITE_PROJECT_ID || 'demo-project';

// Log warnings for missing environment variables in development
if (!PUBLIC_APPWRITE_ENDPOINT || !PUBLIC_APPWRITE_PROJECT_ID) {
  console.warn('⚠️ Appwrite environment variables not set. Using fallback values. Please set PUBLIC_APPWRITE_ENDPOINT and PUBLIC_APPWRITE_PROJECT_ID in your .env file.');
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, OAuthProvider };
