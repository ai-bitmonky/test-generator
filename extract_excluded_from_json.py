#!/usr/bin/env python3
"""
Extract the 50 excluded questions from JSON files
These are questions that were parsed but excluded during migration due to missing correct_answer
"""

import json

def generate_html_report(math_excluded, physics_excluded):
    """Generate HTML report of all excluded questions"""

    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>50 Excluded Questions - Missing Correct Answers</title>
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
            max-width: 1400px;
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
            background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
            border-left: 6px solid #e17055;
            padding: 25px;
            margin-bottom: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .summary h2 {
            color: #2d3748;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .summary ul {
            list-style: none;
            padding-left: 0;
        }

        .summary li {
            padding: 10px 0;
            color: #2d3748;
            font-size: 1.1em;
            font-weight: 500;
        }

        .summary li strong {
            color: #d63031;
        }

        .subject-section {
            margin-bottom: 50px;
        }

        .subject-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .subject-header h2 {
            font-size: 2em;
            margin-bottom: 5px;
        }

        .subject-header p {
            margin-top: 5px;
            opacity: 0.95;
            font-size: 1.1em;
        }

        .question-card {
            background: white;
            border: 3px solid #e2e8f0;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 25px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .question-card:hover {
            border-color: #667eea;
            box-shadow: 0 12px 28px rgba(102, 126, 234, 0.2);
            transform: translateY(-3px);
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
        }

        .question-number {
            font-size: 1.4em;
            font-weight: bold;
            color: #667eea;
        }

        .question-id {
            font-size: 0.9em;
            color: #718096;
            font-family: 'Courier New', monospace;
            background: #f7fafc;
            padding: 5px 10px;
            border-radius: 6px;
        }

        .badges {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .badge {
            padding: 6px 18px;
            border-radius: 25px;
            font-size: 0.85em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge.easy { background: #c6f6d5; color: #22543d; }
        .badge.medium { background: #feebc8; color: #7c2d12; }
        .badge.hard { background: #fed7d7; color: #742a2a; }
        .badge.missing {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            color: white;
            box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
        }

        .metadata-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f7fafc;
            border-radius: 10px;
        }

        .metadata-item {
            color: #4a5568;
            font-size: 0.95em;
        }

        .metadata-item strong {
            color: #2d3748;
            display: block;
            margin-bottom: 3px;
        }

        .question-text {
            color: #2d3748;
            font-size: 1.1em;
            line-height: 1.8;
            margin-bottom: 25px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }

        .options {
            margin-top: 20px;
        }

        .options-title {
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 12px;
            font-size: 1.05em;
        }

        .option {
            padding: 15px 18px;
            margin: 10px 0;
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            color: #2d3748;
            transition: all 0.2s ease;
        }

        .option:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
            transform: translateX(5px);
        }

        .option-label {
            font-weight: bold;
            color: #667eea;
            margin-right: 12px;
            font-size: 1.05em;
        }

        .warning-box {
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 50%);
            border: 3px solid #fc8181;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            color: #742a2a;
            box-shadow: 0 4px 12px rgba(252, 129, 129, 0.2);
        }

        .warning-box strong {
            color: #c53030;
            font-size: 1.05em;
        }

        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }

        .tag {
            background: #e6fffa;
            color: #234e52;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            border: 1px solid #81e6d9;
        }

        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
            }
            .question-card {
                page-break-inside: avoid;
            }
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

            .metadata-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 50 Excluded Questions Report</h1>
        <p class="subtitle">Questions Skipped During Migration - Missing Correct Answers</p>

        <div class="summary">
            <h2>⚠️ Summary</h2>
            <ul>
                <li><strong>Total Excluded:</strong> """ + str(len(math_excluded) + len(physics_excluded)) + """ questions</li>
                <li><strong>Mathematics:</strong> """ + str(len(math_excluded)) + """ questions excluded</li>
                <li><strong>Physics:</strong> """ + str(len(physics_excluded)) + """ questions excluded</li>
                <li><strong>Reason:</strong> Missing or null <code>correct_answer</code> field in extracted data</li>
                <li><strong>Status:</strong> These questions need manual review to determine correct answers</li>
                <li><strong>Action:</strong> Can be manually added to database once correct answers are identified</li>
            </ul>
        </div>
"""

    # Mathematics Section
    if math_excluded:
        html += """
        <div class="subject-section">
            <div class="subject-header">
                <h2>📐 Mathematics Questions</h2>
                <p>""" + str(len(math_excluded)) + """ questions excluded during migration</p>
            </div>
"""

        for idx, q in enumerate(math_excluded, 1):
            difficulty_class = q.get('difficulty', 'MEDIUM').lower()
            chapter = q.get('chapter', 'Unknown')
            topic = q.get('topic', '')
            subtopic = q.get('subtopic', '')
            tags = q.get('tags', [])

            html += f"""
            <div class="question-card">
                <div class="question-header">
                    <div>
                        <div class="question-number">Math Question #{idx}</div>
                        <div class="question-id">ID: {q.get('id', 'Unknown')}</div>
                    </div>
                    <div class="badges">
                        <span class="badge {difficulty_class}">{q.get('difficulty', 'MEDIUM')}</span>
                        <span class="badge missing">⚠️ No Answer</span>
                    </div>
                </div>

                <div class="metadata-info">
                    <div class="metadata-item">
                        <strong>📚 Chapter:</strong> {chapter}
                    </div>
                    <div class="metadata-item">
                        <strong>📖 Topic:</strong> {topic}
                    </div>
                    <div class="metadata-item">
                        <strong>🔖 Subtopic:</strong> {subtopic}
                    </div>
                </div>
"""

            if tags:
                html += """
                <div class="tags">
