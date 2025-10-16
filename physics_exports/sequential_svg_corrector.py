#!/usr/bin/env python3
"""
Sequential SVG Corrector with Verification

This script:
1. Parses all questions from HTML into memory
2. Sends each question one-by-one to SVG generator
3. Verifies the generated SVG matches the question
4. Updates HTML with corrected SVG
5. Moves to next question only after successful verification

Usage:
    python3 sequential_svg_corrector.py --max 5  # Test first 5 questions
    python3 sequential_svg_corrector.py          # Process all 50 questions
"""

import re
import time
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Optional
import subprocess
import sys


@dataclass
class Question:
    """Represents a parsed question"""
    number: int
    topic: str
    difficulty: str
    question_type: str
    text: str
    text_preview: str
    html_start_pos: int
    html_end_pos: int


class QuestionParser:
    """Parse questions from HTML file"""

    def __init__(self, html_file: Path):
        self.html_file = html_file
        with open(html_file, 'r', encoding='utf-8') as f:
            self.html_content = f.read()

    def parse_all_questions(self) -> List[Question]:
        """Extract all questions from HTML"""
        questions = []

        # Pattern to match question containers
        pattern = r'<div class="question-container">(.*?)</div>\s*</div>\s*</div>'

        for match in re.finditer(pattern, self.html_content, re.DOTALL):
            container = match.group(1)

            # Extract question number
            q_num_match = re.search(r'<div class="question-number">Question (\d+)</div>', container)
            if not q_num_match:
                continue
            q_num = int(q_num_match.group(1))

            # Extract metadata
            topic_match = re.search(r'<span class="meta-badge topic">([^<]+)</span>', container)
            topic = topic_match.group(1) if topic_match else "Unknown"

            difficulty_match = re.search(r'<span class="meta-badge difficulty ([^"]+)">([^<]+)</span>', container)
            difficulty = difficulty_match.group(2) if difficulty_match else "MEDIUM"

            type_match = re.search(r'<span class="meta-badge">([^<]+)</span>', container)
            question_type = type_match.group(1) if type_match else "Multiple Choice"

            # Extract question text
            text_match = re.search(r'<div class="question-text">(.*?)</div>', container, re.DOTALL)
            if not text_match:
                continue

            question_html = text_match.group(1)

            # Clean HTML to get plain text
            text_clean = re.sub(r'<[^>]+>', ' ', question_html)
            text_clean = re.sub(r'\s+', ' ', text_clean).strip()

            # Create question object
            question = Question(
                number=q_num,
                topic=topic,
                difficulty=difficulty,
                question_type=question_type,
                text=text_clean,
                text_preview=text_clean[:150] + "..." if len(text_clean) > 150 else text_clean,
                html_start_pos=match.start(),
                html_end_pos=match.end()
            )

            questions.append(question)

        return sorted(questions, key=lambda q: q.number)


