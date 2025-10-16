#!/usr/bin/env python3
"""
Physics Diagram Generator - Command Line Interface

Usage:
    python3 generate_diagram.py "Your physics question here"
    python3 generate_diagram.py -f question.txt
    python3 generate_diagram.py --interactive
"""

import sys
import argparse
from pathlib import Path
from universal_physics_diagram_generator import generate_diagram_from_question


def main():
    parser = argparse.ArgumentParser(
        description='Generate physics diagrams from questions (IIT JEE standard)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # From command line
  python3 generate_diagram.py "A block of mass 5kg is on an incline at 30 degrees"

  # From file
  python3 generate_diagram.py -f question.txt

  # Interactive mode
  python3 generate_diagram.py --interactive

Features:
  ✓ Automatic diagram type detection
  ✓ Follows DIAGRAM_GUIDELINES.md strictly
  ✓ NO solution content included
  ✓ Proper overhead arrow notation
  ✓ Professional IIT JEE quality
        '''
    )

    parser.add_argument(
        'question',
        nargs='?',
        help='Physics question text (enclose in quotes)'
    )

    parser.add_argument(
        '-f', '--file',
        help='Read question from file'
    )

    parser.add_argument(
        '-o', '--output',
        default='generated_diagram.svg',
        help='Output SVG filename (default: generated_diagram.svg)'
    )

    parser.add_argument(
        '--interactive',
        action='store_true',
        help='Interactive mode - enter question interactively'
    )

    args = parser.parse_args()

    # Get question text
    question_text = None

    if args.interactive:
        print("=" * 80)
        print("🔬 INTERACTIVE PHYSICS DIAGRAM GENERATOR")
        print("=" * 80)
        print()
        print("Enter your physics question (press Ctrl+D or Ctrl+Z when done):")
        print()
        lines = []
        try:
            while True:
                line = input()
                lines.append(line)
        except EOFError:
            question_text = '\n'.join(lines)
        print()

    elif args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"❌ Error: File '{args.file}' not found")
            sys.exit(1)
        question_text = file_path.read_text()

    elif args.question:
        question_text = args.question

    else:
        parser.print_help()
        sys.exit(1)

    if not question_text or not question_text.strip():
        print("❌ Error: No question text provided")
        sys.exit(1)

    # Generate diagram
    print("=" * 80)
    print("🎨 GENERATING DIAGRAM...")
    print("=" * 80)
    print()
    print(f"Question: {question_text[:100]}...")
    print()

    try:
        output_file = generate_diagram_from_question(question_text, args.output)

        print("✅ SUCCESS!")
        print()
        print(f"📁 Output file: {output_file}")
        print()
        print("Diagram features:")
        print("  ✓ Follows DIAGRAM_GUIDELINES.md")
        print("  ✓ NO solution content")
        print("  ✓ Proper overhead arrows")
        print("  ✓ Clean labels")
        print("  ✓ Professional quality")
        print()
        print("=" * 80)

    except Exception as e:
        print(f"❌ Error generating diagram: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
