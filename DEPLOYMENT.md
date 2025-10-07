# Deployment Guide

## Deploy to Vercel (Recommended)

### Method 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to deploy

### Method 2: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [Vercel Dashboard](https://vercel.com/new)

3. Import your repository

4. Configure build settings (auto-detected):
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `out`
   - **Install Command**: `npm install`

5. Click "Deploy"

Your app will be live at: `https://your-project.vercel.app`

### Method 3: Deploy from Local Build

1. Build the project:
```bash
npm run build
```

2. Deploy the `out` directory:
```bash
vercel --prod
```

## Deploy to Other Platforms

### Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `out` directory to Netlify:
   - Drag and drop `out` folder to Netlify dashboard
   - Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

### GitHub Pages

1. Build the project:
```bash
npm run build
```

2. Push the `out` directory to `gh-pages` branch:
```bash
npm install -g gh-pages
gh-pages -d out
```

### AWS S3 + CloudFront

1. Build the project:
```bash
npm run build
```

2. Upload `out` directory to S3 bucket

3. Configure CloudFront distribution

### Any Static Host

The `out` directory is a fully static site that can be hosted anywhere:
- Copy `out` directory to your web server
- Point your domain to the directory
- Ensure `index.html` is set as the default document

## Environment Variables

No environment variables needed - all questions are embedded in the static JSON file.

## Post-Deployment

After deployment, test:
1. ✅ Topic selection works
2. ✅ Test generation works
3. ✅ Answer selection works
4. ✅ Question flagging works
5. ✅ Question replacement works
6. ✅ Test submission works
7. ✅ Results display correctly

## Troubleshooting

### Questions not loading
- Check if `public/data/questions.json` exists
- Verify file is copied to `out/data/questions.json` after build
- Check browser console for fetch errors

### Styling issues
- Verify `app/styles.css` is imported in `page.js`
- Check if CSS file is in build output

### Build fails
- Run `npm install` to ensure dependencies are installed
- Check Node.js version (requires 18.17 or later)
- Clear `.next` and `out` directories and rebuild

## Performance

The static build includes:
- 756 questions (841 KB JSON)
- Optimized Next.js bundle
- Code splitting for better performance
- Responsive images (if used)

Total initial load: ~105 KB JavaScript + 841 KB JSON data

## Custom Domain

To add a custom domain on Vercel:
1. Go to Project Settings > Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning
