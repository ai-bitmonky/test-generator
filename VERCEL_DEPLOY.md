# 🚀 Deploy to Vercel - Quick Guide

## Prerequisites
- Node.js 18.17 or later installed
- A Vercel account (free): https://vercel.com/signup

## Method 1: One-Command Deploy (Easiest) ⚡

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel (from this directory)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - What's your project's name? jee-test-nextjs (or your choice)
# - In which directory is your code located? ./
# - Deploy? Yes

# Your app will be live at: https://jee-test-nextjs-xxx.vercel.app
```

## Method 2: GitHub + Vercel (Recommended for CI/CD) 🔄

1. **Create GitHub Repository**
   ```bash
   cd /Users/Pramod/projects/iit-exams/jee-test-nextjs
   git init
   git add .
   git commit -m "Initial commit - JEE Advanced Test Generator"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/jee-test-nextjs.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Done!** ✅
   - Your app is live
   - Auto-deploys on every git push
   - Get preview deployments for PRs

## Method 3: Manual Build + Deploy 🛠️

```bash
# Build the project
npm run build

# Deploy the out directory
vercel --prod
```

## What Happens During Deployment

1. ✅ Vercel detects Next.js framework
2. ✅ Runs `npm install`
3. ✅ Runs `npm run build`
4. ✅ Deploys `out/` directory (1.6 MB)
5. ✅ Sets up HTTPS automatically
6. ✅ Provides a production URL

## Expected Build Output

```
✓ Compiled successfully
✓ Generating static pages (4/4)
✓ Exporting (2/2)

Route (app)                    Size     First Load JS
┌ ○ /                         3.18 kB        105 kB
└ ○ /_not-found               993 B          103 kB
```

## Post-Deployment Checklist

After deployment, verify:

- [ ] App loads at the Vercel URL
- [ ] Topics are displayed (40 topics)
- [ ] Question count shows 756
- [ ] Can select topics
- [ ] Can generate test
- [ ] Questions display correctly
- [ ] Can select answers
- [ ] Can flag questions (yellow highlight)
- [ ] Can replace questions
- [ ] Progress bar works
- [ ] Can submit test
- [ ] Results show correctly
- [ ] Green/red highlighting works

## Custom Domain Setup

1. Go to your project in Vercel dashboard
2. Click "Settings" > "Domains"
3. Add your domain (e.g., jee-test.com)
4. Update your DNS records as instructed
5. Wait for SSL provisioning (5-10 minutes)

## Environment Variables

**None required!** 🎉

This is a fully static app with all data embedded.

## Performance

- **First Load**: ~1 MB (105 KB JS + 841 KB JSON)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)
- **Global CDN**: Served from 100+ edge locations
- **HTTPS**: Automatic SSL certificate

## Monitoring

Vercel provides:
- Real-time analytics
- Error tracking
- Performance insights
- Usage metrics

Access at: https://vercel.com/dashboard

## Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
rm -rf .next out node_modules
npm install
npm run build
```

### Questions not loading
- Check `out/data/questions.json` exists (841 KB)
- Check browser console for errors
- Verify fetch path is `/data/questions.json`

### Deployment fails
```bash
# Ensure you're in project directory
pwd
# Should show: /Users/Pramod/projects/iit-exams/jee-test-nextjs

# Check package.json has correct scripts
cat package.json
```

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project README**: See README.md in this directory

## Cost

**FREE** on Vercel's Hobby plan:
- Unlimited deployments
- Automatic HTTPS
- 100 GB bandwidth/month
- Serverless functions (not used in this app)

---

## Quick Deploy Commands

```bash
# Option 1: Instant deploy
npx vercel --prod

# Option 2: CI/CD setup
git init
git add .
git commit -m "Deploy to Vercel"
git push

# Then import on Vercel dashboard
```

**That's it! Your JEE Advanced Test Generator is now live! 🎓✨**
