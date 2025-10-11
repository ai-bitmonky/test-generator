#!/usr/bin/env python3
"""
Group missing questions into 4 balanced files, keeping chapters together.
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
            return {q['question'].strip() for q in questions}
    return set()

def extract_chapter_from_filename(filename):
    """Extract chapter name from filename"""
    chapter = filename.replace('JEE_Advanced_', '').replace('_Problems', '')
    chapter = re.sub(r'\s*\(\d+\)$', '', chapter)
    chapter = chapter.replace('_', ' ').title()
    return chapter

def extract_questions_by_chapter(html_path, existing_questions):
    """Extract all questions grouped by chapter"""
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    chapters = defaultdict(list)
    file_sections = soup.find_all('div', class_='file-section')

    print(f"📚 Found {len(file_sections)} file sections")

    for section in file_sections:
        header = section.find('div', class_='file-header')
        if not header:
            continue

        filename = header.get_text().strip()
        filename = re.sub(r'^\d+\.\s+', '', filename)
        chapter = extract_chapter_from_filename(filename)

        content = section.decode_contents()
        parts = re.split(r'<strong>(?:Question\s+\d+|Q\.\s*\d+|\d+\.)</strong>', content)

        if len(parts) > 1:
            for i, part in enumerate(parts[1:], 1):
                question_html = f'<strong>Question {i}</strong>' + part.split('<strong>')[0]
                question_text = BeautifulSoup(question_html, 'html.parser').get_text().strip()

                if question_text not in existing_questions:
                    chapters[chapter].append({
                        'html': question_html,
                        'text': question_text
                    })
        else:
            section_text = section.get_text().strip()
            if section_text and section_text not in existing_questions:
                content_div = section.find_all(recursive=False)
                if len(content_div) > 1:
                    chapters[chapter].append({
                        'html': content,
                        'text': section_text
                    })

    return chapters

def distribute_chapters_to_files(chapters, num_files=4):
    """Distribute chapters across files trying to balance question count"""
    # Sort chapters by number of questions (largest first)
    sorted_chapters = sorted(chapters.items(), key=lambda x: len(x[1]), reverse=True)

    # Initialize file buckets
    files = [{'chapters': [], 'count': 0} for _ in range(num_files)]

    # Greedy algorithm: assign each chapter to the file with fewest questions
    for chapter, questions in sorted_chapters:
        # Find file with minimum questions
        min_file = min(files, key=lambda f: f['count'])
        min_file['chapters'].append((chapter, questions))
        min_file['count'] += len(questions)

    return files

def create_grouped_html(file_num, chapters_data, output_dir):
    """Create HTML file with multiple chapters"""

    total_questions = sum(len(questions) for _, questions in chapters_data)
    chapter_list = [f"{chapter} ({len(questions)})" for chapter, questions in chapters_data]

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Missing Questions - Group {file_num}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #f5f5f5;
        }}
        .main-header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .main-header h1 {{
            margin: 0;
            font-size: 2.5em;
        }}
        .main-header .stats {{
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
        }}
        .stat {{
            text-align: center;
        }}
        .stat-number {{
            font-size: 2em;
            font-weight: bold;
        }}
        .stat-label {{
            font-size: 0.9em;
            opacity: 0.8;
        }}
        .toc {{
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .toc h2 {{
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        .toc ul {{
            list-style: none;
            padding: 0;
        }}
        .toc li {{
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }}
        .toc li:last-child {{
            border-bottom: none;
        }}
        .toc a {{
            text-decoration: none;
            color: #667eea;
            font-weight: 500;
            transition: all 0.3s;
        }}
        .toc a:hover {{
            color: #764ba2;
            padding-left: 10px;
        }}
        .chapter-section {{
            background: white;
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .chapter-header {{
            background: linear-gradient(to right, #667eea, #764ba2);
            color: white;
            padding: 20px 30px;
            margin: -30px -30px 30px -30px;
            border-radius: 10px 10px 0 0;
        }}
        .chapter-header h2 {{
            margin: 0;
            font-size: 1.8em;
        }}
        .chapter-header .question-count {{
            font-size: 0.9em;
            opacity: 0.9;
            margin-top: 5px;
        }}
        .question-block {{
            background: #f8f9fa;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }}
        .question-number {{
            background-color: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 15px;
            font-weight: bold;
            font-size: 0.9em;
        }}
        strong {{
            color: #333;
        }}
        .back-to-top {{
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            text-decoration: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s;
        }}
        .back-to-top:hover {{
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }}
    </style>
</head>
<body>
    <div class="main-header">
        <h1>📚 Missing Questions - Group {file_num}</h1>
        <div class="stats">
            <div class="stat">
                <div class="stat-number">{len(chapters_data)}</div>
                <div class="stat-label">Chapters</div>
            </div>
            <div class="stat">
                <div class="stat-number">{total_questions}</div>
                <div class="stat-label">Questions</div>
            </div>
        </div>
    </div>

    <div class="toc">
        <h2>📑 Table of Contents</h2>
        <ul>
"""

    # Add TOC entries
    for chapter, questions in chapters_data:
        safe_id = re.sub(r'[^\w\s-]', '', chapter).strip().replace(' ', '_').lower()
        html_content += f'            <li><a href="#{safe_id}">{chapter} ({len(questions)} questions)</a></li>\n'

    html_content += """        </ul>
    </div>

"""

    # Add chapter sections
    for chapter, questions in chapters_data:
        safe_id = re.sub(r'[^\w\s-]', '', chapter).strip().replace(' ', '_').lower()

        html_content += f"""    <div class="chapter-section" id="{safe_id}">
        <div class="chapter-header">
            <h2>{chapter}</h2>
            <div class="question-count">{len(questions)} Questions</div>
        </div>

"""

        for i, q in enumerate(questions, 1):
            html_content += f"""        <div class="question-block">
            <div class="question-number">Question {i}</div>
            <div class="question-content">
{q['html']}
            </div>
        </div>

"""

        html_content += """    </div>

"""

    html_content += """    <a href="#" class="back-to-top">↑ Back to Top</a>
</body>
</html>"""

    output_path = output_dir / f"missing_questions_group_{file_num}.html"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return output_path, chapter_list, total_questions

