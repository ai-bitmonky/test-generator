#!/usr/bin/env python3
"""
Improved Physics Diagram Generator - Creates specific diagrams for each question

This version creates detailed, question-specific diagrams instead of generic ones.
Handles:
- Capacitor circuits (series, parallel, complex)
- Electric field problems
- Charge distributions
- Electrostatics problems
"""

import re
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass


@dataclass
class DiagramSpec:
    """Specification for what to draw"""
    question_text: str
    topic: str
    diagram_type: str
    elements: List[str]
    values: Dict[str, str]
    layout: str


class ImprovedPhysicsDiagramGenerator:
    """
    Generates detailed, question-specific physics diagrams
    """

    def __init__(self):
        self.canvas_width = 2000
        self.canvas_height = 1400
        self.colors = {
            'primary_text': '#2c3e50',
            'secondary_text': '#34495e',
            'section_header': '#16a085',
            'red': '#e74c3c',
            'blue': '#3498db',
            'green': '#27ae60',
            'purple': '#9b59b6',
            'orange': '#e67e22',
            'gold': '#FFD700',
            'silver': '#C0C0C0'
        }

    def generate_diagram(self, question_text: str, topic: str = "") -> str:
        """Generate diagram from question text"""

        # Parse question to determine what to draw
        spec = self._parse_question(question_text, topic)

        # Generate appropriate diagram based on type
        if 'capacitor' in spec.diagram_type or 'capacitance' in topic.lower():
            return self._generate_capacitor_diagram(spec)
        elif 'electric field' in spec.diagram_type or 'charge' in spec.diagram_type:
            return self._generate_electric_field_diagram(spec)
        elif 'sphere' in spec.diagram_type and 'cavity' in spec.diagram_type:
            return self._generate_sphere_cavity_diagram(spec)
        else:
            return self._generate_generic_diagram(spec)

    def _parse_question(self, question_text: str, topic: str) -> DiagramSpec:
        """Parse question to extract diagram requirements"""

        text_lower = question_text.lower()

        # Detect diagram type
        diagram_type = "generic"
        elements = []
        values = {}

        # Sphere with cavity (check FIRST - more specific than generic electric field)
        if 'sphere' in text_lower and 'cavity' in text_lower:
            diagram_type = "sphere_cavity"
            elements.extend(['sphere', 'cavity'])

        # Capacitor detection
        elif 'capacitor' in text_lower:
            diagram_type = "capacitor"

            # Check for series/parallel
            if 'series' in text_lower and 'parallel' in text_lower:
                diagram_type = "capacitor_series_parallel"
            elif 'series' in text_lower:
                diagram_type = "capacitor_series"
            elif 'parallel' in text_lower:
                diagram_type = "capacitor_parallel"

            # Extract capacitor values
            cap_pattern = r'C[₁₂₃]?\s*=\s*([0-9.]+)\s*(μF|pF|nF)'
            for match in re.finditer(cap_pattern, question_text):
                cap_name = match.group(0).split('=')[0].strip()
                cap_value = match.group(1) + ' ' + match.group(2)
                values[cap_name] = cap_value

            # Check for voltage
            volt_pattern = r'([0-9.]+)\s*V(?!\w)'
            volt_match = re.search(volt_pattern, question_text)
            if volt_match:
                values['V'] = volt_match.group(1) + ' V'

        # Electric field detection (more generic - check AFTER specific types)
        elif 'electric field' in text_lower or 'field lines' in text_lower:
            diagram_type = "electric_field"

            # Check for point charge
            if 'point charge' in text_lower:
                diagram_type = "electric_field_point_charge"
                elements.append('point_charge')

            # Check for multiple charges
            if re.search(r'(two|three|multiple|several)\s+charge', text_lower):
                diagram_type = "electric_field_multiple_charges"

        # Extract given information (values, constants)
        given_info = []

        # Enhanced extraction patterns

        # 1. Numeric values with units: "x = 5.0 cm", "R = 64.0 cm", "7.0 kV", "200 pF", "150 mJ"
        # Enhanced to capture more unit types: kV, pF, mJ, etc.
        # Require space before '=' to avoid matching ASCII art like "PC₁=8μFC"
        value_pattern = r'([A-Za-z][A-Za-z₁₂₃]*)\s+=\s+([0-9.]+(?:\s*×\s*10\^[−\-0-9]+)?)\s+([a-zA-Zμ°]+)'
        for match in re.finditer(value_pattern, question_text):
            var_name = match.group(1)
            var_value = match.group(2)
            var_unit = match.group(3)
            # Filter out garbage: unit should be valid (not contain multiple consecutive capitals like "μFC")
            if len(var_unit) <= 4 and not re.match(r'[A-Z]{3,}', var_unit):  # Valid units are short
                key = f"{var_name}"
                if key not in values:  # Don't duplicate if already in values dict
                    values[key] = f"{var_value} {var_unit}"

        # 1b. Also capture standalone values with units (without variable names): "7.0 kV", "200 pF"
        standalone_pattern = r'([0-9.]+)\s+(kV|mV|pF|nF|mJ|μJ|MeV|keV|eV|GeV|MW|kW|mA|μA|nA|pA|kΩ|MΩ|mΩ)'
        for match in re.finditer(standalone_pattern, question_text):
            value = match.group(1)
            unit = match.group(2)
            # Create descriptive key based on unit type
            if 'V' in unit:
                key = "Voltage"
            elif 'F' in unit:
                key = "Capacitance"
            elif 'J' in unit:
                key = "Energy"
            elif 'W' in unit:
                key = "Power"
            elif 'A' in unit:
                key = "Current"
            elif 'Ω' in unit:
                key = "Resistance"
            else:
                key = f"Value_{len(values)}"

            # Avoid duplicate keys by appending number if needed
            original_key = key
            counter = 1
            while key in values:
                key = f"{original_key}_{counter}"
                counter += 1

            values[key] = f"{value} {unit}"

        # 2. Variables without specific values: "charge q", "plate area A", "radius R"
        # These are mentioned but don't have numeric values
        symbolic_patterns = [
            r'charge\s+([qQ])',
            r'plate\s+area\s+([A-Z])',
            r'radius\s+([rR])',
            r'distance\s+([dDrR])',
            r'mass\s+([mM])',
            r'velocity\s+([vV])',
            r'separation\s+([dD])',
        ]

        for pattern in symbolic_patterns:
            matches = re.finditer(pattern, question_text, re.IGNORECASE)
            for match in matches:
                var = match.group(1)
                # Extract the context (what it represents)
                full_match = match.group(0)
                description = full_match.split(var)[0].strip()
                if var not in values and len(description) > 0:
                    values[var] = f"({description})"

        # 3. Scientific notation values: "1.6 × 10⁻¹⁵ C"
        sci_pattern = r'([0-9.]+)\s*×\s*10[⁻\-]?([0-9]+)\s*([a-zA-Zμ°]+)'
        for match in re.finditer(sci_pattern, question_text):
            value_str = f"{match.group(1)} × 10^-{match.group(2)} {match.group(3)}"
            # Try to associate with a variable if mentioned nearby
            # For now, just note it exists
            pass

        # 4. Phrases like "of radius R = 8.20 cm"
        radius_pattern = r'radius\s+([A-Z])\s*=\s*([0-9.]+)\s*([a-z]+)'
        for match in re.finditer(radius_pattern, question_text, re.IGNORECASE):
            var = match.group(1)
            val = match.group(2)
            unit = match.group(3)
            values[var] = f"{val} {unit}"

        # 5. Density patterns: "density λ = 5.0 C/m", "density ρ"
        density_pattern = r'density\s+([λρσ])'
        for match in re.finditer(density_pattern, question_text):
            var = match.group(1)
            if var not in values:
                values[var] = "(charge density)"

        # Determine layout
        layout = "standard"  # Can be: standard, wide, tall, split

        return DiagramSpec(
            question_text=question_text,
            topic=topic,
            diagram_type=diagram_type,
            elements=elements,
            values=values,
            layout=layout
        )

    def _generate_capacitor_diagram(self, spec: DiagramSpec) -> str:
        """Generate capacitor circuit diagram"""

        # Get title (first 60 chars of question)
        title = spec.question_text[:80] + "..." if len(spec.question_text) > 80 else spec.question_text

        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.canvas_width} {self.canvas_height}">
