#!/usr/bin/env python3
"""
Capacitor Reconnection Problem Diagram Generator
Question 7: Two capacitors in series, then reconnected in parallel
"""

from typing import List


class CapacitorReconnectionDiagram:
    """Generate diagram for capacitor reconnection problem"""

    def __init__(self):
        self.width = 2000
        self.height = 1400

        # Font sizes (following DIAGRAM_GUIDELINES.md)
        self.FONT_TITLE = 42
        self.FONT_SECTION = 32
        self.FONT_SUBSECTION = 24
        self.FONT_BODY = 26
        self.FONT_LABEL = 44
        self.FONT_SMALL = 20

        # Colors
        self.COLOR_PRIMARY = "#2c3e50"
        self.COLOR_SECONDARY = "#34495e"
        self.COLOR_HEADER = "#16a085"
        self.COLOR_RED = "#e74c3c"
        self.COLOR_BLUE = "#3498db"
        self.COLOR_GREEN = "#27ae60"
        self.COLOR_PURPLE = "#9b59b6"

    def generate_svg(self) -> str:
        """Generate complete SVG diagram"""
        parts = []

        # Header
        parts.append(self._svg_header())

        # Title
        parts.append(self._add_title())

        # Three states: Initial, After Charging, After Reconnection
        parts.append(self._draw_state_1_initial())
        parts.append(self._draw_state_2_after_charging())
        parts.append(self._draw_state_3_after_reconnection())

        # Given Information
        parts.append(self._add_given_information())

        # Legend
        parts.append(self._add_legend())

        # Footer
        parts.append('</svg>')

        return '\n'.join(parts)

    def _svg_header(self) -> str:
        """SVG header with markers"""
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.width} {self.height}">
<rect width="{self.width}" height="{self.height}" fill="#ffffff"/>

<defs>
  <!-- Arrow markers -->
  <marker id="arrowRed" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="{self.COLOR_RED}"/>
  </marker>
  <marker id="arrowBlue" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="{self.COLOR_BLUE}"/>
  </marker>
  <marker id="arrowGreen" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
    <path d="M 0 0 L 5 2.5 L 0 5 z" fill="{self.COLOR_GREEN}"/>
  </marker>
