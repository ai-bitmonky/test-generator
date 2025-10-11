#!/usr/bin/env python3
"""
Generate detailed SVG figures for questions 41-50 in problematic_physics_questions.html
Mixed problems: projectile motion, gravitation, mechanics
"""

from bs4 import BeautifulSoup

def create_q41_quadrupole_duplicate():
    """Q41: Same as Q36"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="180" y="25" font-size="15" font-weight="bold">Electric Quadrupole</text>
  <text x="190" y="45" font-size="12">Two dipoles with opposite moments</text>

  <!-- Z-axis -->
  <line x1="325" y1="80" x2="325" y2="420" stroke="black" stroke-width="2"/>
  <polygon points="325,80 320,85 330,85" fill="black"/>
  <text x="335" y="75" font-size="14" font-weight="bold">z</text>

  <!-- Center of quadrupole -->
  <circle cx="325" cy="250" r="6" fill="gray" stroke="black" stroke-width="2"/>
  <text x="335" y="255" font-size="12" font-weight="bold">Center</text>

  <!-- Upper charge -->
  <circle cx="325" cy="170" r="12" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="318" y="177" font-size="13" font-weight="bold">+q</text>

  <!-- Middle charge -->
  <circle cx="325" cy="250" r="12" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="315" y="257" font-size="13" font-weight="bold">−2q</text>

  <!-- Lower charge -->
  <circle cx="325" cy="330" r="12" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="318" y="337" font-size="13" font-weight="bold">+q</text>

  <!-- Point P -->
  <circle cx="325" cy="390" r="8" fill="green" stroke="darkgreen" stroke-width="2"/>
  <text x="335" y="395" font-size="13" font-weight="bold" fill="green">P</text>

  <!-- Formula box -->
  <rect x="380" y="150" width="250" height="180" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="390" y="175" font-size="12" font-weight="bold">Show that:</text>
  <text x="390" y="200" font-size="13">E = 3Q/(4πε₀z⁴)</text>
  <text x="390" y="225" font-size="11">at point P, distance z >> d</text>
  <text x="390" y="250" font-size="11">where</text>
  <text x="390" y="270" font-size="12" font-weight="bold">Q = 2qd²</text>
  <text x="390" y="290" font-size="11">is the quadrupole moment</text>
  <text x="390" y="315" font-size="10" fill="gray">Field: E ∝ 1/z⁴</text>

  <!-- Data box -->
  <rect x="30" y="420" width="590" height="70" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="445" font-size="12" font-weight="bold">Electric Quadrupole:</text>
  <text x="40" y="463" font-size="11">• Two dipoles with equal magnitudes but opposite directions</text>
  <text x="40" y="479" font-size="11" font-weight="bold">• Prove: E = 3Q/(4πε₀z⁴) where Q = 2qd² (quadrupole moment)</text>
</svg>'''

def create_q42_projectile_graph():
    """Q42: Ball projectile - vy vs x graph"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="140" y="25" font-size="15" font-weight="bold">Projectile Motion: v_y Component vs Horizontal Distance</text>

  <!-- Graph axes -->
  <line x1="80" y1="250" x2="580" y2="250" stroke="black" stroke-width="2"/>
  <line x1="80" y1="400" x2="80" y2="100" stroke="black" stroke-width="2"/>
  <polygon points="580,250 575,245 575,255" fill="black"/>
  <polygon points="80,100 75,105 85,105" fill="black"/>

  <!-- X-axis label -->
  <text x="300" y="280" font-size="15" font-weight="bold">x (m)</text>

  <!-- Y-axis label -->
  <text x="25" y="260" font-size="15" font-weight="bold" transform="rotate(-90 35 260)">v_y (m/s)</text>

  <!-- X-axis ticks and labels -->
  <text x="70" y="265" font-size="12">0</text>
  <line x1="80" y1="250" x2="80" y2="255" stroke="black" stroke-width="2"/>

  <line x1="280" y1="250" x2="280" y2="255" stroke="black" stroke-width="2"/>
  <text x="265" y="270" font-size="12">x_s</text>
  <text x="260" y="285" font-size="11" fill="blue">20 m</text>

  <line x1="480" y1="250" x2="480" y2="255" stroke="black" stroke-width="2"/>
  <text x="462" y="270" font-size="12">2x_s</text>
  <text x="460" y="285" font-size="11" fill="blue">40 m</text>

  <!-- Y-axis ticks and labels -->
  <line x1="75" y1="150" x2="80" y2="150" stroke="black" stroke-width="2"/>
  <text x="40" y="155" font-size="12">v_ys</text>
  <text x="35" y="170" font-size="11" fill="blue">5.0 m/s</text>

  <text x="60" y="255" font-size="12">0</text>

  <line x1="75" y1="350" x2="80" y2="350" stroke="black" stroke-width="2"/>
  <text x="35" y="355" font-size="12">−v_ys</text>
  <text x="30" y="370" font-size="11" fill="blue">−5.0 m/s</text>

  <!-- Linear graph: vy decreases linearly with x -->
  <!-- Starts at (0, vys), passes through (xs, 0), ends at (2xs, -vys) -->
  <line x1="80" y1="150" x2="280" y2="250" stroke="red" stroke-width="4"/>
  <line x1="280" y1="250" x2="480" y2="350" stroke="red" stroke-width="4"/>

  <!-- Key points -->
  <circle cx="80" cy="150" r="5" fill="green" stroke="black" stroke-width="2"/>
  <text x="90" y="145" font-size="11" fill="green" font-weight="bold">(0, v_ys)</text>

  <circle cx="280" cy="250" r="5" fill="blue" stroke="black" stroke-width="2"/>
  <text x="290" y="245" font-size="11" fill="blue" font-weight="bold">(x_s, 0)</text>

  <circle cx="480" cy="350" r="5" fill="red" stroke="black" stroke-width="2"/>
  <text x="490" y="345" font-size="11" fill="red" font-weight="bold">(2x_s, −v_ys)</text>

  <!-- Wall -->
  <rect x="500" y="100" width="20" height="300" fill="#8B4513" stroke="black" stroke-width="2"/>
  <text x="530" y="250" font-size="12" font-weight="bold">Wall</text>

  <!-- Trajectory diagram (small inset) -->
  <rect x="430" y="30" width="200" height="100" fill="white" stroke="black" stroke-width="2"/>
  <text x="470" y="50" font-size="11" font-weight="bold">Trajectory:</text>

  <!-- Ground -->
  <line x1="440" y1="120" x2="620" y2="120" stroke="black" stroke-width="2"/>

  <!-- Parabolic path -->
  <path d="M 445,115 Q 500,50 555,115"
        fill="none" stroke="blue" stroke-width="2"/>

  <!-- Launch point -->
  <circle cx="445" cy="115" r="3" fill="green"/>
  <text x="435" y="110" font-size="9">Launch</text>

  <!-- Apex -->
  <circle cx="500" cy="50" r="3" fill="blue"/>
  <text x="490" y="45" font-size="9">Top</text>

  <!-- Wall hit -->
  <circle cx="555" cy="115" r="3" fill="red"/>
  <text x="560" y="110" font-size="9">Wall</text>

  <!-- Data box -->
  <rect x="30" y="420" width="590" height="70" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="440" font-size="12" font-weight="bold">Setup:</text>
  <text x="40" y="458" font-size="11">• Ball shot from ground toward wall at distance x</text>
  <text x="40" y="474" font-size="11">• Graph shows v_y (vertical velocity component) vs x: v_ys = 5.0 m/s, x_s = 20 m</text>
  <text x="350" y="440" font-size="11" font-weight="bold">Find: Launch angle θ</text>
