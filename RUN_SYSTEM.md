# How to Run Smart Restro System

## Prerequisites
- Node.js installed
- MongoDB running locally on default port (27017)

## Starting the System

### 1. Start Backend Server
```bash
cd backend
npm install  # (if not already done)
node server.js
```
- Backend will run on: http://localhost:5002
- Default admin credentials: username=`admin`, password=`admin123`, role=`ADMIN`

### 2. Start Frontend
```bash
# From root directory
npm install  # (if not already done)
npm run dev
```
- Frontend will run on: http://localhost:3001 (or next available port)

## Using the System

### Admin Login
1. Open http://localhost:3001 in your browser
2. Select "Administrator" role
3. Enter username: `admin`
4. Enter password: `admin123`
5. Click "Sign In"

### Creating Staff Accounts
1. After admin login, click "Staff Management" in the sidebar
2. Click "REGISTER NEW STAFF" button
3. Fill in the form (password is auto-generated for security)
4. Click "Save Account"
5. Credentials will be emailed to the staff member (if email is configured)
6. If email is not configured, manual credentials will be displayed

### Email Setup (Optional)
- See SETUP_EMAIL.md for Gmail configuration instructions
- System works without email - shows manual credentials instead

## Troubleshooting
- If login fails: Check that both servers are running
- If email fails: Check SETUP_EMAIL.md for configuration
- If port conflicts: Backend uses 5002, frontend uses 3001+