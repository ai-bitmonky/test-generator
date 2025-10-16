#!/usr/bin/env python3
"""
Comprehensive Physics Diagram Generator
Handles ANY complex physics problem by intelligently parsing question text
"""

import re
import math
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass


@dataclass
class PhysicsElement:
    """Represents a physics element extracted from question"""
    type: str  # capacitor, charge, battery, switch, dielectric, etc.
    label: str  # C₁, q₁, V, S, κ₁, etc.
    value: str  # 8.00 μF, +5.0 μC, 12.0 V, etc.
    properties: Dict[str, Any]  # Additional properties


class QuestionParser:
    """Parse question text to extract all physics elements"""

    def __init__(self, question_text: str):
        self.text = question_text
        self.elements = []

    def parse(self) -> List[PhysicsElement]:
        """Extract all physics elements from question"""

        # 1. Capacitors: C₁ = 8.00 μF
        cap_pattern = r'(C[₁₂₃₄₅]?)\s*=\s*([\d.]+)\s*(μF|pF|nF|mF|F)'
        for match in re.finditer(cap_pattern, self.text):
            self.elements.append(PhysicsElement(
                type='capacitor',
                label=match.group(1),
                value=f"{match.group(2)} {match.group(3)}",
                properties={}
            ))

        # 2. Charges: q₁ = +5.0 μC
        charge_pattern = r'(q[₁₂₃₄]?)\s*=\s*([+\-]?[\d.]+)\s*([μnmp]?C)\b'
        for match in re.finditer(charge_pattern, self.text):
            self.elements.append(PhysicsElement(
                type='charge',
                label=match.group(1),
                value=f"{match.group(2)} {match.group(3)}",
                properties={'polarity': '+' if '+' in match.group(2) else ('-' if '-' in match.group(2) else '+')}
            ))

        # 3. Voltage/Battery: V = 12.0 V or 12.0 V battery
        volt_pattern = r'(?:V\s*=\s*)?([\d.]+)\s*V\s*(?:battery)?'
        volt_matches = list(re.finditer(volt_pattern, self.text))
        if volt_matches:
            # Use first match as main battery voltage
            match = volt_matches[0]
            self.elements.append(PhysicsElement(
                type='battery',
                label='V',
                value=f"{match.group(1)} V",
                properties={}
            ))

        # 4. Switches: switch S
        switch_pattern = r'switch\s+([S₁₂₃]?)'
        for match in re.finditer(switch_pattern, self.text, re.IGNORECASE):
            label = match.group(1) if match.group(1) else 'S'
            self.elements.append(PhysicsElement(
                type='switch',
                label=label,
                value='',
                properties={'state': 'open' if 'open' in self.text.lower() else 'closed'}
            ))

        # 5. Dielectrics: κ₁ = 21.0
        diel_pattern = r'(κ[₁₂₃₄]?)\s*=\s*([\d.]+)'
        for match in re.finditer(diel_pattern, self.text):
            self.elements.append(PhysicsElement(
                type='dielectric',
                label=match.group(1),
                value=match.group(2),
                properties={}
            ))

        # 6. Distances: d = 4.0 cm
        dist_pattern = r'([dDrRhH])\s*=\s*([\d.]+)\s*(cm|mm|m|nm|μm)'
        for match in re.finditer(dist_pattern, self.text):
            self.elements.append(PhysicsElement(
                type='distance',
                label=match.group(1),
                value=f"{match.group(2)} {match.group(3)}",
                properties={}
            ))

        # 7. Areas: A = 10.5 cm²
        area_pattern = r'([A])\s*=\s*([\d.]+)\s*(cm²|m²|mm²)'
        for match in re.finditer(area_pattern, self.text):
            self.elements.append(PhysicsElement(
                type='area',
                label=match.group(1),
                value=f"{match.group(2)} {match.group(3)}",
                properties={}
            ))

        # 8. Points: point P
        point_pattern = r'point\s+([P-Z])'
        for match in re.finditer(point_pattern, self.text, re.IGNORECASE):
            self.elements.append(PhysicsElement(
                type='point',
                label=match.group(1),
                value='',
                properties={}
            ))

        # 9. Angles: θ₁ = 43°
        angle_pattern = r'(θ[₁₂₃]?)\s*=\s*([\d.]+)°'
        for match in re.finditer(angle_pattern, self.text):
            self.elements.append(PhysicsElement(
                type='angle',
                label=match.group(1),
                value=f"{match.group(2)}°",
                properties={}
            ))

        return self.elements

    def detect_diagram_type(self) -> str:
        """Determine what type of diagram is needed"""
        text_lower = self.text.lower()

        # Priority-based detection
        if 'graph' in text_lower or 'versus' in text_lower or 'plot' in text_lower:
            return 'graph'
        elif 'circuit' in text_lower or len([e for e in self.elements if e.type == 'capacitor']) >= 2:
            if any(e.type == 'switch' for e in self.elements):
                return 'circuit_with_switch'
            else:
                return 'capacitor_circuit'
        elif len([e for e in self.elements if e.type == 'dielectric']) >= 2:
            return 'dielectric_configuration'
        elif len([e for e in self.elements if e.type == 'charge']) >= 2:
            if 'dipole' in text_lower:
                return 'electric_dipole'
            else:
                return 'charge_distribution'
        elif 'dipole' in text_lower:
            return 'electric_dipole'
        elif 'sphere' in text_lower and 'cavity' in text_lower:
            return 'sphere_cavity'
        elif 'parallel-plate' in text_lower:
            return 'parallel_plate_capacitor'
        else:
            return 'generic'