<rect width="{self.canvas_width}" height="{self.canvas_height}" fill="#ffffff"/>

{self._generate_defs()}

<!-- Title -->
<text x="1000" y="50" text-anchor="middle" font-size="42" font-weight="bold" fill="{self.colors['primary_text']}">{self._escape_xml(title)}</text>

<!-- Main Diagram Area -->
<g id="main-diagram">
'''

        # Draw based on specific type
        if spec.diagram_type == "capacitor_series":
            svg += self._draw_series_capacitors(spec)
        elif spec.diagram_type == "capacitor_parallel":
            svg += self._draw_parallel_capacitors(spec)
        elif spec.diagram_type == "capacitor_series_parallel":
            svg += self._draw_series_parallel_capacitors(spec)
        else:
            svg += self._draw_basic_capacitor(spec)

        svg += '''
</g>

<!-- Given Information -->
<g id="given-info">
'''
        svg += self._generate_given_info(spec)
        svg += '''
</g>

<!-- Legend -->
<g id="legend">
'''
        svg += self._generate_legend_capacitor()
        svg += '''
</g>

</svg>'''

        return svg

    def _draw_series_capacitors(self, spec: DiagramSpec) -> str:
        """Draw capacitors in series"""
        diagram = ""

        # Battery on left
        battery_x, battery_y = 200, 600
        diagram += f'''
  <!-- Battery -->
  <line x1="{battery_x}" y1="{battery_y - 40}" x2="{battery_x}" y2="{battery_y + 40}" stroke="{self.colors['primary_text']}" stroke-width="4"/>
  <line x1="{battery_x + 15}" y1="{battery_y - 20}" x2="{battery_x + 15}" y2="{battery_y + 20}" stroke="{self.colors['primary_text']}" stroke-width="6"/>
  <text x="{battery_x - 30}" y="{battery_y - 50}" font-size="26" fill="{self.colors['primary_text']}">+</text>
  <text x="{battery_x - 30}" y="{battery_y + 65}" font-size="26" fill="{self.colors['primary_text']}">−</text>
