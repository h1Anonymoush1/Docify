#!/usr/bin/env node

/**
 * Test script to verify Docify setup
 * Run with: node scripts/test-setup.js
 */

const { Client, Databases, Account } = require('node-appwrite');

// Configuration
const config = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || 'your-project-id',
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.DATABASE_ID || 'docify_db',
  documentsCollectionId: process.env.DOCUMENTS_COLLECTION_ID || 'documents',
  analysisCollectionId: process.env.ANALYSIS_COLLECTION_ID || 'analysis_results'
};

async function testConnection() {
  console.log('🔍 Testing Appwrite connection...\n');

  const client = new Client();
  client
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const databases = new Databases(client);

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbInfo = await databases.get(config.databaseId);
    console.log('✅ Database connection successful:', dbInfo.name);

    // Test collections
    console.log('\n📋 Testing collections...');

    try {
      const documentsCollection = await databases.getCollection(
        config.databaseId,
        config.documentsCollectionId
      );
      console.log('✅ Documents collection found:', documentsCollection.name);
    } catch (error) {
      console.log('❌ Documents collection not found or accessible');
      console.log('   Make sure to create the collection with ID:', config.documentsCollectionId);
    }

    try {
      const analysisCollection = await databases.getCollection(
        config.databaseId,
        config.analysisCollectionId
      );
      console.log('✅ Analysis collection found:', analysisCollection.name);
    } catch (error) {
      console.log('❌ Analysis collection not found or accessible');
      console.log('   Make sure to create the collection with ID:', config.analysisCollectionId);
    }

    console.log('\n🎉 Basic setup test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy the functions using Appwrite CLI or Console');
    console.log('2. Set up your frontend environment variables');
    console.log('3. Test the complete workflow');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID');
    console.log('2. Verify your APPWRITE_API_KEY has the correct permissions');
    console.log('3. Make sure the database exists and is accessible');
    process.exit(1);
  }
}

async function testEnvironmentVariables() {
  console.log('🔧 Checking environment variables...\n');

  const requiredVars = [
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'DATABASE_ID'
  ];

  let missingVars = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      console.log(`✅ ${varName}: ${varName.includes('KEY') ? '[HIDDEN]' : process.env[varName]}`);
    }
  });

  if (missingVars.length > 0) {
    console.log('\n❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Create a .env file with these variables.');
    return false;
  }

  console.log('\n✅ All required environment variables are set!\n');
  return true;
}

async function main() {
  console.log('🚀 Docify Setup Test\n');
  console.log('=' .repeat(50));

  // Test environment variables first
  const envOk = await testEnvironmentVariables();
  if (!envOk) {
    process.exit(1);
  }

  // Test Appwrite connection
  await testConnection();

  console.log('\n' + '='.repeat(50));
  console.log('✨ Setup verification complete!');
}

// Run the test
main().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
