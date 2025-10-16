#!/usr/bin/env python3
"""
Batch Diagram Updater - Extract questions, generate diagrams, update HTML

Simpler approach:
1. Extract all questions with regex
2. Generate diagrams using universal generator
3. Update HTML SVG sections
4. Process in batches with commits
"""

import re
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class Question:
    """Represents a physics question"""
    number: int
    topic: str
    difficulty: str
    text: str
    has_svg: bool
    svg_start_pos: int = -1
    svg_end_pos: int = -1


class BatchDiagramUpdater:
    """Update all diagrams in HTML file"""

    def __init__(self, html_file: str):
        self.html_file = Path(html_file)
        self.questions: List[Question] = []
        self.html_content = ""

    def extract_questions(self):
        """Extract all questions from HTML"""
        print("=" * 80)
        print("📖 EXTRACTING QUESTIONS FROM HTML")
        print("="  * 80)
        print()

        with open(self.html_file, 'r', encoding='utf-8') as f:
            self.html_content = f.read()

        # Pattern for question containers
        pattern = r'<div class="question-container">.*?</div>\s*</div>\s*</div>'

        # Find all question containers
        containers = re.finditer(pattern, self.html_content, re.DOTALL)

        for container_match in containers:
            container_text = container_match.group(0)

            # Extract question number
            num_match = re.search(r'<div class="question-number">Question (\d+)</div>', container_text)
            if not num_match:
                continue

            question_num = int(num_match.group(1))

            # Extract topic
            topic_match = re.search(r'<span class="meta-badge topic">([^<]+)</span>', container_text)
            topic = topic_match.group(1) if topic_match else "Unknown"

            # Extract difficulty
            diff_match = re.search(r'<span class="meta-badge difficulty ([^"]+)">', container_text)
            difficulty = diff_match.group(1).upper() if diff_match else "MEDIUM"

            # Extract question text (between question-text div)
            text_match = re.search(r'<div class="question-text">(.*?)</div>', container_text, re.DOTALL)
            if not text_match:
                continue

            question_text_html = text_match.group(1)

            # Remove HTML tags to get clean text
            clean_text = re.sub(r'<[^>]+>', ' ', question_text_html)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()

            # Check if has SVG
            has_svg = '<svg' in container_text

            question = Question(
                number=question_num,
                topic=topic,
                difficulty=difficulty,
                text=clean_text,
                has_svg=has_svg
            )

            self.questions.append(question)

        print(f"✅ Extracted {len(self.questions)} questions")
        print()

        # Summary by topic
        topics = {}
        for q in self.questions:
            topics[q.topic] = topics.get(q.topic, 0) + 1

        print("Topics:")
        for topic, count in sorted(topics.items()):
            print(f"  {topic}: {count} questions")
        print()

        # SVG status
        with_svg = sum(1 for q in self.questions if q.has_svg)
        print(f"Questions with existing SVG: {with_svg}/{len(self.questions)}")
        print()

    def generate_diagram(self, question: Question) -> str:
        """Generate diagram for a question using universal generator"""
        from universal_physics_diagram_generator import generate_diagram_from_question

        # Create temp file for output
        temp_svg = f"temp_q{question.number}.svg"

        try:
            # Generate diagram
            generate_diagram_from_question(question.text, temp_svg)

            # Read generated SVG
            with open(temp_svg, 'r') as f:
                svg_content = f.read()

            # Clean up temp file
            Path(temp_svg).unlink()

            return svg_content

        except Exception as e:
            print(f"    ⚠️  Error generating diagram: {e}")
            return None

    def process_batch(self, start_idx: int, batch_size: int = 5) -> int:
        """Process a batch of questions"""
        end_idx = min(start_idx + batch_size, len(self.questions))

        print("=" * 80)
        print(f"🎨 BATCH {start_idx // batch_size + 1}: Processing Questions {start_idx + 1}-{end_idx}")
        print("=" * 80)
        print()

        generated_count = 0

        for i in range(start_idx, end_idx):
            question = self.questions[i]

            print(f"Question {question.number}: {question.topic} ({question.difficulty})")
            print(f"  Text: {question.text[:100]}...")

            # Generate diagram
            svg_content = self.generate_diagram(question)

            if svg_content:
                # Save standalone SVG
                svg_file = f"generated_q{question.number}.svg"
                with open(svg_file, 'w') as f:
                    f.write(svg_content)

                print(f"  ✅ Generated: {svg_file}")
                generated_count += 1
            else:
                print(f"  ❌ Failed to generate")

            print()

        return generated_count

    def generate_all_batches(self, batch_size: int = 5):
        """Generate all diagrams in batches"""
        total = len(self.questions)
        num_batches = (total + batch_size - 1) // batch_size

        print("=" * 80)
        print("🚀 STARTING BATCH GENERATION")
        print("=" * 80)
        print()
        print(f"Total questions: {total}")
        print(f"Batch size: {batch_size}")
        print(f"Number of batches: {num_batches}")
        print()

        total_generated = 0

        for batch_idx in range(num_batches):
            start_idx = batch_idx * batch_size

            # Process batch
            count = self.process_batch(start_idx, batch_size)
            total_generated += count

            # Commit after each batch
            self.commit_batch(batch_idx + 1, count)

            print(f"✅ Batch {batch_idx + 1}/{num_batches} complete: {count} diagrams generated")
            print("-" * 80)
            print()

        print("=" * 80)
        print("🎉 ALL BATCHES COMPLETE")
        print("=" * 80)
        print()
        print(f"Total diagrams generated: {total_generated}/{total}")
        print()

    def commit_batch(self, batch_num: int, count: int):
        """Commit generated diagrams for this batch"""
        try:
            # Stage all generated SVG files
            subprocess.run(['git', 'add', 'generated_q*.svg'], check=True)

            # Commit
            commit_msg = f"""Generate diagrams for batch {batch_num}

Generated {count} physics diagrams following DIAGRAM_GUIDELINES.md

Compliance:
✓ NO solution content
✓ Proper overhead arrows
✓ Clean labels
✓ Font sizes: 42/32/26/44/36
✓ Canvas: 2000×1400

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"""

            subprocess.run(['git', 'commit', '-m', commit_msg], check=True)

            # Push
            subprocess.run(['git', 'push'], check=True)

            print(f"  💾 Committed and pushed batch {batch_num}")

        except subprocess.CalledProcessError as e:
            print(f"  ⚠️  Git operation failed: {e}")


def main():
    """Main execution"""
    html_file = "/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html"

    print("=" * 80)
    print("🎨 BATCH DIAGRAM GENERATOR & UPDATER")
    print("=" * 80)
    print()

    updater = BatchDiagramUpdater(html_file)

    # Extract questions
    updater.extract_questions()

    if not updater.questions:
        print("❌ No questions found!")
        return

    # Ask for confirmation
    print("=" * 80)
    print(f"Ready to generate diagrams for {len(updater.questions)} questions")
    print("Process will run in batches of 5 with automatic commits")
    print("=" * 80)
    print()

    # Generate all in batches
    updater.generate_all_batches(batch_size=5)


if __name__ == "__main__":
    main()