def create_main_index(file_summaries, output_dir):
    """Create main index linking to all 4 grouped files"""

    total_chapters = sum(fs['chapters'] for fs in file_summaries)
    total_questions = sum(fs['questions'] for fs in file_summaries)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Missing Questions - Main Index</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 40px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 3em;
        }}
        .header .subtitle {{
            margin-top: 15px;
            font-size: 1.3em;
            opacity: 0.9;
        }}
        .stats {{
            display: flex;
            justify-content: center;
            gap: 60px;
            margin-top: 30px;
        }}
        .stat {{
            text-align: center;
        }}
        .stat-number {{
            font-size: 3em;
            font-weight: bold;
        }}
        .stat-label {{
            font-size: 1.1em;
            opacity: 0.85;
        }}
        .file-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }}
        .file-card {{
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }}
        .file-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }}
        .file-card-header {{
            background: linear-gradient(to right, #667eea, #764ba2);
            color: white;
            padding: 25px;
            text-align: center;
        }}
        .file-card-header h2 {{
            margin: 0;
            font-size: 1.8em;
        }}
        .file-card-stats {{
            display: flex;
            justify-content: space-around;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.3);
        }}
        .file-stat {{
            text-align: center;
        }}
        .file-stat-number {{
            font-size: 1.8em;
            font-weight: bold;
        }}
        .file-stat-label {{
            font-size: 0.85em;
            opacity: 0.8;
        }}
        .file-card-body {{
            padding: 25px;
        }}
        .file-card-body h3 {{
            color: #333;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.1em;
        }}
        .chapter-list {{
            list-style: none;
            padding: 0;
            margin: 0;
        }}
        .chapter-list li {{
            padding: 8px 0;
            color: #555;
            font-size: 0.95em;
            border-bottom: 1px solid #eee;
        }}
        .chapter-list li:last-child {{
            border-bottom: none;
        }}
        .view-button {{
            display: block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 15px;
            text-decoration: none;
            border-radius: 0 0 15px 15px;
            font-weight: bold;
            font-size: 1.1em;
            transition: all 0.3s;
        }}
        .view-button:hover {{
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Missing Questions Index</h1>
        <div class="subtitle">JEE Advanced Mathematics - Questions Not Yet in Database</div>
        <div class="stats">
            <div class="stat">
                <div class="stat-number">4</div>
                <div class="stat-label">Groups</div>
            </div>
            <div class="stat">
                <div class="stat-number">{total_chapters}</div>
                <div class="stat-label">Chapters</div>
            </div>
            <div class="stat">
                <div class="stat-number">{total_questions}</div>
                <div class="stat-label">Questions</div>
            </div>
        </div>
    </div>

    <div class="file-grid">
"""

    for i, summary in enumerate(file_summaries, 1):
        html_content += f"""        <div class="file-card">
            <div class="file-card-header">
                <h2>Group {i}</h2>
                <div class="file-card-stats">
                    <div class="file-stat">
                        <div class="file-stat-number">{summary['chapters']}</div>
                        <div class="file-stat-label">Chapters</div>
                    </div>
                    <div class="file-stat">
                        <div class="file-stat-number">{summary['questions']}</div>
                        <div class="file-stat-label">Questions</div>
                    </div>
                </div>
            </div>
            <div class="file-card-body">
                <h3>📖 Chapters Included:</h3>
                <ul class="chapter-list">
"""
        for chapter in summary['chapter_list']:
            html_content += f"                    <li>{chapter}</li>\n"

        html_content += f"""                </ul>
            </div>
            <a href="{summary['filename']}" class="view-button">View Questions →</a>
        </div>

"""

    html_content += """    </div>
</body>
</html>"""

    index_path = output_dir / "index.html"
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return index_path

def main():
    print("🔍 Grouping missing questions into 4 balanced files...\n")

    # Load existing questions
    print("📖 Loading existing questions from database...")
    existing_questions = load_existing_questions()
    print(f"✅ Found {len(existing_questions)} existing questions\n")

    # Extract questions by chapter
    html_path = Path('/Users/Pramod/projects/iit-exams/combined_maths_problems.html')
    print(f"📄 Reading combined HTML file: {html_path}")
    chapters = extract_questions_by_chapter(html_path, existing_questions)

    total_questions = sum(len(q) for q in chapters.values())
    print(f"📊 Found {total_questions} missing questions in {len(chapters)} chapters\n")

    # Distribute chapters across 4 files
    print("⚖️  Distributing chapters across 4 files...\n")
    distributed_files = distribute_chapters_to_files(chapters, num_files=4)

    # Create output directory
    output_dir = Path('/Users/Pramod/projects/iit-exams/maths/output')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create HTML files
    file_summaries = []

    for i, file_data in enumerate(distributed_files, 1):
        output_path, chapter_list, question_count = create_grouped_html(
            i,
            file_data['chapters'],
            output_dir
        )

        file_summaries.append({
            'filename': output_path.name,
            'chapters': len(file_data['chapters']),
            'questions': question_count,
            'chapter_list': chapter_list
        })

        print(f"✅ Group {i}: {len(file_data['chapters'])} chapters, {question_count} questions")
        print(f"   → {output_path.name}")
        print(f"   Chapters: {', '.join([c.split(' (')[0] for c in chapter_list[:3]])}{'...' if len(chapter_list) > 3 else ''}\n")

    # Create main index
    print("📄 Creating main index file...")
    index_path = create_main_index(file_summaries, output_dir)

    print(f"\n{'='*70}")
    print(f"✅ Complete! Created 4 grouped HTML files + index")
    print(f"📁 Output directory: {output_dir}")
    print(f"🌐 Open index.html to browse all groups")
    print(f"{'='*70}\n")

    # Show distribution summary
    print("📊 Distribution Summary:")
    for i, summary in enumerate(file_summaries, 1):
        print(f"   Group {i}: {summary['questions']} questions ({summary['chapters']} chapters)")

if __name__ == '__main__':
    main()
