# Gmail App Password Setup Guide

## Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/security
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the prompts to set up 2-Step Verification if not already enabled
4. You'll need your phone number to receive verification codes

## Step 2: Generate App Password

1. After 2-Step Verification is enabled, go back to: https://myaccount.google.com/security
2. Under "Signing in to Google", click on "App passwords"
3. You might need to sign in again
4. Select "Mail" from the dropdown
5. Select "Other (Custom name)" and type "Smart Restro"
6. Click "Generate"
7. Google will show you a 16-character password like: `abcd efgh ijkl mnop`
8. **Copy this password immediately** (you won't be able to see it again)

## Step 3: Update Your .env File

Replace the placeholder in your `backend/.env` file:

**Before:**
```
EMAIL_PASS=your_16_character_app_password_here
```

**After:**
```
EMAIL_PASS=abcdefghijklmnop
```

**Important:** Remove all spaces from the app password!

## Step 4: Restart Backend Server

After updating the .env file, restart your backend server for changes to take effect.

## Troubleshooting

### "Invalid login: 535-5.7.8 Username and Password not accepted"
- Make sure 2-Step Verification is enabled
- Double-check the app password (no spaces)
- Make sure you're using the app password, not your regular Gmail password

### "Less secure app access"
- This is not needed with app passwords
- App passwords are the secure way to access Gmail from applications

### Still not working?
- Try generating a new app password
- Make sure your Gmail account doesn't have any security restrictions
- Check that the email address in .env is correct