'''

        # Get number of capacitors
        num_caps = len([v for v in spec.values.keys() if v.startswith('C')])
        if num_caps == 0:
            num_caps = 2  # Default

        # Draw capacitors in series
        cap_spacing = 250
        start_x = 400

        for i in range(num_caps):
            cap_x = start_x + i * cap_spacing
            cap_label = f"C_{i+1}" if num_caps > 1 else "C"
            cap_value = spec.values.get(f"C{chr(0x2081 + i)}", f"C_{i+1}")  # Get value or use label

            diagram += f'''
  <!-- Capacitor {i+1} -->
  <line x1="{cap_x - 30}" y1="{battery_y - 50}" x2="{cap_x - 30}" y2="{battery_y + 50}" stroke="{self.colors['primary_text']}" stroke-width="4"/>
  <line x1="{cap_x + 30}" y1="{battery_y - 50}" x2="{cap_x + 30}" y2="{battery_y + 50}" stroke="{self.colors['primary_text']}" stroke-width="4"/>
  <text x="{cap_x}" y="{battery_y - 70}" text-anchor="middle" font-size="32" font-weight="bold" fill="{self.colors['primary_text']}">{cap_label}</text>
  <text x="{cap_x}" y="{battery_y + 100}" text-anchor="middle" font-size="26" fill="{self.colors['secondary_text']}">{self._escape_xml(str(cap_value))}</text>
