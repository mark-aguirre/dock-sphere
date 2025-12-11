# Database Setup Guide

## PostgreSQL Setup

### Option 1: Using Docker (Recommended)

Run PostgreSQL in a Docker container:

```bash
docker run -d \
  --name container-hub-postgres \
  -e POSTGRES_USER=container_hub \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=container_hub_plus \
  -p 5432:5432 \
  -v container-hub-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### Option 2: Local PostgreSQL Installation

#### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Set a password for the postgres user
4. Create a new database:
```sql
CREATE DATABASE container_hub_plus;
CREATE USER container_hub WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE container_hub_plus TO container_hub;
```

#### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
createdb container_hub_plus
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb container_hub_plus
```

## Database Configuration

### 1. Update .env file

Edit `container-hub-plus/.env` and update the DATABASE_URL:

```env
DATABASE_URL=postgresql://container_hub:your_secure_password@localhost:5432/container_hub_plus?schema=public
```

**Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

### 2. Run the SQL Schema

Connect to your PostgreSQL database and run the schema:

```bash
# Using psql command line
psql -U container_hub -d container_hub_plus -f prisma/schema.sql

# Or using Docker
docker exec -i container-hub-postgres psql -U container_hub -d container_hub_plus < prisma/schema.sql
```

### 3. Alternative: Using Prisma Migrate (if using Prisma)

If you prefer to use Prisma migrations:

```bash
# Install Prisma CLI
npm install -D prisma

# Generate Prisma Client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init

# Or push schema without migration
npx prisma db push
```

## Verify Installation

### Check Tables

```sql
-- Connect to database
psql -U container_hub -d container_hub_plus

-- List all tables
\dt

-- Should show:
-- User
-- Account
-- Session
-- VerificationToken
-- OAuthProvider
-- Repository
-- Build
```

### Check OAuth Providers

```sql
SELECT * FROM "OAuthProvider";
```

Should return two rows (github and gitlab) with empty credentials and enabled=false.

## Database Management

### Backup Database

```bash
# Full backup
pg_dump -U container_hub container_hub_plus > backup.sql

# Docker backup
docker exec container-hub-postgres pg_dump -U container_hub container_hub_plus > backup.sql
```

### Restore Database

```bash
# Restore from backup
psql -U container_hub -d container_hub_plus < backup.sql

# Docker restore
docker exec -i container-hub-postgres psql -U container_hub -d container_hub_plus < backup.sql
```

### Reset Database

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE container_hub_plus;"
psql -U postgres -c "CREATE DATABASE container_hub_plus;"
psql -U container_hub -d container_hub_plus -f prisma/schema.sql
```

## Connection Troubleshooting

### Connection Refused

1. Check if PostgreSQL is running:
```bash
# Linux/macOS
sudo systemctl status postgresql

# Docker
docker ps | grep postgres
```

2. Check PostgreSQL is listening on the correct port:
```bash
sudo netstat -plnt | grep 5432
```

3. Update `postgresql.conf` to listen on all interfaces:
```
listen_addresses = '*'
```

4. Update `pg_hba.conf` to allow connections:
```
host    all             all             0.0.0.0/0               md5
```

### Authentication Failed

1. Verify username and password in DATABASE_URL
2. Check user permissions:
```sql
\du  -- List all users and roles
```

3. Grant necessary permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE container_hub_plus TO container_hub;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO container_hub;
```

## Production Considerations

### Security

1. **Use strong passwords** - Generate secure passwords for production
2. **Enable SSL** - Add `?sslmode=require` to DATABASE_URL
3. **Restrict access** - Configure firewall rules to limit database access
4. **Regular backups** - Set up automated backup schedule

### Performance

1. **Connection pooling** - Use PgBouncer or similar
2. **Indexes** - Already included in schema for common queries
3. **Monitoring** - Set up monitoring for query performance

### Example Production DATABASE_URL

```env
DATABASE_URL=postgresql://user:password@db.example.com:5432/container_hub_plus?schema=public&sslmode=require&connection_limit=10
```

## Useful SQL Queries

### View OAuth Configuration
```sql
SELECT provider, "clientId", enabled, "updatedAt" 
FROM "OAuthProvider";
```

### View Recent Builds
```sql
SELECT 
    b.id,
    r."fullName" as repository,
    b.branch,
    b.status,
    b."createdAt"
FROM "Build" b
JOIN "Repository" r ON b."repositoryId" = r.id
ORDER BY b."createdAt" DESC
LIMIT 10;
```

### Build Statistics
```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")))) as avg_duration_seconds
FROM "Build"
WHERE "completedAt" IS NOT NULL
GROUP BY status;
```

### Repository Build Count
```sql
SELECT 
    r."fullName",
    r.provider,
    COUNT(b.id) as total_builds,
    SUM(CASE WHEN b.status = 'success' THEN 1 ELSE 0 END) as successful_builds
FROM "Repository" r
LEFT JOIN "Build" b ON r.id = b."repositoryId"
GROUP BY r.id, r."fullName", r.provider
ORDER BY total_builds DESC;
```

## Migration from File Storage

If you were previously using file-based storage (`data/oauth-config.json`), the system will automatically fall back to environment variables if the database is not available. To migrate:

1. Set up the database using this guide
2. Configure OAuth providers through the Settings UI
3. The new configuration will be stored in the database
4. Old file-based config will be ignored

## Support

For issues or questions:
- Check PostgreSQL logs: `docker logs container-hub-postgres`
- Check application logs for database connection errors
- Verify DATABASE_URL format and credentials
