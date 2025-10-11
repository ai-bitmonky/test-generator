#!/usr/bin/env python3
"""
Generate detailed SVG figures for questions 11-20 in problematic_physics_questions.html
"""

from bs4 import BeautifulSoup

def create_q11_rectangular_array():
    """Q11: Rectangular array of 6 charged particles"""
    return '''<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Rectangular Array of Charged Particles</text>
  <text x="180" y="45" font-size="12">a = 39.0 cm, find V at center</text>

  <!-- Rectangle -->
  <rect x="150" y="120" width="300" height="200" fill="none" stroke="black" stroke-width="3"/>

  <!-- Corner 1 (bottom-left) -->
  <circle cx="150" cy="320" r="15" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="140" y="328" font-size="13" font-weight="bold">−q₁</text>
  <text x="120" y="350" font-size="11">Corner 1</text>
  <text x="115" y="365" font-size="10">−3.40 pC</text>

  <!-- Corner 2 (top-left) -->
  <circle cx="150" cy="120" r="15" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="137" y="128" font-size="13" font-weight="bold">+4q₂</text>
  <text x="120" y="105" font-size="11">Corner 2</text>
  <text x="110" y="90" font-size="10">+24.0 pC</text>

  <!-- Corner 3 (top-right) -->
  <circle cx="450" cy="120" r="15" fill="lightgreen" stroke="black" stroke-width="2"/>
  <text x="437" y="128" font-size="13" font-weight="bold">+2q₁</text>
  <text x="460" y="105" font-size="11">Corner 3</text>
  <text x="460" y="90" font-size="10">+6.80 pC</text>

  <!-- Corner 4 (bottom-right) -->
  <circle cx="450" cy="320" r="15" fill="lightgreen" stroke="black" stroke-width="2"/>
  <text x="437" y="328" font-size="13" font-weight="bold">+2q₁</text>
  <text x="460" y="350" font-size="11">Corner 4</text>
  <text x="460" y="365" font-size="10">+6.80 pC</text>

  <!-- Corner 5 (middle-left) -->
  <circle cx="150" cy="220" r="15" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="137" y="228" font-size="13" font-weight="bold">+4q₂</text>
  <text x="90" y="225" font-size="11">Corner 5</text>
  <text x="80" y="240" font-size="10">+24.0 pC</text>

  <!-- Corner 6 (middle-right) -->
  <circle cx="450" cy="220" r="15" fill="lightyellow" stroke="black" stroke-width="2"/>
  <text x="437" y="228" font-size="13" font-weight="bold">−3q₁</text>
  <text x="470" y="225" font-size="11">Corner 6</text>
  <text x="470" y="240" font-size="10">−10.2 pC</text>

  <!-- Center point -->
  <circle cx="300" cy="220" r="8" fill="red" stroke="black" stroke-width="2"/>
  <text x="310" y="225" font-size="14" font-weight="bold">Center</text>
  <text x="310" y="240" font-size="12">V = ?</text>

  <!-- Dimension arrows -->
  <!-- Horizontal -->
  <line x1="150" y1="350" x2="450" y2="350" stroke="blue" stroke-width="2" marker-start="url(#arrow5)" marker-end="url(#arrow5)"/>
  <text x="280" y="370" font-size="13" font-weight="bold" fill="blue">a = 39.0 cm</text>

  <!-- Vertical left -->
  <line x1="120" y1="120" x2="120" y2="220" stroke="green" stroke-width="2" marker-start="url(#arrow6)" marker-end="url(#arrow6)"/>
  <text x="85" y="175" font-size="11" font-weight="bold" fill="green">a/2</text>

  <!-- Vertical right -->
  <line x1="480" y1="220" x2="480" y2="320" stroke="green" stroke-width="2" marker-start="url(#arrow6)" marker-end="url(#arrow6)"/>
  <text x="485" y="275" font-size="11" font-weight="bold" fill="green">a/2</text>

  <!-- Dashed lines to center -->
  <line x1="150" y1="120" x2="300" y2="220" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="450" y1="120" x2="300" y2="220" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="150" y1="320" x2="300" y2="220" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="450" y1="320" x2="300" y2="220" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="150" y1="220" x2="300" y2="220" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="450" y1="220" x2="300" y2="220" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>

  <!-- Data box -->
  <rect x="30" y="390" width="540" height="50" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="410" font-size="12" font-weight="bold">Given: q₁ = 3.40 pC, q₂ = 6.00 pC, a = 39.0 cm</text>
  <text x="40" y="428" font-size="11">Find: Net electric potential V at rectangle's center (V = 0 at ∞)</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow5" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="blue"/>
    </marker>
    <marker id="arrow6" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="green"/>
    </marker>
  </defs>
</svg>'''