class SVGVerifier:
    """Verify generated SVG matches question requirements"""

    @staticmethod
    def verify_svg(svg_file: Path, question: Question) -> Dict[str, any]:
        """
        Verify SVG is correct for the question
        Returns dict with: {success: bool, issues: List[str], warnings: List[str]}
        """

        if not svg_file.exists():
            return {
                'success': False,
                'issues': [f"SVG file not found: {svg_file}"],
                'warnings': []
            }

        # Read SVG
        with open(svg_file, 'r') as f:
            svg_content = f.read()

        issues = []
        warnings = []

        # Check 1: SVG has valid structure
        if '<svg' not in svg_content or '</svg>' not in svg_content:
            issues.append("Invalid SVG structure")
            return {'success': False, 'issues': issues, 'warnings': warnings}

        # Check 2: Has title
        title_match = re.search(r'<text[^>]*text-anchor="middle"[^>]*font-size="42"[^>]*>([^<]*)</text>', svg_content)
        if not title_match:
            warnings.append("No title found in diagram")

        # Check 3: Check Given Information section
        given_info_match = re.search(r'<g id="given-info">(.*?)</g>', svg_content, re.DOTALL)
        if given_info_match:
            bullets = given_info_match.group(1).count('• ')
            if bullets == 0:
                warnings.append("Given Information section is empty")
        else:
            warnings.append("No Given Information section found")

        # Check 4: Verify diagram type matches question
        text_lower = question.text.lower()

        # Capacitor checks
        is_capacitor_q = 'capacitor' in text_lower
        has_capacitor_diagram = 'Capacitor' in svg_content or 'Battery' in svg_content

        if is_capacitor_q and not has_capacitor_diagram:
            has_charge = '<circle' in svg_content and 'fill="#FFD700"' in svg_content
            if has_charge:
                issues.append("Capacitor question but shows point charge diagram")

        # Sphere/cavity checks
        is_sphere_cavity = 'sphere' in text_lower and 'cavity' in text_lower
        has_sphere_cavity = 'Sphere' in svg_content and 'cavity' in svg_content.lower()

        if is_sphere_cavity and not has_sphere_cavity:
            issues.append("Sphere-cavity question but wrong diagram type")

        # Check 5: SVG size is reasonable
        if len(svg_content) < 500:
            issues.append("SVG content too small - may be incomplete")

        # Check 6: Regression check - legend should not overlap with given info
        given_info_match = re.search(r'<g id="given-info">(.*?)</g>', svg_content, re.DOTALL)
        legend_match = re.search(r'<g id="legend">.*?<text x="\d+" y="(\d+)"', svg_content)

        if given_info_match and legend_match:
            # Find last given info item position
            given_items = re.findall(r'y="(\d+)"', given_info_match.group(1))
            if given_items:
                last_given_y = int(given_items[-1])
                legend_y = int(legend_match.group(1))

                if legend_y <= last_given_y + 40:  # Less than 40px gap
                    warnings.append(f"Legend overlaps with given info (legend at y={legend_y}, last item at y={last_given_y})")

        # Check 7: No garbage extraction (invalid unit combinations like "μFC", "μFSC")
        garbage_pattern = r'= \d+(?:\.\d+)? [a-zμ]+[A-Z]{2,}'  # Units like "μFC", "mJSC"
        if re.search(garbage_pattern, svg_content):
            issues.append("Detected garbage extraction with invalid units")

        success = len(issues) == 0

        return {
            'success': success,
            'issues': issues,
            'warnings': warnings
        }


