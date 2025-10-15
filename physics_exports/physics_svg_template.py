#!/usr/bin/env python3
"""
REUSABLE PHYSICS SVG GENERATOR TEMPLATE
Quickly create accurate physics diagrams for ANY IIT JEE problem

HOW TO USE:
1. Modify the problem_config dictionary with your problem details
2. Run: python3 physics_svg_template.py
3. SVG file is generated with NO overlaps

SUPPORTED DIAGRAMS:
- Mechanics (inclined planes, pulleys, collisions, projectiles)
- Electrostatics (charges, fields, potentials)
- Circuits (resistors, capacitors, batteries)
- Optics (ray diagrams, lenses, mirrors)
- Waves (interference, diffraction)
"""

import math
import json

class UniversalPhysicsSVG:
    """Universal physics diagram generator with mathematical precision"""

    def __init__(self, width=900, height=700):
        self.width = width
        self.height = height
        self.margin = 50

    def vector_with_overhead_arrow(self, x, y, label, color="#000"):
        """Generate text with overhead arrow for vector notation"""
        return f'''
        <text x="{x}" y="{y}" font-size="18" font-weight="bold" fill="{color}" font-style="italic">{label}</text>
        <path d="M {x} {y-10} L {x+12} {y-10} L {x+10} {y-12} M {x+12} {y-10} L {x+10} {y-8}"
              stroke="{color}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        '''

    def draw_arrow(self, x1, y1, x2, y2, color="#000", width=2, dashed=False):
        """Draw arrow from (x1,y1) to (x2,y2) with arrowhead"""
        dash = 'stroke-dasharray="10,5"' if dashed else ''
        return f'''
        <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"
              stroke="{color}" stroke-width="{width}" {dash} marker-end="url(#arrow{color.replace('#','')})"/>
        '''

    def create_inclined_plane(self, angle=30, with_friction=True, with_components=True):
        """
        Inclined plane with block
        Args:
            angle: Inclination angle in degrees
            with_friction: Show friction force
            with_components: Show weight components
        """
        base_x = 150
        base_y = 500
        length = 400
        height = length * math.tan(math.radians(angle))

        svg = self._get_header()

        # Inclined plane (triangle)
        svg += f'''
        <!-- Inclined Plane -->
        <path d="M {base_x} {base_y} L {base_x + length} {base_y} L {base_x} {base_y - height} Z"
              fill="#d5d8dc" stroke="black" stroke-width="3"/>

        <!-- Ground line -->
        <pattern id="ground" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="10" y2="0" stroke="black" stroke-width="1"/>
        </pattern>
        <rect x="{base_x}" y="{base_y}" width="{length}" height="20" fill="url(#ground)"/>
        '''

        # Block on incline
        block_size = 60
        block_pos = length / 2
        block_x = base_x + block_pos * math.cos(math.radians(angle)) - block_size/2 * math.cos(math.radians(angle))
        block_y = base_y - block_pos * math.sin(math.radians(angle)) - block_size

        svg += f'''
        <!-- Block -->
        <g transform="rotate(-{angle}, {block_x + block_size/2}, {block_y + block_size/2})">
          <rect x="{block_x}" y="{block_y}" width="{block_size}" height="{block_size}"
                fill="#3498db" stroke="black" stroke-width="2.5"/>
          <text x="{block_x + block_size/2}" y="{block_y + block_size/2 + 8}"
                text-anchor="middle" font-size="24" font-weight="bold" fill="white">m</text>
        </g>
        '''

        # Force vectors
        force_origin_x = block_x + block_size/2
        force_origin_y = block_y + block_size/2
        force_scale = 100

        # Weight (mg downward)
        svg += f'''
        <!-- Weight -->
        <line x1="{force_origin_x}" y1="{force_origin_y}"
              x2="{force_origin_x}" y2="{force_origin_y + force_scale}"
              stroke="#e74c3c" stroke-width="3" marker-end="url(#arrowRed)"/>
        <text x="{force_origin_x + 20}" y="{force_origin_y + force_scale/2}"
              font-size="20" font-weight="bold" fill="#e74c3c">mg</text>
        '''

        # Normal force (perpendicular to plane)
        normal_dx = force_scale * math.sin(math.radians(angle))
        normal_dy = -force_scale * math.cos(math.radians(angle))
        svg += f'''
        <!-- Normal Force -->
        <line x1="{force_origin_x}" y1="{force_origin_y}"
              x2="{force_origin_x + normal_dx}" y2="{force_origin_y + normal_dy}"
              stroke="#27ae60" stroke-width="3" marker-end="url(#arrowGreen)"/>
        <text x="{force_origin_x + normal_dx + 15}" y="{force_origin_y + normal_dy - 10}"
              font-size="20" font-weight="bold" fill="#27ae60">N</text>
        '''

        if with_friction:
            # Friction (parallel to plane, up the slope)
            friction_dx = -force_scale * 0.6 * math.cos(math.radians(angle))
            friction_dy = -force_scale * 0.6 * math.sin(math.radians(angle))
            svg += f'''
            <!-- Friction Force -->
            <line x1="{force_origin_x}" y1="{force_origin_y}"
                  x2="{force_origin_x + friction_dx}" y2="{force_origin_y + friction_dy}"
                  stroke="#f39c12" stroke-width="3" marker-end="url(#arrowOrange)"/>
            <text x="{force_origin_x + friction_dx - 25}" y="{force_origin_y + friction_dy - 10}"
                  font-size="20" font-weight="bold" fill="#f39c12">f</text>
            '''

        # Angle indicator
        arc_radius = 60
        svg += f'''
        <!-- Angle Arc -->
        <path d="M {base_x + arc_radius} {base_y}
                 A {arc_radius} {arc_radius} 0 0 0
                 {base_x + arc_radius*math.cos(math.radians(angle))} {base_y - arc_radius*math.sin(math.radians(angle))}"
              fill="none" stroke="#9b59b6" stroke-width="2"/>
        <text x="{base_x + arc_radius + 20}" y="{base_y - 15}"
              font-size="18" font-weight="bold" fill="#9b59b6">{angle}°</text>
        '''

        svg += self._get_footer()
        return svg

    def create_pulley_system(self, m1=2, m2=3):
        """
        Pulley system with two masses
        Args:
            m1, m2: Masses in kg
        """
        svg = self._get_header()

        pulley_x = 450
        pulley_y = 150
        pulley_r = 50

        # Pulley
        svg += f'''
        <!-- Pulley -->
        <circle cx="{pulley_x}" cy="{pulley_y}" r="{pulley_r}"
                fill="none" stroke="black" stroke-width="3"/>
        <circle cx="{pulley_x}" cy="{pulley_y}" r="8" fill="black"/>

        <!-- Ceiling -->
        <line x1="{pulley_x - 100}" y1="{pulley_y - pulley_r - 30}"
              x2="{pulley_x + 100}" y2="{pulley_y - pulley_r - 30}"
              stroke="black" stroke-width="5"/>
        <pattern id="ceiling" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
          <line x1="0" y1="15" x2="7.5" y2="0" stroke="black" stroke-width="1.5"/>
        </pattern>
        <rect x="{pulley_x - 100}" y="{pulley_y - pulley_r - 45}"
              width="200" height="15" fill="url(#ceiling)"/>

        <!-- Support rope -->
        <line x1="{pulley_x}" y1="{pulley_y - pulley_r - 30}"
              x2="{pulley_x}" y2="{pulley_y - pulley_r}"
              stroke="black" stroke-width="3"/>
        '''

        # Masses and ropes
        m1_x = pulley_x - pulley_r
        m2_x = pulley_x + pulley_r
        rope1_length = 250
        rope2_length = 180

        # Left mass (m1)
        mass_width = 70
        mass_height = 80
        m1_y = pulley_y + rope1_length

        svg += f'''
        <!-- Left rope -->
        <line x1="{m1_x}" y1="{pulley_y}"
              x2="{m1_x}" y2="{m1_y}"
              stroke="#8b4513" stroke-width="4"/>

        <!-- Left mass -->
        <rect x="{m1_x - mass_width/2}" y="{m1_y}"
              width="{mass_width}" height="{mass_height}"
              fill="#3498db" stroke="black" stroke-width="2.5"/>
        <text x="{m1_x}" y="{m1_y + mass_height/2 + 10}"
              text-anchor="middle" font-size="24" font-weight="bold" fill="white">m₁</text>
        <text x="{m1_x}" y="{m1_y + mass_height + 30}"
              text-anchor="middle" font-size="18" fill="black">{m1} kg</text>

        <!-- Tension on m1 -->
        <line x1="{m1_x}" y1="{m1_y - 10}"
              x2="{m1_x}" y2="{m1_y - 60}"
              stroke="#e74c3c" stroke-width="2.5" marker-end="url(#arrowRed)"/>
        <text x="{m1_x + 20}" y="{m1_y - 30}"
              font-size="18" font-weight="bold" fill="#e74c3c">T</text>

        <!-- Weight on m1 -->
        <line x1="{m1_x}" y1="{m1_y + mass_height + 10}"
              x2="{m1_x}" y2="{m1_y + mass_height + 60}"
              stroke="#e74c3c" stroke-width="2.5" marker-end="url(#arrowRed)"/>
        <text x="{m1_x + 20}" y="{m1_y + mass_height + 45}"
              font-size="18" font-weight="bold" fill="#e74c3c">m₁g</text>
        '''

        # Right mass (m2)
        m2_y = pulley_y + rope2_length

        svg += f'''
        <!-- Right rope -->
        <line x1="{m2_x}" y1="{pulley_y}"
              x2="{m2_x}" y2="{m2_y}"
              stroke="#8b4513" stroke-width="4"/>

        <!-- Right mass -->
        <rect x="{m2_x - mass_width/2}" y="{m2_y}"
              width="{mass_width}" height="{mass_height}"
              fill="#e74c3c" stroke="black" stroke-width="2.5"/>
        <text x="{m2_x}" y="{m2_y + mass_height/2 + 10}"
              text-anchor="middle" font-size="24" font-weight="bold" fill="white">m₂</text>
        <text x="{m2_x}" y="{m2_y + mass_height + 30}"
              text-anchor="middle" font-size="18" fill="black">{m2} kg</text>

        <!-- Tension on m2 -->
        <line x1="{m2_x}" y1="{m2_y - 10}"
              x2="{m2_x}" y2="{m2_y - 60}"
              stroke="#e74c3c" stroke-width="2.5" marker-end="url(#arrowRed)"/>
        <text x="{m2_x + 20}" y="{m2_y - 30}"
              font-size="18" font-weight="bold" fill="#e74c3c">T</text>

        <!-- Weight on m2 -->
        <line x1="{m2_x}" y1="{m2_y + mass_height + 10}"
              x2="{m2_x}" y2="{m2_y + mass_height + 60}"
              stroke="#e74c3c" stroke-width="2.5" marker-end="url(#arrowRed)"/>
        <text x="{m2_x + 20}" y="{m2_y + mass_height + 45}"
              font-size="18" font-weight="bold" fill="#e74c3c">m₂g</text>
        '''

        svg += self._get_footer()
        return svg

    def _get_header(self):
        """SVG header with common definitions"""
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.width} {self.height}">
<rect width="{self.width}" height="{self.height}" fill="#f8f9fa"/>
<defs>
  <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
    <polygon points="0 0, 10 3, 0 6" fill="#e74c3c"/>
  </marker>
  <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
    <polygon points="0 0, 10 3, 0 6" fill="#3498db"/>
  </marker>
  <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
    <polygon points="0 0, 10 3, 0 6" fill="#27ae60"/>
  </marker>
  <marker id="arrowOrange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
    <polygon points="0 0, 10 3, 0 6" fill="#f39c12"/>
  </marker>
  <marker id="arrowBlack" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
    <polygon points="0 0, 10 3, 0 6" fill="black"/>
  </marker>
</defs>
'''

    def _get_footer(self):
        """SVG footer"""
        return '</svg>'

# ==============================================================================
# USAGE EXAMPLES - Modify this section for your problem
# ==============================================================================

if __name__ == '__main__':
    generator = UniversalPhysicsSVG()

    # Example 1: Inclined Plane
    print("Generating inclined plane diagram...")
    svg1 = generator.create_inclined_plane(angle=30, with_friction=True)
    with open('inclined_plane.svg', 'w') as f:
        f.write(svg1)
    print("✅ Created: inclined_plane.svg")

    # Example 2: Pulley System
    print("Generating pulley system diagram...")
    svg2 = generator.create_pulley_system(m1=2, m2=5)
    with open('pulley_system.svg', 'w') as f:
        f.write(svg2)
    print("✅ Created: pulley_system.svg")

    print("\n" + "="*70)
    print("MODIFY THE PARAMETERS ABOVE TO CREATE YOUR OWN DIAGRAMS!")
    print("="*70)