</svg>'''

def create_q43_projectile_duplicate():
    """Q43: Same as Q42"""
    return create_q42_projectile_graph()

def create_q44_semiinfinite_duplicate():
    """Q44: Same as Q33"""
    return '''<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="130" y="25" font-size="15" font-weight="bold">Semi-Infinite Rod: Electric Field at 45° Angle</text>
  <text x="190" y="45" font-size="12">Linear charge density λ</text>

  <!-- Coordinate axes -->
  <line x1="100" y1="280" x2="550" y2="280" stroke="black" stroke-width="2"/>
  <line x1="100" y1="280" x2="100" y2="80" stroke="black" stroke-width="2"/>
  <polygon points="550,280 545,275 545,285" fill="black"/>
  <polygon points="100,80 95,85 105,85" fill="black"/>
  <text x="560" y="285" font-size="14" font-weight="bold">x</text>
  <text x="90" y="70" font-size="14" font-weight="bold">y</text>

  <!-- Rod -->
  <line x1="100" y1="280" x2="540" y2="280" stroke="red" stroke-width="8"/>
  <polygon points="540,280 530,275 530,285" fill="red"/>
  <text x="300" y="300" font-size="13" font-weight="bold" fill="red">Rod (to +∞)</text>

  <!-- Point P -->
  <circle cx="100" cy="160" r="8" fill="blue" stroke="darkblue" stroke-width="2"/>
  <text x="110" y="165" font-size="14" font-weight="bold" fill="blue">P</text>

  <!-- Distance R -->
  <line x1="100" y1="280" x2="100" y2="160" stroke="blue" stroke-width="2"/>
  <text x="60" y="225" font-size="13" font-weight="bold" fill="blue">R</text>

  <!-- E components -->
  <line x1="100" y1="160" x2="180" y2="160" stroke="green" stroke-width="4" marker-end="url(#arrow50)"/>
  <text x="140" y="150" font-size="13" fill="green" font-weight="bold">E∥</text>

  <line x1="100" y1="160" x2="100" y2="100" stroke="orange" stroke-width="4" marker-end="url(#arrow51)"/>
  <text x="105" y="125" font-size="13" fill="orange" font-weight="bold">E⊥</text>

  <!-- Resultant -->
  <line x1="100" y1="160" x2="157" y2="103" stroke="purple" stroke-width="5" marker-end="url(#arrow52)"/>
  <text x="140" y="120" font-size="14" fill="purple" font-weight="bold">E⃗</text>

  <!-- Angle -->
  <path d="M 130,160 Q 135,150 140,145" fill="none" stroke="purple" stroke-width="2"/>
  <text x="145" y="155" font-size="13" font-weight="bold" fill="purple">45°</text>

  <!-- Result -->
  <rect x="300" y="90" width="270" height="170" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="310" y="115" font-size="13" font-weight="bold">Result to Prove:</text>
  <text x="310" y="138" font-size="12">E⃗ at P makes 45° with rod</text>
  <text x="310" y="160" font-size="11">|E∥| = |E⊥|</text>
  <text x="310" y="185" font-size="11">E∥ = λ/(4πε₀R)</text>
  <text x="310" y="205" font-size="11">E⊥ = λ/(4πε₀R)</text>
  <text x="310" y="230" font-size="10" font-weight="bold">Independent of R!</text>
  <text x="310" y="250" font-size="10" fill="gray">tan(θ) = E⊥/E∥ = 1</text>

  <!-- Hint -->
  <rect x="30" y="360" width="540" height="75" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="380" font-size="12" font-weight="bold">Hint:</text>
  <text x="40" y="398" font-size="11">Find E parallel and E perpendicular separately using integration</text>
  <text x="40" y="414" font-size="11">dE from element dx at distance √(x²+R²) from P</text>
  <text x="40" y="428" font-size="11">Show E⊥/E∥ = 1, therefore θ = 45°</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow50" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow51" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="orange"/>
    </marker>
    <marker id="arrow52" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
      <polygon points="0,0 12,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q45_particle_potential_energy():
    """Q45: Particle A moving along y-axis between two fixed masses"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="110" y="25" font-size="15" font-weight="bold">Gravitational Potential Energy: Particle Between Two Masses</text>

  <!-- Part (a): Configuration diagram -->
  <text x="50" y="60" font-size="13" font-weight="bold" fill="blue">Part (a): Configuration</text>

  <!-- Y-axis -->
  <line x1="150" y1="350" x2="150" y2="100" stroke="black" stroke-width="2"/>
  <polygon points="150,100 145,105 155,105" fill="black"/>
  <text x="140" y="90" font-size="14" font-weight="bold">y</text>

  <!-- Particle B (left) -->
  <circle cx="80" cy="250" r="15" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="72" y="257" font-size="13" font-weight="bold">B</text>
  <text x="65" y="280" font-size="11">mass m_B</text>

  <!-- Particle C (right) -->
  <circle cx="220" cy="250" r="15" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="212" y="257" font-size="13" font-weight="bold">C</text>
  <text x="205" y="280" font-size="11">mass m_C</text>

  <!-- Distance D between B and C -->
  <line x1="80" y1="230" x2="220" y2="230" stroke="green" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="135" y="220" font-size="12" font-weight="bold" fill="green">D</text>
  <text x="120" y="210" font-size="11" fill="green">D = 0.3057 m</text>

  <!-- Midpoint at origin -->
  <circle cx="150" cy="250" r="4" fill="black"/>
  <text x="155" y="245" font-size="11">O (origin)</text>
  <text x="155" y="260" font-size="11">y = 0</text>

  <!-- Particle A (movable on y-axis) -->
  <circle cx="150" cy="180" r="12" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="144" y="187" font-size="13" font-weight="bold">A</text>
  <text x="165" y="185" font-size="11">mass m_A</text>
  <text x="165" y="200" font-size="11">(movable)</text>

  <!-- Distance y -->
  <line x1="135" y1="250" x2="135" y2="180" stroke="blue" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="115" y="220" font-size="12" font-weight="bold" fill="blue">y</text>

  <!-- Infinity symbol -->
  <text x="150" y="130" font-size="20">∞</text>
  <line x1="150" y1="135" x2="150" y2="155" stroke="gray" stroke-width="2" stroke-dasharray="5,3"/>

  <!-- Part (b): Potential energy graph -->
  <text x="320" y="60" font-size="13" font-weight="bold" fill="green">Part (b): U vs y graph</text>

  <!-- Graph axes -->
  <line x1="350" y1="320" x2="600" y2="320" stroke="black" stroke-width="2"/>
  <line x1="350" y1="320" x2="350" y2="120" stroke="black" stroke-width="2"/>
  <polygon points="600,320 595,315 595,325" fill="black"/>
  <polygon points="350,120 345,125 355,125" fill="black"/>

  <!-- Axes labels -->
  <text x="460" y="345" font-size="13" font-weight="bold">y position</text>
  <text x="310" y="230" font-size="13" font-weight="bold" transform="rotate(-90 320 230)">U (potential energy)</text>

  <!-- Y-axis origin -->
  <text x="330" y="325" font-size="11">0</text>
  <line x1="350" y1="320" x2="355" y2="320" stroke="black" stroke-width="2"/>

  <!-- Potential energy curve (asymptotic at infinity, minimum near origin) -->
  <path d="M 350,200 Q 400,180 450,190 Q 500,200 550,220 Q 570,230 590,250"
        fill="none" stroke="red" stroke-width="3"/>

  <!-- Minimum point -->
  <circle cx="450" cy="190" r="4" fill="blue"/>
  <text x="455" y="185" font-size="10" fill="blue">U_min</text>

  <!-- Zero level -->
  <line x1="345" y1="200" x2="605" y2="200" stroke="gray" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="320" y="205" font-size="10">U=0</text>

  <!-- Data box -->
  <rect x="30" y="380" width="590" height="105" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="400" font-size="12" font-weight="bold">Setup:</text>
  <text x="40" y="418" font-size="11">• Particles B and C have identical masses, separated by distance D = 0.3057 m</text>
  <text x="40" y="434" font-size="11">• Origin at midpoint between B and C; y-axis is perpendicular bisector</text>
  <text x="40" y="450" font-size="11">• Particle A can move along y-axis from infinity to origin</text>
  <text x="40" y="470" font-size="11" font-weight="bold">Part (a): What is the magnitude of the gravitational force on A when A is at origin?</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow53" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="blue"/>
    </marker>
  </defs>
</svg>'''

def create_q46_three_spheres_work():
    """Q46: Three spheres on a line - work to move sphere B"""
    return '''<svg width="650" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Three Spheres: Work to Move Sphere B</text>

  <!-- Horizontal line -->
  <line x1="50" y1="200" x2="600" y2="200" stroke="black" stroke-width="2"/>
  <polygon points="600,200 595,195 595,205" fill="black"/>

  <!-- Initial configuration (top) -->
  <text x="50" y="60" font-size="13" font-weight="bold" fill="blue">Initial Configuration:</text>

  <!-- Sphere A -->
  <circle cx="120" cy="100" r="20" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="110" y="107" font-size="13" font-weight="bold">A</text>
  <text x="100" y="140" font-size="11">m_A = 80 g</text>

  <!-- Sphere B (initial position) -->
  <circle cx="300" cy="100" r="12" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="293" y="107" font-size="12" font-weight="bold">B</text>
  <text x="280" y="130" font-size="11">m_B = 10 g</text>

  <!-- Sphere C -->
  <circle cx="450" cy="100" r="16" fill="lightgreen" stroke="black" stroke-width="2"/>
  <text x="442" y="107" font-size="13" font-weight="bold">C</text>
  <text x="430" y="140" font-size="11">m_C = 20 g</text>

  <!-- Distance L between A and B -->
  <line x1="140" y1="85" x2="288" y2="85" stroke="blue" stroke-width="2"/>
  <text x="200" y="75" font-size="12" font-weight="bold" fill="blue">L = 12 cm</text>

  <!-- Distance d between B and C -->
  <line x1="312" y1="85" x2="434" y2="85" stroke="green" stroke-width="2"/>
  <text x="360" y="75" font-size="12" font-weight="bold" fill="green">d = ?</text>

  <!-- Arrow showing movement -->
  <line x1="300" y1="150" x2="370" y2="240" stroke="purple" stroke-width="3" marker-end="url(#arrow54)"/>
  <text x="320" y="200" font-size="12" fill="purple" font-weight="bold">Move B</text>

  <!-- Final configuration (bottom) -->
  <text x="50" y="270" font-size="13" font-weight="bold" fill="red">Final Configuration:</text>

  <!-- Sphere A (same position) -->
  <circle cx="120" cy="310" r="20" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="110" y="317" font-size="13" font-weight="bold">A</text>

  <!-- Sphere B (final position) -->
  <circle cx="390" cy="310" r="12" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="383" y="317" font-size="12" font-weight="bold">B</text>

  <!-- Sphere C (same position) -->
  <circle cx="450" cy="310" r="16" fill="lightgreen" stroke="black" stroke-width="2"/>
  <text x="442" y="317" font-size="13" font-weight="bold">C</text>

  <!-- New distance from B to C -->
  <line x1="402" y1="295" x2="434" y2="295" stroke="red" stroke-width="2"/>
  <text x="410" y="285" font-size="12" font-weight="bold" fill="red">d = 4.0 cm</text>

  <!-- Data box -->
  <rect x="30" y="350" width="590" height="40" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="370" font-size="11" font-weight="bold">Find: (a) Work done BY YOU to move B, (b) Work done BY NET GRAVITATIONAL FORCE on B</text>
  <text x="40" y="384" font-size="11">Given: m_A = 80 g, m_B = 10 g, m_C = 20 g, L = 12 cm, final d = 4.0 cm</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow54" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q47_hollow_sphere_gravity():
    """Q47: Spherical hollow inside lead sphere"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="140" y="25" font-size="15" font-weight="bold">Hollowed Lead Sphere: Gravitational Force</text>

  <!-- Lead sphere (cross-section) -->
  <circle cx="250" cy="250" r="100" fill="#708090" stroke="black" stroke-width="3" opacity="0.7"/>
  <text x="210" y="370" font-size="12" font-weight="bold">Lead Sphere</text>
  <text x="200" y="385" font-size="11">R = 4.00 cm (before hollow)</text>
  <text x="195" y="400" font-size="11">M = 2.95 kg (before hollow)</text>

  <!-- Center of sphere -->
  <circle cx="250" cy="250" r="4" fill="black"/>
  <text x="255" y="245" font-size="11">Center</text>

  <!-- Radius R -->
  <line x1="250" y1="250" x2="350" y2="250" stroke="blue" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="290" y="245" font-size="12" font-weight="bold" fill="blue">R = 4.00 cm</text>

  <!-- Hollow cavity (passes through center, touches right side) -->
  <circle cx="300" cy="250" r="50" fill="white" stroke="black" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="285" y="280" font-size="11" fill="red">Hollow</text>

  <!-- Center of hollow -->
  <circle cx="300" cy="250" r="3" fill="red"/>
  <text x="305" y="265" font-size="10" fill="red">Hollow center</text>

  <!-- Hollow touches right edge of sphere -->
  <circle cx="350" cy="250" r="5" fill="red"/>
  <text x="360" y="255" font-size="10" fill="red">Touch point</text>

  <!-- Small mass m at distance d -->
  <circle cx="490" cy="250" r="10" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="485" y="257" font-size="11" font-weight="bold">m</text>
  <text x="465" y="280" font-size="11">m = 0.431 kg</text>

  <!-- Distance d from center of sphere -->
  <line x1="250" y1="250" x2="490" y2="250" stroke="green" stroke-width="2"/>
  <text x="350" y="240" font-size="12" font-weight="bold" fill="green">d = 9.00 cm</text>

  <!-- Gravitational force -->
  <line x1="480" y1="250" x2="430" y2="250" stroke="red" stroke-width="4" marker-end="url(#arrow55)"/>
  <text x="440" y="235" font-size="13" font-weight="bold" fill="red">F_grav</text>

  <!-- Cross-section view label -->
  <rect x="420" y="100" width="210" height="140" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="430" y="125" font-size="12" font-weight="bold">Cross-Section View:</text>
  <text x="430" y="148" font-size="11">• Original sphere: R = 4 cm</text>
  <text x="430" y="166" font-size="11">• Hollow: radius R/2 = 2 cm</text>
  <text x="430" y="184" font-size="11">• Hollow center: R/2 from</text>
  <text x="440" y="200" font-size="11">sphere center</text>
  <text x="430" y="220" font-size="11" fill="red">• Hollow surface touches</text>
  <text x="440" y="235" font-size="11" fill="red">right edge of sphere</text>

  <!-- Question box -->
  <rect x="30" y="420" width="590" height="70" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="440" font-size="12" font-weight="bold">Problem:</text>
  <text x="40" y="458" font-size="11">• Lead sphere (R = 4.00 cm, original mass M = 2.95 kg) has spherical hollow carved out</text>
  <text x="40" y="474" font-size="11">• Hollow surface passes through center and touches right side</text>
  <text x="40" y="488" font-size="11" font-weight="bold">Find: Gravitational force on small mass m = 0.431 kg at distance d = 9.00 cm from center</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow55" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
  </defs>
