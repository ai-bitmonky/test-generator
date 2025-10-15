#!/usr/bin/env python3
"""
Replace the SVG for Question 14 in the HTML file - Version 2
"""

import re

# Read the HTML file
html_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html'
svg_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/question_14_new_diagram.svg'

with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

with open(svg_file, 'r', encoding='utf-8') as f:
    new_svg_content = f.read()

# Find Question 28 (which contains Question 14 content)
# Look for the pattern: Question 28 header, then question-text with "Question 14:", then the SVG

# More precise pattern: Look for the question-figure div that comes after "Question 14:" in question-text
# Pattern: question-text containing "Question 14:" followed by question-figure with SVG

# Use a two-step approach:
# 1. Find the position of "Question 14:" in question-text
# 2. Find the next <svg> ... </svg> after that position

q14_text_pos = html_content.find('Question 14:')
if q14_text_pos == -1:
    print("Could not find 'Question 14:' in the HTML")
    exit(1)

print(f"Found 'Question 14:' at position {q14_text_pos}")

# Now find the next <svg tag after this position
svg_start_tag = '<svg xmlns="http://www.w3.org/2000/svg"'
svg_start_pos = html_content.find(svg_start_tag, q14_text_pos)

if svg_start_pos == -1:
    print("Could not find SVG tag after Question 14")
    exit(1)

print(f"Found SVG start tag at position {svg_start_pos}")

# Find the matching </svg> tag
svg_end_tag = '</svg>'
svg_end_pos = html_content.find(svg_end_tag, svg_start_pos)

if svg_end_pos == -1:
    print("Could not find SVG end tag")
    exit(1)

svg_end_pos += len(svg_end_tag)  # Include the closing tag
print(f"Found SVG end tag at position {svg_end_pos}")

# Extract the old SVG
old_svg = html_content[svg_start_pos:svg_end_pos]
print(f"Old SVG length: {len(old_svg)} characters")
print(f"Old SVG first 200 chars: {old_svg[:200]}")

# Get the indentation of the SVG (count spaces before <svg)
# Go backwards from svg_start_pos to find the last newline
indent_start = html_content.rfind('\n', 0, svg_start_pos) + 1
indentation = html_content[indent_start:svg_start_pos]
print(f"Indentation: '{indentation}' ({len(indentation)} spaces)")

# Indent the new SVG content
new_svg_lines = new_svg_content.split('\n')
indented_new_svg = '\n'.join([indentation + line if line.strip() else '' for line in new_svg_lines])

# Replace the old SVG with the new one
new_html_content = html_content[:svg_start_pos] + indented_new_svg + html_content[svg_end_pos:]

# Write back
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(new_html_content)

print(f"\nSuccessfully replaced SVG!")
print(f"New SVG length: {len(indented_new_svg)} characters")
print(f"File size change: {len(new_html_content) - len(html_content)} characters")
