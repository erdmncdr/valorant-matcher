#!/bin/bash

# Database update script
echo "🔄 Updating database schema..."

# Try prisma db push first
echo "Attempting: npx prisma db push"
npx prisma db push 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database updated successfully with Prisma!"
    exit 0
fi

# If prisma fails, try SQL directly
echo "⚠️  Prisma failed, trying direct SQL..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "Set it with: export DATABASE_URL='your_database_url'"
    exit 1
fi

echo "Running SQL migration..."
psql "$DATABASE_URL" -f prisma/migrations/add_purchase_fields.sql

if [ $? -eq 0 ]; then
    echo "✅ Database updated successfully with SQL!"
else
    echo "❌ ERROR: SQL migration failed"
    echo "Please run manually:"
    echo "  psql \$DATABASE_URL -f prisma/migrations/add_purchase_fields.sql"
    exit 1
fi
