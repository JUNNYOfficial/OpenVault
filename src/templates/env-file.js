/**
 * Environment File Template
 * Looks like a legitimate .env.example file for a web application.
 */

module.exports = {
  header: `# ==========================================
# Environment Configuration
# ==========================================
# Copy this file to .env and fill in the values
# DO NOT commit .env files to version control
# ==========================================
`,
  sections: [
    `# ----------------------------------------
# Application Settings
# ----------------------------------------
APP_NAME="My Application"
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:3000
APP_PORT=3000
APP_KEY=base64:your-app-key-here

# ----------------------------------------
# Logging
# ----------------------------------------
LOG_LEVEL=debug
LOG_CHANNEL=stack
LOG_SLACK_WEBHOOK_URL=

# ----------------------------------------
# Database Configuration
# ----------------------------------------
DB_CONNECTION=postgresql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=myapp_dev
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_SSL_MODE=disable
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
`,
    `# ----------------------------------------
# Authentication & Security
# ----------------------------------------
JWT_SECRET=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URL=http://localhost:3000/auth/github/callback

# Session
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
`,
    `# ----------------------------------------
# Mail Configuration
# ----------------------------------------
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="\${APP_NAME}"

# ----------------------------------------
# File Storage
# ----------------------------------------
FILESYSTEM_DISK=local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_URL=
AWS_ENDPOINT=
`,
    `# ----------------------------------------
# Third-Party Services
# ----------------------------------------
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=

SENTRY_DSN=
SENTRY_ENVIRONMENT=\${APP_ENV}

# ----------------------------------------
# Feature Flags
# ----------------------------------------
FEATURE_NEW_DASHBOARD=false
FEATURE_BETA_API=false
FEATURE_ANALYTICS=true
`,
    `# ----------------------------------------
# Development
# ----------------------------------------
HOT_RELOAD=true
SOURCE_MAPS=true
WEBPACK_DEV_SERVER_PORT=8080

# Testing
TEST_DB_DATABASE=myapp_test
TEST_DB_USERNAME=postgres
TEST_DB_PASSWORD=secret

# CI/CD
CI_PIPELINE_ID=
CI_COMMIT_SHA=
CI_BRANCH=
`  ],
  footer: `
# ==========================================
# End of configuration
# ==========================================
`,
  slots: 5
};
