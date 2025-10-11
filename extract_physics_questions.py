#!/usr/bin/env python3
"""
Extract Physics Questions from HTML
Extracts all 264 IIT JEE Physics questions with complete metadata including
Chapter, Topic, Subtopic, TAGS, TYPE, Difficulty, Strategy, Expert Insight, Key Facts
"""

import json
import re
from bs4 import BeautifulSoup
from pathlib import Path

def clean_html(html_str):
    """Clean HTML string while preserving important tags"""
    if not html_str:
        return ""
    # Remove excessive whitespace
    html_str = re.sub(r'\s+', ' ', html_str).strip()
    return html_str

def extract_text(element):
    """Extract text from element, preserving some structure"""
    if not element:
        return ""
    return element.get_text(strip=True)

def extract_tags(tags_h2):
    """Extract tags from TAGS h2 element"""
    if not tags_h2:
        return []

    # Find all span.tag elements
    tag_spans = tags_h2.find_all('span', class_='tag')
    tags = [span.get_text(strip=True) for span in tag_spans]

    # If no spans found, try to extract from text
    if not tags:
        text = tags_h2.get_text()
        # Extract everything after "TAGS:"
        match = re.search(r'TAGS:\s*(.+)', text)
        if match:
            tags_text = match.group(1).strip()
            # Split by common separators
            tags = [t.strip() for t in re.split(r'[,\s]+', tags_text) if t.strip()]

    return tags

def extract_difficulty(diff_h2):
    """Extract difficulty level from h2 element"""
    if not diff_h2:
        return "MEDIUM"

    # Find span with difficulty class
    diff_span = diff_h2.find('span', class_=lambda x: x and 'difficulty-' in x)
    if diff_span:
        text = diff_span.get_text(strip=True)
        # Normalize to our format
        if 'hard' in text.lower():
            return 'HARD'
        elif 'easy' in text.lower():
            return 'EASY'
        else:
            return 'MEDIUM'

    # Fallback: extract from text
    text = diff_h2.get_text().lower()
    if 'hard' in text:
        return 'HARD'
    elif 'easy' in text:
        return 'EASY'
    else:
        return 'MEDIUM'

def extract_correct_answer(answer_div):
    """Extract correct answer letter from answer div"""
    if not answer_div:
        return None

    text = answer_div.get_text()
    # Extract letter A, B, C, or D
    match = re.search(r'\b([ABCD])\b', text)
    if match:
        return match.group(1).lower()

    return None

def extract_options(options_div):
    """Extract all four options from options div"""
    if not options_div:
        return {}

    options = {}

    # Find the ordered list
    ol = options_div.find('ol', type='A')
    if ol:
        items = ol.find_all('li', recursive=False)
        letters = ['a', 'b', 'c', 'd']

        for idx, item in enumerate(items[:4]):  # Only take first 4
            if idx < len(letters):
                options[letters[idx]] = item.decode_contents().strip()

    return options

def extract_solution_parts(solution_div):
    """Extract strategy, expert insight, key facts, and steps from solution"""
    if not solution_div:
        return {}, ""

    solution_data = {
        'strategy': '',
        'expert_insight': '',
        'key_facts': '',
        'steps': []
    }

    # Get all contents
    contents = solution_div.decode_contents()

    # Extract Strategy
    strategy_match = re.search(r'<strong>Strategy:</strong>\s*(.+?)(?=<strong>|<ol>|$)', contents, re.DOTALL | re.IGNORECASE)
    if strategy_match:
        strategy_html = strategy_match.group(1).strip()
        strategy_soup = BeautifulSoup(strategy_html, 'html.parser')
        solution_data['strategy'] = strategy_soup.get_text(strip=True)

    # Extract Expert Insight
    insight_match = re.search(r'<strong>Expert Insight:</strong>\s*(.+?)(?=<strong>|<ol>|$)', contents, re.DOTALL | re.IGNORECASE)
    if insight_match:
        insight_html = insight_match.group(1).strip()
        insight_soup = BeautifulSoup(insight_html, 'html.parser')
        solution_data['expert_insight'] = insight_soup.get_text(strip=True)

    # Extract Key Facts
    facts_match = re.search(r'<strong>Key Facts Used:</strong>\s*(.+?)(?=<strong>|<ol>|$)', contents, re.DOTALL | re.IGNORECASE)
    if facts_match:
        facts_html = facts_match.group(1).strip()
        facts_soup = BeautifulSoup(facts_html, 'html.parser')
        solution_data['key_facts'] = facts_soup.get_text(strip=True)

    # Extract Steps from ordered list
    ol = solution_div.find('ol')
    if ol:
        steps = []
        items = ol.find_all('li', recursive=False)

        for item in items:
            step_html = item.decode_contents().strip()
            steps.append(step_html)

        solution_data['steps'] = steps

    # Build complete solution HTML
    solution_html = f"""<div class="solution">
<strong>Solution:</strong>
<div class="strategy">
<strong>Strategy:</strong> {solution_data['strategy']}
</div>
<div class="expert-insight">
<strong>Expert Insight:</strong> {solution_data['expert_insight']}
</div>
<div class="key-facts">
<strong>Key Facts Used:</strong> {solution_data['key_facts']}
</div>
<ol class="steps">
"""

    for step in solution_data['steps']:
        solution_html += f"<li>{step}</li>\n"

    solution_html += """</ol>
</div>"""

    return solution_data, solution_html

