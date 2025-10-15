#!/usr/bin/env python3
"""
Update Question 50 diagram - Sphere with Spherical Cavity
Creates a clearer diagram matching the problem statement exactly
"""

def generate_improved_svg():
    """Generate improved SVG diagram for spherical cavity problem"""

    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <!-- Background -->
  <rect width="800" height="500" fill="#f8f9fa"/>

  <!-- Title -->
  <text x="400" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#2c3e50">
    Sphere with Spherical Cavity - Electric Field
  </text>

  <!-- Vector notation style -->
  <style>
    .vector { font-style: italic; font-weight: bold; }
  </style>

  <!-- Defs for markers and patterns -->
  <defs>
    <!-- Arrow markers -->
    <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#e74c3c"/>
    </marker>
    <marker id="arrow-purple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#9b59b6"/>
    </marker>
    <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
      <polygon points="0 0, 8 2.5, 0 5" fill="#3498db"/>
    </marker>

    <!-- Pattern for charge density -->
    <pattern id="chargePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="1.5" fill="#3498db" opacity="0.3"/>
      <circle cx="15" cy="5" r="1.5" fill="#3498db" opacity="0.3"/>
      <circle cx="10" cy="15" r="1.5" fill="#3498db" opacity="0.3"/>
      <text x="10" y="12" font-size="8" fill="#2980b9" text-anchor="middle">+</text>
    </pattern>
  </defs>

  <!-- Main Sphere -->
  <g id="main-sphere">
    <circle cx="250" cy="250" r="150" fill="url(#chargePattern)" stroke="#2980b9" stroke-width="3"/>
    <circle cx="250" cy="250" r="150" fill="none" stroke="#2980b9" stroke-width="3"/>

    <!-- Label for uniform charge density -->
    <text x="130" y="180" font-size="16" font-weight="bold" fill="#2980b9">ρ (uniform)</text>
    <text x="115" y="200" font-size="13" fill="#34495e">charge density</text>
  </g>

  <!-- Spherical Cavity -->
  <g id="cavity">
    <circle cx="310" cy="270" r="65" fill="#ffffff" stroke="#e67e22" stroke-width="3" stroke-dasharray="8,4"/>

    <!-- Cavity label -->
    <text x="310" y="220" text-anchor="middle" font-size="14" font-weight="bold" fill="#e67e22">Cavity</text>
    <text x="310" y="238" text-anchor="middle" font-size="12" fill="#7f8c8d">(hollow region)</text>
  </g>

  <!-- Centers and Points -->
  <g id="points">
    <!-- Center O of sphere -->
    <circle cx="250" cy="250" r="5" fill="#2c3e50"/>
    <text x="235" y="245" font-size="18" font-weight="bold" fill="#2c3e50">O</text>
    <text x="255" y="275" font-size="12" fill="#7f8c8d">(sphere center)</text>

    <!-- Center C of cavity -->
    <circle cx="310" cy="270" r="5" fill="#e74c3c"/>
    <text x="318" y="275" font-size="18" font-weight="bold" fill="#e74c3c">C</text>
    <text x="318" y="290" font-size="12" fill="#7f8c8d">(cavity center)</text>

    <!-- Point P inside cavity -->
    <circle cx="340" cy="295" r="5" fill="#9b59b6"/>
    <text x="348" y="300" font-size="18" font-weight="bold" fill="#9b59b6">P</text>
    <text x="332" y="315" font-size="12" fill="#7f8c8d">(test point)</text>
  </g>

  <!-- Vector a from O to C -->
  <g id="vector-a">
    <line x1="250" y1="250" x2="305" y2="267" stroke="#e74c3c" stroke-width="4" marker-end="url(#arrow-red)"/>
    <!-- Vector with overhead arrow drawn manually -->
    <text x="268" y="245" font-size="18" font-weight="bold" fill="#e74c3c" font-style="italic">a</text>
    <path d="M 268 233 L 277 233 L 275 231 M 277 233 L 275 235" stroke="#e74c3c" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <text x="260" y="262" font-size="12" fill="#c0392b">(O to C)</text>
  </g>

  <!-- Vector r from O to P -->
  <g id="vector-r">
    <line x1="250" y1="250" x2="335" y2="292" stroke="#9b59b6" stroke-width="4" marker-end="url(#arrow-purple)"/>
    <!-- Vector with overhead arrow drawn manually -->
    <text x="285" y="285" font-size="18" font-weight="bold" fill="#9b59b6" font-style="italic">r</text>
    <path d="M 285 273 L 293 273 L 291 271 M 293 273 L 291 275" stroke="#9b59b6" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <text x="275" y="300" font-size="12" fill="#8e44ad">(O to P)</text>
  </g>

  <!-- Electric Field Lines (Uniform) inside cavity -->
  <g id="field-lines">
    <text x="305" y="252" font-size="14" font-weight="bold" fill="#3498db" font-style="italic">E</text>
    <path d="M 305 241 L 313 241 L 311 239 M 313 241 L 311 243" stroke="#3498db" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <text x="318" y="252" font-size="14" fill="#3498db"> (uniform)</text>

    <!-- Parallel field lines showing uniformity -->
    <line x1="240" y1="260" x2="285" y2="260" stroke="#3498db" stroke-width="2.5" marker-end="url(#arrow-blue)" opacity="0.8"/>
    <line x1="240" y1="280" x2="285" y2="280" stroke="#3498db" stroke-width="2.5" marker-end="url(#arrow-blue)" opacity="0.8"/>
    <line x1="240" y1="300" x2="285" y2="300" stroke="#3498db" stroke-width="2.5" marker-end="url(#arrow-blue)" opacity="0.8"/>
    <line x1="240" y1="320" x2="285" y2="320" stroke="#3498db" stroke-width="2.5" marker-end="url(#arrow-blue)" opacity="0.8"/>
  </g>

  <!-- Information Box -->
  <g id="info-box">
    <rect x="480" y="80" width="300" height="380" fill="#fff3cd" stroke="#f39c12" stroke-width="2" rx="8"/>

    <text x="630" y="110" text-anchor="middle" font-size="17" font-weight="bold" fill="#2c3e50">Key Results</text>

    <!-- Part (a) -->
    <text x="495" y="145" font-size="14" font-weight="bold" fill="#16a085">Part (a):</text>
    <text x="495" y="165" font-size="13" fill="#2c3e50">Field inside sphere at point P:</text>
    <rect x="495" y="175" width="265" height="35" fill="#e8f8f5" stroke="#16a085" stroke-width="1" rx="4"/>
    <g>
      <text x="608" y="197" text-anchor="middle" font-size="15" font-weight="bold" fill="#16a085" font-style="italic">E</text>
      <path d="M 608 186 L 616 186 L 614 184 M 616 186 L 614 188" stroke="#16a085" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <text x="620" y="197" text-anchor="start" font-size="15" font-weight="bold" fill="#16a085"> = ρ</text>
      <text x="645" y="197" text-anchor="start" font-size="15" font-weight="bold" fill="#16a085" font-style="italic">r</text>
      <path d="M 645 186 L 652 186 L 650 184 M 652 186 L 650 188" stroke="#16a085" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <text x="656" y="197" text-anchor="start" font-size="15" font-weight="bold" fill="#16a085">/(3ε₀)</text>
    </g>

    <text x="495" y="230" font-size="12" fill="#7f8c8d">• Independent of sphere radius R</text>
    <text x="495" y="248" font-size="12" fill="#7f8c8d">• Proportional to distance r from O</text>

    <!-- Part (b) -->
    <text x="495" y="280" font-size="14" font-weight="bold" fill="#c0392b">Part (b):</text>
    <text x="495" y="300" font-size="13" fill="#2c3e50">Field inside cavity (uniform!):</text>
    <rect x="495" y="310" width="265" height="35" fill="#fadbd8" stroke="#c0392b" stroke-width="1" rx="4"/>
    <g>
      <text x="608" y="332" text-anchor="middle" font-size="15" font-weight="bold" fill="#c0392b" font-style="italic">E</text>
      <path d="M 608 321 L 616 321 L 614 319 M 616 321 L 614 323" stroke="#c0392b" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <text x="620" y="332" text-anchor="start" font-size="15" font-weight="bold" fill="#c0392b"> = ρ</text>
      <text x="645" y="332" text-anchor="start" font-size="15" font-weight="bold" fill="#c0392b" font-style="italic">a</text>
      <path d="M 645 321 L 652 321 L 650 319 M 652 321 L 650 323" stroke="#c0392b" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <text x="656" y="332" text-anchor="start" font-size="15" font-weight="bold" fill="#c0392b">/(3ε₀)</text>
    </g>

    <text x="495" y="365" font-size="12" font-weight="bold" fill="#8e44ad">Key Insight:</text>
    <text x="495" y="383" font-size="12" fill="#7f8c8d">• Field is UNIFORM everywhere</text>
    <text x="505" y="398" font-size="12" fill="#7f8c8d">in cavity</text>
    <text x="495" y="416" font-size="12" fill="#7f8c8d">• Independent of cavity size</text>
    <text x="495" y="434" font-size="12" fill="#7f8c8d">• Independent of cavity position</text>
    <g>
      <text x="495" y="452" font-size="12" fill="#7f8c8d">• Direction parallel to </text>
      <text x="618" y="452" font-size="12" fill="#7f8c8d" font-style="italic">a</text>
      <path d="M 618 443 L 625 443 L 623 441 M 625 443 L 623 445" stroke="#7f8c8d" stroke-width="1" fill="none" stroke-linecap="round"/>
    </g>
  </g>

  <!-- Legend -->
  <g id="legend">
    <text x="50" y="430" font-size="13" font-weight="bold" fill="#34495e">Vectors:</text>
    <line x1="50" y1="445" x2="80" y2="445" stroke="#e74c3c" stroke-width="3" marker-end="url(#arrow-red)"/>
    <g>
      <text x="90" y="450" font-size="12" fill="#2c3e50" font-style="italic">a</text>
      <path d="M 90 441 L 97 441 L 95 439 M 97 441 L 95 443" stroke="#2c3e50" stroke-width="1" fill="none" stroke-linecap="round"/>
      <text x="100" y="450" font-size="12" fill="#2c3e50"> : O to C</text>
    </g>

    <line x1="50" y1="465" x2="80" y2="465" stroke="#9b59b6" stroke-width="3" marker-end="url(#arrow-purple)"/>
    <g>
      <text x="90" y="470" font-size="12" fill="#2c3e50" font-style="italic">r</text>
      <path d="M 90 461 L 96 461 L 94 459 M 96 461 L 94 463" stroke="#2c3e50" stroke-width="1" fill="none" stroke-linecap="round"/>
      <text x="99" y="470" font-size="12" fill="#2c3e50"> : O to P</text>
    </g>

    <line x1="190" y1="445" x2="220" y2="445" stroke="#3498db" stroke-width="3" marker-end="url(#arrow-blue)"/>
    <g>
      <text x="230" y="450" font-size="12" fill="#2c3e50" font-style="italic">E</text>
      <path d="M 230 441 L 237 441 L 235 439 M 237 441 L 235 443" stroke="#2c3e50" stroke-width="1" fill="none" stroke-linecap="round"/>
      <text x="240" y="450" font-size="12" fill="#2c3e50"> : Electric field</text>
    </g>
  </g>