"""
                for tag in tags:
                    html += f'<span class="tag">{tag}</span>'
                html += """
                </div>
"""

            question_text = q.get('question', 'Question text not available')
            html += f"""
                <div class="question-text">
                    {question_text}
                </div>

                <div class="options">
                    <div class="options-title">📝 Options:</div>
"""

            options = q.get('options', {})
            for opt_key in ['a', 'b', 'c', 'd']:
                if opt_key in options:
                    html += f"""
                    <div class="option">
                        <span class="option-label">({opt_key})</span> {options[opt_key]}
                    </div>
"""

            html += """
                </div>

                <div class="warning-box">
                    <strong>⚠️ Manual Review Required:</strong> The correct answer is missing or null in the source data.
                    Please review the original source material to determine the correct answer before adding this question to the database.
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
                <p>""" + str(len(physics_excluded)) + """ questions excluded during migration</p>
            </div>
"""

        for idx, q in enumerate(physics_excluded, 1):
            difficulty_class = q.get('difficulty', 'MEDIUM').lower()
            chapter = q.get('chapter', 'Unknown')
            topic = q.get('topic', '')
            subtopic = q.get('subtopic', '')
            tags = q.get('tags', [])

            html += f"""
            <div class="question-card">
                <div class="question-header">
                    <div>
                        <div class="question-number">Physics Question #{idx}</div>
                        <div class="question-id">ID: {q.get('id', 'Unknown')}</div>
                    </div>
                    <div class="badges">
                        <span class="badge {difficulty_class}">{q.get('difficulty', 'MEDIUM')}</span>
                        <span class="badge missing">⚠️ No Answer</span>
                    </div>
                </div>

                <div class="metadata-info">
                    <div class="metadata-item">
                        <strong>📚 Chapter:</strong> {chapter}
                    </div>
                    <div class="metadata-item">
                        <strong>📖 Topic:</strong> {topic}
                    </div>
                    <div class="metadata-item">
                        <strong>🔖 Subtopic:</strong> {subtopic}
                    </div>
                    <div class="metadata-item">
                        <strong>📋 Type:</strong> {q.get('type', 'Multiple Choice')}
                    </div>
                </div>
"""

            if tags:
                html += """
                <div class="tags">
"""
                for tag in tags:
                    html += f'<span class="tag">{tag}</span>'
                html += """
                </div>
"""

            question_text = q.get('question', 'Question text not available')
            html += f"""
                <div class="question-text">
                    {question_text}
                </div>

                <div class="options">
                    <div class="options-title">📝 Options:</div>
"""

            options = q.get('options', {})
            for opt_key in ['a', 'b', 'c', 'd']:
                if opt_key in options:
                    html += f"""
                    <div class="option">
                        <span class="option-label">({opt_key})</span> {options[opt_key]}
                    </div>
"""

            html += """
                </div>

                <div class="warning-box">
                    <strong>⚠️ Manual Review Required:</strong> The correct answer is missing or null in the source data.
                    Please review the original source material to determine the correct answer before adding this question to the database.
                </div>
            </div>
"""

        html += """
        </div>
"""

    html += """
        <div style="text-align: center; margin-top: 40px; padding: 30px; background: #f7fafc; border-radius: 12px;">
            <h3 style="color: #2d3748; margin-bottom: 15px;">📌 Next Steps</h3>
            <p style="color: #4a5568; line-height: 1.8;">
                1. Review each question against the original source HTML<br/>
                2. Identify the correct answer for each question<br/>
                3. Update the JSON files with correct answers<br/>
                4. Re-run the migration scripts to add these questions to the database
            </p>
        </div>
    </div>
</body>
</html>
"""

    return html

if __name__ == '__main__':
    print("🔍 Extracting excluded questions from JSON files...\n")

    # Load math questions
    print("📐 Loading Mathematics questions...")
    with open('complete_math_questions.json', 'r', encoding='utf-8') as f:
        math_data = json.load(f)

    math_excluded = [q for q in math_data if not q.get('correct_answer')]
    print(f"   Found {len(math_excluded)} math questions without correct_answer\n")

    # Load physics questions
    print("🔬 Loading Physics questions...")
    with open('physics_questions_with_solutions.json', 'r', encoding='utf-8') as f:
        physics_data = json.load(f)

    physics_excluded = [q for q in physics_data if not q.get('correct_answer')]
    print(f"   Found {len(physics_excluded)} physics questions without correct_answer\n")

    # Save detailed JSON
    all_excluded = {
        'summary': {
            'total': len(math_excluded) + len(physics_excluded),
            'mathematics': len(math_excluded),
            'physics': len(physics_excluded),
            'reason': 'Missing correct_answer field',
            'status': 'Needs manual review'
        },
        'mathematics': math_excluded,
        'physics': physics_excluded
    }

    json_file = 'excluded_questions_detailed.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(all_excluded, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved detailed JSON: {json_file}")

    # Generate HTML report
    print("📄 Generating HTML report...")
    html_content = generate_html_report(math_excluded, physics_excluded)
    html_file = 'excluded_questions_report.html'
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"✅ Saved HTML Report: {html_file}")

    print("\n" + "="*70)
    print("📊 Extraction Complete:")
    print("="*70)
    print(f"Total Excluded: {len(math_excluded) + len(physics_excluded)} questions")
    print(f"  • Mathematics: {len(math_excluded)} questions")
    print(f"  • Physics: {len(physics_excluded)} questions")
    print("="*70)
    print(f"\n📂 Files created:")
    print(f"  • {json_file} - Detailed JSON with all excluded questions")
    print(f"  • {html_file} - Beautiful HTML report for review")
    print("="*70)
