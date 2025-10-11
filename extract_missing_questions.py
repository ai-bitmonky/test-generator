#!/usr/bin/env python3
"""
Extract questions from combined_maths_problems.html that are not in our database
and create separate HTML files by chapter in the output folder.
"""

import json
import re
from bs4 import BeautifulSoup
from pathlib import Path
from collections import defaultdict

def load_existing_questions():
    """Load existing questions from JSON file"""
    json_path = Path('mcq_questions_with_solutions.json')
    if json_path.exists():
        with open(json_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)
            # Create set of question texts for comparison
            return {q['question'].strip() for q in questions}
    return set()

def extract_chapter_from_filename(filename):
    """Extract chapter name from filename"""
    # Remove JEE_Advanced_ prefix and _Problems suffix
    chapter = filename.replace('JEE_Advanced_', '').replace('_Problems', '')
    # Remove numbers in parentheses like (1), (2), (3)
    chapter = re.sub(r'\s*\(\d+\)$', '', chapter)
    # Replace underscores with spaces and title case
    chapter = chapter.replace('_', ' ').title()
    return chapter

def extract_questions_by_chapter(html_path, existing_questions):
    """Extract all questions grouped by chapter"""
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    chapters = defaultdict(list)

    # Find all file sections
    file_sections = soup.find_all('div', class_='file-section')

    print(f"📚 Found {len(file_sections)} file sections")

    for section in file_sections:
        # Get filename from header
        header = section.find('div', class_='file-header')
        if not header:
            continue

        filename = header.get_text().strip()
        # Remove numbering like "1. " from the start
        filename = re.sub(r'^\d+\.\s+', '', filename)

        chapter = extract_chapter_from_filename(filename)

        # Extract all questions from this section
        # Questions are typically in paragraphs or divs
        content = section.decode_contents()

        # Try to identify individual questions
        # Look for common patterns: numbered questions, MCQ options, etc.
        question_blocks = []

        # Split by strong question indicators
        parts = re.split(r'<strong>(?:Question\s+\d+|Q\.\s*\d+|\d+\.)</strong>', content)

        if len(parts) > 1:
            # We found numbered questions
            for i, part in enumerate(parts[1:], 1):  # Skip first part (before first question)
                question_html = f'<strong>Question {i}</strong>' + part.split('<strong>')[0]
                question_text = BeautifulSoup(question_html, 'html.parser').get_text().strip()

                # Check if this question is not in our existing set
                if question_text not in existing_questions:
                    question_blocks.append({
                        'html': question_html,
                        'text': question_text
                    })
        else:
            # No numbered questions found, treat entire section as one block
            section_text = section.get_text().strip()
            if section_text and section_text not in existing_questions:
                # Get the content without the header
                content_div = section.find_all(recursive=False)
                if len(content_div) > 1:  # More than just the header
                    question_blocks.append({
                        'html': content,
                        'text': section_text
                    })

        if question_blocks:
            chapters[chapter].extend(question_blocks)

    return chapters

def create_chapter_html(chapter_name, questions, output_dir):
    """Create HTML file for a chapter with its missing questions"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{chapter_name} - Missing Questions</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 2em;
        }}
        .header .count {{
            margin-top: 10px;
            font-size: 1.1em;
            opacity: 0.9;
        }}
        .question-block {{
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .question-number {{
            background-color: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 15px;
            font-weight: bold;
        }}
        strong {{
            color: #333;
        }}
        .math {{
            font-style: italic;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{chapter_name}</h1>
        <div class="count">Missing Questions: {len(questions)}</div>
        <div style="font-size: 0.9em; margin-top: 10px;">Questions not yet in database</div>
    </div>

"""

    for i, q in enumerate(questions, 1):
        html_content += f"""    <div class="question-block">
        <div class="question-number">Question {i}</div>
        <div class="question-content">
{q['html']}
        </div>
    </div>

"""

    html_content += """</body>
</html>"""

    # Create safe filename
    safe_filename = re.sub(r'[^\w\s-]', '', chapter_name).strip().replace(' ', '_')
    output_path = output_dir / f"{safe_filename}_missing_questions.html"

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return output_path

def main():
    print("🔍 Extracting missing questions from combined HTML...\n")

    # Load existing questions
    print("📖 Loading existing questions from database...")
    existing_questions = load_existing_questions()
    print(f"✅ Found {len(existing_questions)} existing questions\n")

    # Extract questions by chapter
    html_path = Path('/Users/Pramod/projects/iit-exams/combined_maths_problems.html')
    print(f"📄 Reading combined HTML file: {html_path}")
    chapters = extract_questions_by_chapter(html_path, existing_questions)

    print(f"\n📊 Found questions in {len(chapters)} chapters:\n")

    # Create output directory
    output_dir = Path('/Users/Pramod/projects/iit-exams/maths/output')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create HTML files for each chapter
    total_questions = 0
    chapter_summary = []

    for chapter, questions in sorted(chapters.items()):
        if questions:
            output_path = create_chapter_html(chapter, questions, output_dir)
            total_questions += len(questions)
            chapter_summary.append((chapter, len(questions), output_path.name))
            print(f"  ✓ {chapter}: {len(questions)} questions → {output_path.name}")

    # Create index file
    create_index_html(chapter_summary, output_dir, total_questions)

    print(f"\n{'='*70}")
    print(f"✅ Complete! Created {len(chapters)} HTML files")
    print(f"📝 Total missing questions: {total_questions}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🌐 Open index.html to browse all chapters")
    print(f"{'='*70}")

def create_index_html(chapter_summary, output_dir, total_questions):
    """Create an index HTML file linking to all chapters"""

    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Missing Questions - Chapter Index</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            margin-top: 10px;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
        }
        .stat {
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .chapter-list {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .chapter-list h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .chapter-item {
            padding: 15px;
            margin: 10px 0;
            background: linear-gradient(to right, #f8f9fa, white);
            border-left: 4px solid #667eea;
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        .chapter-item:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        .chapter-item a {
            text-decoration: none;
            color: #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chapter-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        .chapter-count {
            background-color: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Missing Questions Index</h1>
        <div class="subtitle">JEE Advanced Mathematics - Questions Not Yet in Database</div>
        <div class="stats">
            <div class="stat">
                <div class="stat-number">""" + str(len(chapter_summary)) + """</div>
                <div class="stat-label">Chapters</div>
            </div>
            <div class="stat">
                <div class="stat-number">""" + str(total_questions) + """</div>
                <div class="stat-label">Questions</div>
            </div>
        </div>
    </div>

    <div class="chapter-list">
        <h2>Browse by Chapter</h2>
"""

    for chapter, count, filename in chapter_summary:
        html_content += f"""        <div class="chapter-item">
            <a href="{filename}">
                <span class="chapter-name">{chapter}</span>
                <span class="chapter-count">{count} questions</span>
            </a>
        </div>
"""

    html_content += """    </div>
</body>
</html>"""

    index_path = output_dir / "index.html"
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"\n📄 Created index file: {index_path}")

if __name__ == '__main__':
    main()
