# Cloudflare D1 Database Setup Guide

This guide will help you set up a Cloudflare D1 database and bind it to your Worker.

## Prerequisites

1. Install Wrangler CLI (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

## Step 1: Create a D1 Database

Create a new D1 database named `todo-db`:

```bash
wrangler d1 create todo-db
```

**Output will look like:**
```
✅ Successfully created DB 'todo-db'!

[[d1_databases]]
binding = "DB"
database_name = "todo-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**⚠️ IMPORTANT:** Copy the `database_id` from the output!

## Step 2: Update wrangler.jsonc

Update the `database_id` in `wrangler.jsonc` with the ID from Step 1:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "todo-db",
    "database_id": "YOUR_DATABASE_ID_HERE"  // ← Replace with actual ID
  }
]
```

## Step 3: Create the Database Schema

Run the SQL schema to create the `todos` table:

```bash
wrangler d1 execute todo-db --file=./schema.sql
```

Or execute SQL directly:

```bash
wrangler d1 execute todo-db --command="CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete'
);"
```

## Step 4: Verify the Table was Created

Check that the table exists:

```bash
wrangler d1 execute todo-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see `todos` in the output.

## Step 5: Test Locally (Optional)

Test your Worker locally with the D1 database:

```bash
wrangler dev
```

This will:
- Start a local development server
- Use your local D1 database (stored in `.wrangler/state/`)
- Allow you to test your API endpoints

## Step 6: Deploy to Cloudflare

Deploy your Worker:

```bash
wrangler deploy
```

## Useful D1 Commands

### List all databases:
```bash
wrangler d1 list
```

### Execute SQL queries:
```bash
# Execute a SQL file
wrangler d1 execute todo-db --file=./schema.sql

# Execute a SQL command
wrangler d1 execute todo-db --command="SELECT * FROM todos;"

# Execute SQL interactively
wrangler d1 execute todo-db
```

### View database info:
```bash
wrangler d1 info todo-db
```

### Delete a database (⚠️ destructive):
```bash
wrangler d1 delete todo-db
```

## Local Development vs Production

### Local Development (`wrangler dev`):
- Uses a local SQLite database in `.wrangler/state/`
- Changes are isolated to your machine
- Good for testing

### Production (`wrangler deploy`):
- Uses the actual Cloudflare D1 database
- Changes affect production
- Requires proper database_id in wrangler.jsonc

## Troubleshooting

### Error: "Database not found"
- Make sure you've created the database: `wrangler d1 create todo-db`
- Verify the `database_id` in `wrangler.jsonc` matches the created database

### Error: "Table doesn't exist"
- Run the schema: `wrangler d1 execute todo-db --file=./schema.sql`
- For local dev, the schema needs to be run separately: `wrangler d1 execute todo-db --local --file=./schema.sql`

### Error: "Binding not found"
- Check that `d1_databases` is properly configured in `wrangler.jsonc`
- Make sure the binding name matches what you use in code (`env.DB`)

## Quick Reference

```bash
# 1. Create database
wrangler d1 create todo-db

# 2. Update wrangler.jsonc with database_id

# 3. Create schema
wrangler d1 execute todo-db --file=./schema.sql

# 4. Test locally
wrangler dev

# 5. Deploy
wrangler deploy
```

