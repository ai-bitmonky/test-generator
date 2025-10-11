# Database Backup & Restore Guide

## Overview

This guide explains how to backup and restore all data from the JEE Test Generator database.

---

## 📦 What Gets Backed Up

The backup system creates a timestamped directory containing:

1. **questions.json** - All 142+ mathematics questions with solutions
2. **question_stats.json** - Statistics by topic and difficulty
3. **tests.json** - All completed tests (if any)
4. **question_history.json** - User interaction history (if table exists)
5. **Schema files** - All SQL schema files for database recreation
6. **manifest.json** - Backup metadata and statistics
7. **README.md** - Restore instructions specific to that backup

---

## 🔐 Creating a Backup

### Prerequisites
- Node.js installed
- `.env.local` file configured with Supabase credentials
- Database connection working

### Steps

1. **Run the backup script:**
   ```bash
   node backup_database.js
   ```

2. **Backup location:**
   ```
   ./backups/backup_YYYY-MM-DDTHH-MM-SS/
   ```

3. **Verify backup:**
   - Check the backup directory was created
   - Verify all JSON files are present
   - Check file sizes are reasonable (questions.json should be ~500KB+)

### Backup Output Example

```
🔐 JEE Test Generator - Database Backup
======================================================================

📁 Backup directory: ./backups/backup_2025-10-11T07-43-57

📚 Backing up questions...
✅ Backed up 142 questions to questions.json

📊 Generating question statistics...
✅ Generated statistics for 8 topic-difficulty combinations

📊 Backup Summary:
   Questions: 142
   Question Stats: 8
   Tests: 0
   Question History: 0

📦 Total Size: 512.10 KB
```

---

## 🔓 Restoring from Backup

### Option 1: Restore to New Database

If you're setting up a completely new Supabase project:

1. **Create new Supabase project**
   - Go to https://supabase.com
   - Create new project
   - Wait for database to be provisioned

2. **Run schema files in SQL Editor**
   ```sql
   -- Run in this order:
   1. supabase_schema.sql
   2. supabase_question_history_schema.sql
   3. fix_tests_rls.sql
   ```

3. **Update environment variables**
   ```bash
   # Update .env.local with new project credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
   ```

4. **Restore questions using script**
   ```bash
   node restore_database.js ./backups/backup_2025-10-11T07-43-57
   ```

5. **Verify restore**
   - Check Supabase dashboard
   - Verify question count matches backup
   - Test the application

### Option 2: Restore Questions Only

If you just need to restore questions to existing database:

1. **Run restore script:**
   ```bash
   node restore_database.js ./backups/backup_2025-10-11T07-43-57
   ```

2. **Script will:**
   - Load questions.json
   - Insert/update questions (upsert on external_id)
   - Show verification statistics

### Option 3: Manual Restore via Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to Table Editor
   - Select 'questions' table

2. **Import JSON**
   - Click "Insert" → "Import data from CSV/JSON"
   - Select questions.json from backup
   - Map columns correctly
   - Import

---

## 📋 Backup Best Practices

### Regular Backups

Schedule regular backups:

```bash
# Daily backup (add to cron/scheduled task)
0 2 * * * cd /path/to/project && node backup_database.js
```

### Before Major Changes

Always backup before:
- Updating database schema
- Migrating new questions
- Changing RLS policies
- Deploying major updates
- Deleting or modifying data

### Backup Storage

Store backups securely:
- ✅ Keep local copies
- ✅ Upload to cloud storage (Google Drive, Dropbox, etc.)
- ✅ Keep multiple versions (at least 3 most recent)
- ❌ Don't commit backups to Git (they're in .gitignore)
- ❌ Don't share publicly (contains user data)

### Backup Verification

After each backup:
1. Check all files are present
2. Verify file sizes are reasonable
3. Spot-check questions.json content
4. Keep manifest.json for reference

---

## 🗂️ Backup Directory Structure

```
backups/
└── backup_2025-10-11T07-43-57/
    ├── questions.json                      # 504 KB - All questions
    ├── question_stats.json                 # 768 B  - Statistics
    ├── tests.json                          # 2 B    - Test history
    ├── question_history.json               # varies - User history
    ├── supabase_schema.sql                 # 3 KB   - Main schema
    ├── supabase_question_history_schema.sql# 1.4 KB - History schema
    ├── fix_tests_rls.sql                   # 633 B  - RLS policies
    ├── manifest.json                       # 779 B  - Backup metadata
    └── README.md                           # 1.9 KB - Restore guide
```

---

## 🔍 Verifying Backup Integrity

### Check Questions Count

```bash
# Count questions in backup
cat backups/backup_*/questions.json | jq '. | length'
```

### View Backup Manifest

