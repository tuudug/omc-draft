# Admin Authentication Setup

## Overview

The admin panel is now protected with password authentication. Only authorized users with the correct password can create stages and matches.

## Setting Up Admin Password

1. Open your `.env.local` file
2. Find the `ADMIN_PASSWORD` variable
3. Set it to a secure password:

```env
ADMIN_PASSWORD=your_secure_password_here
```

**Important Security Notes:**

- Choose a strong password (12+ characters, mixed case, numbers, symbols)
- Never commit `.env.local` to version control (already in .gitignore)
- Change the password regularly
- Don't share the password publicly

## Using the Admin Panel

### Step 1: Access Admin Login

- Visit your site homepage
- Click "Admin Panel" button
- You'll be redirected to `/admin/login`

### Step 2: Enter Password

- Enter the password you set in `.env.local`
- Click "Access Admin Panel"
- You'll be authenticated and redirected to the admin dashboard

### Step 3: Create Stages and Matches

- Once authenticated, you can access:
  - `/admin/stages` - Create tournament stages
  - `/admin/matches` - Create matches
  - `/admin` - Admin dashboard

### Session Management

- Authentication persists for your browser session
- Uses `sessionStorage` (cleared when browser closes)
- Click "Logout" to end session manually
- Redirects to login if session expires

## Security Features

### What's Protected

✅ `/admin` - Admin dashboard  
✅ `/admin/stages` - Stage creation  
✅ `/admin/matches` - Match creation  
✅ All admin API routes

### What's Public

✅ `/` - Home page  
✅ `/draft/[id]` - Draft interface (with token)  
✅ `/admin/login` - Login page

## Authentication Flow

```
1. User visits /admin/*
   ↓
2. Check if authenticated (sessionStorage)
   ↓
3. If NOT authenticated → Redirect to /admin/login
   ↓
4. User enters password
   ↓
5. POST /api/admin/auth with password
   ↓
6. Server compares with ADMIN_PASSWORD env var
   ↓
7. If match → Return success + set sessionStorage
   ↓
8. Redirect to admin dashboard
   ↓
9. Can now access all admin pages
```

## For Production Deployment

### Vercel

1. Go to Project Settings → Environment Variables
2. Add `ADMIN_PASSWORD` with your secure password
3. Redeploy

### Other Platforms

Add `ADMIN_PASSWORD` environment variable through your platform's dashboard or CLI.

## Troubleshooting

### "Invalid password" error

- Double-check your `.env.local` file
- Ensure no extra spaces before/after the password
- Restart dev server after changing `.env.local`

### Redirected to login repeatedly

- Clear browser cache and sessionStorage
- Check browser console for errors
- Verify `ADMIN_PASSWORD` is set in environment

### Can't access admin pages after login

- Check browser console (F12)
- Verify sessionStorage has `admin_authenticated = true`
- Try logging out and back in

## Changing Password

1. Update `ADMIN_PASSWORD` in `.env.local`
2. Restart development server
3. All users will need to re-authenticate with new password
4. For production, update environment variable and redeploy

## Future Enhancements

Possible improvements for better security:

- [ ] JWT tokens instead of sessionStorage
- [ ] Rate limiting on login attempts
- [ ] Password reset functionality
- [ ] Multi-admin support with different passwords
- [ ] Two-factor authentication
- [ ] IP whitelist for admin access
- [ ] Audit logs for admin actions

## Example Usage

### Development

```bash
# .env.local
ADMIN_PASSWORD=devpassword123

# Use this password at http://localhost:3000/admin/login
```

### Production

```bash
# Set in Vercel/hosting platform
ADMIN_PASSWORD=YourVerySecureProductionPassword2024!@#

# Use this password at https://yourdomain.com/admin/login
```

---

**Remember**: The password is the only barrier to admin access. Keep it secure!
