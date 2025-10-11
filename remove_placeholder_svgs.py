#!/usr/bin/env python3
"""
Remove old placeholder SVG elements that contain "Figure for Question X" text
Keep only the detailed SVG figures
"""

from bs4 import BeautifulSoup

print("Removing old placeholder SVG elements...\n")

with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

questions = soup.find_all('div', class_='question-card')
removed_count = 0

for i, q in enumerate(questions, 1):
    q_text_div = q.find('div', class_='question-text')

    if q_text_div:
        # Find all SVGs in this question
        svgs = q_text_div.find_all('svg')

        # Remove SVGs that contain placeholder text
        for svg in svgs:
            svg_text = svg.get_text()
            if 'Figure for Question' in svg_text and 'Diagram based on textual description' in svg_text:
                svg.decompose()
                removed_count += 1
                print(f"✓ Removed placeholder SVG from Question {i}")

# Save the cleaned HTML
with open('problematic_physics_questions.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print(f"\n✅ Successfully removed {removed_count} placeholder SVG elements")
print("Saved to problematic_physics_questions.html")

# Verify
print("\nVerification:")
with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    content = f.read()

remaining = content.count('Figure for Question')
print(f"Remaining 'Figure for Question' instances: {remaining}")

if remaining == 0:
    print("✅ All placeholder SVGs successfully removed!")
else:
    print(f"⚠️ Still have {remaining} placeholder instances")
