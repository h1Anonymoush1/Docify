import {
  PUBLIC_APPWRITE_ENDPOINT,
  PUBLIC_APPWRITE_PROJECT_ID,
} from "$env/static/public";

import { Client, Account, Databases, OAuthProvider } from "appwrite";

// Validate required environment variables
if (!PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('PUBLIC_APPWRITE_ENDPOINT is required but not set');
}

if (!PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('PUBLIC_APPWRITE_PROJECT_ID is required but not set');
}

const client = new Client()
  .setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
  .setProject(PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, OAuthProvider };
