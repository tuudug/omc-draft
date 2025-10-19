# 🔐 Admin Authentication Added!

## What Changed

Your osu! Mongolia Cup 2025 Draft System now has **password-protected admin access**!

### New Features

✅ **Password-protected admin panel**  
✅ **Login page** at `/admin/login`  
✅ **Session-based authentication**  
✅ **Logout functionality**  
✅ **Admin dashboard** at `/admin`

### Updated Pages

- **Home Page** (`/`) - Now shows single "Admin Panel" button instead of direct links
- **Admin Login** (`/admin/login`) - New password entry page
- **Admin Dashboard** (`/admin`) - New central hub with logout button
- **Stages/Matches** - Now require authentication to access

## Quick Setup

### 1. Set Your Admin Password

Open `.env.local` and set a secure password:

```env
ADMIN_PASSWORD=YourSecurePassword123!
```

**Important**: Choose a strong password! This is the only protection for your admin panel.

### 2. Restart Dev Server

```bash
# Press Ctrl+C to stop
npm run dev
```

### 3. Test the Authentication

1. Visit http://localhost:3000
2. Click "Admin Panel"
3. Enter your password from `.env.local`
4. You're in! Create stages and matches as before

## How It Works

```
User Flow:
1. Visit homepage → Click "Admin Panel"
2. Redirected to /admin/login
3. Enter password
4. Server validates against ADMIN_PASSWORD
5. Success → sessionStorage set + redirect to /admin
6. Access stages/matches pages (protected)
7. Click "Logout" to end session
```

### Authentication Storage

- Uses **sessionStorage** (cleared when browser closes)
- No cookies or JWT needed (simple use case)
- Session persists across page refreshes
- Automatic redirect to login if not authenticated

## Security Notes

### ✅ What's Protected

- `/admin` - Admin dashboard
- `/admin/stages` - Stage creation
- `/admin/matches` - Match creation
- All require valid session

### ✅ What's Still Public

- `/` - Home page
- `/draft/[id]` - Draft rooms (with token)
- `/admin/login` - Login page itself

### 🔒 Best Practices

1. **Use strong passwords**: 12+ characters, mixed case, numbers, symbols
2. **Change regularly**: Update password periodically
3. **Don't share**: Only give to trusted tournament staff
4. **Production ready**: Set different password for production
5. **HTTPS**: Always use HTTPS in production

## Files Created/Modified

### New Files

- `lib/admin-context.tsx` - Auth context provider
- `app/api/admin/auth/route.ts` - Auth API endpoint
- `app/admin/login/page.tsx` - Login page UI
- `app/admin/page.tsx` - Admin dashboard
- `ADMIN_AUTH.md` - Detailed auth documentation

### Modified Files

- `app/layout.tsx` - Added AdminProvider wrapper
- `app/page.tsx` - Updated to single Admin Panel button
- `app/admin/stages/page.tsx` - Added auth check
- `app/admin/matches/page.tsx` - Added auth check
- `.env.local` - Added ADMIN_PASSWORD
- `.env.local.example` - Added ADMIN_PASSWORD

## Deployment Checklist

When deploying to production:

- [ ] Set `ADMIN_PASSWORD` in production environment variables
- [ ] Use a **different** password than development
- [ ] Verify HTTPS is enabled
- [ ] Test login functionality on production
- [ ] Share password securely with authorized staff only
- [ ] Document who has access

## Troubleshooting

### Can't login with correct password

1. Check `.env.local` has no extra spaces
2. Restart dev server
3. Clear browser cache/sessionStorage
4. Check browser console for errors

### Redirected to login repeatedly

1. Clear sessionStorage: `sessionStorage.clear()` in console
2. Check if `ADMIN_PASSWORD` environment variable is set
3. Verify API route `/api/admin/auth` is accessible

### Forgot admin password

1. Check `.env.local` file
2. For production, check hosting platform's environment variables
3. Update and redeploy if needed

## Advanced Usage

### Multiple Admins

Currently uses single password. For multiple admins:

- Use same password for all
- Or implement user accounts (future enhancement)

### Session Duration

- Lasts until browser closes
- No automatic timeout
- Can add expiration logic if needed

### Logout

```typescript
// Programmatic logout
logout(); // from useAdmin hook
```

## What's Next?

Current authentication is simple but effective. Future enhancements could include:

- [ ] Multiple admin accounts
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] IP whitelist
- [ ] Audit logging
- [ ] Rate limiting on login attempts

---

**Your admin panel is now secure!** 🔐

Use your password wisely and keep it safe!
