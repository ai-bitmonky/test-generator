#!/usr/bin/env python3
"""
Generate an HTML file listing all questions in our database, organized by topic.
"""

import json
from pathlib import Path
from collections import defaultdict

def load_questions():
    """Load questions from JSON file"""
    json_path = Path('mcq_questions_with_solutions.json')
    if json_path.exists():
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def group_by_topic(questions):
    """Group questions by topic"""
    topics = defaultdict(list)
    for q in questions:
        topics[q['topic']].append(q)
    return topics

def create_html(questions_by_topic, output_path):
    """Create HTML file with all questions"""

    total_questions = sum(len(q) for q in questions_by_topic.values())

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Questions - JEE Advanced Mathematics</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            line-height: 1.6;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px 40px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }}
        .header h1 {{
            margin: 0;
            font-size: 3em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }}
        .header .subtitle {{
            margin-top: 15px;
            font-size: 1.2em;
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
            background: rgba(255,255,255,0.1);
            padding: 20px 40px;
            border-radius: 10px;
        }}
        .stat-number {{
            font-size: 3em;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }}
        .stat-label {{
            font-size: 1em;
            opacity: 0.9;
            margin-top: 5px;
        }}
        .toc {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 40px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }}
        .toc h2 {{
            margin-top: 0;
            color: #667eea;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
            font-size: 2em;
        }}
        .toc-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }}
        .toc-item {{
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 15px 20px;
            border-radius: 10px;
            transition: all 0.3s ease;
            border-left: 4px solid #667eea;
        }}
        .toc-item:hover {{
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }}
        .toc-item a {{
            text-decoration: none;
            color: #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
        }}
        .topic-badge {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: bold;
        }}
        .topic-section {{
            background: white;
            padding: 40px;
            margin-bottom: 40px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }}
        .topic-header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            margin: -40px -40px 40px -40px;
            border-radius: 15px 15px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .topic-header h2 {{
            margin: 0;
            font-size: 2.2em;
        }}
        .topic-count {{
            background: rgba(255,255,255,0.2);
            padding: 10px 25px;
            border-radius: 25px;
            font-size: 1.2em;
            font-weight: bold;
        }}
        .question-card {{
            background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 12px;
            border-left: 5px solid #667eea;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
        }}
        .question-card:hover {{
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }}
        .question-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
        }}
        .question-id {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.95em;
        }}
        .difficulty {{
            padding: 6px 15px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 0.85em;
            text-transform: uppercase;
        }}
        .difficulty.EASY {{
            background-color: #4caf50;
            color: white;
        }}
        .difficulty.MEDIUM {{
            background-color: #ff9800;
            color: white;
        }}
        .difficulty.HARD {{
            background-color: #f44336;
            color: white;
        }}
        .question-text {{
            font-size: 1.15em;
            color: #333;
            margin: 20px 0;
            line-height: 1.8;
            font-weight: 500;
        }}
        .options {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }}
        .option {{
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
            transition: all 0.3s ease;
        }}
        .option.correct {{
            border-color: #4caf50;
            background-color: #f1f8f4;
        }}
        .option-label {{
            font-weight: bold;
            color: #667eea;
            margin-right: 10px;
        }}
        .option.correct .option-label {{
            color: #4caf50;
        }}
        .option.correct::after {{
            content: " ✓";
            color: #4caf50;
            font-weight: bold;
            font-size: 1.3em;
            float: right;
        }}
        .solution-toggle {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: bold;
            margin-top: 15px;
            transition: all 0.3s ease;
        }}
        .solution-toggle:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }}
        .solution {{
            display: none;
            background: white;
            padding: 25px;
            margin-top: 20px;
            border-radius: 10px;
            border-left: 5px solid #4caf50;
        }}
        .solution.visible {{
            display: block;
        }}
        .solution-title {{
            color: #4caf50;
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 15px;
        }}
        .solution-step {{
            margin: 15px 0;
            padding-left: 20px;
            border-left: 3px solid #e0e0e0;
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
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            transition: all 0.3s;
            font-weight: bold;
            z-index: 1000;
        }}
        .back-to-top:hover {{
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        }}
    </style>
    <script>
        function toggleSolution(id) {{
            const solution = document.getElementById('solution-' + id);
            const button = document.getElementById('btn-' + id);
            if (solution.classList.contains('visible')) {{
                solution.classList.remove('visible');
                button.textContent = 'Show Solution';
            }} else {{
                solution.classList.add('visible');
                button.textContent = 'Hide Solution';
            }}
        }}
    </script>
