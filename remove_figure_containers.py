#!/usr/bin/env python3
"""
Remove all figure-container divs that contain placeholder SVGs
"""

from bs4 import BeautifulSoup

print("Removing figure-container divs with placeholder SVGs...\n")

with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Find all figure-container divs
figure_containers = soup.find_all('div', class_='figure-container')
removed_count = 0

for container in figure_containers:
    # Check if this container has a placeholder SVG
    svg = container.find('svg')
    if svg and 'Figure for Question' in svg.get_text():
        container.decompose()
        removed_count += 1

print(f"✓ Removed {removed_count} figure-container divs with placeholders")

# Save the cleaned HTML
with open('problematic_physics_questions.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Saved to problematic_physics_questions.html")

# Verify
print("\nVerification:")
with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
    content = f.read()

remaining_placeholder = content.count('Figure for Question')
remaining_containers = content.count('class="figure-container"')

print(f"Remaining 'Figure for Question' instances: {remaining_placeholder}")
print(f"Remaining figure-container divs: {remaining_containers}")

if remaining_placeholder == 0:
    print("\n✅ All placeholder figure containers successfully removed!")
else:
    print(f"\n⚠️ Still have {remaining_placeholder} placeholder instances")