```bash
# View backup statistics
cat backups/backup_*/manifest.json | jq
```

### Compare with Database

```bash
# In Supabase SQL Editor:
SELECT COUNT(*) FROM questions;
```

---

## 🚨 Disaster Recovery

### Lost All Data

If you lose your entire Supabase project:

1. Create new Supabase project
2. Run all schema files
3. Restore from most recent backup
4. Update .env.local
5. Test application thoroughly

### Corrupted Data

If data gets corrupted but database structure is intact:

1. Create fresh backup first (to save any good data)
2. Clear corrupted table:
   ```sql
   TRUNCATE TABLE questions CASCADE;
   ```
3. Restore from good backup
4. Verify data integrity

### Partial Data Loss

If only some questions are affected:

1. Restore will upsert on external_id
2. Existing good data will be preserved
3. Missing/corrupted data will be restored
4. No duplicates will be created

---

## 📊 Backup Contents Details

### questions.json

```json
[
  {
    "id": "uuid",
    "external_id": "Derivatives_1",
    "topic": "Derivatives",
    "difficulty": "MEDIUM",
    "concepts": ["tangent", "optimization"],
    "question": "The point M (x, y) of the graph...",
    "options": {
      "a": "(1, e-1)",
      "b": "(2, e-2)",
      "c": "(-2, e2)",
      "d": "(0, 1)"
    },
    "correct_answer": "a",
    "solution_html": "<div class='solution'>...</div>",
    "solution_text": "Solution: Step 1: ...",
    "created_at": "2025-10-07T...",
    "updated_at": "2025-10-07T..."
  }
]
```

### manifest.json

```json
{
  "backup_date": "2025-10-11T07:43:57.123Z",
  "backup_timestamp": "2025-10-11T07-43-57",
  "supabase_url": "https://project.supabase.co",
  "statistics": {
    "questions": 142,
    "questionStats": 8,
    "tests": 0,
    "questionHistory": 0
  },
  "files": ["questions.json", "..."],
  "notes": ["..."]
}
```

---

## ⚙️ Advanced Usage

### Backup Specific Tables Only

Modify `backup_database.js` to comment out tables you don't want:

```javascript
// Comment out to skip
// await backupTests();
// await backupQuestionHistory();
```

### Automated Cloud Backup

Add to backup script:

```bash
#!/bin/bash
# Run backup
node backup_database.js

# Upload to cloud
latest_backup=$(ls -t backups/ | head -1)
# Upload to Google Drive / S3 / etc.
rclone copy "backups/$latest_backup" remote:backups/
```

### Backup Rotation

Keep only last N backups:

```bash
#!/bin/bash
# Keep only 5 most recent backups
cd backups/
ls -t | tail -n +6 | xargs rm -rf
```

---

## 🔒 Security Considerations

### What's Included
- ✅ Question content and solutions
- ✅ Test results (anonymized)
- ✅ User performance data
- ✅ Database schema

### What's NOT Included
- ❌ User passwords (managed by Supabase Auth)
- ❌ User personal information
- ❌ Supabase credentials
- ❌ API keys

### Backup Security
- Store backups in secure location
- Encrypt backups if storing in cloud
- Limit access to backup files
- Don't commit to version control
- Regularly test restore process

---

## 🛠️ Troubleshooting

### Backup Script Fails

**Error: Missing Supabase credentials**
```bash
# Solution: Check .env.local file exists and has correct values
cat .env.local
```

**Error: Cannot connect to database**
```bash
# Solution: Verify Supabase project is running
# Check credentials are correct
```

### Restore Script Fails

**Error: Table does not exist**
```bash
# Solution: Run schema files first
# In Supabase SQL Editor, run all .sql files
```

**Error: Duplicate key violation**
```bash
# Solution: Script uses upsert, but if issue persists:
# Delete existing data first or use different external_ids
```

### Backup Size Issues

**Backup too large**
```bash
# Questions with solutions can be large
# This is normal - questions.json should be 500KB+
# Compress for storage:
tar -czf backup.tar.gz backups/backup_*/
```

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify schema files are up to date
3. Check Supabase dashboard for errors
4. Review backup manifest.json for statistics
5. Test with small dataset first

---

## 📝 Backup Checklist

Before deploying to production:
- [ ] Test backup script works
- [ ] Test restore script works
- [ ] Schedule regular backups
- [ ] Set up backup storage location
- [ ] Document backup procedures for team
- [ ] Test disaster recovery plan
- [ ] Verify backup file permissions
- [ ] Add backup directory to .gitignore

---

**Last Updated:** October 11, 2025
**Script Version:** 1.0

---

*Keep this guide accessible for your team and update it when backup procedures change.*