</defs>'''

    def _add_title(self) -> str:
        """Add title"""
        return f'''<text x="{self.width/2}" y="50" text-anchor="middle" font-size="{self.FONT_TITLE}" font-weight="bold" fill="{self.COLOR_PRIMARY}">Capacitor Reconnection Problem</text>'''

    def _draw_state_1_initial(self) -> str:
        """Draw State 1: Series connection with battery"""
        x_start = 120
        y_center = 250

        parts = []
        parts.append('<g id="state-1">')

        # State label
        parts.append(f'<text x="{x_start + 200}" y="120" text-anchor="middle" font-size="{self.FONT_SECTION}" font-weight="bold" fill="{self.COLOR_HEADER}">State 1: Series Connection</text>')

        # Battery (left)
        battery_x = x_start
        parts.append(self._draw_battery(battery_x, y_center))
        parts.append(f'<text x="{battery_x - 30}" y="{y_center + 5}" text-anchor="end" font-size="{self.FONT_BODY}" fill="{self.COLOR_PRIMARY}">V = 300V</text>')

        # Wire from battery positive to C1
        parts.append(f'<line x1="{battery_x + 40}" y1="{y_center - 40}" x2="{battery_x + 100}" y2="{y_center - 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')

        # Capacitor C1
        c1_x = battery_x + 100
        parts.append(self._draw_capacitor(c1_x, y_center, "C₁"))
        parts.append(f'<text x="{c1_x + 50}" y="{y_center + 70}" text-anchor="middle" font-size="{self.FONT_BODY}" fill="{self.COLOR_BLUE}">C₁ = 2.00 μF</text>')

        # Charge labels on C1
        parts.append(f'<text x="{c1_x + 15}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">+</text>')
        parts.append(f'<text x="{c1_x + 85}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">−</text>')

        # Wire from C1 to C2
        parts.append(f'<line x1="{c1_x + 100}" y1="{y_center - 40}" x2="{c1_x + 160}" y2="{y_center - 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')

        # Capacitor C2
        c2_x = c1_x + 160
        parts.append(self._draw_capacitor(c2_x, y_center, "C₂"))
        parts.append(f'<text x="{c2_x + 50}" y="{y_center + 70}" text-anchor="middle" font-size="{self.FONT_BODY}" fill="{self.COLOR_BLUE}">C₂ = 8.00 μF</text>')

        # Charge labels on C2
        parts.append(f'<text x="{c2_x + 15}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">+</text>')
        parts.append(f'<text x="{c2_x + 85}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">−</text>')

        # Wire from C2 back to battery
        parts.append(f'<line x1="{c2_x + 100}" y1="{y_center - 40}" x2="{c2_x + 100}" y2="{y_center + 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')
        parts.append(f'<line x1="{c2_x + 100}" y1="{y_center + 40}" x2="{battery_x + 40}" y2="{y_center + 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')

        # Note
        parts.append(f'<text x="{x_start + 200}" y="{y_center + 120}" text-anchor="middle" font-size="{self.FONT_SMALL}" font-style="italic" fill="{self.COLOR_SECONDARY}">Series connection: same charge on both capacitors</text>')

        parts.append('</g>')
        return '\n'.join(parts)

    def _draw_state_2_after_charging(self) -> str:
        """Draw State 2: After disconnection"""
        x_start = 120
        y_center = 550

        parts = []
        parts.append('<g id="state-2">')

        # State label
        parts.append(f'<text x="{x_start + 200}" y="{y_center - 130}" text-anchor="middle" font-size="{self.FONT_SECTION}" font-weight="bold" fill="{self.COLOR_HEADER}">State 2: After Disconnection</text>')

        # Capacitor C1 (isolated)
        c1_x = x_start + 80
        parts.append(self._draw_capacitor(c1_x, y_center, "C₁"))
        parts.append(f'<text x="{c1_x + 50}" y="{y_center + 70}" text-anchor="middle" font-size="{self.FONT_BODY}" fill="{self.COLOR_BLUE}">C₁ = 2.00 μF</text>')

        # Charge on C1
        parts.append(f'<text x="{c1_x + 15}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">+Q₁</text>')
        parts.append(f'<text x="{c1_x + 75}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">−Q₁</text>')

        # Capacitor C2 (isolated)
        c2_x = c1_x + 180
        parts.append(self._draw_capacitor(c2_x, y_center, "C₂"))
        parts.append(f'<text x="{c2_x + 50}" y="{y_center + 70}" text-anchor="middle" font-size="{self.FONT_BODY}" fill="{self.COLOR_BLUE}">C₂ = 8.00 μF</text>')

        # Charge on C2
        parts.append(f'<text x="{c2_x + 15}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">+Q₂</text>')
        parts.append(f'<text x="{c2_x + 75}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">−Q₂</text>')

        # Note
        parts.append(f'<text x="{x_start + 200}" y="{y_center + 120}" text-anchor="middle" font-size="{self.FONT_SMALL}" font-style="italic" fill="{self.COLOR_SECONDARY}">Capacitors disconnected: Q₁ = Q₂ (same charge from series)</text>')

        parts.append('</g>')
        return '\n'.join(parts)

    def _draw_state_3_after_reconnection(self) -> str:
        """Draw State 3: After reconnection in parallel"""
        x_start = 120
        y_center = 850

        parts = []
        parts.append('<g id="state-3">')

        # State label
        parts.append(f'<text x="{x_start + 200}" y="{y_center - 130}" text-anchor="middle" font-size="{self.FONT_SECTION}" font-weight="bold" fill="{self.COLOR_HEADER}">State 3: Reconnected in Parallel</text>')

        # Top wire (connecting positive plates)
        c1_x = x_start + 80
        c2_x = c1_x + 180
        parts.append(f'<line x1="{c1_x + 20}" y1="{y_center - 40}" x2="{c2_x + 20}" y2="{y_center - 40}" stroke="{self.COLOR_RED}" stroke-width="4"/>')

        # Bottom wire (connecting negative plates)
        parts.append(f'<line x1="{c1_x + 80}" y1="{y_center + 40}" x2="{c2_x + 80}" y2="{y_center + 40}" stroke="{self.COLOR_BLUE}" stroke-width="4"/>')

        # Capacitor C1
        parts.append(self._draw_capacitor(c1_x, y_center, "C₁"))
        parts.append(f'<text x="{c1_x + 50}" y="{y_center + 70}" text-anchor="middle" font-size="{self.FONT_BODY}" fill="{self.COLOR_BLUE}">C₁ = 2.00 μF</text>')

        # New charge on C1
        parts.append(f'<text x="{c1_x + 15}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">+Q₁\'</text>')
        parts.append(f'<text x="{c1_x + 70}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">−Q₁\'</text>')

        # Capacitor C2
        parts.append(self._draw_capacitor(c2_x, y_center, "C₂"))
        parts.append(f'<text x="{c2_x + 50}" y="{y_center + 70}" text-anchor="middle" font-size="{self.FONT_BODY}" fill="{self.COLOR_BLUE}">C₂ = 8.00 μF</text>')

        # New charge on C2
        parts.append(f'<text x="{c2_x + 15}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">+Q₂\'</text>')
        parts.append(f'<text x="{c2_x + 70}" y="{y_center - 60}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">−Q₂\'</text>')

        # Labels for connections
        parts.append(f'<text x="{(c1_x + c2_x)/2 + 20}" y="{y_center - 55}" text-anchor="middle" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">(+ to +)</text>')
        parts.append(f'<text x="{(c1_x + c2_x)/2 + 80}" y="{y_center + 65}" text-anchor="middle" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">(− to −)</text>')

        # Note
        parts.append(f'<text x="{x_start + 200}" y="{y_center + 120}" text-anchor="middle" font-size="{self.FONT_SMALL}" font-style="italic" fill="{self.COLOR_SECONDARY}">Parallel connection: same voltage across both capacitors</text>')

        parts.append('</g>')
        return '\n'.join(parts)

    def _draw_battery(self, x: float, y: float) -> str:
        """Draw battery symbol"""
        parts = []

        # Positive terminal (longer line)
        parts.append(f'<line x1="{x + 20}" y1="{y - 60}" x2="{x + 20}" y2="{y - 20}" stroke="{self.COLOR_PRIMARY}" stroke-width="4"/>')

        # Negative terminal (shorter line)
        parts.append(f'<line x1="{x + 40}" y1="{y - 50}" x2="{x + 40}" y2="{y - 30}" stroke="{self.COLOR_PRIMARY}" stroke-width="4"/>')

        # Connection points
        parts.append(f'<line x1="{x + 20}" y1="{y - 60}" x2="{x + 40}" y2="{y - 60}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')
        parts.append(f'<line x1="{x + 40}" y1="{y + 60}" x2="{x + 40}" y2="{y + 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')

        # + and - labels
        parts.append(f'<text x="{x + 10}" y="{y - 65}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_RED}">+</text>')
        parts.append(f'<text x="{x + 50}" y="{y - 15}" font-size="{self.FONT_SMALL}" fill="{self.COLOR_BLUE}">−</text>')

        return '\n'.join(parts)

    def _draw_capacitor(self, x: float, y: float, label: str) -> str:
        """Draw capacitor symbol"""
        parts = []

        # Two parallel plates
        parts.append(f'<line x1="{x + 20}" y1="{y - 40}" x2="{x + 20}" y2="{y + 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="5"/>')
        parts.append(f'<line x1="{x + 80}" y1="{y - 40}" x2="{x + 80}" y2="{y + 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="5"/>')

        # Connection wires
        parts.append(f'<line x1="{x}" y1="{y - 40}" x2="{x + 20}" y2="{y - 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')
        parts.append(f'<line x1="{x + 80}" y1="{y - 40}" x2="{x + 100}" y2="{y - 40}" stroke="{self.COLOR_PRIMARY}" stroke-width="3"/>')

        # Label
        parts.append(f'<text x="{x + 50}" y="{y + 5}" text-anchor="middle" font-size="{self.FONT_LABEL}" font-weight="bold" fill="{self.COLOR_PRIMARY}">{label}</text>')

        return '\n'.join(parts)

    def _add_given_information(self) -> str:
        """Add given information section"""
        return f'''<g id="given-info">
  <text x="700" y="200" font-size="{self.FONT_SECTION}" font-weight="bold" fill="{self.COLOR_HEADER}">Given Information:</text>

  <text x="720" y="245" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">• Initial voltage: V = 300 V</text>
  <text x="720" y="280" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">• Capacitor 1: C₁ = 2.00 μF</text>
  <text x="720" y="315" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">• Capacitor 2: C₂ = 8.00 μF</text>

  <text x="700" y="370" font-size="{self.FONT_SUBSECTION}" font-weight="bold" fill="{self.COLOR_HEADER}">Process:</text>

  <text x="720" y="405" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">1. Capacitors connected in series</text>
  <text x="720" y="440" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">2. Connected to 300 V battery</text>
  <text x="720" y="475" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">3. Disconnected from battery</text>
  <text x="720" y="510" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">4. Disconnected from each other</text>
  <text x="720" y="545" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">5. Reconnected: + to +, − to −</text>
  <text x="720" y="580" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">   (parallel connection)</text>