class ComprehensiveDiagramRenderer:
    """Renders physics diagrams based on parsed elements"""

    def __init__(self):
        self.width = 2000
        self.height = 1400
        self.colors = {
            'bg': '#ffffff',
            'primary': '#2c3e50',
            'secondary': '#34495e',
            'accent': '#3498db',
            'positive': '#e74c3c',
            'negative': '#3498db',
            'neutral': '#95a5a6',
            'green': '#27ae60',
            'gold': '#FFD700',
            'silver': '#C0C0C0'
        }

    def render(self, question_text: str, diagram_type: str, elements: List[PhysicsElement]) -> str:
        """Main render method - routes to specific renderer"""

        if diagram_type == 'circuit_with_switch':
            return self._render_circuit_with_switch(elements)
        elif diagram_type == 'capacitor_circuit':
            return self._render_capacitor_circuit(elements)
        elif diagram_type == 'dielectric_configuration':
            return self._render_dielectric_config(elements)
        elif diagram_type == 'charge_distribution':
            return self._render_charge_distribution(elements)
        elif diagram_type == 'electric_dipole':
            return self._render_electric_dipole(elements)
        elif diagram_type == 'graph':
            return self._render_graph_placeholder(elements)
        elif diagram_type == 'parallel_plate_capacitor':
            return self._render_parallel_plate(elements)
        else:
            return self._render_generic(elements)

    def _render_circuit_with_switch(self, elements: List[PhysicsElement]) -> str:
        """Render circuit with capacitors, battery, and switch"""

        svg = self._svg_header()

        # Battery position
        batt_x, batt_y = 150, 600
        svg += self._draw_battery(batt_x, batt_y, 'V')

        # Get capacitors
        capacitors = [e for e in elements if e.type == 'capacitor']
        num_caps = len(capacitors)

        if num_caps == 0:
            num_caps = 2  # Default

        # Draw capacitors in a configuration
        cap_spacing = 250
        start_x = 400

        for i, cap in enumerate(capacitors[:4]):  # Max 4 capacitors
            cap_x = start_x + (i % 2) * cap_spacing
            cap_y = 500 if i < 2 else 700

            svg += self._draw_capacitor_symbol(cap_x, cap_y, cap.label, cap.value)

        # Draw switch
        switches = [e for e in elements if e.type == 'switch']
        if switches:
            svg += self._draw_switch(700, 600, switches[0].label, switches[0].properties.get('state', 'open'))

        # Draw point P if exists
        points = [e for e in elements if e.type == 'point']
        if points:
            svg += self._draw_point(500, 450, points[0].label)

        # Connect with wires (simplified)
        svg += self._draw_wire(batt_x + 15, batt_y, start_x - 50, batt_y)

        svg += self._svg_footer(elements)
        return svg

    def _render_capacitor_circuit(self, elements: List[PhysicsElement]) -> str:
        """Render capacitor circuit without switch"""

        svg = self._svg_header()

        capacitors = [e for e in elements if e.type == 'capacitor']
        battery = next((e for e in elements if e.type == 'battery'), None)

        # Determine layout based on question text
        # For now, simple series layout
        batt_x, batt_y = 200, 600
        svg += self._draw_battery(batt_x, batt_y, battery.label if battery else 'V')

        start_x = 400
        for i, cap in enumerate(capacitors):
            cap_x = start_x + i * 250
            svg += self._draw_capacitor_symbol(cap_x, batt_y, cap.label, cap.value)

        svg += self._svg_footer(elements)
        return svg

    def _render_dielectric_config(self, elements: List[PhysicsElement]) -> str:
        """Render parallel-plate capacitor with dielectric regions"""

        svg = self._svg_header()

        # Draw parallel plates
        plate_x, plate_y1, plate_y2 = 300, 300, 700
        plate_width = 800

        svg += f'<rect x="{plate_x}" y="{plate_y1}" width="{plate_width}" height="20" fill="{self.colors["gold"]}" stroke="{self.colors["primary"]}" stroke-width="3"/>\n'
        svg += f'<rect x="{plate_x}" y="{plate_y2}" width="{plate_width}" height="20" fill="{self.colors["silver"]}" stroke="{self.colors["primary"]}" stroke-width="3"/>\n'

        # Draw dielectric regions
        dielectrics = [e for e in elements if e.type == 'dielectric']
        if len(dielectrics) == 2:
            # Left-right split
            mid_x = plate_x + plate_width // 2
            svg += f'<rect x="{plate_x}" y="{plate_y1 + 30}" width="{plate_width//2}" height="{plate_y2 - plate_y1 - 50}" fill="#e8f4f9" stroke="{self.colors["accent"]}" stroke-width="2" stroke-dasharray="5,5"/>\n'
            svg += f'<text x="{plate_x + plate_width//4}" y="{(plate_y1 + plate_y2)//2}" text-anchor="middle" font-size="32" fill="{self.colors["accent"]}">{dielectrics[0].label} = {dielectrics[0].value}</text>\n'

            svg += f'<rect x="{mid_x}" y="{plate_y1 + 30}" width="{plate_width//2}" height="{plate_y2 - plate_y1 - 50}" fill="#f9e8f4" stroke="{self.colors["positive"]}" stroke-width="2" stroke-dasharray="5,5"/>\n'
            svg += f'<text x="{mid_x + plate_width//4}" y="{(plate_y1 + plate_y2)//2}" text-anchor="middle" font-size="32" fill="{self.colors["positive"]}">{dielectrics[1].label} = {dielectrics[1].value}</text>\n'

        # Label dimensions
        distances = [e for e in elements if e.type == 'distance']
        if distances:
            svg += f'<text x="{plate_x - 80}" y="{(plate_y1 + plate_y2)//2}" font-size="28" fill="{self.colors["primary"]}">{distances[0].label} = {distances[0].value}</text>\n'

        svg += self._svg_footer(elements)
        return svg

    def _render_charge_distribution(self, elements: List[PhysicsElement]) -> str:
        """Render multiple charged particles"""

        svg = self._svg_header()

        charges = [e for e in elements if e.type == 'charge']
        distances = [e for e in elements if e.type == 'distance']

        # Place charges on x-axis
        y_pos = 600
        positions = [400, 800, 1200]  # x positions

        for i, charge in enumerate(charges[:3]):
            x = positions[i]
            color = self.colors['positive'] if charge.properties.get('polarity') == '+' else self.colors['negative']

            svg += f'<circle cx="{x}" cy="{y_pos}" r="50" fill="{color}" fill-opacity="0.3" stroke="{color}" stroke-width="4"/>\n'
            svg += f'<text x="{x}" y="{y_pos + 15}" text-anchor="middle" font-size="32" font-weight="bold" fill="{self.colors["primary"]}">{charge.label}</text>\n'
            svg += f'<text x="{x}" y="{y_pos + 80}" text-anchor="middle" font-size="24" fill="{self.colors["secondary"]}">{charge.value}</text>\n'

        # Draw distance markers
        if distances and len(charges) >= 2:
            svg += f'<line x1="{positions[0]}" y1="{y_pos + 100}" x2="{positions[1]}" y2="{y_pos + 100}" stroke="{self.colors["primary"]}" stroke-width="2" marker-start="url(#arrowBlueReverse)" marker-end="url(#arrowBlue)"/>\n'
            svg += f'<text x="{(positions[0] + positions[1])//2}" y="{y_pos + 90}" text-anchor="middle" font-size="26" fill="{self.colors["primary"]}">{distances[0].label} = {distances[0].value}</text>\n'

        svg += self._svg_footer(elements)
        return svg

    def _render_electric_dipole(self, elements: List[PhysicsElement]) -> str:
        """Render electric dipole"""

        svg = self._svg_header()

        # Dipole center
        center_x, center_y = 700, 600
        separation = 100

        # Negative charge
        svg += f'<circle cx="{center_x - separation}" cy="{center_y}" r="40" fill="{self.colors["negative"]}" fill-opacity="0.3" stroke="{self.colors["negative"]}" stroke-width="4"/>\n'
        svg += f'<text x="{center_x - separation}" y="{center_y + 10}" text-anchor="middle" font-size="32" font-weight="bold" fill="{self.colors["primary"]}">−e</text>\n'

        # Positive charge
        svg += f'<circle cx="{center_x + separation}" cy="{center_y}" r="40" fill="{self.colors["positive"]}" fill-opacity="0.3" stroke="{self.colors["positive"]}" stroke-width="4"/>\n'
        svg += f'<text x="{center_x + separation}" y="{center_y + 10}" text-anchor="middle" font-size="32" font-weight="bold" fill="{self.colors["primary"]}">+e</text>\n'

        # Separation distance
        distances = [e for e in elements if e.type == 'distance']
        if distances:
            svg += f'<line x1="{center_x - separation}" y1="{center_y + 80}" x2="{center_x + separation}" y2="{center_y + 80}" stroke="{self.colors["primary"]}" stroke-width="2" marker-start="url(#arrowBlueReverse)" marker-end="url(#arrowBlue)"/>\n'
            svg += f'<text x="{center_x}" y="{center_y + 70}" text-anchor="middle" font-size="26" fill="{self.colors["primary"]}">{distances[0].label} = {distances[0].value}</text>\n'

        svg += self._svg_footer(elements)
        return svg

    def _render_parallel_plate(self, elements: List[PhysicsElement]) -> str:
        """Render basic parallel-plate capacitor"""

        svg = self._svg_header()

        # Plates
        svg += f'<rect x="400" y="400" width="400" height="20" fill="{self.colors["gold"]}" stroke="{self.colors["primary"]}" stroke-width="3"/>\n'
        svg += f'<rect x="400" y="680" width="400" height="20" fill="{self.colors["silver"]}" stroke="{self.colors["primary"]}" stroke-width="3"/>\n'

        # Charge labels
        svg += f'<text x="350" y="420" text-anchor="end" font-size="32" fill="{self.colors["primary"]}">+q</text>\n'
        svg += f'<text x="350" y="700" text-anchor="end" font-size="32" fill="{self.colors["primary"]}">−q</text>\n'

        # Electric field
        for i in range(5):
            x = 450 + i * 80
            svg += f'<line x1="{x}" y1="420" x2="{x}" y2="680" stroke="{self.colors["green"]}" stroke-width="2" marker-end="url(#arrowGreen)"/>\n'

        svg += f'<text x="850" y="550" font-size="32" font-weight="bold" font-style="italic" fill="{self.colors["green"]}">E</text>\n'

        # Dimensions if provided
        areas = [e for e in elements if e.type == 'area']
        if areas:
            svg += f'<line x1="420" y1="380" x2="780" y2="380" stroke="{self.colors["accent"]}" stroke-width="2" marker-start="url(#arrowBlueReverse)" marker-end="url(#arrowBlue)"/>\n'
            svg += f'<text x="600" y="370" text-anchor="middle" font-size="28" font-weight="bold" fill="{self.colors["accent"]}">A = {areas[0].value}</text>\n'

        distances = [e for e in elements if e.type == 'distance' and e.label == 'd']
        if distances:
            svg += f'<line x1="380" y1="420" x2="380" y2="680" stroke="{self.colors["positive"]}" stroke-width="2" marker-start="url(#arrowOrangeReverse)" marker-end="url(#arrowOrange)"/>\n'
            svg += f'<text x="365" y="555" text-anchor="end" font-size="28" font-weight="bold" fill="{self.colors["positive"]}">{distances[0].label} = {distances[0].value}</text>\n'

        svg += self._svg_footer(elements)
        return svg

    def _render_graph_placeholder(self, elements: List[PhysicsElement]) -> str:
        """Render placeholder for graphs"""

        svg = self._svg_header()
        svg += f'<text x="700" y="600" font-size="36" fill="{self.colors["secondary"]}" text-anchor="middle">Graph Visualization</text>\n'
        svg += f'<text x="700" y="650" font-size="24" fill="{self.colors["secondary"]}" text-anchor="middle">(Complex graphs require data points)</text>\n'
        svg += self._svg_footer(elements)
        return svg

    def _render_generic(self, elements: List[PhysicsElement]) -> str:
        """Generic fallback renderer"""

        svg = self._svg_header()

        # List all detected elements
        y_pos = 400
        svg += f'<text x="400" y="{y_pos}" font-size="32" font-weight="bold" fill="{self.colors["primary"]}">Detected Elements:</text>\n'

        for i, elem in enumerate(elements[:10]):
            y_pos += 50
            svg += f'<text x="420" y="{y_pos}" font-size="24" fill="{self.colors["secondary"]}">• {elem.type}: {elem.label} = {elem.value}</text>\n'

        svg += self._svg_footer(elements)
        return svg

    # Helper methods for drawing components

    def _draw_battery(self, x, y, label) -> str:
        return f'''
  <!-- Battery -->
  <line x1="{x}" y1="{y - 40}" x2="{x}" y2="{y + 40}" stroke="{self.colors['primary']}" stroke-width="4"/>
  <line x1="{x + 15}" y1="{y - 20}" x2="{x + 15}" y2="{y + 20}" stroke="{self.colors['primary']}" stroke-width="6"/>
  <text x="{x - 30}" y="{y - 50}" font-size="26" fill="{self.colors['primary']}">+</text>
  <text x="{x - 30}" y="{y + 65}" font-size="26" fill="{self.colors['primary']}">−</text>
  <text x="{x + 40}" y="{y + 10}" font-size="24" fill="{self.colors['secondary']}">{label}</text>
'''

    def _draw_capacitor_symbol(self, x, y, label, value) -> str:
        return f'''
  <!-- Capacitor {label} -->
  <line x1="{x - 30}" y1="{y - 50}" x2="{x - 30}" y2="{y + 50}" stroke="{self.colors['primary']}" stroke-width="4"/>
  <line x1="{x + 30}" y1="{y - 50}" x2="{x + 30}" y2="{y + 50}" stroke="{self.colors['primary']}" stroke-width="4"/>
  <text x="{x}" y="{y - 70}" text-anchor="middle" font-size="28" font-weight="bold" fill="{self.colors['primary']}">{label}</text>
  <text x="{x}" y="{y + 100}" text-anchor="middle" font-size="22" fill="{self.colors['secondary']}">{value}</text>
'''

    def _draw_switch(self, x, y, label, state) -> str:
        angle = 30 if state == 'open' else 0
        x2 = x + 60 * math.cos(math.radians(angle))
        y2 = y - 60 * math.sin(math.radians(angle))

        return f'''
  <!-- Switch {label} -->
  <circle cx="{x}" cy="{y}" r="8" fill="{self.colors['primary']}"/>
  <circle cx="{x + 60}" cy="{y}" r="8" fill="{self.colors['primary']}"/>
  <line x1="{x}" y1="{y}" x2="{x2}" y2="{y2}" stroke="{self.colors['primary']}" stroke-width="4"/>
  <text x="{x + 30}" y="{y - 30}" text-anchor="middle" font-size="24" fill="{self.colors['secondary']}">{label} ({state})</text>
'''

    def _draw_point(self, x, y, label) -> str:
        return f'''
  <!-- Point {label} -->
  <circle cx="{x}" cy="{y}" r="12" fill="{self.colors['positive']}" stroke="{self.colors['primary']}" stroke-width="3"/>
  <text x="{x + 25}" y="{y + 10}" font-size="28" font-weight="bold" fill="{self.colors['primary']}">{label}</text>
'''

    def _draw_wire(self, x1, y1, x2, y2) -> str:
        return f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{self.colors["primary"]}" stroke-width="3"/>\n'

    def _svg_header(self) -> str:
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.width} {self.height}">
<rect width="{self.width}" height="{self.height}" fill="{self.colors['bg']}"/>

