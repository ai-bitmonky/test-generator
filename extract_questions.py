#!/usr/bin/env python3
"""Extract questions as JSON for Next.js app."""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup


def extract_questions_with_options(html_file, topic_name):
    """Extract questions with options from HTML file."""

    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    problems = soup.find_all('div', class_='problem')

    questions = []

    for idx, problem in enumerate(problems, 1):
        prob_num = problem.find('span', class_='problem-number')
        prob_num_text = prob_num.get_text(strip=True) if prob_num else f"Problem {idx}"

        difficulty = problem.find('span', class_='difficulty')
        difficulty_text = difficulty.get_text(strip=True) if difficulty else "ADVANCED"

        prob_text = problem.find('div', class_='problem-text')
        prob_text_html = str(prob_text) if prob_text else ""
        prob_text_content = prob_text.get_text(strip=True) if prob_text else ""

        options_div = problem.find('div', class_='options')
        options = []

        if options_div:
            option_items = options_div.find_all('div', class_='option')
            for opt in option_items:
                opt_text = opt.get_text(strip=True)
                match = re.match(r'^\(([a-d])\)', opt_text)
                if match:
                    option_letter = match.group(1)
                    option_value = opt_text[3:].strip()
                    options.append({
                        'letter': option_letter,
                        'text': opt_text,
                        'value': option_value
                    })

        questions.append({
            'id': f"{topic_name}_{idx}",
            'topic': topic_name,
            'number': prob_num_text,
            'difficulty': difficulty_text,
            'question_html': prob_text_html,
            'question_text': prob_text_content,
            'options': options,
            'correct_answer': None,
            'solution': None
        })

    return questions


def build_questions_database(maths_folder):
    """Build complete questions database."""

    maths_path = Path(maths_folder)
    html_files = sorted(maths_path.glob("*.html"))

    database = {}
    total_questions = 0

    for html_file in html_files:
        topic_name = html_file.stem.replace('_', ' ')

        print(f"Processing: {topic_name}")

        questions = extract_questions_with_options(html_file, topic_name)

        if questions:
            database[topic_name] = questions
            total_questions += len(questions)
            print(f"  Found {len(questions)} questions")

    print(f"\n✅ Total topics: {len(database)}")
    print(f"✅ Total questions: {total_questions}")

    return database


if __name__ == "__main__":
    database = build_questions_database("../maths")

    # Save to JSON
    with open("public/data/questions.json", "w", encoding="utf-8") as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    print("\n✅ Saved to public/data/questions.json")
