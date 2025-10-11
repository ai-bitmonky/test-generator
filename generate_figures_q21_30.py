#!/usr/bin/env python3
"""
Generate detailed SVG figures for questions 21-30 in problematic_physics_questions.html
These are mostly mechanics problems: pulleys, stress-strain, equilibrium, torque
"""

from bs4 import BeautifulSoup

def create_q21_pulley_forearm():
    """Q21: Pulley system with forearm at angle"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="180" y="25" font-size="15" font-weight="bold">Forearm and Pulley System</text>
  <text x="180" y="45" font-size="12">15 kg block, forearm at θ = 30° with horizontal</text>

  <!-- Upper arm (vertical) -->
  <line x1="200" y1="150" x2="200" y2="300" stroke="black" stroke-width="8"/>
  <text x="165" y="225" font-size="12" font-weight="bold">Upper Arm</text>
  <text x="175" y="240" font-size="11">(vertical)</text>

  <!-- Elbow joint/pivot -->
  <circle cx="200" cy="300" r="8" fill="gray" stroke="black" stroke-width="2"/>
  <text x="170" y="325" font-size="12" font-weight="bold">Elbow O</text>
  <text x="165" y="340" font-size="11">(pivot point)</text>

  <!-- Forearm at 30° angle -->
  <line x1="200" y1="300" x2="400" y2="243" stroke="#CD853F" stroke-width="8"/>
  <text x="280" y="260" font-size="12" font-weight="bold">Forearm</text>
  <text x="265" y="275" font-size="11">mass = 2.0 kg</text>

  <!-- Angle θ = 30° -->
  <path d="M 250,300 Q 260,290 270,285" fill="none" stroke="blue" stroke-width="2"/>
  <text x="260" y="310" font-size="12" font-weight="bold" fill="blue">θ = 30°</text>

  <!-- Horizontal reference line -->
  <line x1="200" y1="300" x2="450" y2="300" stroke="gray" stroke-width="1" stroke-dasharray="5,3"/>
  <text x="410" y="315" font-size="10" fill="gray">horizontal</text>

  <!-- Center of mass of forearm at d₁ = 15 cm -->
  <circle cx="280" cy="278" r="6" fill="red" stroke="black" stroke-width="2"/>
  <text x="285" y="283" font-size="11" fill="red" font-weight="bold">CM</text>
  <line x1="200" y1="300" x2="280" y2="278" stroke="red" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="225" y="295" font-size="11" fill="red">d₁ = 15 cm</text>

  <!-- Triceps muscle force (vertical upward) at d₂ -->
  <line x1="240" y1="289" x2="240" y2="220" stroke="green" stroke-width="4" marker-end="url(#arrow31)"/>
  <text x="245" y="250" font-size="13" fill="green" font-weight="bold">F_triceps</text>
  <text x="245" y="265" font-size="11" fill="green">(vertical)</text>

  <!-- Distance d₂ marker -->
  <line x1="200" y1="300" x2="240" y2="289" stroke="green" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="210" y="285" font-size="11" fill="green">d₂</text>

  <!-- Hand/wrist end of forearm -->
  <circle cx="400" cy="243" r="6" fill="black"/>
  <text x="405" y="248" font-size="11" font-weight="bold">Hand</text>

  <!-- Pulley system -->
  <circle cx="400" cy="180" r="15" fill="lightgray" stroke="black" stroke-width="2"/>
  <text x="420" y="185" font-size="11">Pulley</text>

  <!-- Rope from hand to pulley -->
  <line x1="400" y1="243" x2="400" y2="195" stroke="brown" stroke-width="3"/>

  <!-- Rope from pulley down to block -->
  <line x1="400" y1="165" x2="400" y2="380" stroke="brown" stroke-width="3"/>

  <!-- 15 kg block -->
  <rect x="370" y="380" width="60" height="60" fill="#8B4513" stroke="black" stroke-width="2"/>
  <text x="380" y="410" font-size="13" font-weight="bold" fill="white">15 kg</text>
  <text x="380" y="427" font-size="11" fill="white">block</text>

  <!-- Weight force on block -->
  <line x1="400" y1="440" x2="400" y2="470" stroke="red" stroke-width="3" marker-end="url(#arrow32)"/>
  <text x="405" y="460" font-size="11" fill="red">W = mg</text>

  <!-- Data box -->
  <rect x="450" y="150" width="180" height="160" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="460" y="170" font-size="12" font-weight="bold">Given:</text>
  <text x="460" y="188" font-size="11">• Block: m = 15 kg</text>
  <text x="460" y="204" font-size="11">• Forearm angle: θ = 30°</text>
  <text x="460" y="220" font-size="11">• Forearm mass: 2.0 kg</text>
  <text x="460" y="236" font-size="11">• CM at d₁ = 15 cm</text>
  <text x="460" y="252" font-size="11">• Triceps at d₂ from O</text>
  <text x="460" y="275" font-size="11" font-weight="bold">Find:</text>
  <text x="460" y="291" font-size="11">Triceps muscle force</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow31" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow32" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
  </defs>
</svg>'''

def create_q22_stress_strain_spider():
    """Q22: Stress vs strain graph for spider web thread"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="160" y="25" font-size="15" font-weight="bold">Stress-Strain Curve for Spider-Web Thread</text>
  <text x="180" y="45" font-size="12">L₀ = 0.80 cm, A₀ = 8.0×10⁻¹² m², breaks at ε = 2.00</text>

  <!-- Graph axes -->
  <line x1="80" y1="380" x2="580" y2="380" stroke="black" stroke-width="2"/>
  <line x1="80" y1="380" x2="80" y2="100" stroke="black" stroke-width="2"/>
  <polygon points="580,380 575,375 575,385" fill="black"/>
  <polygon points="80,100 75,105 85,105" fill="black"/>

  <!-- X-axis: Strain (ε) -->
  <text x="300" y="415" font-size="15" font-weight="bold">Strain (ε)</text>
  <text x="70" y="395" font-size="12">0</text>
  <line x1="80" y1="380" x2="80" y2="385" stroke="black" stroke-width="2"/>

  <text x="200" y="395" font-size="12">0.5</text>
  <line x1="210" y1="380" x2="210" y2="385" stroke="black" stroke-width="2"/>

  <text x="320" y="395" font-size="12">1.0</text>
  <line x1="330" y1="380" x2="330" y2="385" stroke="black" stroke-width="2"/>

  <text x="440" y="395" font-size="12">1.5</text>
  <line x1="450" y1="380" x2="450" y2="385" stroke="black" stroke-width="2"/>

  <text x="555" y="395" font-size="12">2.0</text>
  <line x1="570" y1="380" x2="570" y2="385" stroke="black" stroke-width="2"/>

  <!-- Y-axis: Stress (GN/m²) -->
  <text x="25" y="250" font-size="15" font-weight="bold" transform="rotate(-90 35 250)">Stress (GN/m²)</text>
  <text x="50" y="385" font-size="12">0</text>

  <text x="40" y="330" font-size="12">a</text>
  <line x1="75" y1="325" x2="80" y2="325" stroke="black" stroke-width="2"/>
  <text x="25" y="330" font-size="11" fill="blue">0.12</text>

  <text x="40" y="280" font-size="12">b</text>
  <line x1="75" y1="275" x2="80" y2="275" stroke="black" stroke-width="2"/>
  <text x="25" y="280" font-size="11" fill="blue">0.30</text>

  <text x="40" y="180" font-size="12">c</text>
  <line x1="75" y1="175" x2="80" y2="175" stroke="black" stroke-width="2"/>
  <text x="25" y="180" font-size="11" fill="blue">0.80</text>

  <!-- Stress-strain curve (nonlinear, breaking at ε=2.0) -->
  <!-- Initial linear region -->
  <path d="M 80,380 L 150,350 Q 210,325 270,290 Q 330,250 390,220 Q 450,190 510,175 Q 540,170 570,175"
        fill="none" stroke="red" stroke-width="3"/>

  <!-- Breaking point -->
  <circle cx="570" cy="175" r="6" fill="red" stroke="darkred" stroke-width="2"/>
  <text x="575" y="170" font-size="12" font-weight="bold" fill="red">Break</text>
  <text x="575" y="185" font-size="11" fill="red">(ε = 2.00)</text>

  <!-- Mark key points on curve -->
  <circle cx="150" cy="350" r="4" fill="blue"/>
  <circle cx="270" cy="290" r="4" fill="blue"/>
  <circle cx="390" cy="220" r="4" fill="blue"/>

  <!-- Horizontal reference lines for a, b, c -->
  <line x1="80" y1="325" x2="210" y2="325" stroke="blue" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="80" y1="275" x2="330" y2="275" stroke="blue" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="80" y1="175" x2="570" y2="175" stroke="blue" stroke-width="1" stroke-dasharray="3,2"/>

  <!-- Data box -->
  <rect x="30" y="430" width="590" height="60" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="450" font-size="12" font-weight="bold">Thread Properties:</text>
  <text x="40" y="468" font-size="11">• Initial length L₀ = 0.80 cm, cross-sectional area A₀ = 8.0×10⁻¹² m²</text>
  <text x="40" y="483" font-size="11">• Constant volume during stretching, breaks at strain ε = 2.00</text>
  <text x="350" y="450" font-size="11" font-weight="bold">Scale values:</text>
  <text x="350" y="468" font-size="11">a = 0.12 GN/m²</text>
  <text x="470" y="468" font-size="11">b = 0.30 GN/m²</text>
  <text x="350" y="483" font-size="11">c = 0.80 GN/m²</text>

  <!-- Note -->
  <text x="80" y="120" font-size="11" fill="gray">Curve shows nonlinear elastic behavior typical of biological materials</text>
