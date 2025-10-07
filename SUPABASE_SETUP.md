# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign in"
3. Sign in with GitHub (recommended) or email
4. Click "New Project"
5. Fill in the details:
   - **Name**: jee-test-generator (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you (e.g., Mumbai for India)
   - **Pricing Plan**: Free tier is sufficient
6. Click "Create new project"
7. Wait 1-2 minutes for project setup to complete

## Step 2: Get Your Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **anon public** key: A long JWT token

## Step 3: Copy These Values

Copy and save:
- ✅ **NEXT_PUBLIC_SUPABASE_URL**: Your Project URL
- ✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Your anon public key

## Step 4: Provide These to Me

Once you have these values, provide them to me in this format:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

I will then:
1. Create a `.env.local` file with these credentials
2. Install Supabase client library
3. Create the database schema (users, tests, questions tables)
4. Migrate all 89 MCQ questions to the database
5. Update authentication to use Supabase Auth
6. Update all API routes to use Supabase

## What We've Prepared

✅ **89 MCQ questions** extracted with complete solutions:
- 5 topics: Areas Integration (13), Circles (24), Integration (17), Inverse Trig (20), Matrices (15)
- 2 difficulty levels: Advanced (56), Medium (33)
- All questions include:
  - Question text
  - Multiple choice options (a, b, c, d)
  - Correct answer
  - Complete solution with step-by-step explanations (both HTML and text)
  - Concept tags
  - Difficulty level

## Benefits of Using Supabase

1. **Proper Database**: PostgreSQL instead of file-based JSON
2. **Built-in Auth**: Simplified authentication with email/password
3. **Scalable**: Can handle many users concurrently
4. **Vercel Compatible**: Works perfectly with serverless functions
5. **Free Tier**: 500MB database, 2GB bandwidth - plenty for this project
6. **Real-time**: Can add live features later if needed

---

**Next Step**: Create your Supabase project and share the credentials above with me!
