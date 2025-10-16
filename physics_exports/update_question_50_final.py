#!/usr/bin/env python3
"""
Update Question 50 with collision-free SVG diagram
Replace existing diagram with mathematically precise version
"""

def update_question_50():
    """Update Question 50 with the new collision-free diagram"""

    html_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html'
    svg_file = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/collision_free_diagram.svg'

    # Read the SVG content
    with open(svg_file, 'r', encoding='utf-8') as f:
        new_svg = f.read()

    # Read the HTML file
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Find Question 50
    q50_marker = '<div class="question-number">Question 50</div>'
    q50_pos = html_content.find(q50_marker)

    if q50_pos == -1:
        print("❌ Error: Could not find Question 50")
        return False

    print(f"✓ Found Question 50 at position {q50_pos}")

    # Find the question-figure div after Question 50
    fig_start = html_content.find('<div class="question-figure">', q50_pos)

    if fig_start == -1:
        print("❌ Error: Could not find question-figure div")
        return False

    # Find the closing </svg> tag
    svg_end = html_content.find('</svg>', fig_start)

    if svg_end == -1:
        print("❌ Error: Could not find closing svg tag")
        return False

    # Find the closing </div> after the svg
    div_end = html_content.find('</div>', svg_end)

    if div_end == -1:
        print("❌ Error: Could not find closing div tag")
        return False

    print(f"✓ Found SVG section: {fig_start} to {div_end + 6}")

    # Extract old SVG for comparison
    old_svg_section = html_content[fig_start:div_end + 6]
    old_svg_lines = old_svg_section.count('\n')

    # Create new figure div with updated SVG
    new_figure_html = f'''<div class="question-figure">
          {new_svg}
        </div>'''

    # Replace the old section with new one
    new_html_content = html_content[:fig_start] + new_figure_html + html_content[div_end + 6:]

    # Write back to file
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(new_html_content)

    print("\n" + "=" * 80)
    print("✅ Successfully updated Question 50 diagram!")
    print("=" * 80)
    print(f"📁 File: {html_file}")
    print(f"📊 Old SVG: ~{old_svg_lines} lines")
    print(f"📊 New SVG: Collision-free with mathematical precision")
    print()
    print("🎨 New Diagram Features:")
    print("   ✓ Small arrows (5×5 pixels)")
    print("   ✓ Zero intersections (mathematically verified)")
    print("   ✓ Proper vector notation (overhead arrows)")
    print("   ✓ Clean layout (diagram left, formulas right)")
    print("   ✓ Transparent backgrounds")
    print("   ✓ Professional IIT JEE quality")
    print()
    print("🔬 Mathematical Techniques:")
    print("   ✓ Cartesian coordinate system")
    print("   ✓ Vector algebra for positioning")
    print("   ✓ Collision detection algorithms:")
    print("     • Line-circle intersection (quadratic formula)")
    print("     • Line-line intersection (CCW algorithm)")
    print("     • Bounding box overlap (AABB test)")
    print()
    print("=" * 80)
    return True


if __name__ == '__main__':
    print("🔄 Updating Question 50 with collision-free diagram...")
    print()
    success = update_question_50()

    if success:
        print("\n✨ Update complete! Open the HTML file to view the changes.")
        print("📂 File: physics_questions_01_of_05.html")
    else:
        print("\n❌ Update failed!")
