# SoundWave authentication setup

The authentication module implements registration, six-digit email OTP verification, login, JWT access tokens, rotating HttpOnly refresh cookies, logout, forgot password, and OTP-based password reset.

## Required environment variables

Configure these values in the IntelliJ Spring Boot Run Configuration. Do not put real credentials in `application.properties` or commit them to Git.

```text
MAIL_USERNAME=<Gmail sender address>
MAIL_PASSWORD=<Gmail app password without spaces>
MAIL_FROM=<same Gmail sender address>
JWT_SECRET=<random secret with at least 32 characters>
```

For local frontend development, the default allowed origins are `http://127.0.0.1:4174` and `http://localhost:4174`.

## Required role data

The `roles` table must contain the three stable role codes below. Registration always assigns `LISTENER`; clients never choose a role.

```sql
IF NOT EXISTS (SELECT 1 FROM roles WHERE code = 'LISTENER')
    INSERT INTO roles (code, name, description, created_at)
    VALUES ('LISTENER', N'Listener', N'Standard SoundWave listener account', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM roles WHERE code = 'STAFF')
    INSERT INTO roles (code, name, description, created_at)
    VALUES ('STAFF', N'Staff', N'Content moderation account', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM roles WHERE code = 'ADMIN')
    INSERT INTO roles (code, name, description, created_at)
    VALUES ('ADMIN', N'Administrator', N'System administration account', SYSUTCDATETIME());
```

## Authentication endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/verification-otp
POST /api/v1/auth/login
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

OTP and refresh token plaintext values are never stored in the database. Tests mock email delivery and do not require real Gmail credentials.
