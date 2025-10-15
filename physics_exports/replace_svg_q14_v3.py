#!/usr/bin/env python3
"""
Replace the SVG for Question 14/28 - Target the specific SVG at line ~7010
"""

# Read the HTML file
html_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html'
svg_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/question_14_new_diagram.svg'

with open(html_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(svg_file, 'r', encoding='utf-8') as f:
    new_svg_content = f.read()

# Find Question 28 header (which contains Question 14 content)
# Look for: <div class="question-number">Question 28</div>
q28_line = None
for i, line in enumerate(lines):
    if '<div class="question-number">Question 28</div>' in line:
        q28_line = i
        print(f"Found Question 28 at line {i+1}")
        break

if q28_line is None:
    print("Could not find Question 28!")
    exit(1)

# Now find the SVG tag after Question 28
# Look for <svg xmlns... after q28_line
svg_start_line = None
for i in range(q28_line, min(q28_line + 100, len(lines))):
    if '<svg xmlns="http://www.w3.org/2000/svg"' in lines[i]:
        svg_start_line = i
        print(f"Found SVG start at line {i+1}")
        break

if svg_start_line is None:
    print("Could not find SVG after Question 28!")
    exit(1)

# Find the SVG end tag
svg_end_line = None
for i in range(svg_start_line, min(svg_start_line + 100, len(lines))):
    if '</svg>' in lines[i]:
        svg_end_line = i
        print(f"Found SVG end at line {i+1}")
        break

if svg_end_line is None:
    print("Could not find SVG end!")
    exit(1)

# Get the indentation (10 spaces based on the structure)
indentation = '          '

# Prepare the new SVG lines
new_svg_lines = new_svg_content.split('\n')
indented_svg_lines = [indentation + line + '\n' if line.strip() else '\n' for line in new_svg_lines]

# Replace the old SVG lines with new ones
new_lines = lines[:svg_start_line] + indented_svg_lines + lines[svg_end_line+1:]

# Write back
with open(html_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\nSuccessfully replaced SVG!")
print(f"Replaced lines {svg_start_line+1} to {svg_end_line+1}")
print(f"Old SVG: {svg_end_line - svg_start_line + 1} lines")
print(f"New SVG: {len(indented_svg_lines)} lines")
print(f"Net change: {len(new_lines) - len(lines)} lines")