def create_q12_dipole_electron():
    """Q12: Electron released near electric dipole"""
    return '''<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="180" y="25" font-size="15" font-weight="bold">Electron Near Electric Dipole</text>
  <text x="190" y="45" font-size="12">d = 20 pm, find speed at 5.0d</text>

  <!-- Dipole axis -->
  <line x1="100" y1="200" x2="500" y2="200" stroke="black" stroke-width="2"/>
  <polygon points="500,200 495,195 495,205" fill="black"/>
  <text x="510" y="205" font-size="13">axis</text>

  <!-- Dipole center -->
  <circle cx="250" cy="200" r="4" fill="black"/>
  <text x="255" y="220" font-size="12" font-weight="bold">Dipole Center</text>

  <!-- Negative charge of dipole -->
  <circle cx="240" cy="200" r="12" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="235" y="207" font-size="13" font-weight="bold">−e</text>

  <!-- Positive charge of dipole -->
  <circle cx="260" cy="200" r="12" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="255" y="207" font-size="13" font-weight="bold">+e</text>

  <!-- Dipole separation d -->
  <line x1="240" y1="230" x2="260" y2="230" stroke="green" stroke-width="2" marker-start="url(#arrow7)" marker-end="url(#arrow7)"/>
  <text x="242" y="250" font-size="12" font-weight="bold" fill="green">d = 20 pm</text>

  <!-- Initial position: 7.0d from center (positive side) -->
  <circle cx="390" cy="200" r="10" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="384" y="206" font-size="12" font-weight="bold">e⁻</text>
  <text x="365" y="180" font-size="11" fill="blue">Initial position</text>
  <text x="370" y="195" font-size="11" fill="blue">(at rest)</text>
  <text x="405" y="205" font-size="11">7.0d from center</text>

  <!-- Distance marker: center to initial -->
  <line x1="250" y1="170" x2="390" y2="170" stroke="blue" stroke-width="2" marker-start="url(#arrow8)" marker-end="url(#arrow8)"/>
  <text x="300" y="165" font-size="12" font-weight="bold" fill="blue">7.0d = 140 pm</text>

  <!-- Final position: 5.0d from center -->
  <circle cx="330" cy="200" r="10" fill="orange" stroke="black" stroke-width="2"/>
  <text x="324" y="206" font-size="12" font-weight="bold">e⁻</text>
  <text x="315" y="280" font-size="11" fill="red">Final position</text>
  <text x="315" y="295" font-size="11" fill="red">(v = ?)</text>

  <!-- Distance marker: center to final -->
  <line x1="250" y1="260" x2="330" y2="260" stroke="red" stroke-width="2" marker-start="url(#arrow9)" marker-end="url(#arrow9)"/>
  <text x="270" y="280" font-size="12" font-weight="bold" fill="red">5.0d = 100 pm</text>

  <!-- Motion arrow -->
  <line x1="385" y1="200" x2="345" y2="200" stroke="purple" stroke-width="3" marker-end="url(#arrow10)"/>
  <text x="355" y="225" font-size="12" fill="purple" font-weight="bold">Motion</text>

  <!-- Data box -->
  <rect x="30" y="320" width="540" height="65" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="340" font-size="12" font-weight="bold">Given:</text>
  <text x="40" y="358" font-size="11">• Dipole: charges ±e separated by d = 20 pm</text>
  <text x="40" y="374" font-size="11">• Electron released from rest at 7.0d (positive side)</text>
  <text x="300" y="358" font-size="11" font-weight="bold">Find:</text>
  <text x="300" y="374" font-size="11">Speed when it reaches 5.0d from center</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow7" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="green"/>
    </marker>
    <marker id="arrow8" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="blue"/>
    </marker>
    <marker id="arrow9" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="red"/>
    </marker>
    <marker id="arrow10" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q13_electron_proton_plates():
    """Q13: Electron and proton between parallel plates"""
    return '''<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="130" y="25" font-size="15" font-weight="bold">Electron and Proton Between Parallel Plates</text>
  <text x="210" y="45" font-size="12">d = 5.0 cm separation</text>

  <!-- Negative plate (top) -->
  <rect x="100" y="80" width="400" height="20" fill="#4A90E2" stroke="black" stroke-width="2"/>
  <text x="235" y="95" font-size="14" font-weight="bold" fill="white">Negative Plate (−)</text>
  <text x="50" y="95" font-size="16" font-weight="bold">−</text>
  <text x="510" y="95" font-size="16" font-weight="bold">−</text>

  <!-- Positive plate (bottom) -->
  <rect x="100" y="330" width="400" height="20" fill="#E74C3C" stroke="black" stroke-width="2"/>
  <text x="230" y="345" font-size="14" font-weight="bold" fill="white">Positive Plate (+)</text>
  <text x="50" y="345" font-size="16" font-weight="bold">+</text>
  <text x="510" y="345" font-size="16" font-weight="bold">+</text>

  <!-- Electric field lines (downward) -->
  <line x1="150" y1="100" x2="150" y2="330" stroke="green" stroke-width="2" marker-end="url(#arrow11)"/>
  <line x1="250" y1="100" x2="250" y2="330" stroke="green" stroke-width="2" marker-end="url(#arrow11)"/>
  <line x1="350" y1="100" x2="350" y2="330" stroke="green" stroke-width="2" marker-end="url(#arrow11)"/>
  <line x1="450" y1="100" x2="450" y2="330" stroke="green" stroke-width="2" marker-end="url(#arrow11)"/>
  <text x="360" y="220" font-size="13" font-weight="bold" fill="green">E (uniform)</text>

  <!-- Separation distance -->
  <line x1="70" y1="100" x2="70" y2="330" stroke="black" stroke-width="2" marker-start="url(#arrow12)" marker-end="url(#arrow12)"/>
  <text x="30" y="220" font-size="13" font-weight="bold">d = 5.0 cm</text>

  <!-- Electron (starts at negative plate) -->
  <circle cx="200" cy="90" r="12" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="193" y="97" font-size="13" font-weight="bold">e⁻</text>
  <text x="160" y="75" font-size="11" fill="blue">Electron</text>
  <text x="150" y="60" font-size="10" fill="blue">(starts at rest)</text>

  <!-- Electron motion arrow -->
  <line x1="200" y1="110" x2="200" y2="280" stroke="blue" stroke-width="3" marker-end="url(#arrow13)"/>

  <!-- Proton (starts at positive plate) -->
  <circle cx="400" cy="340" r="12" fill="pink" stroke="black" stroke-width="2"/>
  <text x="394" y="347" font-size="13" font-weight="bold">p⁺</text>
  <text x="410" y="345" font-size="11" fill="red">Proton</text>
  <text x="400" y="365" font-size="10" fill="red">(starts at rest)</text>

  <!-- Proton motion arrow -->
  <line x1="400" y1="320" x2="400" y2="150" stroke="red" stroke-width="3" marker-end="url(#arrow14)"/>

  <!-- Meeting point (very close to positive plate) -->
  <circle cx="300" cy="320" r="8" fill="orange" stroke="black" stroke-width="2"/>
  <text x="240" y="315" font-size="12" font-weight="bold" fill="orange">Meeting Point</text>
  <text x="225" y="305" font-size="10" fill="orange">(~27 μm from + plate)</text>

  <!-- Distance from positive plate to meeting point -->
  <line x1="520" y1="330" x2="520" y2="320" stroke="orange" stroke-width="2" marker-start="url(#arrow15)" marker-end="url(#arrow15)"/>
  <text x="530" y="327" font-size="10" fill="orange">~27 μm</text>

  <!-- Note box -->
  <rect x="30" y="380" width="540" height="60" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="400" font-size="12" font-weight="bold">Setup:</text>
  <text x="40" y="418" font-size="11">• Electron (e⁻) released from negative plate, proton (p⁺) from positive plate</text>
  <text x="40" y="433" font-size="11">• Both start from rest simultaneously. They meet very close to positive plate (~27 μm)</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow11" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow12" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="black"/>
    </marker>
    <marker id="arrow13" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="blue"/>
    </marker>
    <marker id="arrow14" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow15" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <polygon points="0,0 6,3 0,6" fill="orange"/>
    </marker>
  </defs>
