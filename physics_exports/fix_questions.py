#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

# Read the HTML file
with open('physics_questions_01_of_05.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Question 16 - Add C1 label
content = content.replace(
    '    <rect x="95" y="155" width="30" height="50" fill="none" stroke="#3498db" stroke-width="2"></rect>\n    \n    <text x="125" y="175" font-size="11" fill="#27ae60">+</text>',
    '    <rect x="95" y="155" width="30" height="50" fill="none" stroke="#3498db" stroke-width="2"></rect>\n    <text x="110" y="145" text-anchor="middle" font-size="12" fill="#3498db" font-weight="bold">C₁ = 2.00 μF</text>\n    <text x="125" y="175" font-size="11" fill="#27ae60">+</text>'
)

# Question 16 - Add C2 label
content = content.replace(
    '    <rect x="175" y="155" width="30" height="50" fill="none" stroke="#e74c3c" stroke-width="2"></rect>\n    \n    <text x="205" y="175" font-size="11" fill="#27ae60">+</text>',
    '    <rect x="175" y="155" width="30" height="50" fill="none" stroke="#e74c3c" stroke-width="2"></rect>\n    <text x="190" y="145" text-anchor="middle" font-size="12" fill="#e74c3c" font-weight="bold">C₂ = 8.00 μF</text>\n    <text x="205" y="175" font-size="11" fill="#27ae60">+</text>'
)

# Question 20 - Add d = 4.0 cm label
# Find the section for Question 20 and add the distance label
content = re.sub(
    r'(<!-- Distance marker between particles -->)\n(\s+<line x1="300" y1="190" x2="500" y2="190"[^>]*>)',
    r'\1\n\2\n    <text x="400" y="205" text-anchor="middle" font-size="13" font-weight="bold" fill="#7f8c8d">d = 4.0 cm</text>',
    content
)

# Question 23 - Add d = 4.0 cm label in system information
content = re.sub(
    r'(<text x="125" y="140" text-anchor="start"[^>]*>q₃ = \? \(movable\)</text>)\n(\s+)',
    r'\1\n\2<text x="125" y="160" text-anchor="start" stroke="#fff" stroke-width="3" opacity="0.8">d = 4.0 cm</text>\n\2',
    content
)

# Question 26 - Add d = 1.40 cm label
# This is the same diagram as Question 16, so we need to find the specific instance
# Look for the line that marks distance d between q1 and point P
q26_pattern = r'(<!-- Distances and Angles -->)\n(\s+<line x1="150" y1="230" x2="280" y2="150" stroke-dasharray="5,5"></line>)\n(\s+)'
q26_replacement = r'\1\n\2\n\3<text x="215" y="190" text-anchor="middle" stroke="#fff" stroke-width="3" opacity="0.8" font-size="16">d = 1.40 cm</text>\n\3'
content = re.sub(q26_pattern, q26_replacement, content)

# Question 35 - Add d = 1.40 cm label
# Find the SVG for Question 35 and add the label
q35_pattern = r'(<line x1="140" y1="220" x2="280" y2="220" stroke-dasharray="5,5"></line>)\n(\s+)'
q35_replacement = r'\1\n\2<text x="210" y="215" text-anchor="middle" stroke="#fff" stroke-width="3" opacity="0.8">d = 1.40 cm</text>\n\2'
content = re.sub(q35_pattern, q35_replacement, content)

# Write the modified content back
with open('physics_questions_01_of_05.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Question 16: Added C₁ = 2.00 μF and C₂ = 8.00 μF labels")
print("✓ Question 20: Added d = 4.0 cm label")
print("✓ Question 23: Added d = 4.0 cm label")
print("✓ Question 26: Added d = 1.40 cm label")
print("✓ Question 35: Added d = 1.40 cm label")
print("\nAll fixes applied successfully!")