</svg>'''

def create_q23_crate_ramp_tip():
    """Q23: Crate on ramp - tipping vs sliding"""
    return '''<svg width="650" height="480" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="170" y="25" font-size="15" font-weight="bold">Crate on Inclined Ramp: Tip or Slide?</text>
  <text x="190" y="45" font-size="12">Edge length 1.2 m, CM 0.30 m above geometric center</text>

  <!-- Ramp -->
  <line x1="50" y1="400" x2="550" y2="150" stroke="black" stroke-width="4"/>
  <line x1="50" y1="400" x2="550" y2="400" stroke="black" stroke-width="2"/>

  <!-- Angle θ -->
  <path d="M 150,400 Q 180,390 200,370" fill="none" stroke="blue" stroke-width="2"/>
  <text x="170" y="410" font-size="13" font-weight="bold" fill="blue">θ</text>

  <!-- Crate (cube at angle) -->
  <g transform="translate(280, 250) rotate(-25)">
    <!-- Front face -->
    <rect x="-50" y="-50" width="100" height="100" fill="#CD853F" stroke="black" stroke-width="2"/>

    <!-- Top face (parallelogram for 3D effect) -->
    <path d="M -50,-50 L -30,-65 L 70,-65 L 50,-50 Z" fill="#8B6914" stroke="black" stroke-width="2"/>

    <!-- Side face -->
    <path d="M 50,-50 L 70,-65 L 70,35 L 50,50 Z" fill="#A0826D" stroke="black" stroke-width="2"/>

    <!-- Geometric center -->
    <circle cx="0" cy="0" r="4" fill="gray"/>
    <text x="5" y="-5" font-size="10">Geometric center</text>

    <!-- Center of mass (0.30 m above geometric center) -->
    <circle cx="0" cy="-15" r="6" fill="red" stroke="darkred" stroke-width="2"/>
    <text x="8" y="-12" font-size="11" font-weight="bold" fill="red">CM</text>
    <line x1="0" y1="0" x2="0" y2="-15" stroke="red" stroke-width="2" stroke-dasharray="2,2"/>
    <text x="5" y="-25" font-size="9" fill="red">0.30 m above</text>

    <!-- Edge length -->
    <line x1="-50" y1="55" x2="50" y2="55" stroke="blue" stroke-width="2"/>
    <text x="-30" y="70" font-size="11" fill="blue">1.2 m</text>
  </g>

  <!-- Weight force through CM -->
  <line x1="280" y1="235" x2="280" y2="310" stroke="red" stroke-width="3" marker-end="url(#arrow33)"/>
  <text x="285" y="280" font-size="13" font-weight="bold" fill="red">mg</text>

  <!-- Normal force -->
  <line x1="310" y1="280" x2="340" y2="250" stroke="green" stroke-width="3" marker-end="url(#arrow34)"/>
  <text x="345" y="265" font-size="12" fill="green" font-weight="bold">N</text>

  <!-- Friction force -->
  <line x1="250" y1="285" x2="200" y2="270" stroke="orange" stroke-width="3" marker-end="url(#arrow35)"/>
  <text x="205" y="265" font-size="12" fill="orange" font-weight="bold">f</text>

  <!-- Pivot point (lower corner) -->
  <circle cx="320" cy="292" r="5" fill="purple" stroke="black" stroke-width="2"/>
  <text x="325" y="310" font-size="11" fill="purple" font-weight="bold">Pivot point</text>
  <text x="325" y="323" font-size="10" fill="purple">(for tipping)</text>

  <!-- Question boxes -->
  <rect x="30" y="90" width="280" height="100" fill="#FFE6E6" stroke="black" stroke-width="2"/>
  <text x="40" y="110" font-size="12" font-weight="bold">Will it TIP?</text>
  <text x="40" y="128" font-size="11">If torque due to weight</text>
  <text x="40" y="143" font-size="11">about pivot point exceeds</text>
  <text x="40" y="158" font-size="11">restoring torque, crate</text>
  <text x="40" y="173" font-size="11">tips at angle θ_tip</text>

  <rect x="340" y="90" width="280" height="100" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="350" y="110" font-size="12" font-weight="bold">Will it SLIDE?</text>
  <text x="350" y="128" font-size="11">If mg sin θ > μ_s mg cos θ</text>
  <text x="350" y="143" font-size="11">where μ_s = coefficient of</text>
  <text x="350" y="158" font-size="11">static friction, crate slides</text>
  <text x="350" y="173" font-size="11">at angle θ_slide</text>

  <!-- Data box -->
  <rect x="30" y="420" width="590" height="50" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="440" font-size="12" font-weight="bold">Problem:</text>
  <text x="40" y="458" font-size="11">As θ increases, will the crate tip over first or start sliding first?</text>
  <text x="350" y="458" font-size="11">Determine the critical angle and mode of failure.</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow33" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow34" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow35" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="orange"/>
    </marker>
  </defs>