</svg>'''

def create_q14_bee_pollen():
    """Q14: Honeybee with pollen grain"""
    return '''<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="160" y="25" font-size="15" font-weight="bold">Charged Honeybee with Pollen Grain</text>

  <!-- Bee (large sphere) -->
  <circle cx="300" cy="220" r="80" fill="#FFD700" stroke="black" stroke-width="3"/>
  <text x="270" y="230" font-size="16" font-weight="bold">Bee</text>
  <text x="260" y="250" font-size="13">+45.0 pC</text>

  <!-- Bee diameter -->
  <line x1="220" y1="220" x2="380" y2="220" stroke="blue" stroke-width="2"/>
  <text x="270" y="210" font-size="11" fill="blue">diameter</text>
  <line x1="220" y1="210" x2="220" y2="230" stroke="blue" stroke-width="2"/>
  <line x1="380" y1="210" x2="380" y2="230" stroke="blue" stroke-width="2"/>
  <text x="260" y="195" font-size="12" font-weight="bold" fill="blue">1.000 cm</text>

  <!-- Pollen grain (small sphere on surface) -->
  <circle cx="380" cy="220" r="8" fill="#DEB887" stroke="black" stroke-width="2"/>
  <text x="395" y="225" font-size="12" font-weight="bold">Pollen</text>

  <!-- Zoom inset for pollen -->
  <rect x="420" y="150" width="150" height="140" fill="white" stroke="black" stroke-width="2"/>
  <text x="450" y="170" font-size="12" font-weight="bold">Pollen (zoom):</text>

  <!-- Zoomed pollen grain -->
  <circle cx="495" cy="230" r="25" fill="#DEB887" stroke="black" stroke-width="2"/>

  <!-- Near side (-1.00 pC) -->
  <circle cx="470" cy="230" r="5" fill="lightblue"/>
  <text x="440" y="235" font-size="10">−1.00 pC</text>
  <text x="435" y="248" font-size="9">(near bee)</text>

  <!-- Far side (+1.00 pC) -->
  <circle cx="520" cy="230" r="5" fill="lightcoral"/>
  <text x="527" y="235" font-size="10">+1.00 pC</text>
  <text x="527" y="248" font-size="9">(far side)</text>

  <!-- Pollen diameter -->
  <text x="460" y="275" font-size="10">diameter = 40.0 μm</text>

  <!-- Electric force arrows -->
  <line x1="380" y1="180" x2="380" y2="150" stroke="red" stroke-width="2" marker-end="url(#arrow16)"/>
  <text x="385" y="165" font-size="11" fill="red">F (attraction)</text>

  <line x1="380" y1="260" x2="380" y2="290" stroke="red" stroke-width="2" marker-end="url(#arrow16)"/>

  <!-- Data box -->
  <rect x="50" y="330" width="500" height="105" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="60" y="350" font-size="12" font-weight="bold">Model:</text>
  <text x="60" y="368" font-size="11">• Bee: sphere with diameter 1.000 cm, uniform charge +45.0 pC on surface</text>
  <text x="60" y="385" font-size="11">• Pollen: sphere with diameter 40.0 μm on bee's surface</text>
  <text x="60" y="402" font-size="11">• Bee's charge induces: −1.00 pC on near side, +1.00 pC on far side of pollen</text>
  <text x="60" y="420" font-size="11" font-weight="bold">Find: Electric force holding pollen grain on bee</text>

  <!-- Note -->
  <text x="50" y="315" font-size="10" fill="gray">Note: Pollen held by induced charge separation (polarization)</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow16" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
  </defs>