'''

            # Connect with wire (if not first capacitor)
            if i > 0:
                wire_x = cap_x - cap_spacing//2
                diagram += f'  <line x1="{wire_x - cap_spacing//2 + 30}" y1="{battery_y}" x2="{wire_x + cap_spacing//2 - 30}" y2="{battery_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>\n'

        # Connect battery to first capacitor
        diagram += f'  <line x1="{battery_x + 15}" y1="{battery_y}" x2="{start_x - 30}" y2="{battery_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>\n'

        # Connect last capacitor to battery (bottom)
        last_cap_x = start_x + (num_caps - 1) * cap_spacing
        diagram += f'''
  <line x1="{last_cap_x + 30}" y1="{battery_y}" x2="{last_cap_x + 100}" y2="{battery_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{last_cap_x + 100}" y1="{battery_y}" x2="{last_cap_x + 100}" y2="{battery_y + 200}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{last_cap_x + 100}" y1="{battery_y + 200}" x2="{battery_x}" y2="{battery_y + 200}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{battery_x}" y1="{battery_y + 200}" x2="{battery_x}" y2="{battery_y + 40}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
'''

        # Add voltage label if present
        if 'V' in spec.values:
            diagram += f'  <text x="{battery_x + 50}" y="{battery_y}" font-size="28" font-weight="bold" fill="{self.colors['red']}">{spec.values["V"]}</text>\n'

        return diagram

    def _draw_parallel_capacitors(self, spec: DiagramSpec) -> str:
        """Draw capacitors in parallel"""
        diagram = ""

        # Battery
        battery_x, battery_y = 200, 600
        diagram += f'''
  <!-- Battery -->
  <line x1="{battery_x}" y1="{battery_y - 40}" x2="{battery_x}" y2="{battery_y + 40}" stroke="{self.colors['primary_text']}" stroke-width="4"/>
  <line x1="{battery_x + 15}" y1="{battery_y - 20}" x2="{battery_x + 15}" y2="{battery_y + 20}" stroke="{self.colors['primary_text']}" stroke-width="6"/>
  <text x="{battery_x - 30}" y="{battery_y - 50}" font-size="26" fill="{self.colors['primary_text']}">+</text>
  <text x="{battery_x - 30}" y="{battery_y + 65}" font-size="26" fill="{self.colors['primary_text']}">−</text>
'''

        # Get number of capacitors
        num_caps = len([v for v in spec.values.keys() if v.startswith('C')])
        if num_caps == 0:
            num_caps = 2

        # Draw capacitors in parallel
        junction_left_x = 400
        junction_right_x = 700
        cap_spacing_y = 120
        start_y = battery_y - (num_caps - 1) * cap_spacing_y // 2

        # Left junction wire
        diagram += f'  <circle cx="{junction_left_x}" cy="{battery_y}" r="8" fill="{self.colors['primary_text']}"/>\n'
        diagram += f'  <circle cx="{junction_right_x}" cy="{battery_y}" r="8" fill="{self.colors['primary_text']}"/>\n'

        for i in range(num_caps):
            cap_y = start_y + i * cap_spacing_y
            cap_label = f"C_{i+1}" if num_caps > 1 else "C"
            cap_value = spec.values.get(f"C{chr(0x2081 + i)}", f"C_{i+1}")

            cap_center_x = (junction_left_x + junction_right_x) // 2

            diagram += f'''
  <!-- Capacitor {i+1} -->
  <line x1="{cap_center_x - 30}" y1="{cap_y - 50}" x2="{cap_center_x - 30}" y2="{cap_y + 50}" stroke="{self.colors['primary_text']}" stroke-width="4"/>
  <line x1="{cap_center_x + 30}" y1="{cap_y - 50}" x2="{cap_center_x + 30}" y2="{cap_y + 50}" stroke="{self.colors['primary_text']}" stroke-width="4"/>
  <text x="{cap_center_x}" y="{cap_y - 70}" text-anchor="middle" font-size="32" font-weight="bold" fill="{self.colors['primary_text']}">{cap_label}</text>
  <text x="{cap_center_x + 100}" y="{cap_y + 10}" text-anchor="start" font-size="26" fill="{self.colors['secondary_text']}">{self._escape_xml(str(cap_value))}</text>

  <!-- Connecting wires -->
  <line x1="{junction_left_x}" y1="{battery_y}" x2="{junction_left_x}" y2="{cap_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{junction_left_x}" y1="{cap_y}" x2="{cap_center_x - 30}" y2="{cap_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{cap_center_x + 30}" y1="{cap_y}" x2="{junction_right_x}" y2="{cap_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{junction_right_x}" y1="{cap_y}" x2="{junction_right_x}" y2="{battery_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