</svg>'''

def create_q48_cylinder_rolling():
    """Q48: Non-uniform cylinder rolling down ramp"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="140" y="25" font-size="15" font-weight="bold">Non-Uniform Cylinder Rolling: Find Distance</text>

  <!-- Ramp -->
  <line x1="50" y1="150" x2="400" y2="150" stroke="black" stroke-width="3"/>
  <line x1="400" y1="150" x2="400" y2="250" stroke="black" stroke-width="3"/>
  <line x1="400" y1="250" x2="550" y2="250" stroke="black" stroke-width="3"/>
  <line x1="550" y1="250" x2="550" y2="400" stroke="black" stroke-width="3"/>

  <!-- Height markers -->
  <line x1="30" y1="150" x2="30" y2="250" stroke="blue" stroke-width="2"/>
  <text x="10" y="205" font-size="12" font-weight="bold" fill="blue">H</text>

  <line x1="530" y1="250" x2="530" y2="400" stroke="green" stroke-width="2"/>
  <text x="510" y="330" font-size="12" font-weight="bold" fill="green">h</text>

  <!-- Cylinder at top -->
  <circle cx="100" cy="130" r="20" fill="#8B4513" stroke="black" stroke-width="2"/>
  <text x="90" y="137" font-size="11" font-weight="bold">M, R</text>
  <text x="105" y="110" font-size="10">Non-uniform</text>
  <text x="110" y="125" font-size="10">cylinder</text>

  <!-- Cylinder at ramp edge -->
  <circle cx="380" cy="130" r="20" fill="#8B4513" stroke="black" stroke-width="2" opacity="0.5"/>
  <text x="370" y="137" font-size="11">v, ω</text>

  <!-- Rolling arrow -->
  <line x1="120" y1="130" x2="350" y2="130" stroke="purple" stroke-width="3" marker-end="url(#arrow56)"/>
  <text x="220" y="120" font-size="11" fill="purple">Rolls down</text>

  <!-- Projectile motion -->
  <path d="M 400,150 Q 450,180 500,240"
        fill="none" stroke="red" stroke-width="3" stroke-dasharray="5,3"/>
  <text x="430" y="190" font-size="11" fill="red">Projectile path</text>

  <!-- Landing point -->
  <circle cx="500" cy="250" r="6" fill="red" stroke="black" stroke-width="2"/>
  <text x="505" y="265" font-size="11" fill="red">Land</text>

  <!-- Distance d -->
  <line x1="400" y1="260" x2="500" y2="260" stroke="orange" stroke-width="2"/>
  <text x="440" y="275" font-size="12" font-weight="bold" fill="orange">d = 0.506 m</text>

  <!-- Ground -->
  <line x1="30" y1="400" x2="600" y2="400" stroke="black" stroke-width="2"/>
  <text x="280" y="420" font-size="11">Ground</text>

  <!-- Data box -->
  <rect x="30" y="310" width="280" height="80" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="330" font-size="11" font-weight="bold">Given:</text>
  <text x="40" y="348" font-size="10">• Non-uniform cylinder: mass M, radius R</text>
  <text x="40" y="363" font-size="10">• Rolls from rest down ramp height H</text>
  <text x="40" y="378" font-size="10">• Leaves ramp at height h, lands at d = 0.506 m</text>

  <!-- Result box -->
  <rect x="330" y="310" width="290" height="80" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="340" y="330" font-size="11" font-weight="bold">Find:</text>
  <text x="340" y="348" font-size="10">Initial height H in terms of h, d, R</text>
  <text x="340" y="365" font-size="10" font-style="italic">Use energy conservation + projectile motion</text>
  <text x="340" y="382" font-size="9">Hint: KE = (1/2)Mv² + (1/2)Iω²</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow56" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q49_bowling_ball():
    """Q49: Bowling ball sliding then rolling"""
    return '''<svg width="650" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Bowling Ball: Sliding to Rolling Transition</text>

  <!-- Lane -->
  <rect x="50" y="250" width="550" height="30" fill="#D2691E" stroke="black" stroke-width="2"/>
  <text x="280" y="300" font-size="12">Bowling Lane</text>

  <!-- Initial state: sliding (ω=0) -->
  <text x="80" y="70" font-size="12" font-weight="bold" fill="blue">Initial: Sliding</text>
  <circle cx="150" cy="220" r="30" fill="orange" stroke="black" stroke-width="2"/>
  <line x1="150" y1="220" x2="180" y2="220" stroke="black" stroke-width="2"/>
  <text x="140" y="227" font-size="11" font-weight="bold">ω = 0</text>

  <!-- Velocity arrow initial -->
  <line x1="150" y1="180" x2="230" y2="180" stroke="red" stroke-width="4" marker-end="url(#arrow57)"/>
  <text x="165" y="170" font-size="12" fill="red" font-weight="bold">v₀ = 8.5 m/s</text>

  <!-- Friction force -->
  <line x1="150" y1="250" x2="110" y2="250" stroke="brown" stroke-width="3" marker-end="url(#arrow58)"/>
  <text x="105" y="240" font-size="11" fill="brown">f_k</text>

  <!-- Arrow showing transition -->
  <line x1="220" y1="220" x2="330" y2="220" stroke="purple" stroke-width="3" marker-end="url(#arrow59)"/>
  <text x="250" y="210" font-size="11" fill="purple">Transition</text>

  <!-- Final state: smooth rolling (v = ωR) -->
  <text x="420" y="70" font-size="12" font-weight="bold" fill="green">Final: Rolling</text>
  <circle cx="480" cy="220" r="30" fill="orange" stroke="black" stroke-width="2"/>
  <line x1="480" y1="220" x2="510" y2="220" stroke="black" stroke-width="2"/>

  <!-- Rotation arrow -->
  <path d="M 490,210 A 15,15 0 1,1 490,230" fill="none" stroke="green" stroke-width="2" marker-end="url(#arrow60)"/>
  <text x="515" y="227" font-size="11" font-weight="bold" fill="green">ω</text>

  <!-- Velocity arrow final -->
  <line x1="480" y1="180" x2="540" y2="180" stroke="green" stroke-width="4" marker-end="url(#arrow61)"/>
  <text x="490" y="170" font-size="11" fill="green" font-weight="bold">v = ωR</text>

  <!-- Data box -->
  <rect x="30" y="320" width="590" height="70" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="340" font-size="12" font-weight="bold">Setup:</text>
  <text x="40" y="358" font-size="11">• Ball radius R = 11 cm, initial speed v₀ = 8.5 m/s, initial angular speed ω₀ = 0</text>
  <text x="40" y="374" font-size="11">• Coefficient of kinetic friction μ_k = 0.21</text>
  <text x="350" y="340" font-size="11" font-weight="bold">Find:</text>
  <text x="350" y="358" font-size="11">• Distance traveled before</text>
  <text x="350" y="374" font-size="11">  smooth rolling begins</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow57" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow58" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="brown"/>
    </marker>
    <marker id="arrow59" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
    <marker id="arrow60" markerWidth="8" markerHeight="8" refX="8" refY="2" orient="auto">
      <polygon points="0,0 8,2 0,4" fill="green"/>
    </marker>
    <marker id="arrow61" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
  </defs>