</svg>'''

def create_q15_quarter_disk():
    """Q15: Quarter disk with charge"""
    return '''<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Uniformly Charged Quarter Disk</text>
  <text x="140" y="45" font-size="12">R = 64.0 cm, σ = 7.73 fC/m², find V at P</text>

  <!-- 3D perspective view -->
  <!-- XY plane (quarter disk) -->
  <path d="M 200,280 L 200,100 A 180,180 0 0,1 380,280 Z"
        fill="#87CEEB" stroke="black" stroke-width="3" opacity="0.7"/>

  <!-- Coordinate axes -->
  <line x1="200" y1="280" x2="450" y2="280" stroke="black" stroke-width="2"/>
  <line x1="200" y1="280" x2="200" y2="80" stroke="black" stroke-width="2"/>
  <line x1="200" y1="280" x2="150" y2="350" stroke="black" stroke-width="2"/>

  <polygon points="450,280 445,275 445,285" fill="black"/>
  <polygon points="200,80 195,85 205,85" fill="black"/>
  <polygon points="150,350 155,345 145,345" fill="black"/>

  <text x="460" y="285" font-size="14" font-weight="bold">x</text>
  <text x="190" y="70" font-size="14" font-weight="bold">y</text>
  <text x="135" y="365" font-size="14" font-weight="bold">z</text>

  <!-- Origin O -->
  <circle cx="200" cy="280" r="4" fill="black"/>
  <text x="175" y="300" font-size="12" font-weight="bold">O</text>

  <!-- Radius R -->
  <line x1="200" y1="280" x2="380" y2="280" stroke="red" stroke-width="2"/>
  <text x="270" y="270" font-size="12" font-weight="bold" fill="red">R = 64.0 cm</text>

  <!-- Point P on z-axis -->
  <circle cx="170" cy="330" r="6" fill="blue" stroke="darkblue" stroke-width="2"/>
  <text x="145" y="335" font-size="14" font-weight="bold" fill="blue">P</text>

  <!-- Distance D -->
  <line x1="200" y1="280" x2="170" y2="330" stroke="blue" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="175" y="310" font-size="12" font-weight="bold" fill="blue">D = 25.9 cm</text>

  <!-- Charge notation on disk -->
  <text x="260" y="200" font-size="13" font-weight="bold">σ = 7.73 fC/m²</text>
  <text x="250" y="220" font-size="11">(uniform surface</text>
  <text x="260" y="235" font-size="11">charge density)</text>

  <!-- Shading/hatching to show it's only a quarter -->
  <text x="210" y="265" font-size="10" fill="gray">Only 1 quadrant</text>
  <text x="210" y="280" font-size="10" fill="gray">(3 quadrants</text>
  <text x="210" y="295" font-size="10" fill="gray">removed)</text>

  <!-- Original full disk (dashed outline) -->
  <circle cx="200" cy="280" r="180" fill="none" stroke="gray" stroke-width="1" stroke-dasharray="5,3"/>
  <text x="330" y="350" font-size="10" fill="gray">Original disk</text>
  <text x="340" y="365" font-size="10" fill="gray">(dashed)</text>

  <!-- Data box -->
  <rect x="30" y="380" width="540" height="60" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="400" font-size="12" font-weight="bold">Given:</text>
  <text x="40" y="418" font-size="11">• Quarter disk: R = 64.0 cm, surface charge density σ = 7.73 fC/m²</text>
  <text x="40" y="433" font-size="11">• Point P on central axis (perpendicular to disk) at D = 25.9 cm from center</text>
  <text x="350" y="400" font-size="11" font-weight="bold">Find: V at P (V=0 at ∞)</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow17" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="blue"/>
    </marker>
  </defs>
