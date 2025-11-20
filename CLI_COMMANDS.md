# Quick CLI Commands for Cloudflare D1 Setup

## Complete Setup (Run in Order)

### 1. Login to Cloudflare
```bash
wrangler login
```

### 2. Create D1 Database
```bash
wrangler d1 create todo-db
```
**Copy the `database_id` from the output!**

### 3. Update wrangler.jsonc
Replace `YOUR_DATABASE_ID_HERE` in `wrangler.jsonc` with the actual `database_id` from step 2.

### 4. Create Database Table
```bash
wrangler d1 execute todo-db --file=./schema.sql
```

### 5. Verify Table Creation
```bash
wrangler d1 execute todo-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 6. Test Locally
```bash
wrangler dev
```

### 7. Deploy to Production
```bash
wrangler deploy
```

---

## Individual Commands Reference

### Database Management

**Create a database:**
```bash
wrangler d1 create todo-db
```

**List all databases:**
```bash
wrangler d1 list
```

**Get database info:**
```bash
wrangler d1 info todo-db
```

**Delete a database (⚠️ destructive):**
```bash
wrangler d1 delete todo-db
```

### Execute SQL

**Execute SQL file:**
```bash
wrangler d1 execute todo-db --file=./schema.sql
```

**Execute SQL command:**
```bash
wrangler d1 execute todo-db --command="SELECT * FROM todos;"
```

**Execute SQL interactively:**
```bash
wrangler d1 execute todo-db
```

**For local development (when using `wrangler dev`):**
```bash
wrangler d1 execute todo-db --local --file=./schema.sql
```

### Development & Deployment

**Start local development server:**
```bash
wrangler dev
```

**Deploy to Cloudflare:**
```bash
wrangler deploy
```

**View logs:**
```bash
wrangler tail
```

---

## Example: Complete Setup from Scratch

```bash
# 1. Login
wrangler login

# 2. Create database (copy the database_id!)
wrangler d1 create todo-db

# 3. Edit wrangler.jsonc and add the database_id

# 4. Create schema
wrangler d1 execute todo-db --file=./schema.sql

# 5. Verify
wrangler d1 execute todo-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 6. Test locally
wrangler dev

# 7. Deploy
wrangler deploy
```

---

## Troubleshooting Commands

**Check if database exists:**
```bash
wrangler d1 list | grep todo-db
```

**View database schema:**
```bash
wrangler d1 execute todo-db --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='todos';"
```

**Count todos:**
```bash
wrangler d1 execute todo-db --command="SELECT COUNT(*) as count FROM todos;"
```

**Clear all todos (⚠️ destructive):**
```bash
wrangler d1 execute todo-db --command="DELETE FROM todos;"
```

