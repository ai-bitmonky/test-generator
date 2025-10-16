#!/usr/bin/env python3
"""
Generate SVG with TRUE OVERHEAD ARROWS
Using SVG paths positioned directly above letters
"""

import math
import numpy as np

def create_overhead_arrow_svg():
    """Generate diagram with proper overhead arrows like a⃗"""

    width = 1600
    height = 1000
    origin = np.array([400.0, 500.0])

    # Calculate positions
    O = origin
    R_sphere = 180

    a_magnitude = 90
    a_angle = math.radians(-15)
    C = origin + np.array([a_magnitude * math.cos(a_angle), -a_magnitude * math.sin(a_angle)])
    R_cavity = 70

    P = C + np.array([25, -17])

    # Vector endpoints (stop before circles)
    a_direction = (C - O) / np.linalg.norm(C - O)
    a_start = O + 7 * a_direction
    a_end = C - (R_cavity + 2) * a_direction

    r_direction = (P - O) / np.linalg.norm(P - O)
    r_start = O + 7 * r_direction
    r_end = P - 12 * r_direction

    # Label positions
    O_label = O + np.array([-50, 10])
    C_label = C + np.array([25, -R_cavity - 25])
    P_label = P + np.array([25, 5])

    a_mid = (O + C) / 2
    a_perp = np.array([-(C[1] - O[1]), C[0] - O[0]])
    a_perp = a_perp / np.linalg.norm(a_perp)
    a_label = a_mid + 40 * a_perp

    r_mid = (O + P) / 2
    r_perp = np.array([-(P[1] - O[1]), P[0] - O[0]])
    r_perp = r_perp / np.linalg.norm(r_perp)
    r_label = r_mid + 50 * r_perp

    E_label = C + np.array([0, -R_cavity - 55])

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
<rect width="{width}" height="{height}" fill="#ffffff"/>

<defs>
  <!-- Small sharp arrows (5x5 pixels) -->
  <marker id="arrowRed" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#e74c3c"/>
  </marker>
  <marker id="arrowPurple" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#9b59b6"/>
  </marker>
  <marker id="arrowGreen" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#27ae60"/>
  </marker>

  <!-- Charge pattern -->
  <pattern id="chargePattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="12" cy="12" r="2.5" fill="#3498db" opacity="0.2"/>
    <circle cx="28" cy="12" r="2.5" fill="#3498db" opacity="0.2"/>
    <circle cx="20" cy="28" r="2.5" fill="#3498db" opacity="0.2"/>
    <text x="20" y="22" font-size="13" fill="#2980b9" text-anchor="middle" opacity="0.3">+</text>
  </pattern>
</defs>

<!-- Title -->
<text x="{width/2}" y="65" text-anchor="middle" font-size="36" font-weight="600" fill="#2c3e50">
  Uniformly Charged Sphere with Spherical Cavity
</text>

<!-- ============ DIAGRAM ============ -->

<!-- Sphere -->
<circle cx="{O[0]}" cy="{O[1]}" r="{R_sphere}"
        fill="url(#chargePattern)" stroke="#2980b9" stroke-width="4"/>

<!-- Cavity -->
<circle cx="{C[0]}" cy="{C[1]}" r="{R_cavity}"
        fill="white" stroke="#e67e22" stroke-width="4" stroke-dasharray="18,9"/>

<!-- Points -->
<circle cx="{O[0]}" cy="{O[1]}" r="6" fill="#2c3e50"/>
<circle cx="{C[0]}" cy="{C[1]}" r="6" fill="#e74c3c"/>
<circle cx="{P[0]}" cy="{P[1]}" r="6" fill="#9b59b6"/>

<!-- Vector a (O to C) -->
<line x1="{a_start[0]}" y1="{a_start[1]}" x2="{a_end[0]}" y2="{a_end[1]}"
      stroke="#e74c3c" stroke-width="4" marker-end="url(#arrowRed)"/>

<!-- Vector r (O to P) -->
<line x1="{r_start[0]}" y1="{r_start[1]}" x2="{r_end[0]}" y2="{r_end[1]}"
      stroke="#9b59b6" stroke-width="4" stroke-dasharray="18,9" marker-end="url(#arrowPurple)"/>

<!-- Electric field lines -->
<line x1="{C[0] - 45}" y1="{C[1] - 40}" x2="{C[0] + 35}" y2="{C[1] - 40}"
      stroke="#27ae60" stroke-width="3" marker-end="url(#arrowGreen)"/>
<line x1="{C[0] - 45}" y1="{C[1]}" x2="{C[0] + 35}" y2="{C[1]}"
      stroke="#27ae60" stroke-width="3" marker-end="url(#arrowGreen)"/>
<line x1="{C[0] - 45}" y1="{C[1] + 40}" x2="{C[0] + 35}" y2="{C[1] + 40}"
      stroke="#27ae60" stroke-width="3" marker-end="url(#arrowGreen)"/>