</svg>'''

def create_q50_spinning_wheel_arrow():
    """Q50: Spinning wheel with spokes - arrow must pass through"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="130" y="25" font-size="15" font-weight="bold">Spinning Wheel with Spokes: Arrow Minimum Speed</text>

  <!-- Wheel -->
  <circle cx="250" cy="220" r="80" fill="none" stroke="black" stroke-width="3"/>

  <!-- Hub/axle -->
  <circle cx="250" cy="220" r="10" fill="gray" stroke="black" stroke-width="2"/>
  <text x="260" y="225" font-size="10">Axle</text>

  <!-- 8 equally spaced spokes -->
  <line x1="250" y1="220" x2="330" y2="220" stroke="black" stroke-width="4"/>
  <line x1="250" y1="220" x2="306" y2="276" stroke="black" stroke-width="4"/>
  <line x1="250" y1="220" x2="250" y2="300" stroke="black" stroke-width="4"/>
  <line x1="250" y1="220" x2="194" y2="276" stroke="black" stroke-width="4"/>
  <line x1="250" y1="220" x2="170" y2="220" stroke="black" stroke-width="4"/>
  <line x1="250" y1="220" x2="194" y2="164" stroke="black" stroke-width="4"/>
  <line x1="250" y1="220" x2="250" y2="140" stroke="black" stroke-width="4"/>
  <line x1="250" y1="220" x2="306" y2="164" stroke="black" stroke-width="4"/>

  <!-- Rotation arrow -->
  <path d="M 290,180 A 50,50 0 0,1 310,220" fill="none" stroke="blue" stroke-width="3" marker-end="url(#arrow62)"/>
  <text x="305" y="185" font-size="13" font-weight="bold" fill="blue">ω</text>
  <text x="280" y="165" font-size="11" fill="blue">2.5 rev/s</text>

  <!-- Arrow -->
  <rect x="50" y="210" width="60" height="8" fill="#8B4513" stroke="black" stroke-width="1"/>
  <polygon points="110,214 125,220 110,226" fill="#8B4513" stroke="black" stroke-width="1"/>
  <rect x="40" y="216" width="10" height="8" fill="red" stroke="black" stroke-width="1"/>

  <!-- Arrow velocity -->
  <line x1="80" y1="190" x2="140" y2="190" stroke="red" stroke-width="4" marker-end="url(#arrow63)"/>
  <text x="90" y="180" font-size="12" font-weight="bold" fill="red">v = ?</text>

  <!-- Arrow label -->
  <text x="50" y="240" font-size="11">Arrow</text>
  <text x="45" y="255" font-size="10">L = 20 cm</text>

  <!-- Wheel data -->
  <text x="230" y="330" font-size="11">Wheel radius</text>
  <text x="235" y="345" font-size="11">r = 30 cm</text>

  <!-- Data box -->
  <rect x="360" y="150" width="270" height="170" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="370" y="175" font-size="12" font-weight="bold">Problem Setup:</text>
  <text x="370" y="195" font-size="11">• Wheel: radius 30 cm,</text>
  <text x="380" y="210" font-size="11">8 equally spaced spokes</text>
  <text x="380" y="225" font-size="11">spinning at 2.5 rev/s</text>
  <text x="370" y="245" font-size="11">• Arrow: length 20 cm</text>
  <text x="380" y="260" font-size="11">shot parallel to axle</text>
  <text x="370" y="285" font-size="12" font-weight="bold" fill="red">Find:</text>
  <text x="370" y="303" font-size="11">Minimum speed v for arrow</text>
  <text x="370" y="318" font-size="11">to pass through wheel</text>

  <!-- Hint box -->
  <rect x="30" y="360" width="590" height="75" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="40" y="380" font-size="11" font-weight="bold">Hint:</text>
  <text x="40" y="398" font-size="10">• Time between consecutive spokes: Δt = (1/8) × (1/2.5) seconds</text>
  <text x="40" y="413" font-size="10">• Arrow must traverse wheel (2r = 60 cm) in time less than Δt</text>
  <text x="40" y="428" font-size="10">• Minimum speed: v_min = 2r/Δt</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow62" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="blue"/>
    </marker>
    <marker id="arrow63" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
  </defs>
</svg>'''


# Main execution
def main():
    print("Generating detailed SVG figures for questions 41-50...")

    with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    questions = soup.find_all('div', class_='question-card')

    # Map of SVG generators
    svg_generators = {
        41: create_q41_quadrupole_duplicate,
        42: create_q42_projectile_graph,
        43: create_q43_projectile_duplicate,
        44: create_q44_semiinfinite_duplicate,
        45: create_q45_particle_potential_energy,
        46: create_q46_three_spheres_work,
        47: create_q47_hollow_sphere_gravity,
        48: create_q48_cylinder_rolling,
        49: create_q49_bowling_ball,
        50: create_q50_spinning_wheel_arrow,
    }

    count = 0
    for i in range(41, 51):
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

    print(f"\n✅ Successfully added {count} detailed SVG figures (Q41-Q50)")
    print("Saved to problematic_physics_questions.html")

if __name__ == "__main__":
    main()