def extract_questions_from_html(html_path):
    """Extract all questions from the HTML file"""
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    questions = []

    # Find all <hr> tags which separate questions
    hrs = soup.find_all('hr')

    print(f"Found {len(hrs)} question separators")

    # Keep track of current chapter
    current_chapter = None

    for idx, hr in enumerate(hrs):
        try:
            # Start from the <hr> and collect elements until next <hr>
            current = hr.next_sibling

            # Collect all elements for this question
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

                    # Check for Chapter
                    if text.startswith('Chapter:') or 'id="chapter-' in str(current):
                        current_chapter = text.replace('Chapter:', '').strip()
                        if not current_chapter:
                            # Try to extract from id
                            chapter_id = current.get('id', '')
                            if chapter_id.startswith('chapter-'):
                                current_chapter = chapter_id.replace('chapter-', '').replace('-', ' ').title()

                    # Topic
                    elif text.startswith('Topic:'):
                        topic = text.replace('Topic:', '').strip()

                    # Subtopic
                    elif text.startswith('Subtopic:'):
                        subtopic = text.replace('Subtopic:', '').strip()

                    # TAGS
                    elif text.startswith('TAGS:') or 'TAGS' in text:
                        tags = extract_tags(current)

                    # TYPE
                    elif text.startswith('TYPE:'):
                        question_type = text.replace('TYPE:', '').strip()

                    # Difficulty
                    elif text.startswith('Difficulty:'):
                        difficulty = extract_difficulty(current)

                elif current.name == 'h3':
                    # Question number
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

            # Now create question object if we have all required parts
            if question_number and question_div and options_div and answer_div:
                # Extract data
                question_text = question_div.decode_contents().strip()
                options = extract_options(options_div)
                correct_answer = extract_correct_answer(answer_div)
                solution_parts, solution_html = extract_solution_parts(solution_div)

                # Create question ID
                chapter_slug = current_chapter.replace(' ', '_').replace('and', '').replace(',', '') if current_chapter else 'Physics'
                question_id = f"{chapter_slug}_{question_number}"

                question_obj = {
                    'id': question_id,
                    'subject': 'Physics',
                    'chapter': current_chapter or 'Physics',
                    'topic': topic or '',
                    'subtopic': subtopic or '',
                    'tags': tags,
                    'type': question_type or 'Multiple Choice Single Answer',
                    'difficulty': difficulty or 'MEDIUM',
                    'question': BeautifulSoup(question_text, 'html.parser').get_text(strip=True),
                    'question_html': question_text,
                    'options': options,
                    'correct_answer': correct_answer,
                    'strategy': solution_parts.get('strategy', ''),
                    'expert_insight': solution_parts.get('expert_insight', ''),
                    'key_facts': solution_parts.get('key_facts', ''),
                    'solution_html': solution_html,
                    'solution_text': BeautifulSoup(solution_html, 'html.parser').get_text(separator='\n', strip=True)
                }

                questions.append(question_obj)

                if len(questions) % 10 == 0:
                    print(f"Extracted {len(questions)} questions...")

        except Exception as e:
            print(f"Error processing question at index {idx}: {e}")
            continue

    return questions

def main():
    print("🔬 Extracting IIT JEE Physics Questions...\n")

    html_path = Path('/Users/Pramod/projects/Selenium/IIT_JEE_Physics_Complete_264_Questions.html')

    if not html_path.exists():
        print(f"❌ HTML file not found: {html_path}")
        return

    print(f"📄 Reading: {html_path}")

    # Extract questions
    questions = extract_questions_from_html(html_path)

    print(f"\n✅ Extracted {len(questions)} physics questions")

    # Show chapter breakdown
    from collections import Counter
    chapters = Counter(q['chapter'] for q in questions)

    print("\n📊 Questions by Chapter:")
    for chapter, count in sorted(chapters.items()):
        print(f"  • {chapter}: {count} questions")

    # Show difficulty breakdown
    difficulties = Counter(q['difficulty'] for q in questions)
    print("\n📊 Questions by Difficulty:")
    for diff, count in sorted(difficulties.items()):
        print(f"  • {diff}: {count} questions")

    # Save to JSON
    output_path = Path('physics_questions_with_solutions.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Saved to: {output_path}")
    print(f"📦 File size: {output_path.stat().st_size / 1024:.2f} KB")

    # Show sample question
    if questions:
        print("\n📝 Sample Question:")
        sample = questions[0]
        print(f"  ID: {sample['id']}")
        print(f"  Chapter: {sample['chapter']}")
        print(f"  Topic: {sample['topic']}")
        print(f"  Subtopic: {sample['subtopic']}")
        print(f"  Tags: {', '.join(sample['tags'])}")
        print(f"  Type: {sample['type']}")
        print(f"  Difficulty: {sample['difficulty']}")
        print(f"  Question: {sample['question'][:100]}...")
        print(f"  Options: {len(sample['options'])} options")
        print(f"  Correct Answer: {sample['correct_answer']}")
        print(f"  Strategy: {sample['strategy'][:100]}..." if sample['strategy'] else "  Strategy: (none)")
        print(f"  Key Facts: {sample['key_facts'][:100]}..." if sample['key_facts'] else "  Key Facts: (none)")

if __name__ == '__main__':
    main()
