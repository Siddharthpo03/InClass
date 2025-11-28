# Admin Account Management Guide

Since admin accounts cannot be created through the frontend, use these backend scripts to manage admin accounts.

## Prerequisites

1. Make sure your `.env` file has the correct `DATABASE_URL`
2. Ensure the database is running and accessible
3. Node.js and npm packages are installed

## Creating an Admin Account

### Method 1: Using npm script (Recommended)

```bash
npm run create-admin "Admin Name" "admin@example.com" "SecurePassword123" "ADM001"
```

**Parameters:**
- `Admin Name` - Full name of the admin
- `admin@example.com` - Email address (must be unique)
- `SecurePassword123` - Password (minimum 6 characters)
- `ADM001` - Roll number (optional, can be omitted)

**Example:**
```bash
npm run create-admin "John Doe" "admin@inclass.com" "AdminPass123" "ADM001"
```

### Method 2: Direct Node.js command

```bash
node scripts/createAdmin.js "Admin Name" "admin@example.com" "SecurePassword123" "ADM001"
```

## Listing All Admin Accounts

To see all existing admin accounts:

```bash
npm run list-admins
```

Or directly:
```bash
node scripts/listAdmins.js
```

## Deleting an Admin Account

To delete an admin account by email:

```bash
npm run delete-admin "admin@example.com"
```

Or directly:
```bash
node scripts/deleteAdmin.js "admin@example.com"
```

**⚠️ Warning:** This will delete the admin account permanently. The script will wait 5 seconds before deletion to give you time to cancel (Ctrl+C).

## Alternative: Direct SQL Method

If you prefer to use SQL directly, you can connect to your PostgreSQL database and run:

```sql
-- Hash the password first (use bcrypt with 10 rounds)
-- For example, if password is "AdminPass123", you need to hash it
-- You can use an online bcrypt generator or Node.js

INSERT INTO users (name, email, password, role, roll_no)
VALUES (
  'Admin Name',
  'admin@example.com',
  '$2b$10$hashedPasswordHere', -- Replace with actual bcrypt hash
  'admin',
  'ADM001' -- Optional
);
```

**Note:** For security, it's recommended to use the script method which properly hashes passwords.

## Admin Login

Once an admin account is created:

1. Go to the login page
2. Enter the admin email address
3. The system will automatically detect it's an admin account
4. The role dropdown will be hidden
5. Enter the password
6. Click "Sign In"
7. You'll be redirected to `/admin/dashboard`

## Security Notes

- Admin passwords are hashed using bcrypt (10 rounds)
- Admin accounts can only be created from the backend
- Admin email addresses are checked automatically on login
- Never share admin credentials
- Use strong passwords for admin accounts
- Regularly review admin accounts using `list-admins`

## Troubleshooting

### "Email already exists" error
- The email is already registered (could be student/faculty/admin)
- Use `list-admins` to check existing admin accounts
- Use SQL to check all users: `SELECT email, role FROM users WHERE email = 'your@email.com';`

### "Database connection failed"
- Check your `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Verify database credentials

### "Invalid email format"
- Make sure email follows standard format: `user@domain.com`
- Check for typos in the email address

