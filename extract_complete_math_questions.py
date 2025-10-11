#!/usr/bin/env python3
"""
Extract Complete Mathematics Questions from HTML
Similar structure to Physics questions
"""

import json
import re
from bs4 import BeautifulSoup
from pathlib import Path

def extract_tags(tags_h2):
    """Extract tags from TAGS h2 element"""
    if not tags_h2:
        return []

    tag_spans = tags_h2.find_all('span', class_='tag')
    tags = [span.get_text(strip=True) for span in tag_spans]

    if not tags:
        text = tags_h2.get_text()
        match = re.search(r'TAGS:\s*(.+)', text)
        if match:
            tags_text = match.group(1).strip()
            tags = [t.strip() for t in re.split(r'[,\s]+', tags_text) if t.strip()]

    return tags

def extract_difficulty(diff_h2):
    """Extract difficulty level - normalize to EASY/MEDIUM/HARD"""
    if not diff_h2:
        return "MEDIUM"

    diff_span = diff_h2.find('span', class_=lambda x: x and 'difficulty-' in x)
    if diff_span:
        text = diff_span.get_text(strip=True).lower()
        if 'hard' in text or 'advanced' in text:
            return 'HARD'
        elif 'easy' in text:
            return 'EASY'
        else:
            return 'MEDIUM'

    text = diff_h2.get_text().lower()
    if 'hard' in text or 'advanced' in text:
        return 'HARD'
    elif 'easy' in text:
        return 'EASY'
    return 'MEDIUM'

def extract_options_from_divs(options_div):
    """Extract options from div.option elements"""
    if not options_div:
        return {}

    options = {}
    option_divs = options_div.find_all('div', class_='option')
    letters = ['a', 'b', 'c', 'd']

    for idx, div in enumerate(option_divs[:4]):
        if idx < len(letters):
            text = div.get_text(strip=True)
            # Remove leading (a), (b), etc.
            text = re.sub(r'^\([a-d]\)\s*', '', text)
            options[letters[idx]] = text

    return options

def extract_correct_answer(answer_div):
    """Extract correct answer"""
    if not answer_div:
        return None

    text = answer_div.get_text()
    # Match (a), (b), (c), (d) or just A, B, C, D
    match = re.search(r'\(([a-d])\)|Answer:\s*\(([a-d])\)|([ABCD])\b', text, re.IGNORECASE)
    if match:
        answer = (match.group(1) or match.group(2) or match.group(3)).lower()
        return answer

    return None

def extract_solution_text(solution_div):
    """Extract solution as HTML and text"""
    if not solution_div:
        return "", ""

    solution_html = solution_div.decode_contents().strip()
    solution_text = solution_div.get_text(separator='\n', strip=True)

    return solution_html, solution_text

def extract_questions_from_html(html_path):
    """Extract all math questions"""
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    questions = []
    hrs = soup.find_all('hr')

    print(f"Found {len(hrs)} question separators")

    current_chapter = None

    for idx, hr in enumerate(hrs):
        try:
            current = hr.next_sibling

            topic = None
            subtopic = None
            tags = []
            question_type = None
            difficulty = None
            question_number = None
            question_div = None
            options_div = None
            answer_div = None
            solution_div = None

            while current and current.name != 'hr':
                if current.name == 'h2':
                    text = current.get_text()

                    if text.startswith('Chapter:') or 'id="chapter-' in str(current):
                        current_chapter = text.replace('Chapter:', '').strip()
                        if not current_chapter:
                            chapter_id = current.get('id', '')
                            if chapter_id.startswith('chapter-'):
                                current_chapter = chapter_id.replace('chapter-', '').replace('-', ' ').title()

                    elif text.startswith('Topic:'):
                        topic = text.replace('Topic:', '').strip()

                    elif text.startswith('Subtopic:'):
                        subtopic = text.replace('Subtopic:', '').strip()

                    elif text.startswith('TAGS:') or 'TAGS' in text:
                        tags = extract_tags(current)

                    elif text.startswith('TYPE:'):
                        question_type = text.replace('TYPE:', '').strip()

                    elif text.startswith('Difficulty:'):
                        difficulty = extract_difficulty(current)

                elif current.name == 'h3':
                    text = current.get_text()
                    match = re.search(r'Question\s+(\d+)', text)
                    if match:
                        question_number = int(match.group(1))

                elif current.name == 'div':
                    classes = current.get('class', [])

                    if 'question' in classes:
                        question_div = current
                    elif 'options' in classes:
                        options_div = current
                    elif 'answer' in classes:
                        answer_div = current
                    elif 'solution' in classes:
                        solution_div = current

                current = current.next_sibling

            if question_number and question_div:
                question_text = question_div.decode_contents().strip()
                options = extract_options_from_divs(options_div) if options_div else {}
                correct_answer = extract_correct_answer(answer_div) if answer_div else None
                solution_html, solution_text = extract_solution_text(solution_div) if solution_div else ("", "")

                chapter_slug = current_chapter.replace(' ', '_').replace('and', '').replace(',', '') if current_chapter else 'Mathematics'
                question_id = f"{chapter_slug}_{question_number}"

                question_obj = {
                    'id': question_id,
                    'subject': 'Mathematics',
                    'chapter': current_chapter or 'Mathematics',
                    'topic': topic or '',
                    'subtopic': subtopic or '',
                    'tags': tags,
                    'type': question_type or 'Multiple Choice Single Answer',
                    'difficulty': difficulty or 'MEDIUM',
                    'question': BeautifulSoup(question_text, 'html.parser').get_text(strip=True),
                    'question_html': question_text,
                    'options': options,
                    'correct_answer': correct_answer,
                    'solution_html': solution_html,
                    'solution_text': solution_text
                }

                questions.append(question_obj)

                if len(questions) % 50 == 0:
                    print(f"Extracted {len(questions)} questions...")

        except Exception as e:
            print(f"Error processing question at index {idx}: {e}")
            continue

    return questions

def main():
    print("📐 Extracting IIT JEE Complete Mathematics Questions...\n")

    html_path = Path('/Users/Pramod/projects/Selenium/IIT_JEE_Mathematics_Complete_Problems.html')

    if not html_path.exists():
        print(f"❌ HTML file not found: {html_path}")
        return

    print(f"📄 Reading: {html_path}")

    questions = extract_questions_from_html(html_path)

    print(f"\n✅ Extracted {len(questions)} mathematics questions")

    from collections import Counter
    chapters = Counter(q['chapter'] for q in questions)

    print("\n📊 Questions by Chapter:")
    for chapter, count in sorted(chapters.items()):
        print(f"  • {chapter}: {count} questions")

    difficulties = Counter(q['difficulty'] for q in questions)
    print("\n📊 Questions by Difficulty:")
    for diff, count in sorted(difficulties.items()):
        print(f"  • {diff}: {count} questions")

    output_path = Path('complete_math_questions.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Saved to: {output_path}")
    print(f"📦 File size: {output_path.stat().st_size / 1024:.2f} KB")

    if questions:
        print("\n📝 Sample Question:")
        sample = questions[0]
        print(f"  ID: {sample['id']}")
        print(f"  Chapter: {sample['chapter']}")
        print(f"  Topic: {sample['topic']}")
        print(f"  Difficulty: {sample['difficulty']}")
        print(f"  Question: {sample['question'][:100]}...")
        print(f"  Options: {len(sample['options'])} options")
        print(f"  Correct Answer: {sample['correct_answer']}")

if __name__ == '__main__':
    main()
