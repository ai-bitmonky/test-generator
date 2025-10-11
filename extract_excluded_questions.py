#!/usr/bin/env python3
"""
Extract the 50 questions that were excluded due to missing correct answers
- 38 Mathematics questions
- 12 Physics questions
"""

from bs4 import BeautifulSoup
import json
import re

def extract_excluded_math_questions(html_file):
    """Extract math questions that don't have correct answers"""
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    excluded = []

    # Find all question sections
    questions = soup.find_all('div', class_='question')

    for idx, q_div in enumerate(questions, 1):
        try:
            # Extract question text
            question_p = q_div.find('p')
            if not question_p:
                continue
            question_text = question_p.get_text(strip=True)

            # Extract chapter
            chapter_h2 = None
            for prev_sibling in q_div.find_all_previous(['h2']):
                text = prev_sibling.get_text(strip=True)
                if text and not text.startswith('Difficulty'):
                    chapter_h2 = text
                    break

            chapter = chapter_h2 if chapter_h2 else "Unknown"

            # Extract difficulty
            difficulty = "MEDIUM"
            for prev_h2 in q_div.find_all_previous('h2', limit=5):
                if 'Difficulty' in prev_h2.get_text():
                    diff_text = prev_h2.get_text(strip=True).lower()
                    if 'hard' in diff_text or 'advanced' in diff_text:
                        difficulty = "HARD"
                    elif 'easy' in diff_text:
                        difficulty = "EASY"
                    break

            # Extract options
            options = {}
            option_spans = q_div.find_all('span', class_='option')
            for opt_span in option_spans:
                opt_text = opt_span.get_text(strip=True)
                match = re.match(r'\(([a-d])\)\s*(.+)', opt_text)
                if match:
                    options[match.group(1)] = match.group(2)

            # Extract correct answer
            correct_answer = None
            answer_div = q_div.find_next_sibling('div', class_='answer')
            if answer_div:
                answer_p = answer_div.find('p')
                if answer_p:
                    answer_text = answer_p.get_text(strip=True).lower()
                    # Try to find (a), (b), (c), or (d)
                    answer_match = re.search(r'\(([a-d])\)', answer_text)
                    if answer_match:
                        correct_answer = answer_match.group(1)

            # Only include if no correct answer found
            if not correct_answer and len(options) > 0:
                excluded.append({
                    'index': idx,
                    'chapter': chapter,
                    'difficulty': difficulty,
                    'question': question_text[:200] + '...' if len(question_text) > 200 else question_text,
                    'options': options,
                    'reason': 'Missing correct answer'
                })

        except Exception as e:
            print(f"Error processing math question {idx}: {e}")
            continue

    return excluded

def extract_excluded_physics_questions(html_file):
    """Extract physics questions that don't have correct answers"""
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    excluded = []

    # Split by <hr> tags
    sections = str(soup).split('<hr>')

    for idx, section in enumerate(sections[1:], 1):  # Skip first empty section
        try:
            section_soup = BeautifulSoup(section, 'html.parser')

            # Extract metadata
            h2_tags = section_soup.find_all('h2')

            chapter = ""
            topic = ""
            difficulty = "MEDIUM"

            for h2 in h2_tags:
                text = h2.get_text(strip=True)
                if text.startswith('Chapter'):
                    chapter = text.replace('Chapter', '').strip()
                elif text.startswith('topic'):
                    topic = text.replace('topic', '').strip()
                elif 'Difficulty level' in text:
                    diff_text = text.lower()
                    if 'hard' in diff_text or 'advanced' in diff_text:
                        difficulty = "HARD"
                    elif 'easy' in diff_text:
                        difficulty = "EASY"

            # Extract question
            question_div = section_soup.find('div', class_='question')
            if not question_div:
                continue

            question_p = question_div.find('p')
            if not question_p:
                continue

            question_text = question_p.get_text(strip=True)

            # Extract options
            options = {}
            option_spans = question_div.find_all('span', class_='option')
            for opt_span in option_spans:
                opt_text = opt_span.get_text(strip=True)
                match = re.match(r'\(([a-d])\)\s*(.+)', opt_text)
                if match:
                    options[match.group(1)] = match.group(2)

            # Extract correct answer
            correct_answer = None
            answer_div = section_soup.find('div', class_='answer')
            if answer_div:
                answer_p = answer_div.find('p')
                if answer_p:
                    answer_text = answer_p.get_text(strip=True).lower()
                    answer_match = re.search(r'\(([a-d])\)', answer_text)
                    if answer_match:
                        correct_answer = answer_match.group(1)

            # Only include if no correct answer found
            if not correct_answer and len(options) > 0:
                excluded.append({
                    'index': idx,
                    'chapter': chapter,
                    'topic': topic,
                    'difficulty': difficulty,
                    'question': question_text[:200] + '...' if len(question_text) > 200 else question_text,
                    'options': options,
                    'reason': 'Missing correct answer'
                })

        except Exception as e:
            print(f"Error processing physics question {idx}: {e}")
            continue

    return excluded