'''

        # Connect battery to junctions
        diagram += f'''
  <line x1="{battery_x + 15}" y1="{battery_y}" x2="{junction_left_x}" y2="{battery_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{junction_right_x}" y1="{battery_y}" x2="{junction_right_x + 100}" y2="{battery_y}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{junction_right_x + 100}" y1="{battery_y}" x2="{junction_right_x + 100}" y2="{battery_y + 200}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{junction_right_x + 100}" y1="{battery_y + 200}" x2="{battery_x}" y2="{battery_y + 200}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <line x1="{battery_x}" y1="{battery_y + 200}" x2="{battery_x}" y2="{battery_y + 40}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
'''

        if 'V' in spec.values:
            diagram += f'  <text x="{battery_x + 50}" y="{battery_y}" font-size="28" font-weight="bold" fill="{self.colors['red']}">{spec.values["V"]}</text>\n'

        return diagram

    def _draw_series_parallel_capacitors(self, spec: DiagramSpec) -> str:
        """Draw complex series-parallel capacitor network"""
        # For now, use series as default (can be enhanced)
        return self._draw_series_capacitors(spec)

    def _draw_basic_capacitor(self, spec: DiagramSpec) -> str:
        """Draw a basic parallel-plate capacitor"""
        diagram = f'''
  <!-- Parallel-plate capacitor -->
  <rect x="400" y="400" width="400" height="20" fill="{self.colors['gold']}" stroke="{self.colors['primary_text']}" stroke-width="3"/>
  <rect x="400" y="680" width="400" height="20" fill="{self.colors['silver']}" stroke="{self.colors['primary_text']}" stroke-width="3"/>

  <!-- Labels -->
  <text x="350" y="420" text-anchor="end" font-size="32" fill="{self.colors['primary_text']}">+q</text>
  <text x="350" y="700" text-anchor="end" font-size="32" fill="{self.colors['primary_text']}">−q</text>

  <!-- Electric field lines -->
'''
        # Draw field lines between plates
        for i in range(5):
            x = 450 + i * 80
            diagram += f'  <line x1="{x}" y1="420" x2="{x}" y2="680" stroke="{self.colors['green']}" stroke-width="2" marker-end="url(#arrowGreen)"/>\n'

        diagram += f'''
  <!-- Field label -->
  <text x="850" y="550" font-size="32" font-weight="bold" font-style="italic" fill="{self.colors['green']}">E</text>