</g>'''

    def _add_legend(self) -> str:
        """Add legend section"""
        return f'''<g id="legend">
  <text x="700" y="660" font-size="{self.FONT_SECTION}" font-weight="bold" fill="{self.COLOR_PRIMARY}">Legend:</text>

  <text x="720" y="705" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">• Q₁, Q₂ = Initial charges (State 2)</text>
  <text x="720" y="740" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">• Q₁\', Q₂\' = Final charges (State 3)</text>
  <text x="720" y="775" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">• In series: Q₁ = Q₂ = Q (same charge)</text>
  <text x="720" y="810" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">• In parallel: V₁ = V₂ = V\' (same voltage)</text>

  <line x1="720" y1="850" x2="770" y2="850" stroke="{self.COLOR_RED}" stroke-width="4"/>
  <text x="780" y="857" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">= Positive connection</text>

  <line x1="720" y1="885" x2="770" y2="885" stroke="{self.COLOR_BLUE}" stroke-width="4"/>
  <text x="780" y="892" font-size="{self.FONT_BODY}" fill="{self.COLOR_SECONDARY}">= Negative connection</text>
</g>'''


def main():
    """Generate the capacitor reconnection diagram"""
    print("=" * 80)
    print("🔋 CAPACITOR RECONNECTION DIAGRAM GENERATOR")
    print("=" * 80)
    print()
    print("Generating diagram for Question 7...")
    print()

    generator = CapacitorReconnectionDiagram()
    svg_content = generator.generate_svg()

    output_file = "capacitor_reconnection_diagram.svg"
    with open(output_file, 'w') as f:
        f.write(svg_content)

    print("✅ SUCCESS!")
    print()
    print(f"📁 Output file: {output_file}")
    print()
    print("Diagram shows:")
    print("  ✓ State 1: Series connection with battery")
    print("  ✓ State 2: After disconnection (isolated capacitors)")
    print("  ✓ State 3: Reconnected in parallel (+ to +, − to −)")
    print("  ✓ Given Information: V, C₁, C₂, process steps")
    print("  ✓ Legend: Charge notation, connection types")
    print("  ✓ NO solution formulas or answer values")
    print()
    print("=" * 80)


if __name__ == "__main__":
    main()
