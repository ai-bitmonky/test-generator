#!/usr/bin/env python3
"""
Reposition new detailed SVG figures to replace old placeholder SVGs
Move SVG from beginning to the position where placeholder SVG was located
"""

from bs4 import BeautifulSoup

print("Repositioning SVG figures to replace placeholders...\n")

with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

questions = soup.find_all('div', class_='question-card')
repositioned_count = 0

for i, q in enumerate(questions, 1):
    q_text_div = q.find('div', class_='question-text')

    if q_text_div:
        # Find all SVGs in this question
        svgs = list(q_text_div.find_all('svg'))

        if len(svgs) >= 2:
            # SVG #1 is the new detailed one (at beginning)
            # SVG #2 is the old placeholder (in the middle)
            new_svg = svgs[0]
            old_placeholder_svg = svgs[1]

            # Check if SVG #2 is indeed a placeholder
            if 'Figure for Question' in old_placeholder_svg.get_text():
                # Get the position of the placeholder
                placeholder_parent = old_placeholder_svg.parent
                placeholder_index = list(placeholder_parent.children).index(old_placeholder_svg)

                # Remove new SVG from beginning
                new_svg.extract()

                # Remove old placeholder
                old_placeholder_svg.extract()

                # Insert new SVG at the placeholder's position
                # We need to re-get the children list after extraction
                children = list(placeholder_parent.children)

                # Insert at the same index where placeholder was
                if placeholder_index < len(children):
                    children[placeholder_index].insert_before(new_svg)
                else:
                    placeholder_parent.append(new_svg)

                repositioned_count += 1
                print(f"✓ Repositioned SVG for Question {i}")

# Save the modified HTML
with open('problematic_physics_questions.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print(f"\n✅ Successfully repositioned {repositioned_count} SVG figures")
print("Saved to problematic_physics_questions.html")

# Verify
print("\nVerification:")
with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    content = f.read()

remaining = content.count('Figure for Question')
print(f"Remaining 'Figure for Question' instances: {remaining}")

if remaining == 0:
    print("✅ All placeholders replaced with detailed SVGs at correct positions!")
else:
    print(f"⚠️ Still have {remaining} placeholder instances")
