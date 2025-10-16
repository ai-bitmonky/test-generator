#!/usr/bin/env python3
"""Update HTML by replacing SVGs sequentially"""

import re
from pathlib import Path

def update_html_sequential(html_path):
    """Replace each SVG in HTML with corresponding generated SVG"""

    # Read HTML
    with open(html_path, 'r') as f:
        html_content = f.read()

    # Find all SVG blocks in HTML
    svg_pattern = r'<svg[^>]*>.*?</svg>'
    existing_svgs = list(re.finditer(svg_pattern, html_content, re.DOTALL))

    print(f"Found {len(existing_svgs)} SVG blocks in HTML")

    # Replace each SVG with the corresponding generated one
    replacements = []
    for i, match in enumerate(existing_svgs, start=1):
        q_num = i  # SVG i corresponds to question i
        svg_file = f"generated_q{q_num}.svg"

        if not Path(svg_file).exists():
            print(f"⚠️  Q{q_num}: SVG file not found - {svg_file}")
            continue

        # Read new SVG content
        with open(svg_file, 'r') as f:
            new_svg = f.read().strip()

        # Store replacement (old_text, new_text, start_pos)
        replacements.append((match.group(0), new_svg, match.start(), match.end()))
        print(f"✅ Q{q_num}: Prepared replacement")

    # Apply replacements in reverse order (to preserve positions)
    for old_svg, new_svg, start, end in reversed(replacements):
        html_content = html_content[:start] + new_svg + html_content[end:]

    # Write updated HTML
    with open(html_path, 'w') as f:
        f.write(html_content)

    print(f"\n✅ HTML updated with {len(replacements)}/50 diagrams")
    print(f"✅ Output: {html_path}")

if __name__ == "__main__":
    html_path = Path("physics_questions_01_of_05.html")
    update_html_sequential(html_path)