</svg>'''

def create_q24_crate_ramp_duplicate():
    """Q24: Same as Q23"""
    return create_q23_crate_ramp_tip()

def create_q25_pulley_forearm_duplicate():
    """Q25: Same as Q21"""
    return create_q21_pulley_forearm()

def create_q26_pulley_forearm_duplicate2():
    """Q26: Same as Q21"""
    return create_q21_pulley_forearm()

def create_q27_stress_strain_duplicate():
    """Q27: Same as Q22"""
    return create_q22_stress_strain_spider()

def create_q28_stress_strain_duplicate2():
    """Q28: Same as Q22"""
    return create_q22_stress_strain_spider()

def create_q29_crate_ramp_duplicate2():
    """Q29: Same as Q23"""
    return create_q23_crate_ramp_tip()

def create_q30_beam_tension():
    """Q30: Vertical beam with cable - tension vs force position"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Vertical Beam with Cable: Tension vs Force Position</text>

  <!-- Wall/hinge at bottom -->
  <rect x="280" y="380" width="40" height="20" fill="gray" stroke="black" stroke-width="2"/>
  <text x="260" y="415" font-size="12" font-weight="bold">Hinge O</text>

  <!-- Vertical beam -->
  <rect x="290" y="180" width="20" height="200" fill="#8B4513" stroke="black" stroke-width="2"/>
  <text x="250" y="280" font-size="12" font-weight="bold">Beam</text>
  <text x="245" y="295" font-size="11">(length L)</text>
  <text x="235" y="310" font-size="11">(uniform mass)</text>

  <!-- Length L marker -->
  <line x1="270" y1="180" x2="270" y2="380" stroke="blue" stroke-width="2"/>
  <text x="240" y="285" font-size="12" font-weight="bold" fill="blue">L</text>

  <!-- Cable from top of beam at angle θ -->
  <line x1="300" y1="180" x2="450" y2="120" stroke="brown" stroke-width="3"/>
  <text x="370" y="140" font-size="12" font-weight="bold">Cable</text>

  <!-- Angle θ with horizontal -->
  <line x1="300" y1="180" x2="400" y2="180" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <path d="M 340,180 Q 360,170 370,155" fill="none" stroke="purple" stroke-width="2"/>
  <text x="350" y="175" font-size="12" font-weight="bold" fill="purple">θ</text>
  <text x="405" y="185" font-size="10" fill="gray">horizontal</text>

  <!-- Tension force in cable -->
  <line x1="300" y1="180" x2="380" y2="140" stroke="red" stroke-width="3" marker-end="url(#arrow36)"/>
  <text x="340" y="155" font-size="13" font-weight="bold" fill="red">T</text>

  <!-- Horizontal force Fa applied at distance y -->
  <circle cx="300" cy="280" r="5" fill="green" stroke="darkgreen" stroke-width="2"/>
  <line x1="300" y1="280" x2="380" y2="280" stroke="green" stroke-width="4" marker-end="url(#arrow37)"/>
  <text x="340" y="275" font-size="13" font-weight="bold" fill="green">F_a</text>
  <text x="330" y="295" font-size="11" fill="green">(horizontal)</text>

  <!-- Distance y from bottom -->
  <line x1="250" y1="380" x2="250" y2="280" stroke="green" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="220" y="335" font-size="12" font-weight="bold" fill="green">y</text>

  <!-- Graph of T vs y/L -->
  <rect x="430" y="220" width="200" height="200" fill="white" stroke="black" stroke-width="2"/>
  <text x="465" y="240" font-size="12" font-weight="bold">Tension T vs y/L</text>

  <!-- Graph axes -->
  <line x1="450" y1="400" x2="610" y2="400" stroke="black" stroke-width="2"/>
  <line x1="450" y1="400" x2="450" y2="240" stroke="black" stroke-width="2"/>

  <!-- X-axis labels -->
  <text x="445" y="415" font-size="9">0</text>
  <text x="520" y="415" font-size="9">0.5</text>
  <text x="600" y="415" font-size="9">1.0</text>
  <text x="515" y="430" font-size="10" font-weight="bold">y/L</text>

  <!-- Y-axis -->
  <text x="435" y="405" font-size="9">0</text>
  <text x="420" y="320" font-size="9">T</text>

  <!-- Tension curve (decreasing from y=0 to y=L) -->
  <path d="M 450,260 Q 500,300 530,340 L 610,400"
        fill="none" stroke="red" stroke-width="3"/>

  <!-- Scale marker -->
  <text x="455" y="260" font-size="9" fill="red">T_s</text>

  <!-- Data box -->
  <rect x="30" y="430" width="590" height="60" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="450" font-size="12" font-weight="bold">Setup:</text>
  <text x="40" y="468" font-size="11">• Uniform vertical beam (length L, mass M) hinged at bottom</text>
  <text x="40" y="483" font-size="11">• Cable attached at top at angle θ, horizontal force F_a applied at distance y from bottom</text>
  <text x="350" y="450" font-size="11" font-weight="bold">Graph shows:</text>
  <text x="350" y="468" font-size="11">T varies with y/L position</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow36" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow37" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
      <polygon points="0,0 12,3 0,6" fill="green"/>
    </marker>
  </defs>
</svg>'''