</svg>'''

def create_q16_work_charges_angles():
    """Q16: Similar to Q10 but with angles"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="160" y="25" font-size="15" font-weight="bold">Work to Bring Charge Q to Point P (with angles)</text>

  <!-- Fixed charges -->
  <!-- Charge q1 -->
  <circle cx="250" cy="250" r="18" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="240" y="258" font-size="14" font-weight="bold">+q₁</text>
  <text x="225" y="280" font-size="12">q₁ = +4e</text>

  <!-- Charge q2 -->
  <circle cx="450" cy="300" r="18" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="440" y="308" font-size="14" font-weight="bold">−q₂</text>
  <text x="425" y="330" font-size="12">q₂ = -2e</text>

  <!-- Point P -->
  <circle cx="320" cy="170" r="8" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="330" y="175" font-size="14" font-weight="bold">P</text>

  <!-- Distance from q1 to P with angle θ1 -->
  <line x1="250" y1="250" x2="320" y2="170" stroke="green" stroke-width="2"/>
  <text x="260" y="205" font-size="12" font-weight="bold" fill="green">d = 1.40 cm</text>

  <!-- Angle θ1 -->
  <path d="M 280,250 Q 285,230 300,220" fill="none" stroke="green" stroke-width="2"/>
  <text x="295" y="240" font-size="12" font-weight="bold" fill="green">θ₁=43°</text>

  <!-- Distance from q2 to P with angle θ2 -->
  <line x1="450" y1="300" x2="320" y2="170" stroke="blue" stroke-width="2"/>
  <text x="370" y="250" font-size="12" font-weight="bold" fill="blue">2.00d = 2.80 cm</text>

  <!-- Angle θ2 -->
  <path d="M 420,300 Q 400,270 380,240" fill="none" stroke="blue" stroke-width="2"/>
  <text x="400" y="285" font-size="12" font-weight="bold" fill="blue">θ₂=60°</text>

  <!-- Charge Q coming from infinity -->
  <circle cx="520" cy="80" r="15" fill="gold" stroke="black" stroke-width="2"/>
  <text x="512" y="87" font-size="13" font-weight="bold">Q</text>
  <text x="490" y="110" font-size="11">Q = +16e</text>

  <!-- Dashed path from infinity -->
  <line x1="520" y1="80" x2="420" y2="110" stroke="purple" stroke-width="2" stroke-dasharray="8,4" marker-end="url(#arrow18)"/>
  <line x1="420" y1="110" x2="320" y2="170" stroke="purple" stroke-width="2" stroke-dasharray="8,4" marker-end="url(#arrow18)"/>
  <text x="430" y="95" font-size="11" fill="purple">From ∞</text>

  <!-- Infinity symbol -->
  <text x="540" y="65" font-size="20" font-weight="bold">∞</text>

  <!-- Work annotation -->
  <text x="350" y="150" font-size="12" fill="purple" font-weight="bold">W = ?</text>

  <!-- Reference axes for angles -->
  <line x1="250" y1="250" x2="350" y2="250" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="450" y1="300" x2="350" y2="300" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>

  <!-- Data box -->
  <rect x="30" y="350" width="590" height="90" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="370" font-size="12" font-weight="bold">Given:</text>
  <text x="40" y="388" font-size="11">• Fixed charges: q₁ = +4e at origin, q₂ = -2e at second position</text>
  <text x="40" y="404" font-size="11">• Point P: distance d = 1.40 cm from q₁ at angle θ₁ = 43°</text>
  <text x="40" y="420" font-size="11">                distance 2.00d = 2.80 cm from q₂ at angle θ₂ = 60°</text>
  <text x="350" y="370" font-size="11" font-weight="bold">Find:</text>
  <text x="350" y="388" font-size="11">Work to bring Q = +16e</text>
  <text x="350" y="404" font-size="11">from infinity to P</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow18" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q17_energy_graph():
    """Q17: Three charged particles - potential energy vs position (duplicate of Q8)"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Three-Particle System: Potential Energy U(x)</text>

  <!-- Particle configuration diagram (top) -->
  <text x="50" y="55" font-size="12" font-weight="bold">Particle Configuration:</text>

  <!-- X-axis for particles -->
  <line x1="50" y1="100" x2="600" y2="100" stroke="black" stroke-width="2"/>
  <polygon points="600,100 595,95 595,105" fill="black"/>
  <text x="605" y="105" font-size="13">x</text>

  <!-- Particle 1 (fixed) -->
  <circle cx="150" cy="100" r="12" fill="red" stroke="black" stroke-width="2"/>
  <text x="145" y="105" font-size="11" font-weight="bold" fill="white">1</text>
  <text x="130" y="130" font-size="12">q₁ = +5.0 μC</text>
  <text x="140" y="145" font-size="11">(fixed)</text>
  <line x1="150" y1="112" x2="150" y2="125" stroke="black" stroke-width="1"/>
  <text x="145" y="85" font-size="11">x = 0</text>

  <!-- Particle 2 (fixed) -->
  <circle cx="350" cy="100" r="12" fill="blue" stroke="black" stroke-width="2"/>
  <text x="345" y="105" font-size="11" font-weight="bold" fill="white">2</text>
  <text x="325" y="130" font-size="12">q₂ = -3.0 μC</text>
  <text x="340" y="145" font-size="11">(fixed)</text>
  <line x1="350" y1="112" x2="350" y2="125" stroke="black" stroke-width="1"/>
  <text x="338" y="85" font-size="11">x = d</text>

  <!-- Distance d -->
  <line x1="150" y1="75" x2="350" y2="75" stroke="red" stroke-width="2"/>
  <text x="230" y="70" font-size="12" font-weight="bold" fill="red">d = 4.0 cm</text>

  <!-- Particle 3 (movable) -->
  <circle cx="500" cy="100" r="12" fill="green" stroke="black" stroke-width="2"/>
  <text x="495" y="105" font-size="11" font-weight="bold" fill="white">3</text>
  <text x="480" y="130" font-size="12">q₃ = ?</text>
  <text x="475" y="145" font-size="11">(movable)</text>
  <line x1="500" y1="112" x2="500" y2="125" stroke="black" stroke-width="1"/>
  <text x="495" y="85" font-size="11">x</text>

  <!-- Graph of U vs x -->
  <text x="50" y="180" font-size="12" font-weight="bold">Potential Energy U vs Position x:</text>

  <!-- Graph axes -->
  <line x1="80" y1="380" x2="580" y2="380" stroke="black" stroke-width="2"/>
  <line x1="80" y1="380" x2="80" y2="210" stroke="black" stroke-width="2"/>
  <polygon points="580,380 575,375 575,385" fill="black"/>
  <polygon points="80,210 75,215 85,215" fill="black"/>

  <!-- X-axis labels -->
  <text x="70" y="395" font-size="11">0</text>
  <line x1="150" y1="380" x2="150" y2="385" stroke="black" stroke-width="2"/>
  <text x="145" y="400" font-size="11">d</text>
  <line x1="350" y1="380" x2="350" y2="385" stroke="black" stroke-width="2"/>
  <text x="342" y="400" font-size="11">2d</text>
  <text x="315" y="418" font-size="13" font-weight="bold">x (position of particle 3)</text>

  <!-- Y-axis labels -->
  <text x="50" y="385" font-size="11">0</text>
  <text x="40" y="330" font-size="11">Uₛ</text>
  <line x1="75" y1="325" x2="80" y2="325" stroke="black" stroke-width="2"/>
  <text x="50" y="325" font-size="10" fill="blue">5.0 J</text>

  <!-- Energy curve -->
  <path d="M 80,380 Q 100,350 150,310 Q 200,280 250,325 Q 300,360 350,340 Q 400,320 450,300 Q 500,285 550,275"
        fill="none" stroke="purple" stroke-width="3"/>

  <!-- Mark the scale point -->
  <line x1="75" y1="325" x2="585" y2="325" stroke="blue" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="500" y="320" font-size="10" fill="blue">Uₛ = 5.0 J</text>

  <!-- Question box -->
  <rect x="50" y="425" width="550" height="20" fill="#FFF9E6" stroke="black" stroke-width="1"/>
  <text x="60" y="439" font-size="11" font-weight="bold">Determine: charge q₃ of particle 3</text>
</svg>'''