<!-- ============ LABELS WITH OVERHEAD ARROWS ============ -->

<!-- Point labels -->
<text x="{O_label[0]}" y="{O_label[1]}" font-size="32" font-weight="bold" fill="#2c3e50">O</text>
<text x="{O_label[0] - 30}" y="{O_label[1] + 28}" font-size="15" fill="#7f8c8d">(sphere center)</text>

<text x="{C_label[0]}" y="{C_label[1]}" font-size="32" font-weight="bold" fill="#e74c3c">C</text>
<text x="{C_label[0] - 25}" y="{C_label[1] + 28}" font-size="15" fill="#7f8c8d">(cavity center)</text>

<text x="{P_label[0]}" y="{P_label[1]}" font-size="32" font-weight="bold" fill="#9b59b6">P</text>
<text x="{P_label[0] - 10}" y="{P_label[1] + 28}" font-size="15" fill="#7f8c8d">(test point)</text>

<!-- Vector a with OVERHEAD arrow -->
<g>
  <text x="{a_label[0]}" y="{a_label[1]}" font-size="36" font-weight="bold" fill="#e74c3c" font-style="italic">a</text>
  <!-- Arrow overhead: horizontal line with arrowhead -->
  <path d="M {a_label[0] - 2} {a_label[1] - 28} L {a_label[0] + 20} {a_label[1] - 28} L {a_label[0] + 18} {a_label[1] - 30} M {a_label[0] + 20} {a_label[1] - 28} L {a_label[0] + 18} {a_label[1] - 26}"
        stroke="#e74c3c" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>

<!-- Vector r with OVERHEAD arrow -->
<g>
  <text x="{r_label[0]}" y="{r_label[1]}" font-size="36" font-weight="bold" fill="#9b59b6" font-style="italic">r</text>
  <!-- Arrow overhead: horizontal line with arrowhead -->
  <path d="M {r_label[0] - 2} {r_label[1] - 28} L {r_label[0] + 18} {r_label[1] - 28} L {r_label[0] + 16} {r_label[1] - 30} M {r_label[0] + 18} {r_label[1] - 28} L {r_label[0] + 16} {r_label[1] - 26}"
        stroke="#9b59b6" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>

<!-- Vector E with OVERHEAD arrow -->
<g>
  <text x="{E_label[0]}" y="{E_label[1]}" font-size="34" font-weight="bold" fill="#27ae60" font-style="italic">E</text>
  <!-- Arrow overhead: horizontal line with arrowhead -->
  <path d="M {E_label[0] - 2} {E_label[1] - 28} L {E_label[0] + 20} {E_label[1] - 28} L {E_label[0] + 18} {E_label[1] - 30} M {E_label[0] + 20} {E_label[1] - 28} L {E_label[0] + 18} {E_label[1] - 26}"
        stroke="#27ae60" stroke-width="2" fill="none" stroke-linecap="round"/>
  <text x="{E_label[0] + 48}" y="{E_label[1]}" font-size="19" fill="#27ae60">(uniform)</text>
</g>

<!-- Diagram labels -->
<text x="{O[0] - 150}" y="{O[1] - 220}" font-size="23" font-weight="bold" fill="#2980b9">Uniformly Charged</text>
<text x="{O[0] - 110}" y="{O[1] - 195}" font-size="23" font-weight="bold" fill="#2980b9">Sphere (ρ)</text>

<text x="{C[0] + 90}" y="{C[1] + 75}" font-size="22" font-weight="bold" fill="#e67e22">Spherical Cavity</text>
<text x="{C[0] + 112}" y="{C[1] + 100}" font-size="17" fill="#7f8c8d">(hollow region)</text>

<!-- ============ FORMULAS WITH OVERHEAD ARROWS ============ -->

<text x="1000" y="210" font-size="27" font-weight="bold" fill="#16a085">Part (a): Field at P in sphere</text>

<!-- Formula: E⃗ = ρr⃗/(3ε₀) -->
<g>
  <text x="1150" y="295" text-anchor="middle" font-size="50" font-weight="bold" fill="#16a085" font-style="italic">E</text>
  <path d="M 1141 262 L 1167 262 L 1165 260 M 1167 262 L 1165 264"
        stroke="#16a085" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="1175" y="295" font-size="50" font-weight="bold" fill="#16a085"> = ρ</text>
  <text x="1246" y="295" font-size="50" font-weight="bold" fill="#16a085" font-style="italic">r</text>
  <path d="M 1239 262 L 1260 262 L 1258 260 M 1260 262 L 1258 264"
        stroke="#16a085" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="1268" y="295" font-size="50" font-weight="bold" fill="#16a085">/(3ε₀)</text>
</g>

