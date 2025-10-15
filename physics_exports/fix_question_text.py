#!/usr/bin/env python3
"""
Fix vector notation in Question 50 text
Replace combining character vectors with HTML formatted vectors
"""

def fix_question_text():
    """Fix the vector notation in the question text"""

    file_path = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html'

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find Question 50's question text section
    q50_pos = content.find('<div class="question-number">Question 50</div>')

    if q50_pos == -1:
        print("Error: Could not find Question 50")
        return False

    # Find the question-text div after Question 50
    text_start = content.find('<div class="question-text">', q50_pos)
    text_end = content.find('</div>', text_start)

    if text_start == -1 or text_end == -1:
        print("Error: Could not find question text section")
        return False

    # Extract the question text
    old_text = content[text_start:text_end + 6]

    # Replace vector notations - using HTML entities and styling
    # r⃗ becomes <i>r</i>→
    # E⃗ becomes <i>E</i>→
    # a⃗ becomes <i>a</i>→

    new_text = old_text

    # Replace all instances of vectors with combining arrows
    replacements = [
        ('r⃗', '<i>r</i><span style="position:relative;"><span style="position:absolute;left:-0.5em;top:-0.8em;font-size:0.7em;">→</span></span>'),
        ('E⃗', '<i>E</i><span style="position:relative;"><span style="position:absolute;left:-0.5em;top:-0.8em;font-size:0.7em;">→</span></span>'),
        ('a⃗', '<i>a</i><span style="position:relative;"><span style="position:absolute;left:-0.5em;top:-0.8em;font-size:0.7em;">→</span></span>'),
    ]

    for old, new in replacements:
        new_text = new_text.replace(old, new)

    # Replace in the content
    new_content = content[:text_start] + new_text + content[text_end + 6:]

    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("✅ Successfully fixed Question 50 text vectors!")
    print(f"📍 Updated file: {file_path}")
    print("🎨 Vector notation fixed:")
    print("   • r⃗ → <i>r</i> with overhead →")
    print("   • E⃗ → <i>E</i> with overhead →")
    print("   • a⃗ → <i>a</i> with overhead →")
    return True


if __name__ == '__main__':
    print("🔄 Fixing Question 50 text vector notation...")
    print("=" * 60)
    success = fix_question_text()
    if success:
        print("=" * 60)
        print("✨ Text fix complete!")
    else:
        print("=" * 60)
        print("❌ Text fix failed!")