def create_q18_square_four_charges():
    """Q18: Four charges in square arrangement"""
    return '''<svg width="600" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="140" y="25" font-size="15" font-weight="bold">Four Charges in Square: Force on Particle 3</text>
  <text x="220" y="45" font-size="12">a = 5.0 cm</text>

  <!-- Square -->
  <rect x="200" y="150" width="200" height="200" fill="none" stroke="black" stroke-width="3"/>

  <!-- Particle 1 (bottom-left): -q2 = -100 nC -->
  <circle cx="200" cy="350" r="20" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="188" y="358" font-size="14" font-weight="bold">1</text>
  <text x="160" y="380" font-size="12">q₁ = -100 nC</text>
  <text x="150" y="395" font-size="11">(bottom-left)</text>

  <!-- Particle 2 (top-left): +q2 = +100 nC -->
  <circle cx="200" cy="150" r="20" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="188" y="158" font-size="14" font-weight="bold">2</text>
  <text x="160" y="130" font-size="12">q₂ = +100 nC</text>
  <text x="165" y="115" font-size="11">(top-left)</text>

  <!-- Particle 3 (bottom-right): -q4 = -200 nC -->
  <circle cx="400" cy="350" r="20" fill="yellow" stroke="black" stroke-width="3"/>
  <text x="388" y="358" font-size="14" font-weight="bold">3</text>
  <text x="420" y="380" font-size="12">q₃ = -200 nC</text>
  <text x="410" y="395" font-size="11">(bottom-right)</text>

  <!-- Particle 4 (top-right): +q4 = +200 nC -->
  <circle cx="400" cy="150" r="20" fill="lightgreen" stroke="black" stroke-width="2"/>
  <text x="388" y="158" font-size="14" font-weight="bold">4</text>
  <text x="420" y="130" font-size="12">q₄ = +200 nC</text>
  <text x="415" y="115" font-size="11">(top-right)</text>

  <!-- Force vectors on particle 3 -->
  <!-- F31: from 1 to 3 (horizontal) -->
  <line x1="220" y1="350" x2="360" y2="350" stroke="red" stroke-width="3" marker-end="url(#arrow19)"/>
  <text x="270" y="340" font-size="12" fill="red" font-weight="bold">F₃₁</text>

  <!-- F32: from 2 to 3 (diagonal) -->
  <line x1="220" y1="170" x2="340" y2="310" stroke="blue" stroke-width="3" marker-end="url(#arrow20)"/>
  <text x="260" y="230" font-size="12" fill="blue" font-weight="bold">F₃₂</text>

  <!-- F34: from 4 to 3 (vertical) -->
  <line x1="400" y1="170" x2="400" y2="310" stroke="green" stroke-width="3" marker-end="url(#arrow21)"/>
  <text x="410" y="240" font-size="12" fill="green" font-weight="bold">F₃₄</text>

  <!-- Net force (resultant) -->
  <line x1="400" y1="350" x2="480" y2="290" stroke="purple" stroke-width="4" marker-end="url(#arrow22)"/>
  <text x="440" y="315" font-size="13" fill="purple" font-weight="bold">F⃗_net</text>

  <!-- Side length a -->
  <line x1="200" y1="380" x2="400" y2="380" stroke="black" stroke-width="2" marker-start="url(#arrow23)" marker-end="url(#arrow23)"/>
  <text x="280" y="400" font-size="13" font-weight="bold">a = 5.0 cm</text>

  <!-- Coordinate axes -->
  <line x1="480" y1="420" x2="550" y2="420" stroke="black" stroke-width="2"/>
  <line x1="480" y1="420" x2="480" y2="350" stroke="black" stroke-width="2"/>
  <polygon points="550,420 545,415 545,425" fill="black"/>
  <polygon points="480,350 475,355 485,355" fill="black"/>
  <text x="555" y="425" font-size="13" font-weight="bold">x</text>
  <text x="470" y="345" font-size="13" font-weight="bold">y</text>

  <!-- Question box -->
  <rect x="30" y="430" width="540" height="60" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="450" font-size="12" font-weight="bold">Find:</text>
  <text x="40" y="468" font-size="11">(a) x-component of net electrostatic force on particle 3</text>
  <text x="40" y="483" font-size="11">(b) y-component of net electrostatic force on particle 3</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow19" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow20" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="blue"/>
    </marker>
    <marker id="arrow21" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow22" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
      <polygon points="0,0 12,3 0,6" fill="purple"/>
    </marker>
    <marker id="arrow23" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="black"/>
    </marker>
  </defs>
</svg>'''