<text x="1000" y="370" font-size="20" fill="#34495e">• Independent of R</text>
<text x="1000" y="400" font-size="20" fill="#34495e">• Proportional to r</text>
<text x="1000" y="430" font-size="20" fill="#34495e">• Radial direction</text>

<line x1="1000" y1="480" x2="1550" y2="480" stroke="#95a5a6" stroke-width="2" stroke-dasharray="14,7"/>

<text x="1000" y="555" font-size="27" font-weight="bold" fill="#c0392b">Part (b): Field in cavity (UNIFORM)</text>

<!-- Formula: E⃗ = ρa⃗/(3ε₀) -->
<g>
  <text x="1150" y="640" text-anchor="middle" font-size="50" font-weight="bold" fill="#c0392b" font-style="italic">E</text>
  <path d="M 1141 607 L 1167 607 L 1165 605 M 1167 607 L 1165 609"
        stroke="#c0392b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="1175" y="640" font-size="50" font-weight="bold" fill="#c0392b"> = ρ</text>
  <text x="1246" y="640" font-size="50" font-weight="bold" fill="#c0392b" font-style="italic">a</text>
  <path d="M 1238 607 L 1260 607 L 1258 605 M 1260 607 L 1258 609"
        stroke="#c0392b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="1268" y="640" font-size="50" font-weight="bold" fill="#c0392b">/(3ε₀)</text>
</g>

<text x="1000" y="715" font-size="21" font-weight="bold" fill="#8e44ad">★ Key Result:</text>
<text x="1000" y="750" font-size="20" fill="#34495e">• UNIFORM field everywhere</text>
<text x="1000" y="780" font-size="20" fill="#34495e">• Independent of cavity size</text>
<text x="1000" y="810" font-size="20" fill="#34495e">• Parallel to </text>
<text x="1168" y="810" font-size="20" fill="#34495e" font-style="italic">a</text>
<path d="M 1164 795 L 1178 795 L 1176 793 M 1178 795 L 1176 797"
      stroke="#34495e" stroke-width="1.8" fill="none" stroke-linecap="round"/>

<text x="1000" y="865" font-size="20" fill="#7f8c8d" font-style="italic">Superposition principle</text>

<!-- ============ LEGEND WITH OVERHEAD ARROWS ============ -->

<text x="120" y="875" font-size="24" font-weight="bold" fill="#34495e">Legend:</text>

<!-- Legend a -->
<line x1="120" y1="920" x2="210" y2="920" stroke="#e74c3c" stroke-width="4" marker-end="url(#arrowRed)"/>
<g>
  <text x="225" y="928" font-size="20" fill="#2c3e50" font-style="italic">a</text>
  <path d="M 221 911 L 235 911 L 233 909 M 235 911 L 233 913"
        stroke="#2c3e50" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <text x="240" y="928" font-size="20" fill="#2c3e50"> = O to C</text>
</g>

<!-- Legend r -->
<line x1="450" y1="920" x2="540" y2="920" stroke="#9b59b6" stroke-width="4" stroke-dasharray="16,8" marker-end="url(#arrowPurple)"/>
<g>
  <text x="555" y="928" font-size="20" fill="#2c3e50" font-style="italic">r</text>
  <path d="M 552 911 L 564 911 L 562 909 M 564 911 L 562 913"
        stroke="#2c3e50" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <text x="568" y="928" font-size="20" fill="#2c3e50"> = O to P</text>
</g>

<!-- Legend E -->
<line x1="780" y1="920" x2="870" y2="920" stroke="#27ae60" stroke-width="4" marker-end="url(#arrowGreen)"/>
<g>
  <text x="885" y="928" font-size="20" fill="#2c3e50" font-style="italic">E</text>
  <path d="M 881 911 L 896 911 L 894 909 M 896 911 L 894 913"
        stroke="#2c3e50" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <text x="900" y="928" font-size="20" fill="#2c3e50"> = Electric field</text>
</g>

</svg>'''

    return svg


# Generate
svg_content = create_overhead_arrow_svg()

output_file = 'overhead_arrows_diagram.svg'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("=" * 90)
print("✅ SVG WITH TRUE OVERHEAD ARROWS GENERATED!")
print("=" * 90)
print(f"📁 File: {output_file}")
print()
print("🎯 OVERHEAD ARROWS IMPLEMENTED:")
print("   ✓ Vectors: a⃗, r⃗, E⃗ (arrow directly above letter)")
print("   ✓ Formulas: E⃗ = ρr⃗/(3ε₀) and E⃗ = ρa⃗/(3ε₀)")
print("   ✓ Legend: All vectors with overhead arrows")
print()
print("📐 TECHNIQUE:")
print("   • SVG <path> element draws arrow above text")
print("   • Positioned using calculated coordinates")
print("   • Horizontal line + V-shaped arrowhead")
print("   • Matches standard mathematical notation")
print()
print("=" * 90)
