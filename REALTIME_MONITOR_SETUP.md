# 🔴 Real-time Enrichment Monitor

Monitor database enrichment progress in real-time using Supabase Realtime.

## Setup Instructions

### 1. Enable Realtime in Supabase

Run the SQL migration in Supabase Dashboard → SQL Editor:

```sql
-- Enable Realtime for questions table
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
```

Or use the migration file:
```bash
# Apply the migration
cat enable_realtime.sql
```

### 2. Start the Next.js Development Server

If not already running:
```bash
npm run dev
```

### 3. Open the Monitor

Navigate to: **http://localhost:3000/enrichment-monitor**

## Features

### 📊 Real-time Stats
- **Live progress bars** for each subject (Mathematics, Physics, Chemistry)
- **Percentage completion** updated instantly
- **Questions remaining** counter

### 🔄 Live Updates Feed
- See each question as it's enriched in real-time
- Track what fields were added (strategy, expert_insight, key_facts, figure_svg, options)
- Timestamp for each update
- Color-coded by subject

### 📈 Overall Progress
- Total questions across all subjects
- Total enriched count
- Remaining questions
- Overall completion percentage

### 🟢 Connection Status
- Green dot: Connected to Supabase Realtime
- Red dot: Connection issues

## How It Works

The monitor uses **Supabase Realtime** to subscribe to changes on the `questions` table:

```typescript
supabase
  .channel('questions-enrichment')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'questions',
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

When the enrichment pipelines update a question, the changes are:
1. **Detected** by Supabase Realtime
2. **Broadcast** to all connected clients
3. **Displayed** instantly in the monitor

## What You'll See

As pipelines run, you'll see updates like:

```
Mathematics • Areas Integration
✓ strategy  ✓ expert_insight  ✓ key_facts  ✓ figure_svg

Physics • Electromagnetic Induction
✓ figure_svg  ✓ options

Chemistry • Thermodynamics
✓ strategy  ✓ expert_insight  ✓ key_facts
```

## Monitor While Pipelines Run

Keep the monitor open while running:

```bash
# Terminal 1: Run pipelines
node database_enrichment_pipeline.js Mathematics
node database_enrichment_pipeline.js Physics
node database_enrichment_pipeline.js Chemistry

# Browser: Watch real-time updates
http://localhost:3000/enrichment-monitor
```

## Troubleshooting

### No updates showing?

1. **Check connection status** (green dot in UI)
2. **Verify Realtime is enabled**:
   ```sql
   SELECT * FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```
   Should include `questions` table

3. **Check browser console** for errors
4. **Verify pipelines are running**:
   ```bash
   ps aux | grep "database_enrichment_pipeline"
   ```

### Connection Issues?

- Check `.env.local` has correct Supabase credentials
- Verify Supabase project is accessible
- Check browser network tab for WebSocket connection

## Performance

- **Lightweight**: Only metadata is transmitted (not full question content)
- **Efficient**: Uses Supabase's built-in WebSocket connection
- **Scalable**: Handles hundreds of updates per minute

## Files Created

- `app/enrichment-monitor/page.tsx` - Real-time monitor component
- `enable_realtime.sql` - SQL migration to enable Realtime
- `REALTIME_MONITOR_SETUP.md` - This file

## Next Steps

1. Run the SQL migration to enable Realtime
2. Open the monitor in your browser
3. Start the enrichment pipelines
4. Watch the magic happen! ✨

---

**Created:** 2025-10-13
**Status:** ✅ Ready to use
**URL:** http://localhost:3000/enrichment-monitor
