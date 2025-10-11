#!/usr/bin/env python3
"""
1. Remove "Figure Added" success message divs
2. Reposition detailed SVGs from beginning to after question text (before options)
"""

from bs4 import BeautifulSoup

print("Step 1: Removing 'Figure Added' success message divs...\n")

with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Remove all solution-section divs that contain "Figure Added" messages
solution_sections = soup.find_all('div', class_='solution-section')
removed_messages = 0

for section in solution_sections:
    text = section.get_text()
    if '✅ Figure Added:' in text and 'diagram generated and embedded above' in text:
        section.decompose()
        removed_messages += 1

print(f"✓ Removed {removed_messages} 'Figure Added' message divs")

print("\nStep 2: Repositioning SVG figures...\n")

questions = soup.find_all('div', class_='question-card')
repositioned = 0

for i, q in enumerate(questions, 1):
    q_text_div = q.find('div', class_='question-text')

    if not q_text_div:
        continue

    # Find the detailed SVG (should be first child)
    svg = q_text_div.find('svg')

    if not svg:
        continue

    # Check if this is a detailed SVG (not a placeholder)
    svg_text = svg.get_text()
    if 'Figure for Question' in svg_text:
        continue  # Skip if it's still a placeholder

    # Find the question heading (h4 tag)
    h4 = q_text_div.find('h4')

    if h4:
        # Extract the SVG
        svg.extract()

        # Find all text content after h4 (the actual question text)
        # We want to insert SVG after the question text but before options

        # Get parent of question-text div to find options-section
        parent = q_text_div.parent
        options_div = parent.find('div', class_='options-section')

        if options_div:
            # Insert SVG just before options section
            options_div.insert_before(svg)
            repositioned += 1
            print(f"✓ Repositioned SVG for Question {i}")
        else:
            # If no options section found, append to end of question-text
            q_text_div.append(svg)
            repositioned += 1
            print(f"✓ Repositioned SVG for Question {i} (no options found)")

print(f"\n✅ Repositioned {repositioned} SVG figures")

# Save
with open('problematic_physics_questions.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Saved to problematic_physics_questions.html")

# Final verification
print("\nVerification:")
with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    content = f.read()

figure_added_count = content.count('✅ Figure Added:')
print(f"Remaining 'Figure Added' messages: {figure_added_count}")

if figure_added_count == 0:
    print("✅ All success messages removed!")
    print("✅ SVG figures repositioned to appear before answer choices!")
else:
    print(f"⚠️ Still have {figure_added_count} messages")