</head>
<body>
    <div class="header">
        <h1>📚 Database Questions</h1>
        <div class="subtitle">JEE Advanced Mathematics - Complete Question Bank</div>
        <div class="stats">
            <div class="stat">
                <div class="stat-number">{len(questions_by_topic)}</div>
                <div class="stat-label">Topics</div>
            </div>
            <div class="stat">
                <div class="stat-number">{total_questions}</div>
                <div class="stat-label">Questions</div>
            </div>
        </div>
    </div>

    <div class="toc">
        <h2>📑 Topics</h2>
        <div class="toc-grid">
"""

    # Add TOC items
    for topic in sorted(questions_by_topic.keys()):
        count = len(questions_by_topic[topic])
        safe_id = topic.lower().replace(' ', '_').replace('&', 'and')
        html_content += f"""            <div class="toc-item">
                <a href="#{safe_id}">
                    <span>{topic}</span>
                    <span class="topic-badge">{count}</span>
                </a>
            </div>
"""

    html_content += """        </div>
    </div>

"""

    # Add question sections by topic
    for topic in sorted(questions_by_topic.keys()):
        questions = questions_by_topic[topic]
        safe_id = topic.lower().replace(' ', '_').replace('&', 'and')

        html_content += f"""    <div class="topic-section" id="{safe_id}">
        <div class="topic-header">
            <h2>{topic}</h2>
            <div class="topic-count">{len(questions)} Questions</div>
        </div>

"""

        for idx, q in enumerate(questions, 1):
            question_id = q['id'].replace('_', '-')
            correct_answer = q.get('correctAnswer', '')

            html_content += f"""        <div class="question-card">
            <div class="question-header">
                <span class="question-id">{q['id']}</span>
                <span class="difficulty {q['difficulty']}">{q['difficulty']}</span>
            </div>

            <div class="question-text">
                {q['question']}
            </div>

            <div class="options">
"""

            # Add options
            for option_key, option_text in q.get('options', {}).items():
                is_correct = option_key == correct_answer
                correct_class = ' correct' if is_correct else ''
                html_content += f"""                <div class="option{correct_class}">
                    <span class="option-label">{option_key.upper()})</span>
                    {option_text}
                </div>
"""

            html_content += """            </div>

"""

            # Add solution toggle button if solution exists
            if q.get('solutionHtml'):
                html_content += f"""            <button class="solution-toggle" id="btn-{question_id}" onclick="toggleSolution('{question_id}')">
                Show Solution
            </button>

            <div class="solution" id="solution-{question_id}">
                {q['solutionHtml']}
            </div>
"""

            html_content += """        </div>

"""

        html_content += """    </div>

"""

    html_content += """    <a href="#" class="back-to-top">↑ Back to Top</a>
</body>
</html>"""

    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return output_path

def main():
    print("📚 Generating HTML list of all database questions...\n")

    # Load questions
    print("📖 Loading questions from database...")
    questions = load_questions()

    if not questions:
        print("❌ No questions found in database!")
        return

    print(f"✅ Loaded {len(questions)} questions\n")

    # Group by topic
    print("📊 Grouping questions by topic...")
    questions_by_topic = group_by_topic(questions)
    print(f"✅ Found {len(questions_by_topic)} topics\n")

    # Show topic breakdown
    print("Topics breakdown:")
    for topic in sorted(questions_by_topic.keys()):
        count = len(questions_by_topic[topic])
        print(f"  • {topic}: {count} questions")

    # Generate HTML
    print(f"\n📝 Generating HTML file...")
    output_path = Path('/Users/Pramod/projects/iit-exams/maths/output/database_questions_list.html')
    output_path.parent.mkdir(parents=True, exist_ok=True)

    result_path = create_html(questions_by_topic, output_path)

    print(f"\n{'='*70}")
    print(f"✅ HTML file created successfully!")
    print(f"📁 Location: {result_path}")
    print(f"🌐 Open this file in your browser to view all questions")
    print(f"{'='*70}")

if __name__ == '__main__':
    main()