'''
        diagram += self._draw_overhead_arrow(850, 533, self.colors['green'])

        return diagram

    def _generate_electric_field_diagram(self, spec: DiagramSpec) -> str:
        """Generate electric field diagram"""

        title = spec.question_text[:80] + "..." if len(spec.question_text) > 80 else spec.question_text

        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.canvas_width} {self.canvas_height}">
<rect width="{self.canvas_width}" height="{self.canvas_height}" fill="#ffffff"/>

{self._generate_defs()}

<!-- Title -->
<text x="1000" y="50" text-anchor="middle" font-size="42" font-weight="bold" fill="{self.colors['primary_text']}">{self._escape_xml(title)}</text>

<g id="main-diagram">
'''

        if 'point_charge' in spec.elements:
            svg += self._draw_point_charge_field()
        else:
            svg += self._draw_generic_electric_field()

        svg += f'''
</g>

<g id="given-info">
{self._generate_given_info(spec)}
</g>

<g id="legend">
{self._generate_legend_electric_field()}
</g>

</svg>'''

        return svg

    def _draw_point_charge_field(self) -> str:
        """Draw radial electric field from point charge"""
        charge_x, charge_y = 400, 600
        diagram = f'''
  <!-- Point charge -->
  <circle cx="{charge_x}" cy="{charge_y}" r="40" fill="{self.colors['gold']}" fill-opacity="0.3" stroke="{self.colors['gold']}" stroke-width="4"/>
  <text x="{charge_x}" y="{charge_y + 10}" text-anchor="middle" font-size="32" font-weight="bold" fill="{self.colors['primary_text']}">+Q</text>
  <text x="{charge_x - 60}" y="{charge_y + 10}" font-size="44" font-weight="bold" fill="{self.colors['primary_text']}">O</text>

  <!-- Radial field lines -->
'''

        # Draw 8 radial field lines
        import math
        num_lines = 8
        field_length = 150

        for i in range(num_lines):
            angle = 2 * math.pi * i / num_lines
            start_x = charge_x + 50 * math.cos(angle)
            start_y = charge_y + 50 * math.sin(angle)
            end_x = charge_x + field_length * math.cos(angle)
            end_y = charge_y + field_length * math.sin(angle)

            diagram += f'  <line x1="{start_x:.1f}" y1="{start_y:.1f}" x2="{end_x:.1f}" y2="{end_y:.1f}" stroke="{self.colors["green"]}" stroke-width="2" marker-end="url(#arrowGreen)"/>\n'

        # Label one field line
        diagram += f'''
  <text x="{charge_x + field_length + 20}" y="{charge_y + 10}" font-size="36" font-weight="bold" font-style="italic" fill="{self.colors['green']}">E</text>
'''
        diagram += self._draw_overhead_arrow(charge_x + field_length + 20, charge_y - 7, self.colors['green'])

        return diagram

    def _draw_generic_electric_field(self) -> str:
        """Draw generic electric field"""
        return self._draw_point_charge_field()  # Default to point charge

    def _generate_sphere_cavity_diagram(self, spec: DiagramSpec) -> str:
        """Generate sphere with cavity diagram"""
        # Use the existing proven implementation
        from generate_real_physics_problems import SmartPhysicsSVGRenderer
        renderer = SmartPhysicsSVGRenderer()
        return renderer.render_sphere_cavity_problem()

    def _generate_generic_diagram(self, spec: DiagramSpec) -> str:
        """Fallback for unrecognized diagram types"""
        # Try to at least create something relevant based on keywords
        if 'charge' in spec.question_text.lower():
            return self._generate_electric_field_diagram(spec)
        else:
            return self._generate_basic_placeholder(spec)

    def _generate_basic_placeholder(self, spec: DiagramSpec) -> str:
        """Basic placeholder when type unknown"""
        title = spec.question_text[:80] + "..." if len(spec.question_text) > 80 else spec.question_text

        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.canvas_width} {self.canvas_height}">
<rect width="{self.canvas_width}" height="{self.canvas_height}" fill="#ffffff"/>

{self._generate_defs()}

<text x="1000" y="50" text-anchor="middle" font-size="42" font-weight="bold" fill="{self.colors['primary_text']}">{self._escape_xml(title)}</text>

<g id="main-diagram">
  <text x="400" y="600" font-size="32" fill="{self.colors['secondary_text']}">Diagram for this question type is under development</text>
</g>

<g id="given-info">
{self._generate_given_info(spec)}
</g>

</svg>'''

    def _generate_defs(self) -> str:
        """Generate SVG defs (arrow markers)"""
        return '''<defs>
  <marker id="arrowRed" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#e74c3c"/>
  </marker>
  <marker id="arrowBlue" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#3498db"/>
  </marker>
  <marker id="arrowGreen" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#27ae60"/>
  </marker>
  <marker id="arrowPurple" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#9b59b6"/>
  </marker>
  <marker id="arrowOrange" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#e67e22"/>
  </marker>