def create_q19_spherical_cavity():
    """Q19: Solid sphere with spherical cavity"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="140" y="25" font-size="15" font-weight="bold">Charged Sphere with Spherical Cavity (Superposition)</text>

  <!-- Main sphere (solid) -->
  <circle cx="280" cy="240" r="120" fill="#87CEEB" stroke="black" stroke-width="3" opacity="0.6"/>
  <text x="240" y="200" font-size="13" font-weight="bold">Uniform ρ</text>

  <!-- Center of main sphere -->
  <circle cx="280" cy="240" r="4" fill="black"/>
  <text x="285" y="260" font-size="12" font-weight="bold">O</text>

  <!-- Cavity (removed volume) -->
  <circle cx="340" cy="200" r="60" fill="white" stroke="black" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="320" y="205" font-size="11">Cavity</text>

  <!-- Center of cavity -->
  <circle cx="340" cy="200" r="3" fill="red"/>
  <text x="345" y="195" font-size="11" fill="red">C</text>

  <!-- General point P inside sphere -->
  <circle cx="320" cy="260" r="5" fill="green" stroke="darkgreen" stroke-width="2"/>
  <text x="325" y="265" font-size="13" font-weight="bold" fill="green">P</text>

  <!-- Vector from O to P -->
  <line x1="280" y1="240" x2="320" y2="260" stroke="blue" stroke-width="2" marker-end="url(#arrow24)"/>
  <text x="285" y="255" font-size="11" fill="blue" font-weight="bold">r⃗</text>

  <!-- Vector from C to P -->
  <line x1="340" y1="200" x2="320" y2="260" stroke="red" stroke-width="2" marker-end="url(#arrow25)"/>
  <text x="325" y="225" font-size="11" fill="red" font-weight="bold">r⃗'</text>

  <!-- Part (a) explanation box -->
  <rect x="420" y="80" width="210" height="120" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="430" y="100" font-size="12" font-weight="bold">Part (a): Show that</text>
  <text x="430" y="120" font-size="11">E⃗(P) = ρr⃗/(3ε₀)</text>
  <text x="430" y="140" font-size="10">for point P inside</text>
  <text x="430" y="155" font-size="10">uniform sphere</text>
  <text x="430" y="175" font-size="10">(no cavity case)</text>
  <text x="430" y="192" font-size="9" fill="gray">Result independent</text>
  <text x="430" y="204" font-size="9" fill="gray">of sphere radius!</text>

  <!-- Part (b) explanation box -->
  <rect x="420" y="210" width="210" height="140" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="430" y="230" font-size="12" font-weight="bold">Part (b): Use superposition</text>
  <text x="430" y="250" font-size="10">Cavity = Full sphere +</text>
  <text x="430" y="265" font-size="10">     (negative density</text>
  <text x="430" y="280" font-size="10">      sphere in cavity)</text>
  <text x="430" y="300" font-size="10">Show: E⃗ in cavity is</text>
  <text x="430" y="315" font-size="10">uniform and equals</text>
  <text x="430" y="332" font-size="11" font-weight="bold">E⃗ = ρa⃗/(3ε₀)</text>
  <text x="430" y="347" font-size="9">where a⃗ = O→C vector</text>

  <!-- Superposition diagram (bottom) -->
  <text x="50" y="390" font-size="12" font-weight="bold">Superposition Method:</text>

  <!-- Full sphere -->
  <circle cx="90" cy="420" r="30" fill="#87CEEB" stroke="black" stroke-width="2"/>
  <text x="80" y="425" font-size="10">+ρ</text>

  <!-- Equals sign -->
  <text x="130" y="425" font-size="16">=</text>

  <!-- Sphere with cavity -->
  <circle cx="200" cy="420" r="30" fill="#87CEEB" stroke="black" stroke-width="2"/>
  <circle cx="215" cy="410" r="15" fill="white" stroke="black" stroke-width="1"/>
  <text x="190" y="425" font-size="10">+ρ</text>

  <!-- Plus sign -->
  <text x="240" y="425" font-size="16">+</text>

  <!-- Negative sphere in cavity region -->
  <circle cx="290" cy="420" r="15" fill="#FFB6C1" stroke="black" stroke-width="2"/>
  <text x="282" y="425" font-size="10">−ρ</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow24" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="blue"/>
    </marker>
    <marker id="arrow25" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
  </defs>
</svg>'''

def create_q20_carnot_system():
    """Q20: Carnot engine driving Carnot refrigerator"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="160" y="25" font-size="15" font-weight="bold">Carnot Engine Driving Carnot Refrigerator</text>

  <!-- Hot reservoir for engine -->
  <rect x="80" y="80" width="150" height="60" fill="#FF6B6B" stroke="black" stroke-width="2"/>
  <text x="100" y="105" font-size="13" font-weight="bold">Hot Reservoir</text>
  <text x="115" y="125" font-size="14" font-weight="bold">T₁ = 400 K</text>

  <!-- Carnot Engine -->
  <rect x="100" y="180" width="110" height="100" fill="#87CEEB" stroke="black" stroke-width="3"/>
  <text x="120" y="210" font-size="14" font-weight="bold">Carnot</text>
  <text x="120" y="230" font-size="14" font-weight="bold">Engine</text>
  <text x="105" y="255" font-size="11">η = 1 - T₂/T₁</text>

  <!-- Heat Q1 in -->
  <line x1="155" y1="140" x2="155" y2="180" stroke="red" stroke-width="3" marker-end="url(#arrow26)"/>
  <text x="165" y="165" font-size="12" font-weight="bold" fill="red">Q₁</text>

  <!-- Cold reservoir for engine -->
  <rect x="80" y="320" width="150" height="60" fill="#6BB6FF" stroke="black" stroke-width="2"/>
  <text x="95" y="345" font-size="13" font-weight="bold">Cold Reservoir</text>
  <text x="115" y="365" font-size="14" font-weight="bold">T₂ = 150 K</text>

  <!-- Heat Q2 out -->
  <line x1="155" y1="280" x2="155" y2="320" stroke="blue" stroke-width="3" marker-end="url(#arrow27)"/>
  <text x="165" y="305" font-size="12" font-weight="bold" fill="blue">Q₂</text>

  <!-- Work W transferred -->
  <line x1="210" y1="230" x2="320" y2="230" stroke="green" stroke-width="4" marker-end="url(#arrow28)"/>
  <text x="240" y="220" font-size="13" font-weight="bold" fill="green">Work W</text>
  <text x="235" y="250" font-size="11" fill="green">Transfer</text>

  <!-- Carnot Refrigerator -->
  <rect x="330" y="180" width="120" height="100" fill="#98FB98" stroke="black" stroke-width="3"/>
  <text x="350" y="210" font-size="14" font-weight="bold">Carnot</text>
  <text x="330" y="230" font-size="14" font-weight="bold">Refrigerator</text>
  <text x="335" y="255" font-size="11">K = T₃/(T₃-T₄)</text>

  <!-- Hot reservoir for refrigerator -->
  <rect x="320" y="80" width="150" height="60" fill="#FFB347" stroke="black" stroke-width="2"/>
  <text x="340" y="105" font-size="13" font-weight="bold">Hot Reservoir</text>
  <text x="355" y="125" font-size="14" font-weight="bold">T₃ = 325 K</text>

  <!-- Heat Q3 out -->
  <line x1="390" y1="180" x2="390" y2="140" stroke="orange" stroke-width="3" marker-end="url(#arrow29)"/>
  <text x="400" y="165" font-size="12" font-weight="bold" fill="orange">Q₃</text>

  <!-- Cold reservoir for refrigerator -->
  <rect x="320" y="320" width="150" height="60" fill="#ADD8E6" stroke="black" stroke-width="2"/>
  <text x="335" y="345" font-size="13" font-weight="bold">Cold Reservoir</text>
  <text x="355" y="365" font-size="14" font-weight="bold">T₄ = 225 K</text>

  <!-- Heat Q4 in -->
  <line x1="390" y1="320" x2="390" y2="280" stroke="cyan" stroke-width="3" marker-end="url(#arrow30)"/>
  <text x="400" y="305" font-size="12" font-weight="bold" fill="cyan">Q₄</text>

  <!-- Question box -->
  <rect x="30" y="410" width="590" height="75" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="430" font-size="12" font-weight="bold">System:</text>
  <text x="40" y="448" font-size="11">• Engine absorbs Q₁ from T₁, rejects Q₂ to T₂, produces work W</text>
  <text x="40" y="464" font-size="11">• W drives refrigerator: removes Q₄ from T₄, rejects Q₃ to T₃</text>
  <text x="40" y="480" font-size="11" font-weight="bold">Find: Ratio Q₃/Q₁ = ?</text>

  <!-- Efficiency formulas -->
  <rect x="500" y="180" width="140" height="100" fill="#E6F3FF" stroke="black" stroke-width="1.5"/>
  <text x="510" y="200" font-size="11" font-weight="bold">Engine:</text>
  <text x="510" y="216" font-size="10">η = W/Q₁</text>
  <text x="510" y="230" font-size="10">η = 1 - T₂/T₁</text>
  <text x="510" y="250" font-size="11" font-weight="bold">Refrigerator:</text>
  <text x="510" y="266" font-size="10">K = Q₄/W</text>
  <text x="510" y="280" font-size="10">K = T₄/(T₃-T₄)</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow26" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow27" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="blue"/>
    </marker>
    <marker id="arrow28" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
      <polygon points="0,0 12,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow29" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="orange"/>
    </marker>
    <marker id="arrow30" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="cyan"/>
    </marker>
  </defs>
</svg>'''


# Main execution
def main():
    print("Generating detailed SVG figures for questions 11-20...")

    with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    questions = soup.find_all('div', class_='question-card')

    # Map of SVG generators
    svg_generators = {
        11: create_q11_rectangular_array,
        12: create_q12_dipole_electron,
        13: create_q13_electron_proton_plates,
        14: create_q14_bee_pollen,
        15: create_q15_quarter_disk,
        16: create_q16_work_charges_angles,
        17: create_q17_energy_graph,
        18: create_q18_square_four_charges,
        19: create_q19_spherical_cavity,
        20: create_q20_carnot_system,
    }

    count = 0
    for i in range(11, 21):
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

    print(f"\n✅ Successfully added {count} detailed SVG figures (Q11-Q20)")
    print("Saved to problematic_physics_questions.html")

if __name__ == "__main__":
    main()
