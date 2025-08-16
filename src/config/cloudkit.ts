// CloudKit Configuration for TuneBoxed Password Reset
// Update these values with your actual CloudKit credentials

export interface CloudKitConfig {
  containerIdentifier: string;
  environment: 'development' | 'production';
  serverToServerKeyAuth: string;
  privateKey: string;
  databaseType: 'public' | 'private';
  apiEndpoint: string;
}

export const CLOUDKIT_CONFIG: CloudKitConfig = {
  containerIdentifier: 'iCloud.AuraBrand.TuneBoxed',
  environment: 'development', // Change to 'production' when ready
  serverToServerKeyAuth: 'a15e8398eb9f01cab4b5f3cd9d65c4bc6143fa88d15067de97860560e71df9f0', // CloudKit Server-to-Server Key ID
  privateKey: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJBYILxe5I+owLrIktPuzy59saOGMq4w+kaKrNJzgLrhoAoGCCqGSM49
AwEHoUQDQgAEEZhnE/DpSol682PsGMQNmx5RPLrTnRMkL9ekrddQF/FiYJD00mut
7SuRpNl86toObo7BIm3ThhpzT0ghqltDQg==
-----END EC PRIVATE KEY-----`,
  databaseType: 'public',
  apiEndpoint: 'https://api.apple-cloudkit.com/database/1'
};

// CloudKit Record Types - Update these to match your actual record schema
export const CLOUDKIT_RECORD_TYPES = {
  USER: 'User',
  RESET_TOKEN: 'PasswordResetToken'
};

// CloudKit Field Names - Update these to match your actual field names
export const CLOUDKIT_FIELDS = {
  EMAIL: 'email',
  PASSWORD: 'password',
  RESET_TOKEN: 'resetToken',
  TOKEN_EXPIRY: 'resetTokenExpiry',
  USER_ID: 'userId'
};

/**
 * Setup Instructions:
 * 
 * 1. Go to Apple Developer Console (developer.apple.com)
 * 2. Navigate to CloudKit Dashboard
 * 3. Select your app's container
 * 4. Go to API Access tab
 * 5. Generate a Server-to-Server Key
 * 6. Update the CLOUDKIT_CONFIG above with your values
 * 
 * Required CloudKit Schema:
 * 
 * User Record Type:
 * - email (String, Queryable, Searchable)
 * - password (String) 
 * - resetToken (String, Queryable) [Optional]
 * - tokenExpiry (Date/Time) [Optional]
 * 
 * Make sure your CloudKit database has the proper indexes for querying by:
 * - email
 * - resetToken
 */ 