<defs>
  <marker id="arrowRed" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#e74c3c"/>
  </marker>
  <marker id="arrowBlue" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#3498db"/>
  </marker>
  <marker id="arrowGreen" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#27ae60"/>
  </marker>
  <marker id="arrowOrange" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#e67e22"/>
  </marker>
  <marker id="arrowBlueReverse" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
    <path d="M 5 0 L 0 2.5 L 5 5 z" fill="#3498db"/>
  </marker>
  <marker id="arrowOrangeReverse" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
    <path d="M 5 0 L 0 2.5 L 5 5 z" fill="#e67e22"/>
  </marker>
</defs>

<!-- Main Diagram -->
<g id="main-diagram">
'''

    def _svg_footer(self, elements: List[PhysicsElement]) -> str:
        footer = '</g>\n\n<!-- Given Information -->\n<g id="given-info">\n'
        footer += '  <text x="1000" y="250" font-size="32" font-weight="bold" fill="#16a085">Given Information:</text>\n'

        y_offset = 300
        for elem in elements:
            if elem.value:
                footer += f'  <text x="1020" y="{y_offset}" font-size="26" fill="#34495e">• {elem.label} = {elem.value}</text>\n'
                y_offset += 40

        footer += '</g>\n</svg>'
        return footer


def generate_comprehensive_diagram(question_text: str, output_file: str):
    """Main entry point"""

    # Parse question
    parser = QuestionParser(question_text)
    elements = parser.parse()
    diagram_type = parser.detect_diagram_type()

    print(f"Detected diagram type: {diagram_type}")
    print(f"Found {len(elements)} elements")

    # Render diagram
    renderer = ComprehensiveDiagramRenderer()
    svg = renderer.render(question_text, diagram_type, elements)

    # Save
    with open(output_file, 'w') as f:
        f.write(svg)

    print(f"✅ Generated: {output_file}")


if __name__ == "__main__":
    # Test
    test_q = "Problem 61: capacitor 1 (C₁ = 8.00 μF), capacitor 2 (C₂ = 6.00 μF), and capacitor 3 (C₃ = 8.00 μF) connected to a 12.0 V battery with a switch S initially open. capacitor C₄ (C₄ = 6.00 μF). point P"
    generate_comprehensive_diagram(test_q, "test_comprehensive.svg")
