# 📑 Project File Index

## 🎯 Core Application Files

### React/Next.js Components
- **`app/layout.js`** - Root layout component with metadata
- **`app/page.js`** - Main test generator component (756 lines)
  - State management
  - Test generation logic
  - Question selection algorithms
  - Answer tracking
  - Flag & replacement functionality
  - Results calculation

### Styling
- **`app/styles.css`** - Global styles (500+ lines)
  - Responsive design
  - Gradient themes
  - Print styles
  - Animations
  - Mobile optimizations

### Data
- **`public/data/questions.json`** - Question database (841 KB)
  - 756 questions
  - 40 topics
  - Options, difficulty, HTML content

## 🔧 Configuration Files

- **`package.json`** - Dependencies & NPM scripts
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    }
  }
  ```

- **`next.config.js`** - Next.js configuration
  - Static export enabled
  - Image optimization settings

- **`vercel.json`** - Vercel deployment config
  - Build command
  - Output directory

- **`.gitignore`** - Git ignore patterns
  - node_modules
  - .next
  - out

## 📚 Documentation Files

### Getting Started
- **`README.md`** - Main project documentation
  - Features overview
  - Quick start guide
  - Technology stack
  - Usage instructions

### Deployment
- **`DEPLOYMENT.md`** - Comprehensive deployment guide
  - Vercel deployment
  - Netlify deployment
  - GitHub Pages
  - AWS S3
  - Custom domain setup
  - Troubleshooting

- **`VERCEL_DEPLOY.md`** - Quick Vercel deployment guide
  - One-command deploy
  - GitHub integration
  - Post-deployment checklist
  - Performance metrics

### Reference
- **`PROJECT_SUMMARY.md`** - Complete project overview
  - Feature list
  - Technical details
  - File structure
  - Build statistics

- **`INDEX.md`** (this file) - File directory and navigation

## 🛠️ Utility Scripts

- **`extract_questions.py`** - Python script to extract questions
  - Parses HTML files from maths folder
  - Extracts questions with options
  - Generates JSON output
  - Run: `python3 extract_questions.py`

- **`enhanced_test_generator.html`** - Standalone HTML version
  - For comparison/reference
  - Can run without Next.js

## 📦 Build Output (Generated)

- **`out/`** - Static build output (1.6 MB)
  - `index.html` - Main page
  - `404.html` - Not found page
  - `_next/` - Next.js assets
  - `data/questions.json` - Question data

- **`.next/`** - Next.js build cache (gitignored)
- **`node_modules/`** - NPM dependencies (gitignored)

## 📊 File Statistics

| Type | Count | Size |
|------|-------|------|
| React Components | 2 | ~800 lines |
| CSS Files | 1 | ~500 lines |
| Config Files | 3 | ~50 lines |
| Documentation | 5 | ~1000 lines |
| Python Scripts | 1 | ~100 lines |
| Data Files | 1 | 841 KB |

**Total Project Size**: ~2 MB (excluding node_modules)

## 🚀 Quick Navigation

### For Developers
1. Start here: `README.md`
2. Code: `app/page.js` & `app/styles.css`
3. Config: `next.config.js`
4. Data: `public/data/questions.json`

### For Deployment
1. Read: `VERCEL_DEPLOY.md`
2. Or: `DEPLOYMENT.md` for other platforms
3. Check: `vercel.json` for config

### For Understanding
1. Overview: `PROJECT_SUMMARY.md`
2. Features: `README.md`
3. Structure: This file (`INDEX.md`)

## 📝 Key Commands

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start dev server (port 3000)

# Production
npm run build       # Build static site
npm start          # Preview production build

# Deployment
vercel             # Deploy to Vercel
vercel --prod      # Deploy to production

# Utilities
python3 extract_questions.py  # Re-extract questions from HTML
```

## 🔗 Important Links

- **Local Dev**: http://localhost:3000
- **Vercel Deploy**: Run `vercel` to get URL
- **Source Data**: `../maths/*.html` (43 files)

## ✅ Project Status

- [x] Next.js app created
- [x] All 756 questions extracted
- [x] Full functionality implemented
- [x] Responsive design
- [x] Documentation complete
- [x] Build tested (1.6 MB output)
- [x] Ready for Vercel deployment

---

**Navigation Tip**: Use `Cmd+Click` (Mac) or `Ctrl+Click` (Windows) to open files in your editor!