def generate_html_report(math_excluded, physics_excluded):
    """Generate HTML report of all excluded questions"""

    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excluded Questions Report - Missing Correct Answers</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        h1 {
            color: #2d3748;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .subtitle {
            text-align: center;
            color: #718096;
            margin-bottom: 30px;
            font-size: 1.1em;
        }

        .summary {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
        }

        .summary h2 {
            color: #2d3748;
            margin-bottom: 15px;
        }

        .summary ul {
            list-style: none;
            padding-left: 0;
        }

        .summary li {
            padding: 8px 0;
            color: #4a5568;
            font-size: 1.05em;
        }

        .summary li strong {
            color: #667eea;
        }

        .subject-section {
            margin-bottom: 50px;
        }

        .subject-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .subject-header h2 {
            font-size: 1.8em;
        }

        .subject-header p {
            margin-top: 5px;
            opacity: 0.9;
        }

        .question-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }

        .question-card:hover {
            border-color: #667eea;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
            transform: translateY(-2px);
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .question-number {
            font-size: 1.2em;
            font-weight: bold;
            color: #667eea;
        }

        .badges {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge.easy { background: #c6f6d5; color: #22543d; }
        .badge.medium { background: #feebc8; color: #7c2d12; }
        .badge.hard { background: #fed7d7; color: #742a2a; }
        .badge.missing { background: #fbb6ce; color: #702459; }

        .chapter-info {
            color: #4a5568;
            font-weight: 600;
            margin-bottom: 15px;
            padding: 10px;
            background: #f7fafc;
            border-radius: 6px;
        }

        .question-text {
            color: #2d3748;
            font-size: 1.05em;
            line-height: 1.6;
            margin-bottom: 20px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
        }

        .options {
            margin-top: 15px;
        }

        .option {
            padding: 12px 15px;
            margin: 8px 0;
            background: #f7fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            color: #2d3748;
            transition: all 0.2s ease;
        }

        .option:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
        }

        .option-label {
            font-weight: bold;
            color: #667eea;
            margin-right: 10px;
        }

        .warning-box {
            background: #fff5f5;
            border: 2px solid #fc8181;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            color: #742a2a;
        }

        .warning-box strong {
            color: #c53030;
        }

        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }

            h1 {
                font-size: 1.8em;
            }

            .question-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Excluded Questions Report</h1>
        <p class="subtitle">Questions with Missing Correct Answers</p>

        <div class="summary">
            <h2>📊 Summary</h2>
            <ul>
                <li><strong>Total Excluded:</strong> """ + str(len(math_excluded) + len(physics_excluded)) + """ questions</li>
                <li><strong>Mathematics:</strong> """ + str(len(math_excluded)) + """ questions</li>
                <li><strong>Physics:</strong> """ + str(len(physics_excluded)) + """ questions</li>
                <li><strong>Reason:</strong> Missing or improperly formatted correct answer in source HTML</li>
                <li><strong>Status:</strong> Can be manually reviewed and added to database</li>
            </ul>
        </div>
"""

    # Mathematics Section
    if math_excluded:
        html += """
        <div class="subject-section">
            <div class="subject-header">
                <h2>📐 Mathematics Questions</h2>
                <p>""" + str(len(math_excluded)) + """ questions excluded</p>
            </div>
"""

        for q in math_excluded:
            difficulty_class = q['difficulty'].lower()
            html += f"""
            <div class="question-card">
                <div class="question-header">
                    <span class="question-number">Question #{q['index']}</span>
                    <div class="badges">
                        <span class="badge {difficulty_class}">{q['difficulty']}</span>
                        <span class="badge missing">Missing Answer</span>
                    </div>
                </div>

                <div class="chapter-info">
                    📚 Chapter: {q['chapter']}
                </div>

                <div class="question-text">
                    {q['question']}
                </div>

                <div class="options">
                    <strong>Options:</strong>
"""

            for opt_key, opt_val in q['options'].items():
                html += f"""
                    <div class="option">
                        <span class="option-label">({opt_key})</span> {opt_val}
                    </div>
"""

            html += """
                </div>

                <div class="warning-box">
                    <strong>⚠️ Action Required:</strong> Correct answer not found in source HTML. Manual review needed to determine correct answer.
                </div>
            </div>
"""

        html += """
        </div>
"""

    # Physics Section
    if physics_excluded:
        html += """
        <div class="subject-section">
            <div class="subject-header">
                <h2>🔬 Physics Questions</h2>
                <p>""" + str(len(physics_excluded)) + """ questions excluded</p>
            </div>
"""

        for q in physics_excluded:
            difficulty_class = q['difficulty'].lower()
            topic_info = f"{q['chapter']} → {q['topic']}" if q['topic'] else q['chapter']
            html += f"""
            <div class="question-card">
                <div class="question-header">
                    <span class="question-number">Question #{q['index']}</span>
                    <div class="badges">
                        <span class="badge {difficulty_class}">{q['difficulty']}</span>
                        <span class="badge missing">Missing Answer</span>
                    </div>
                </div>

                <div class="chapter-info">
                    📚 {topic_info}
                </div>

                <div class="question-text">
                    {q['question']}
                </div>

                <div class="options">
                    <strong>Options:</strong>
"""

            for opt_key, opt_val in q['options'].items():
                html += f"""
                    <div class="option">
                        <span class="option-label">({opt_key})</span> {opt_val}
                    </div>
"""

            html += """
                </div>

                <div class="warning-box">
                    <strong>⚠️ Action Required:</strong> Correct answer not found in source HTML. Manual review needed to determine correct answer.
                </div>
            </div>
"""

        html += """
        </div>
"""

    html += """
    </div>
</body>
</html>
"""

    return html

if __name__ == '__main__':
    print("🔍 Extracting excluded questions...\n")

    # Extract excluded math questions
    print("📐 Processing Mathematics questions...")
    math_file = '/Users/Pramod/projects/Selenium/IIT_JEE_Mathematics_Complete_Problems.html'
    math_excluded = extract_excluded_math_questions(math_file)
    print(f"   Found {len(math_excluded)} excluded math questions\n")

    # Extract excluded physics questions
    print("🔬 Processing Physics questions...")
    physics_file = '/Users/Pramod/projects/Selenium/IIT_JEE_Physics_Complete_264_Questions.html'
    physics_excluded = extract_excluded_physics_questions(physics_file)
    print(f"   Found {len(physics_excluded)} excluded physics questions\n")

    # Save as JSON
    all_excluded = {
        'summary': {
            'total': len(math_excluded) + len(physics_excluded),
            'mathematics': len(math_excluded),
            'physics': len(physics_excluded)
        },
        'mathematics': math_excluded,
        'physics': physics_excluded
    }

    json_file = 'excluded_questions.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(all_excluded, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved JSON: {json_file}")

    # Generate HTML report
    html_content = generate_html_report(math_excluded, physics_excluded)
    html_file = 'excluded_questions_report.html'
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"✅ Saved HTML Report: {html_file}")

    print("\n" + "="*70)
    print("📊 Summary:")
    print("="*70)
    print(f"Total Excluded: {len(math_excluded) + len(physics_excluded)} questions")
    print(f"  • Mathematics: {len(math_excluded)} questions")
    print(f"  • Physics: {len(physics_excluded)} questions")
    print("="*70)
