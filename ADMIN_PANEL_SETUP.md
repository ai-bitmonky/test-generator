# Admin Panel Setup Guide

## Overview

This guide will help you set up the complete admin panel for managing JEE questions with audit trail and version history.

## Step 1: Apply Database Migration ✅

The database migration has been created at:
```
supabase/migrations/20251013000000_create_questions_audit.sql
```

### Apply Migration Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20251013000000_create_questions_audit.sql`
4. Copy all contents
5. Paste into SQL Editor
6. Click **Run** or press `Ctrl+Enter`

You should see a success message at the bottom:
```
✅ Questions audit system created successfully
```

### Verify Installation

Run this query in SQL Editor to verify:

```sql
-- Check table exists
SELECT COUNT(*) FROM questions_audit;

-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'questions_audit_trigger';

-- Test by updating a question
UPDATE questions
SET difficulty = 'Medium'
WHERE id = (SELECT id FROM questions LIMIT 1)
RETURNING id;

-- Check audit record was created
SELECT * FROM questions_audit
ORDER BY changed_at DESC
LIMIT 1;
```

If all queries succeed, the audit system is working! ✅

## Step 2: Configure Environment Variables

Ensure your `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
```

## Step 3: Admin API Routes (In Progress)

The following API routes will be created in `app/api/admin/`:

- `GET /api/admin/questions` - List all questions with filtering and sorting
- `GET /api/admin/questions/[id]` - Get detailed question data
- `GET /api/admin/questions/[id]/history` - Get version history
- `GET /api/admin/questions/[id]/compare` - Compare two versions

## Step 4: Admin Dashboard UI (Upcoming)

The admin dashboard will be created at:
- `/app/admin/page.js` - Main admin dashboard
- `/app/admin/questions/page.js` - Question list with filters
- `/app/admin/questions/[id]/page.js` - Question detail view

## Step 5: Testing the System

After setup is complete, you can:

1. **View all questions** with filters by subject, topic, difficulty
2. **Sort questions** by date added, last modified, or external_id
3. **View question history** - see all changes made to a question
4. **Compare versions** - side-by-side comparison of any two versions
5. **See audit trail** - who changed what and when

## Features Included

### Database Features ✅
- [x] Automatic audit logging for all question changes
- [x] Complete version history with full row snapshots
- [x] Track which specific fields changed
- [x] Helper functions for version comparison
- [x] Views for recent changes and statistics
- [x] Efficient indexes for fast queries

### API Features (Coming Next)
- [ ] RESTful API for question management
- [ ] Pagination and filtering
- [ ] Version history endpoints
- [ ] Comparison endpoints
- [ ] Authentication/authorization

### UI Features (Coming Soon)
- [ ] Admin dashboard with statistics
- [ ] Question list with advanced filters
- [ ] Question detail modal/page
- [ ] Version history timeline
- [ ] Side-by-side version comparison
- [ ] Syntax highlighting for HTML fields
- [ ] Responsive design

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Dashboard UI                    │
│  (Next.js 15 App Router - React Components)             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│                    Admin API Routes                      │
│  (Next.js API Routes - /app/api/admin/*)                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│              Supabase Client (JavaScript)                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  ┌──────────────┐         ┌────────────────┐           │
│  │   questions   │◄───────┤ Audit Trigger  │           │
│  │   (main)      │         └────────────────┘           │
│  └──────┬────────┘                 │                    │
│         │                          ↓                    │
│         │                ┌─────────────────┐            │
│         └───────────────►│ questions_audit │            │
│                          │  (history)      │            │
│                          └─────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### questions (main table)
- Standard question fields: id, external_id, subject, topic, etc.
- Modified by application and AI pipeline

### questions_audit (audit/history table)
- `audit_id` - Unique ID for each audit record
- `question_id` - References questions.id
- `operation_type` - INSERT/UPDATE/DELETE
- `changed_at` - Timestamp
- `changed_by` - User ID (if available)
- `changed_fields` - Array of modified field names
- `row_data` - Complete row snapshot as JSONB
- Individual field columns for easy querying

## Helper Functions

### Get All Versions
```sql
SELECT * FROM get_question_versions(123);
```

Returns all versions of question ID 123, ordered by most recent.

### Compare Two Versions
```sql
SELECT * FROM compare_question_versions(456, 789);
```

Shows field-by-field comparison between audit records 456 and 789.

### Get Change Statistics
```sql
SELECT * FROM get_question_change_stats(
  NOW() - INTERVAL '30 days',
  NOW()
);
```

Returns statistics by subject for the last 30 days.

## Security Considerations

1. **Row Level Security (RLS)**: Currently disabled for flexibility. Enable and configure based on your auth setup.

2. **Service Role Key**: Admin operations may require service role key for unrestricted access.

3. **Authentication**: Add authentication middleware to protect admin routes.

4. **Audit Trail**: All changes are logged. Consider who should have access to this data.

## Performance Notes

- Indexes are created for common query patterns
- JSONB fields allow flexible querying
- Consider archiving old audit records after retention period
- Use pagination for large result sets

## Troubleshooting

### Migration fails
- Check PostgreSQL version (requires 12+)
- Verify you have sufficient permissions
- Run statements one at a time to identify issues

### Trigger not firing
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'questions_audit_trigger';

-- Manually test trigger function
SELECT log_question_changes();
```

### No audit records
- Verify trigger is active
- Check table permissions
- Look for errors in PostgreSQL logs

## Next Steps

1. ✅ Apply database migration (follow Step 1 above)
2. 🔄 Create admin API routes (in progress)
3. ⏳ Build admin dashboard UI (upcoming)
4. ⏳ Add authentication/authorization (upcoming)
5. ⏳ Deploy and test in production (upcoming)

## Support

For issues or questions:
- Check migration README: `supabase/migrations/README.md`
- Review Supabase documentation: https://supabase.com/docs
- Check Next.js App Router docs: https://nextjs.org/docs/app
