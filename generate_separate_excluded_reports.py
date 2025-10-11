#!/usr/bin/env python3
"""
Generate separate HTML reports for Mathematics and Physics excluded questions
"""

import json

def generate_math_html(math_excluded):
    """Generate HTML report for Mathematics excluded questions"""

    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mathematics - 38 Excluded Questions</title>
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
            background: linear-gradient(135deg, #a8e6cf 0%, #56ab2f 100%);
            border-left: 6px solid #2d8659;
            padding: 25px;
            margin-bottom: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            color: white;
        }

        .summary h2 {
            color: white;
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
            font-size: 1.1em;
            font-weight: 500;
        }

        .summary li strong {
            font-weight: 700;
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

        .footer-box {
            text-align: center;
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border: 2px solid #cbd5e0;
        }

        .footer-box h3 {
            color: #2d3748;
            margin-bottom: 15px;
        }

        .footer-box p {
            color: #4a5568;
            line-height: 1.8;
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
        <h1>📐 Mathematics - Excluded Questions</h1>
        <p class="subtitle">38 Questions Missing Correct Answers</p>

        <div class="summary">
            <h2>📊 Summary</h2>
            <ul>
                <li><strong>Subject:</strong> Mathematics</li>
                <li><strong>Total Excluded:</strong> """ + str(len(math_excluded)) + """ questions</li>
                <li><strong>Reason:</strong> Missing or null <code>correct_answer</code> field</li>
                <li><strong>Status:</strong> Needs manual review</li>
            </ul>
        </div>
"""

    # Add each math question
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
                    <div class="question-number">Question #{idx}</div>
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
                <strong>⚠️ Manual Review Required:</strong> Correct answer is missing. Please review the original source to determine the correct answer.
            </div>
        </div>
"""

    html += """
        <div class="footer-box">
            <h3>📌 Next Steps</h3>
            <p>
                Review each question against the original source file:<br/>
                <strong>/Users/Pramod/projects/Selenium/IIT_JEE_Mathematics_Complete_Problems.html</strong><br/><br/>
                Once correct answers are identified, update the JSON and re-run migration.
            </p>
        </div>
    </div>
</body>
</html>
"""

    return html

def generate_physics_html(physics_excluded):
    """Generate HTML report for Physics excluded questions"""

    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Physics - 12 Excluded Questions</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
            background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
            border-left: 6px solid #8e44ad;
            padding: 25px;
            margin-bottom: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            color: #2d3748;
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
            font-size: 1.1em;
            font-weight: 500;
        }

        .summary li strong {
            font-weight: 700;
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
            border-color: #f5576c;
            box-shadow: 0 12px 28px rgba(245, 87, 108, 0.2);
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
            color: #f5576c;
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
            border-left: 4px solid #f5576c;
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
            color: #f5576c;
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
            background: #fef5e7;
            color: #7d6608;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            border: 1px solid #f9e79f;
        }

        .footer-box {
            text-align: center;
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border: 2px solid #cbd5e0;
        }

        .footer-box h3 {
            color: #2d3748;
            margin-bottom: 15px;
        }

        .footer-box p {
            color: #4a5568;
            line-height: 1.8;
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
        <h1>🔬 Physics - Excluded Questions</h1>
        <p class="subtitle">12 Questions Missing Correct Answers</p>

        <div class="summary">
            <h2>📊 Summary</h2>
            <ul>
                <li><strong>Subject:</strong> Physics</li>
                <li><strong>Total Excluded:</strong> """ + str(len(physics_excluded)) + """ questions</li>
                <li><strong>Reason:</strong> Missing or null <code>correct_answer</code> field</li>
                <li><strong>Status:</strong> Needs manual review</li>
            </ul>
        </div>
"""

    # Add each physics question
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
                    <div class="question-number">Question #{idx}</div>
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
                <strong>⚠️ Manual Review Required:</strong> Correct answer is missing. Please review the original source to determine the correct answer.
            </div>
        </div>
"""

    html += """
        <div class="footer-box">
            <h3>📌 Next Steps</h3>
            <p>
                Review each question against the original source file:<br/>
                <strong>/Users/Pramod/projects/Selenium/IIT_JEE_Physics_Complete_264_Questions.html</strong><br/><br/>
                Once correct answers are identified, update the JSON and re-run migration.
            </p>
        </div>
    </div>
</body>
</html>
"""

    return html

if __name__ == '__main__':
    print("🔍 Generating separate HTML reports...\n")

    # Load excluded questions from JSON
    with open('excluded_questions_detailed.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    math_excluded = data['mathematics']
    physics_excluded = data['physics']

    # Generate Mathematics HTML
    print(f"📐 Generating Mathematics report ({len(math_excluded)} questions)...")
    math_html = generate_math_html(math_excluded)
    math_file = 'excluded_mathematics_questions.html'
    with open(math_file, 'w', encoding='utf-8') as f:
        f.write(math_html)
    print(f"   ✅ Saved: {math_file}\n")

    # Generate Physics HTML
    print(f"🔬 Generating Physics report ({len(physics_excluded)} questions)...")
    physics_html = generate_physics_html(physics_excluded)
    physics_file = 'excluded_physics_questions.html'
    with open(physics_file, 'w', encoding='utf-8') as f:
        f.write(physics_html)
    print(f"   ✅ Saved: {physics_file}\n")

    print("="*70)
    print("✅ Separate reports generated successfully!")
    print("="*70)
    print(f"📂 Files created:")
    print(f"  • {math_file} - 38 Mathematics questions")
    print(f"  • {physics_file} - 12 Physics questions")
    print("="*70)