class SequentialSVGProcessor:
    """Process questions sequentially with verification"""

    def __init__(self, html_file: Path):
        self.html_file = html_file
        self.parser = QuestionParser(html_file)
        self.verifier = SVGVerifier()

    def generate_svg_for_question(self, question: Question, output_svg: Path) -> bool:
        """
        Generate SVG for a single question using improved_diagram_generator
        Returns True if successful
        """

        print(f"  📝 Generating SVG for Q{question.number}...")

        try:
            # Import and use the improved diagram generator
            from improved_diagram_generator import generate_diagram_from_question

            # Generate diagram
            generate_diagram_from_question(
                question.text,
                str(output_svg),
                question.topic
            )

            return output_svg.exists()

        except Exception as e:
            print(f"  ❌ Error generating SVG: {e}")
            return False

    def update_html_with_svg(self, question_num: int, svg_file: Path) -> bool:
        """
        Update HTML with the new SVG for the given question number
        Returns True if successful
        """

        print(f"  📝 Updating HTML for Q{question_num}...")

        # Read current HTML
        with open(self.html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Read new SVG
        with open(svg_file, 'r') as f:
            new_svg = f.read()

        # Extract just SVG content
        svg_match = re.search(r'<svg.*?</svg>', new_svg, re.DOTALL)
        if not svg_match:
            print(f"  ❌ Could not extract SVG content")
            return False

        new_svg_content = svg_match.group(0)

        # Find question section in HTML
        question_pattern = rf'(<div class="question-container">.*?<div class="question-number">Question {question_num}</div>.*?)(<div class="question-figure">.*?<svg.*?</svg>.*?</div>)(.*?</div>\s*</div>\s*</div>)'

        match = re.search(question_pattern, html_content, re.DOTALL)

        if match:
            before_svg = match.group(1)
            old_svg_section = match.group(2)
            after_svg = match.group(3)

            # Create new SVG section
            new_svg_section = f'<div class="question-figure">\n          {new_svg_content}\n        </div>'

            # Replace
            old_full = match.group(0)
            new_full = before_svg + new_svg_section + after_svg

            html_content = html_content.replace(old_full, new_full, 1)

            # Save HTML
            with open(self.html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

            return True
        else:
            print(f"  ❌ Could not find Q{question_num} in HTML")
            return False

    def process_question(self, question: Question) -> Dict[str, any]:
        """
        Process a single question: generate SVG, verify, update HTML
        Returns dict with processing results
        """

        print(f"\n{'='*80}")
        print(f"Processing Q{question.number}: {question.topic} - {question.difficulty}")
        print(f"{'='*80}")
        print(f"Preview: {question.text_preview}")
        print()

        svg_file = Path(f"generated_q{question.number}.svg")

        # Step 1: Generate SVG
        success = self.generate_svg_for_question(question, svg_file)

        if not success:
            return {
                'question_num': question.number,
                'success': False,
                'stage': 'generation',
                'message': 'Failed to generate SVG'
            }

        print(f"  ✅ SVG generated: {svg_file}")

        # Step 2: Verify SVG
        print(f"  🔍 Verifying SVG...")
        verification = self.verifier.verify_svg(svg_file, question)

        if not verification['success']:
            print(f"  ⚠️  Verification issues found:")
            for issue in verification['issues']:
                print(f"     - {issue}")

        if verification['warnings']:
            print(f"  ⚠️  Warnings:")
            for warning in verification['warnings']:
                print(f"     - {warning}")

        if verification['success']:
            print(f"  ✅ Verification passed")

        # Step 3: Update HTML (even if warnings exist, but not if critical issues)
        if not verification['issues']:  # No critical issues
            success = self.update_html_with_svg(question.number, svg_file)

            if success:
                print(f"  ✅ HTML updated")
                return {
                    'question_num': question.number,
                    'success': True,
                    'stage': 'complete',
                    'verification': verification,
                    'message': 'Successfully processed'
                }
            else:
                return {
                    'question_num': question.number,
                    'success': False,
                    'stage': 'html_update',
                    'verification': verification,
                    'message': 'Failed to update HTML'
                }
        else:
            return {
                'question_num': question.number,
                'success': False,
                'stage': 'verification',
                'verification': verification,
                'message': f"Verification failed: {'; '.join(verification['issues'])}"
            }

    def process_questions(self, max_questions: Optional[int] = None) -> List[Dict]:
        """
        Process questions sequentially

        Args:
            max_questions: Maximum number of questions to process (None = all)

        Returns:
            List of processing results for each question
        """

        print("="*80)
        print("🔄 SEQUENTIAL SVG CORRECTOR WITH VERIFICATION")
        print("="*80)
        print()

        # Parse all questions
        print("📖 Parsing questions from HTML...")
        questions = self.parser.parse_all_questions()
        print(f"✅ Found {len(questions)} questions")
        print()

        # Limit if requested
        if max_questions:
            questions = questions[:max_questions]
            print(f"🎯 Processing first {max_questions} questions")
            print()

        # Process each question
        results = []

        for i, question in enumerate(questions, 1):
            result = self.process_question(question)
            results.append(result)

            # Brief pause between questions
            if i < len(questions):
                time.sleep(0.5)

        # Summary
        print(f"\n{'='*80}")
        print("📊 PROCESSING SUMMARY")
        print(f"{'='*80}")
        print()

        successful = sum(1 for r in results if r['success'])
        failed = len(results) - successful

        print(f"Total processed: {len(results)}")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print()

        if failed > 0:
            print("Failed questions:")
            for r in results:
                if not r['success']:
                    print(f"  Q{r['question_num']}: {r['message']} (stage: {r['stage']})")

        print()
        print(f"{'='*80}")
        print("🎉 PROCESSING COMPLETE!")
        print(f"{'='*80}")
        print()

        return results


def main():
    """Main execution"""

    import argparse

    parser = argparse.ArgumentParser(description='Sequential SVG Corrector with Verification')
    parser.add_argument('--max', type=int, default=None,
                       help='Maximum number of questions to process (default: all)')
    parser.add_argument('--html', type=str,
                       default='/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html',
                       help='Path to HTML file')

    args = parser.parse_args()

    html_file = Path(args.html)

    if not html_file.exists():
        print(f"❌ Error: HTML file not found: {html_file}")
        sys.exit(1)

    # Create backup
    import shutil
    backup_file = html_file.with_suffix('.html.backup_sequential')
    print(f"Creating backup: {backup_file}")
    shutil.copy(html_file, backup_file)
    print()

    # Process questions
    processor = SequentialSVGProcessor(html_file)
    results = processor.process_questions(max_questions=args.max)

    print(f"Backup saved at: {backup_file}")
    print(f"View updated HTML at: file://{html_file.absolute()}")
    print()


if __name__ == "__main__":
    main()
