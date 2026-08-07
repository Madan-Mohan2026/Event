export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'super_secret_government_key_12345',
  EXPIRES_IN: '8h'
};
