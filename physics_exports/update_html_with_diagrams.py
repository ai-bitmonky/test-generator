#!/usr/bin/env python3
"""
Update HTML file with generated SVG diagrams

This script:
1. Reads all generated_qN.svg files
2. Finds corresponding question sections in HTML
3. Replaces existing SVG with new diagrams
4. Saves updated HTML
"""

import re
from pathlib import Path
from typing import Dict


def read_svg_file(svg_path: Path) -> str:
    """Read and return SVG content"""
    with open(svg_path, 'r') as f:
        return f.read()


def extract_svg_content(svg_text: str) -> str:
    """Extract just the SVG content (remove any extra whitespace)"""
    # Find the <svg> tag and everything until </svg>
    match = re.search(r'<svg.*?</svg>', svg_text, re.DOTALL)
    if match:
        return match.group(0)
    return svg_text


def update_html_with_diagrams(html_file: Path, max_questions: int = 50):
    """Update HTML file with all generated diagrams"""

    print("=" * 80)
    print("📝 UPDATING HTML WITH GENERATED DIAGRAMS")
    print("=" * 80)
    print()

    # Read HTML file
    print(f"Reading HTML file: {html_file}")
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    original_content = html_content

    # Track updates
    updated_count = 0
    failed_count = 0

    # Process each question
    for q_num in range(1, max_questions + 1):
        svg_file = Path(f"generated_q{q_num}.svg")

        if not svg_file.exists():
            print(f"  Q{q_num}: ⚠️  SVG file not found: {svg_file}")
            failed_count += 1
            continue

        # Read the generated SVG
        new_svg = read_svg_file(svg_file)
        new_svg = extract_svg_content(new_svg)

        # Find the question section in HTML
        # Pattern: <div class="question-container"> ... Question N ... </div>

        # First, find the question container for this question number
        question_pattern = rf'(<div class="question-container">.*?<div class="question-number">Question {q_num}</div>.*?)(<div class="question-figure">.*?<svg.*?</svg>.*?</div>)(.*?</div>\s*</div>\s*</div>)'

        match = re.search(question_pattern, html_content, re.DOTALL)

        if match:
            # Extract parts
            before_svg = match.group(1)
            old_svg_section = match.group(2)
            after_svg = match.group(3)

            # Create new SVG section
            new_svg_section = f'<div class="question-figure">\n          {new_svg}\n        </div>'

            # Replace in HTML
            old_full = match.group(0)
            new_full = before_svg + new_svg_section + after_svg

            html_content = html_content.replace(old_full, new_full, 1)

            print(f"  Q{q_num}: ✅ Updated")
            updated_count += 1

        else:
            # Try alternate pattern - some questions might not have existing SVG
            question_pattern_no_svg = rf'(<div class="question-container">.*?<div class="question-number">Question {q_num}</div>.*?<div class="question-text">.*?</div>)(.*?)(</div>)'

            match2 = re.search(question_pattern_no_svg, html_content, re.DOTALL)

            if match2:
                before = match2.group(1)
                middle = match2.group(2)
                after = match2.group(3)

                # Insert SVG section after question-text
                new_svg_section = f'\n\n        <div class="question-figure">\n          {new_svg}\n        </div>\n'

                old_full = match2.group(0)
                new_full = before + new_svg_section + middle + after

                html_content = html_content.replace(old_full, new_full, 1)

                print(f"  Q{q_num}: ✅ Inserted (was missing)")
                updated_count += 1
            else:
                print(f"  Q{q_num}: ❌ Could not find question in HTML")
                failed_count += 1

    print()
    print("=" * 80)
    print(f"Summary:")
    print(f"  ✅ Updated: {updated_count}")
    print(f"  ❌ Failed: {failed_count}")
    print("=" * 80)
    print()

    # Save updated HTML
    if updated_count > 0:
        backup_file = html_file.with_suffix('.html.backup')

        # Create backup
        print(f"Creating backup: {backup_file}")
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(original_content)

        # Save updated HTML
        print(f"Saving updated HTML: {html_file}")
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print()
        print("✅ HTML file updated successfully!")
        print(f"   Original backed up to: {backup_file}")
        print()
    else:
        print("⚠️  No updates made - HTML unchanged")
        print()

    return updated_count, failed_count


def main():
    """Main execution"""
    html_file = Path("/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html")

    print("=" * 80)
    print("🔄 HTML DIAGRAM UPDATER")
    print("=" * 80)
    print()
    print("This will update the HTML file with all generated diagrams")
    print()

    if not html_file.exists():
        print(f"❌ Error: HTML file not found: {html_file}")
        return

    # Update HTML
    updated, failed = update_html_with_diagrams(html_file)

    print("=" * 80)
    print("🎉 COMPLETE!")
    print("=" * 80)
    print()
    print(f"View updated HTML at:")
    print(f"file://{html_file.absolute()}")
    print()


if __name__ == "__main__":
    main()