</svg>'''

    return svg


def update_html_file():
    """Update the HTML file with the new SVG diagram"""
    import re

    file_path = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports/physics_questions_01_of_05.html'

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generate new SVG
    new_svg = generate_improved_svg()

    # Find Question 50 position
    q50_pos = content.find('<div class="question-number">Question 50</div>')

    if q50_pos == -1:
        print("Error: Could not find Question 50")
        return False

    # Find the SVG after Question 50
    svg_start = content.find('<div class="question-figure">', q50_pos)

    if svg_start == -1:
        print("Error: Could not find question-figure div")
        return False

    # Find the end of the SVG div
    # Look for the closing </svg> tag first
    svg_tag_end = content.find('</svg>', svg_start)
    if svg_tag_end == -1:
        print("Error: Could not find closing svg tag")
        return False

    # Now find the closing div after the svg
    div_end = content.find('</div>', svg_tag_end)

    if div_end == -1:
        print("Error: Could not find SVG div closing tag")
        return False

    # Replace the old SVG with new one
    new_figure_html = f'''<div class="question-figure">
          {new_svg}
        </div>'''

    new_content = content[:svg_start] + new_figure_html + content[div_end + 6:]

    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("✅ Successfully updated Question 50 diagram!")
    print(f"📍 Updated file: {file_path}")
    print("🎨 New diagram features:")
    print("   • Proper vector notation (italic letters with → arrows)")
    print("   • Clearer sphere with visible charge density pattern")
    print("   • Distinct cavity with dashed border")
    print("   • Labeled points O, C, and P")
    print("   • Clear vectors a→ and r→")
    print("   • Uniform electric field lines in cavity")
    print("   • Comprehensive information box with key results")
    print("   • Legend explaining all vectors")
    return True


if __name__ == '__main__':
    print("🔄 Updating Question 50 diagram...")
    print("=" * 60)
    success = update_html_file()
    if success:
        print("=" * 60)
        print("✨ Diagram update complete!")
    else:
        print("=" * 60)
        print("❌ Diagram update failed!")