# Main execution
def main():
    print("Generating detailed SVG figures for questions 21-30...")

    with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    questions = soup.find_all('div', class_='question-card')

    # Map of SVG generators
    svg_generators = {
        21: create_q21_pulley_forearm,
        22: create_q22_stress_strain_spider,
        23: create_q23_crate_ramp_tip,
        24: create_q24_crate_ramp_duplicate,
        25: create_q25_pulley_forearm_duplicate,
        26: create_q26_pulley_forearm_duplicate2,
        27: create_q27_stress_strain_duplicate,
        28: create_q28_stress_strain_duplicate2,
        29: create_q29_crate_ramp_duplicate2,
        30: create_q30_beam_tension,
    }

    count = 0
    for i in range(21, 31):
        if i <= len(questions):
            q = questions[i-1]
            q_text_div = q.find('div', class_='question-text')

            if q_text_div:
                # Remove old placeholder if exists
                old_svg = q_text_div.find('svg')
                if old_svg:
                    old_svg.decompose()

                # Generate and insert new detailed SVG
                svg_content = svg_generators[i]()
                svg_soup = BeautifulSoup(svg_content, 'html.parser')
                q_text_div.insert(0, svg_soup)
                count += 1
                print(f"✓ Added detailed SVG for Question {i}")

    # Save modified HTML
    with open('problematic_physics_questions.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))

    print(f"\n✅ Successfully added {count} detailed SVG figures (Q21-Q30)")
    print("Saved to problematic_physics_questions.html")

if __name__ == "__main__":
    main()
