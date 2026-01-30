# JWT-based Authentication with MFA

This document describes the JWT-based authentication system with Multi-Factor Authentication (MFA) implemented for the Local Vendor AI Marketplace.

## Features

### Core Authentication
- **JWT Token-based Authentication**: Secure access tokens with configurable expiration
- **Refresh Token System**: Long-lived refresh tokens for seamless user experience
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Phone Number Verification**: SMS-based phone number verification during registration
- **Rate Limiting**: Protection against brute force attacks

### Multi-Factor Authentication (MFA)
- **SMS MFA**: SMS-based second factor authentication using Twilio
- **Email MFA**: Email-based second factor authentication using SMTP
- **MFA Setup/Disable**: Users can enable/disable MFA with proper verification
- **Backup Codes**: Support for backup authentication codes (future enhancement)

### Security Features
- **Industry-standard Encryption**: All personal data encrypted using bcrypt
- **Session Management**: Configurable session timeouts
- **Login Notifications**: Optional notifications for login events
- **Password Reset**: Secure password reset via email or SMS
- **User Enumeration Protection**: Consistent responses to prevent user discovery

## API Endpoints

### Registration & Login
- `POST /api/auth/register` - User registration with phone verification
- `POST /api/auth/login` - User login with optional MFA
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate refresh token

### Phone Verification
- `POST /api/auth/verify/phone/send` - Send phone verification code
- `POST /api/auth/verify/phone` - Verify phone number with code

### MFA Management
- `POST /api/auth/mfa/setup` - Setup MFA (SMS or Email)
- `POST /api/auth/mfa/setup/confirm` - Confirm MFA setup with verification code
- `POST /api/auth/mfa/verify` - Verify MFA code during login
- `POST /api/auth/mfa/disable` - Disable MFA with password confirmation

### Password Management
- `POST /api/auth/password/reset` - Request password reset
- `POST /api/auth/password/reset/confirm` - Confirm password reset with token/code

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=7d

# Password Hashing
BCRYPT_ROUNDS=12

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Local Vendor AI <noreply@localvendorai.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Security Measures

### Data Protection (Requirement 9.1)
- All passwords are hashed using bcrypt with configurable salt rounds
- JWT tokens are signed with strong secrets
- Sensitive data is masked in logs
- Database connections use encrypted connections

### Multi-Factor Authentication (Requirement 9.2)
- SMS-based MFA using Twilio integration
- Email-based MFA using SMTP
- MFA codes expire after 5-10 minutes
- Rate limiting on MFA attempts
- Secure MFA setup and disable flows

### Additional Security Features
- Phone number verification during registration
- Password complexity requirements
- Session timeout configuration
- Login attempt rate limiting
- Secure password reset flows
- User enumeration protection

## Usage Examples

### User Registration
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    phoneNumber: '+919876543210',
    email: 'john@example.com',
    password: 'SecurePass123!',
    userType: 'buyer',
    acceptTerms: true
  })
});
```

### User Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+919876543210',
    password: 'SecurePass123!'
  })
});
```

### MFA Setup
```javascript
// 1. Setup MFA
const setupResponse = await fetch('/api/auth/mfa/setup', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    method: 'sms',
    phoneNumber: '+919876543210'
  })
});

// 2. Confirm MFA setup with received code
const confirmResponse = await fetch('/api/auth/mfa/setup/confirm', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    code: '123456'
  })
});
```

## Error Handling

The authentication system provides consistent error responses:

```javascript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...],
    "timestamp": "2023-..."
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Input validation failed
- `INVALID_CREDENTIALS` - Login credentials are incorrect
- `MFA_REQUIRED` - MFA verification needed
- `INVALID_TOKEN` - JWT token is invalid or expired
- `RATE_LIMITED` - Too many requests

## Testing

The authentication system includes comprehensive tests covering:
- User registration and login flows
- Phone number verification
- MFA setup and verification
- Password reset functionality
- Token refresh and logout
- Error handling and edge cases

Run tests with:
```bash
npm test -- --testPathPattern=auth.test.ts
```

## Integration Notes

### SMS Service Integration
The system uses Twilio for SMS delivery. Ensure proper Twilio credentials are configured. In development, SMS sending can be disabled by omitting Twilio configuration.

### Email Service Integration
Email functionality uses Nodemailer with SMTP. Configure your SMTP provider (Gmail, SendGrid, etc.) for email delivery.

### Database Requirements
- PostgreSQL for user data storage
- Redis for session management and temporary codes
- Proper database indexes for performance

### Frontend Integration
The frontend should handle:
- JWT token storage and refresh
- MFA verification flows
- Phone number verification
- Password reset flows
- Error display and user feedback

## Security Considerations

1. **Token Storage**: Store JWT tokens securely on the client side
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implement additional rate limiting at the API gateway level
4. **Monitoring**: Monitor for suspicious authentication patterns
5. **Key Rotation**: Regularly rotate JWT secrets
6. **Backup Codes**: Consider implementing backup codes for MFA recovery
7. **Audit Logging**: Log all authentication events for security auditing