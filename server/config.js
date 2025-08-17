// CloudKit Configuration for Server
const CLOUDKIT_CONFIG = {
  containerIdentifier: 'iCloud.AuraBrand.TuneBoxed',
  environment: 'development', // Change to 'production' when ready
  serverToServerKeyAuth: 'a15e8398eb9f01cab4b5f3cd9d65c4bc6143fa88d15067de97860560e71df9f0',
  privateKey: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJBYILxe5I+owLrIktPuzy59saOGMq4w+kaKrNJzgLrhoAoGCCqGSM49
AwEHoUQDQgAEEZhnE/DpSol682PsGMQNmx5RPLrTnRMkL9ekrddQF/FiYJD00mut
7SuRpNl86toObo7BIm3ThhpzT0ghqltDQg==
-----END EC PRIVATE KEY-----`,
  databaseType: 'public',
  apiEndpoint: 'https://api.apple-cloudkit.com/database/1'
};

const SERVER_CONFIG = {
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development'
};

module.exports = {
  CLOUDKIT_CONFIG,
  SERVER_CONFIG
}; 