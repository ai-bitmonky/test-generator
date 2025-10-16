#!/usr/bin/env python3
"""
Remove duplicate question labels from HTML
Example: Remove "Question 19:" from question text when "Question 2" already exists in header
"""

import re
from pathlib import Path


def remove_duplicate_question_labels(html_file: Path):
    """Remove duplicate 'Question N:' labels from question text"""

    print("=" * 80)
    print("🧹 REMOVING DUPLICATE QUESTION LABELS")
    print("=" * 80)
    print()

    # Read HTML
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    original_content = html_content

    # Pattern to match: <p><strong>Question N:</strong></p>
    # This appears in the question-text div as duplicate
    pattern1 = r'<p><strong>Question \d+:</strong></p>\s*'

    # Count matches
    matches = list(re.finditer(pattern1, html_content))
    print(f"Found {len(matches)} duplicate 'Question N:' labels")
    print()

    if matches:
        print("Removing labels:")
        for i, match in enumerate(matches, 1):
            snippet = match.group(0).strip()
            print(f"  {i}. {snippet}")

        # Remove all matches
        html_content = re.sub(pattern1, '', html_content)
        print()
        print(f"✅ Removed {len(matches)} duplicate labels")
    else:
        print("No duplicate labels found")

    print()

    # Save if changes were made
    if html_content != original_content:
        # Create backup
        backup_file = html_file.with_suffix('.html.backup2')
        print(f"Creating backup: {backup_file}")
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(original_content)

        # Save cleaned HTML
        print(f"Saving cleaned HTML: {html_file}")
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print()
        print("✅ HTML cleaned successfully!")
        print(f"   Backup saved to: {backup_file}")
    else:
        print("⚠️  No changes needed")

    print()
    print("=" * 80)
    print("🎉 COMPLETE!")
    print("=" * 80)
    print()

    return len(matches)


def main():
    html_file = Path("/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html")

    if not html_file.exists():
        print(f"❌ Error: HTML file not found: {html_file}")
        return

    removed_count = remove_duplicate_question_labels(html_file)

    if removed_count > 0:
        print(f"View cleaned HTML at:")
        print(f"file://{html_file.absolute()}")
        print()


if __name__ == "__main__":
    main()
