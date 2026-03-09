// CloudKit Configuration for Server
const CLOUDKIT_CONFIG = {
  containerIdentifier: process.env.CK_CONTAINER || 'iCloud.AuraBrand.TuneBoxed',
  environment: process.env.CK_ENV || 'production',  // Changed default to production
  serverToServerKeyAuth: process.env.CK_KEY_ID || '',
  privateKey: process.env.CK_PRIVATE_KEY || '',
  databaseType: process.env.CK_DB || 'public',
  apiEndpoint: 'https://api.apple-cloudkit.com/database/1'
};

// Validate required environment variables
if (!CLOUDKIT_CONFIG.serverToServerKeyAuth || !CLOUDKIT_CONFIG.privateKey) {
  console.error('❌ Missing required CloudKit environment variables:');
  console.error('   CK_KEY_ID: Your CloudKit Key ID');
  console.error('   CK_PRIVATE_KEY: Your EC private key (PEM format)');
  console.error('   CK_CONTAINER: Your CloudKit container identifier');
  console.error('   CK_ENV: Environment (development/production)');
  process.exit(1);
}

const SERVER_CONFIG = {
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development'
};

module.exports = {
  CLOUDKIT_CONFIG,
  SERVER_CONFIG
}; 