</defs>'''

    def _generate_given_info(self, spec: DiagramSpec) -> str:
        """Generate given information section - returns (info_svg, final_y_position)"""
        info = f'''
  <text x="1000" y="250" font-size="32" font-weight="bold" fill="{self.colors['section_header']}">Given Information:</text>
'''

        y_offset = 300
        for key, value in spec.values.items():
            info += f'  <text x="1020" y="{y_offset}" font-size="26" fill="{self.colors['secondary_text']}">• {key} = {self._escape_xml(value)}</text>\n'
            y_offset += 40

        # Store final y position for legend placement
        self._given_info_end_y = y_offset

        return info

    def _generate_legend_capacitor(self) -> str:
        """Generate legend for capacitor diagrams"""
        # Calculate legend start position with padding after given info
        legend_y_start = max(500, getattr(self, '_given_info_end_y', 300) + 60)

        return f'''
  <text x="1000" y="{legend_y_start}" font-size="32" font-weight="bold" fill="{self.colors['section_header']}">Legend:</text>
  <text x="1020" y="{legend_y_start + 50}" font-size="26" fill="{self.colors['secondary_text']}">• Capacitor plates shown as parallel lines</text>
  <text x="1020" y="{legend_y_start + 90}" font-size="26" fill="{self.colors['secondary_text']}">• +q and −q represent charge on plates</text>
  <text x="1020" y="{legend_y_start + 130}" font-size="26" fill="{self.colors['secondary_text']}">• Battery symbol: thick line is positive terminal</text>
'''

    def _generate_legend_electric_field(self) -> str:
        """Generate legend for electric field diagrams"""
        return f'''
  <text x="1000" y="900" font-size="32" font-weight="bold" fill="{self.colors['section_header']}">Legend:</text>

  <line x1="1020" y1="950" x2="1110" y2="950" stroke="{self.colors['green']}" stroke-width="3" marker-end="url(#arrowGreen)"/>
  <text x="1125" y="958" font-size="36" font-weight="bold" font-style="italic" fill="{self.colors['green']}">E</text>
'''+ self._draw_overhead_arrow(1125, 941, self.colors['green']) + f'''
  <text x="1160" y="958" font-size="26" fill="{self.colors['secondary_text']}"> = Electric field</text>

  <circle cx="1050" cy="1010" r="20" fill="{self.colors['gold']}" fill-opacity="0.3" stroke="{self.colors['gold']}" stroke-width="3"/>
  <text x="1080" y="1018" font-size="26" fill="{self.colors['secondary_text']}">= Positive charge</text>
'''

    def _draw_overhead_arrow(self, x: float, y: float, color: str) -> str:
        """Draw overhead arrow for vector notation"""
        arrow_start_x = x - 2
        arrow_end_x = x + 14
        arrow_y = y

        return f'''<path d="M {arrow_start_x} {arrow_y} L {arrow_end_x} {arrow_y} L {arrow_end_x - 2} {arrow_y - 2} M {arrow_end_x} {arrow_y} L {arrow_end_x - 2} {arrow_y + 2}" stroke="{color}" stroke-width="2" fill="none" stroke-linecap="round"/>'''

    def _escape_xml(self, text: str) -> str:
        """Escape XML special characters"""
        return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&apos;')


def generate_diagram_from_question(question_text: str, output_file: str, topic: str = ""):
    """Main entry point for generating diagrams"""
    generator = ImprovedPhysicsDiagramGenerator()
    svg_content = generator.generate_diagram(question_text, topic)

    with open(output_file, 'w') as f:
        f.write(svg_content)

    print(f"✅ Generated diagram: {output_file}")


if __name__ == "__main__":
    # Test with a simple question
    test_question = "Two capacitors C₁ = 10 μF and C₂ = 5 μF are connected in series with a 300 V battery."
    generate_diagram_from_question(test_question, "test_improved.svg", "Capacitance")
