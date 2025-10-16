#!/usr/bin/env python3
"""
Verify each diagram matches its question and identify issues
"""

import re
from pathlib import Path

# Read HTML
html_file = Path('/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html')
with open(html_file) as f:
    html = f.read()

# Extract all questions
pattern = r'<div class="question-number">Question (\d+)</div>.*?<span class="meta-badge topic">([^<]+)</span>.*?<div class="question-text">(.*?)</div>'
matches = re.finditer(pattern, html, re.DOTALL)

questions = {}
for match in matches:
    q_num = int(match.group(1))
    topic = match.group(2)
    q_html = match.group(3)

    # Clean HTML
    q_text = re.sub(r'<[^>]+>', ' ', q_html)
    q_text = re.sub(r'\s+', ' ', q_text).strip()

    questions[q_num] = {
        'topic': topic,
        'text': q_text,
        'preview': q_text[:200]
    }

print("=" * 80)
print("DIAGRAM VERIFICATION REPORT")
print("=" * 80)
print()

issues = []

for q_num in range(1, 51):
    if q_num not in questions:
        print(f"Q{q_num}: ⚠️  Not found in HTML")
        continue

    q = questions[q_num]
    svg_file = Path(f'generated_q{q_num}.svg')

    if not svg_file.exists():
        print(f"Q{q_num}: ❌ SVG file missing!")
        issues.append((q_num, "Missing SVG"))
        continue

    # Read SVG
    with open(svg_file) as f:
        svg = f.read()

    # Check if diagram matches question
    problems = []

    # 1. Check title matches
    title_match = re.search(r'<text.*?text-anchor="middle".*?font-size="42".*?>(.*?)</text>', svg)
    if title_match:
        svg_title = title_match.group(1)
        # Check if question start is in title
        q_start = q['text'][:50]
        if q_start[:30] not in svg_title and not any(word in svg_title for word in q['text'].split()[:5]):
            problems.append(f"Title mismatch")

    # 2. Check if it's a capacitor question but has electric field diagram
    text_lower = q['text'].lower()
    is_capacitor_q = 'capacitor' in text_lower or q['topic'] == 'Capacitance'
    is_electric_field_q = 'electric field' in text_lower or 'charge' in text_lower[:100]

    has_capacitor_symbol = '<line x1=' in svg and 'stroke-width="4"' in svg  # Capacitor plates
    has_point_charge = '<circle cx=' in svg and 'fill="#FFD700"' in svg  # Gold circle
    has_field_lines = 'marker-end="url(#arrowGreen)"' in svg

    if is_capacitor_q and not has_capacitor_symbol and has_point_charge:
        problems.append("Capacitor question but has point charge diagram")

    if 'parallel-plate' in text_lower and has_point_charge and not has_capacitor_symbol:
        problems.append("Parallel-plate capacitor question but wrong diagram type")

    # 3. Check for multiple capacitors
    cap_count_in_question = 0
    for i in range(1, 7):
        if f'C{i}' in q['text'] or f'C₁' in q['text'] or 'capacitor' in text_lower:
            cap_matches = re.findall(r'C[₁₂₃₄₅₆]', q['text'])
            cap_count_in_question = len(set(cap_matches))
            break

    if cap_count_in_question >= 2:
        cap_count_in_svg = svg.count('<!-- Capacitor')
        if cap_count_in_svg == 0:
            problems.append(f"Has {cap_count_in_question} capacitors but diagram shows 0")
        elif cap_count_in_svg == 1 and cap_count_in_question >= 3:
            problems.append(f"Has {cap_count_in_question} capacitors but diagram shows only 1")

    # 4. Check for series/parallel
    if 'series' in text_lower and is_capacitor_q:
        has_series = 'Battery' in svg
        if not has_series:
            problems.append("Series circuit question but no battery shown")

    # 5. Check Given Information is not empty
    given_info_match = re.search(r'<g id="given-info">(.*?)</g>', svg, re.DOTALL)
    if given_info_match:
        bullets = given_info_match.group(1).count('• ')
        if bullets == 0:
            problems.append("Given Information is empty")

    # Report
    if problems:
        print(f"\nQ{q_num} ({q['topic']}): ⚠️  ISSUES FOUND")
        print(f"  Question: {q['preview'][:100]}...")
        for prob in problems:
            print(f"  - {prob}")
        issues.append((q_num, problems))
    else:
        print(f"Q{q_num}: ✅ OK", end='  ')
        if q_num % 5 == 0:
            print()

print("\n")
print("=" * 80)
print(f"SUMMARY: {len(issues)} questions with issues out of 50")
print("=" * 80)

if issues:
    print("\nDetailed issues:")
    for q_num, probs in issues:
        if isinstance(probs, str):
            print(f"  Q{q_num}: {probs}")
        else:
            print(f"  Q{q_num}: {', '.join(probs)}")
