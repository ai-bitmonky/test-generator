# JEE Advanced Test Generator

Interactive test generator for JEE Advanced Mathematics with 756 questions across 40 topics.

## Features

- 🎯 **Interactive Testing** - Select answers, submit tests, get instant feedback
- 🚩 **Question Flagging** - Mark difficult questions for review
- 🔄 **Question Replacement** - Replace questions with new ones from same topic
- 📊 **Detailed Results** - View correct/incorrect answers with solutions
- 📈 **Progress Tracking** - Track answered questions in real-time
- 🖨️ **Print Support** - Generate print-ready test papers
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Technologies

- **Next.js 15** - React framework
- **React 19** - UI library
- **Static Export** - Fully static site for Vercel deployment

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

The static site will be generated in the `out` directory.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/jee-test-nextjs)

Or deploy manually:

```bash
npm run build
# The 'out' directory can be deployed to any static hosting
```

## Question Bank

- **40 Topics** including:
  - 3D Geometry
  - Binomial Theorem
  - Calculus (Limits, Derivatives, Integration)
  - Circles & Straight Lines
  - Differential Equations
  - Matrices & Determinants
  - Permutations & Combinations
  - Probability & Statistics
  - Trigonometry
  - And more...

- **756 Questions** total
- Multiple choice format (a, b, c, d)
- Difficulty levels marked

## Usage

1. **Select Topics** - Choose which mathematics topics to include
2. **Configure Test** - Set number of questions and selection strategy
3. **Generate Test** - Create your custom test paper
4. **Take Test** - Answer questions, flag difficult ones, replace if needed
5. **Submit** - Get instant feedback with correct answers and solutions
6. **Review** - See detailed results and solutions

## License

MIT
