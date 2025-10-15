#!/usr/bin/env python3
"""
Replace the SVG for Question 14 in the HTML file
"""

import re

# Read the HTML file
html_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html'
svg_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/question_14_new_diagram.svg'

with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

with open(svg_file, 'r', encoding='utf-8') as f:
    new_svg = f.read()

# Find the SVG section for Question 14
# We need to be careful to match the right SVG
# Looking for the pattern that starts after Question 14 and before the next div

# Pattern to match: from the opening svg tag to the closing svg tag
# We'll use a more specific pattern that looks for the Question 14 context

# First, let's find the Question 14 section
q14_pattern = r'(<div class="question-figure">\s*<svg[^>]*>.*?</svg>\s*</div>)'

# Find all matches
matches = list(re.finditer(q14_pattern, html_content, re.DOTALL))

# We need to find the right one - it should be around line 7009-7061
# Let's search for the specific SVG that contains "Question 14:" text inside it
old_svg_pattern = r'(<div class="question-figure">\s*)(<svg[^>]*>.*?Question 14:.*?</svg>)(\s*</div>)'

match = re.search(old_svg_pattern, html_content, re.DOTALL)

if match:
    # Extract just the SVG content (with proper indentation)
    indent = '          '  # 10 spaces to match the original indentation
    new_svg_indented = '\n'.join([indent + line if line.strip() else line for line in new_svg.split('\n')])

    # Replace the old SVG with the new one
    replacement = match.group(1) + new_svg_indented + match.group(3)
    html_content = html_content[:match.start()] + replacement + html_content[match.end():]

    # Write back
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print("Successfully replaced SVG for Question 14")
    print(f"Old SVG was {len(match.group(2))} characters")
    print(f"New SVG is {len(new_svg)} characters")
else:
    print("Could not find the SVG to replace")
    print("Searching for alternative pattern...")

    # Alternative approach: find based on position after "Question 28" header
    # Since we know it's around line 7009
    lines = html_content.split('\n')

    # Find the line with Question 28 question-number
    for i, line in enumerate(lines):
        if 'class="question-number">Question 28<' in line:
            print(f"Found Question 28 at line {i+1}")
            # Now find the next <svg> tag
            for j in range(i, min(i+50, len(lines))):
                if '<svg' in lines[j]:
                    print(f"Found SVG start at line {j+1}")
                    # Find the end of this SVG
                    svg_start = j
                    for k in range(j, min(j+100, len(lines))):
                        if '</svg>' in lines[k]:
                            svg_end = k
                            print(f"Found SVG end at line {k+1}")

                            # Replace lines from svg_start to svg_end
                            new_svg_lines = new_svg.split('\n')
                            # Add proper indentation
                            indented_lines = ['          ' + line if line.strip() else '' for line in new_svg_lines]

                            # Replace the lines
                            new_lines = lines[:svg_start] + indented_lines + lines[svg_end+1:]

                            # Write back
                            with open(html_file, 'w', encoding='utf-8') as f:
                                f.write('\n'.join(new_lines))

                            print("Successfully replaced SVG using line-based approach")
                            break
                    break
            break
