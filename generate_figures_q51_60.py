#!/usr/bin/env python3
"""
Generate detailed SVG figures for questions 51-60 in problematic_physics_questions.html
Final batch: rotational mechanics, waves, and particle systems
"""

from bs4 import BeautifulSoup

def create_q51_hoop_rod_assembly():
    """Q51: Hoop and rod assembly rotating"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="140" y="25" font-size="15" font-weight="bold">Hoop and Rod Assembly: Rotational Motion</text>

  <!-- Pivot point (at lower end of rod) -->
  <circle cx="300" cy="400" r="8" fill="black" stroke="black" stroke-width="2"/>
  <text x="240" y="425" font-size="12" font-weight="bold">Pivot (rotation axis)</text>

  <!-- Rod (vertical, length L = 2R) -->
  <rect x="295" y="250" width="10" height="150" fill="#8B4513" stroke="black" stroke-width="2"/>
  <text x="310" y="330" font-size="12" font-weight="bold">Rod</text>
  <text x="310" y="345" font-size="11">mass m</text>
  <text x="310" y="360" font-size="11">L = 2.00R</text>

  <!-- Length L marker -->
  <line x1="280" y1="250" x2="280" y2="400" stroke="blue" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="260" y="330" font-size="12" font-weight="bold" fill="blue">L</text>

  <!-- Hoop (at top of rod) -->
  <circle cx="300" cy="200" r="50" fill="none" stroke="red" stroke-width="4"/>
  <text x="340" y="205" font-size="12" font-weight="bold">Hoop</text>
  <text x="340" y="220" font-size="11">mass m</text>
  <text x="340" y="235" font-size="11">R = 0.150 m</text>

  <!-- Radius R of hoop -->
  <line x1="300" y1="200" x2="350" y2="200" stroke="red" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="315" y="195" font-size="11" font-weight="bold" fill="red">R</text>

  <!-- Center of mass of assembly -->
  <circle cx="300" cy="310" r="6" fill="green" stroke="darkgreen" stroke-width="2"/>
  <text x="310" y="315" font-size="11" fill="green" font-weight="bold">CM</text>

  <!-- Rotation arrow -->
  <path d="M 340,300 A 60,60 0 0,1 340,380" fill="none" stroke="purple" stroke-width="3" marker-end="url(#arrow64)"/>
  <text x="355" y="345" font-size="13" font-weight="bold" fill="purple">ω</text>

  <!-- Ground -->
  <line x1="200" y1="410" x2="400" y2="410" stroke="black" stroke-width="3"/>
  <pattern id="ground-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
    <line x1="0" y1="0" x2="20" y2="20" stroke="black" stroke-width="1"/>
  </pattern>
  <rect x="200" y="410" width="200" height="10" fill="url(#ground-pattern)"/>

  <!-- Data box -->
  <rect x="410" y="150" width="220" height="190" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="420" y="175" font-size="12" font-weight="bold">Assembly:</text>
  <text x="420" y="195" font-size="11">• Hoop: mass m,</text>
  <text x="430" y="210" font-size="11">radius R = 0.150 m</text>
  <text x="420" y="230" font-size="11">• Rod: mass m,</text>
  <text x="430" y="245" font-size="11">length L = 2.00R</text>
  <text x="430" y="260" font-size="11">= 0.300 m</text>
  <text x="420" y="285" font-size="11" font-weight="bold">Setup:</text>
  <text x="420" y="303" font-size="10">• Rod connects to hoop</text>
  <text x="420" y="318" font-size="10">• Pivot at lower end</text>
  <text x="420" y="333" font-size="10">• Assembly nudged</text>

  <!-- Question box -->
  <rect x="30" y="430" width="590" height="60" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="40" y="450" font-size="12" font-weight="bold">Problem:</text>
  <text x="40" y="468" font-size="11">Assembly is upright. Given a slight nudge, it rotates about horizontal axis at lower end.</text>
  <text x="40" y="483" font-size="11" font-weight="bold">Find: Angular speed when assembly reaches horizontal position (assuming no energy loss)</text>

  <!-- Horizontal position (ghost view) -->
  <rect x="70" y="245" width="10" height="150" fill="#8B4513" stroke="gray" stroke-width="1" opacity="0.3" transform="rotate(90 125 320)"/>
  <circle cx="170" cy="250" r="50" fill="none" stroke="gray" stroke-width="2" opacity="0.3"/>
  <text x="190" y="255" font-size="10" fill="gray">Horizontal</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow64" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q52_judo_sweep():
    """Q52: Judo foot-sweep rotation"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="170" y="25" font-size="15" font-weight="bold">Judo Foot-Sweep: Rotational Dynamics</text>

  <!-- Ground/mat -->
  <rect x="50" y="400" width="550" height="80" fill="#90EE90" stroke="black" stroke-width="2"/>
  <text x="280" y="450" font-size="12">Mat</text>

  <!-- Right foot (pivot point O) -->
  <circle cx="350" cy="390" r="10" fill="black" stroke="black" stroke-width="2"/>
  <text x="360" y="395" font-size="12" font-weight="bold">O</text>
  <text x="360" y="410" font-size="11">(Right foot, pivot)</text>

  <!-- Opponent (simplified as stick figure rotating) -->
  <!-- Body as vertical line -->
  <line x1="350" y1="390" x2="350" y2="250" stroke="blue" stroke-width="6"/>
  <text x="360" y="320" font-size="11" fill="blue">Body</text>

  <!-- Head -->
  <circle cx="350" cy="230" r="20" fill="peachpuff" stroke="black" stroke-width="2"/>
  <text x="342" y="237" font-size="16">👤</text>

  <!-- Left leg (swept out) -->
  <line x1="350" y1="390" x2="280" y2="390" stroke="red" stroke-width="5" stroke-dasharray="5,3"/>
  <text x="290" y="380" font-size="11" fill="red">Left leg (swept)</text>

  <!-- Arms extended (being pulled) -->
  <line x1="350" y1="290" x2="280" y2="270" stroke="brown" stroke-width="4"/>
  <text x="260" y="265" font-size="11" fill="brown">Arm (pulled)</text>

  <!-- Gravitational force arrow -->
  <line x1="350" y1="310" x2="350" y2="360" stroke="red" stroke-width="4" marker-end="url(#arrow65)"/>
  <text x="355" y="340" font-size="13" font-weight="bold" fill="red">F_g = Mg</text>

  <!-- Center of mass -->
  <circle cx="350" cy="320" r="6" fill="green" stroke="darkgreen" stroke-width="2"/>
  <text x="360" y="325" font-size="11" fill="green" font-weight="bold">CM</text>

  <!-- Distance from pivot to CM -->
  <line x1="340" y1="390" x2="340" y2="320" stroke="green" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="310" y="360" font-size="11" fill="green" font-weight="bold">d</text>

  <!-- Rotation arrow -->
  <path d="M 380,350 A 50,50 0 0,1 400,390" fill="none" stroke="purple" stroke-width="3" marker-end="url(#arrow66)"/>
  <text x="405" y="375" font-size="13" font-weight="bold" fill="purple">ω</text>
  <text x="400" y="355" font-size="11" fill="purple">Rotation</text>

  <!-- Final position (on mat) -->
  <rect x="450" y="380" width="80" height="15" fill="peachpuff" stroke="black" stroke-width="1" opacity="0.5"/>
  <circle cx="535" cy="387" r="10" fill="peachpuff" stroke="black" stroke-width="1" opacity="0.5"/>
  <text x="540" y="392" font-size="10" fill="gray">Fall</text>

  <!-- Data box -->
  <rect x="30" y="70" width="280" height="120" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="90" font-size="12" font-weight="bold">Judo Foot-Sweep:</text>
  <text x="40" y="110" font-size="11">1. Sweep left foot out</text>
  <text x="40" y="126" font-size="11">2. Pull on uniform (gi) toward</text>
  <text x="50" y="141" font-size="11">swept side</text>
  <text x="40" y="160" font-size="11">3. Opponent rotates about</text>
  <text x="50" y="175" font-size="11">right foot (point O)</text>

  <!-- Question box -->
  <rect x="30" y="220" width="280" height="90" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="40" y="245" font-size="12" font-weight="bold">Find:</text>
  <text x="40" y="265" font-size="11">• Moment of inertia I</text>
  <text x="50" y="280" font-size="11">about pivot O</text>
  <text x="40" y="298" font-size="11">• Torque τ due to gravity</text>

  <!-- Note -->
  <text x="330" y="60" font-size="11" font-style="italic">Simplified diagram showing opponent facing you,</text>
  <text x="330" y="75" font-size="11" font-style="italic">rotating clockwise about right foot</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow65" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow66" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q53_disk_rotation():
    """Q53: Disk rotating like merry-go-round"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="130" y="25" font-size="15" font-weight="bold">Disk Rotation with Constant Angular Acceleration</text>

  <!-- Disk (top view) -->
  <circle cx="300" cy="200" r="80" fill="#D3D3D3" stroke="black" stroke-width="3"/>

  <!-- Center/axis -->
  <circle cx="300" cy="200" r="8" fill="black"/>
  <text x="310" y="205" font-size="11" font-weight="bold">Axis</text>

  <!-- Radius -->
  <line x1="300" y1="200" x2="380" y2="200" stroke="blue" stroke-width="2"/>
  <text x="330" y="195" font-size="12" font-weight="bold" fill="blue">r = 0.25 m</text>

  <!-- Point on edge -->
  <circle cx="380" cy="200" r="6" fill="red"/>
  <text x="390" y="205" font-size="11" fill="red">Point on edge</text>

  <!-- Rotation arrows showing acceleration/deceleration phases -->
  <path d="M 340,160 A 50,50 0 0,1 360,200" fill="none" stroke="green" stroke-width="3" marker-end="url(#arrow67)"/>
  <text x="350" y="150" font-size="11" fill="green">+α₁</text>

  <path d="M 340,240 A 50,50 0 0,0 360,200" fill="none" stroke="red" stroke-width="3" marker-end="url(#arrow68)"/>
  <text x="350" y="255" font-size="11" fill="red">−α₁</text>

  <!-- Data box -->
  <rect x="30" y="290" width="590" height="145" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="315" font-size="12" font-weight="bold">Disk Rotation Problem:</text>
  <text x="40" y="335" font-size="11">• Disk radius r = 0.25 m rotates through total angle θ_total = 800 rad</text>
  <text x="40" y="351" font-size="11">• Starts from rest, gains angular speed at constant rate α₁ for first 400 rad</text>
  <text x="40" y="367" font-size="11">• Then loses angular speed at constant rate −α₁ until at rest again (next 400 rad)</text>
  <text x="40" y="383" font-size="11">• Constraint: Centripetal acceleration a_c must not exceed 400 m/s²</text>
  <text x="40" y="410" font-size="12" font-weight="bold" fill="blue">Find: (a) Minimum time for rotation, (b) Maximum α₁ allowed</text>
  <text x="40" y="427" font-size="10" fill="gray">Hint: a_c = ω²r, ω_max occurs at midpoint (after 400 rad)</text>

  <!-- Phase diagram -->
  <rect x="420" y="60" width="210" height="210" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="430" y="85" font-size="12" font-weight="bold">Rotation Phases:</text>

  <!-- Phase 1 -->
  <text x="430" y="110" font-size="11" font-weight="bold" fill="green">Phase 1 (0 to 400 rad):</text>
  <text x="440" y="127" font-size="10">ω: 0 → ω_max</text>
  <text x="440" y="142" font-size="10">α = +α₁ (constant)</text>

  <!-- Phase 2 -->
  <text x="430" y="170" font-size="11" font-weight="bold" fill="red">Phase 2 (400 to 800 rad):</text>
  <text x="440" y="187" font-size="10">ω: ω_max → 0</text>
  <text x="440" y="202" font-size="10">α = −α₁ (constant)</text>

  <!-- Constraint -->
  <text x="430" y="230" font-size="11" font-weight="bold" fill="purple">Constraint:</text>
  <text x="440" y="247" font-size="10">ω_max²r ≤ 400 m/s²</text>
  <text x="440" y="262" font-size="10">ω_max ≤ 40 rad/s</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow67" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow68" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
  </defs>
</svg>'''

def create_q54_ball_loop():
    """Q54: Ball rolling in loop-the-loop"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="160" y="25" font-size="15" font-weight="bold">Ball Rolling in Loop-the-Loop Track</text>

  <!-- Ramp -->
  <line x1="50" y1="150" x2="200" y2="300" stroke="black" stroke-width="4"/>

  <!-- Release point -->
  <circle cx="80" cy="170" r="10" fill="orange" stroke="black" stroke-width="2"/>
  <text x="30" y="165" font-size="11" font-weight="bold">Release</text>
  <text x="35" y="180" font-size="10">(at rest)</text>

  <!-- Height h -->
  <line x1="30" y1="170" x2="30" y2="300" stroke="blue" stroke-width="2"/>
  <text x="10" y="240" font-size="13" font-weight="bold" fill="blue">h</text>

  <!-- Circular loop -->
  <circle cx="300" cy="300" r="100" fill="none" stroke="black" stroke-width="4"/>
  <text x="380" y="310" font-size="11">Loop</text>
  <text x="375" y="325" font-size="11">R = 14.0 cm</text>

  <!-- Center of loop -->
  <circle cx="300" cy="300" r="3" fill="black"/>

  <!-- Top of loop (point Q) -->
  <circle cx="300" cy="200" r="8" fill="red" stroke="black" stroke-width="2"/>
  <text x="310" y="205" font-size="12" font-weight="bold" fill="red">Q</text>
  <text x="310" y="190" font-size="11" fill="red">Top point</text>

  <!-- Ball at top (small) -->
  <circle cx="300" cy="200" r="6" fill="orange" stroke="black" stroke-width="1"/>
  <text x="285" y="217" font-size="9">ball</text>

  <!-- Radius R of loop -->
  <line x1="300" y1="300" x2="300" y2="200" stroke="red" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="280" y="255" font-size="11" font-weight="bold" fill="red">R</text>

  <!-- Normal force at top -->
  <line x1="300" y1="200" x2="300" y2="170" stroke="green" stroke-width="3" marker-end="url(#arrow69)"/>
  <text x="305" y="185" font-size="10" fill="green">N</text>

  <!-- Weight at top -->
  <line x1="300" y1="206" x2="300" y2="236" stroke="purple" stroke-width="3" marker-end="url(#arrow70)"/>
  <text x="305" y="228" font-size="10" fill="purple">mg</text>

  <!-- Ground level -->
  <line x1="20" y1="400" x2="580" y2="400" stroke="black" stroke-width="3"/>
  <text x="280" y="420" font-size="11">Ground</text>

  <!-- Height from ground to center -->
  <line x1="250" y1="300" x2="250" y2="400" stroke="green" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="230" y="355" font-size="10" fill="green">R</text>

  <!-- Data box -->
  <rect x="420" y="150" width="210" height="170" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="430" y="175" font-size="12" font-weight="bold">Setup:</text>
  <text x="430" y="195" font-size="11">• Solid brass ball</text>
  <text x="440" y="210" font-size="10">mass = 0.280 g</text>
  <text x="440" y="225" font-size="10">radius r << R</text>
  <text x="430" y="245" font-size="11">• Loop radius:</text>
  <text x="440" y="260" font-size="10">R = 14.0 cm</text>
  <text x="430" y="285" font-size="11" font-weight="bold" fill="red">Find:</text>
  <text x="430" y="303" font-size="10">Minimum h for ball</text>
  <text x="430" y="318" font-size="10">on verge of leaving</text>

  <!-- Condition box -->
  <rect x="30" y="430" width="590" height="60" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="40" y="450" font-size="11" font-weight="bold">Condition at top Q (verge of leaving):</text>
  <text x="40" y="468" font-size="11">• Normal force N = 0, only weight provides centripetal force: mg = mv²/R</text>
  <text x="40" y="483" font-size="11">• Use energy conservation: mgh = mg(2R) + (1/2)mv² + (1/2)Iω² where v = ωr</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow69" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow70" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q55_two_strings():
    """Q55: Two strings under tension with hanging mass"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="140" y="25" font-size="15" font-weight="bold">Two Strings Under Tension: Wave Speeds</text>

  <!-- String 1 (left, horizontal) -->
  <line x1="50" y1="150" x2="250" y2="150" stroke="blue" stroke-width="4"/>
  <text x="130" y="140" font-size="12" font-weight="bold">String 1</text>
  <text x="120" y="170" font-size="11">μ₁ = 3.00 g/m</text>

  <!-- String 2 (right, horizontal) -->
  <line x1="350" y1="150" x2="550" y2="150" stroke="red" stroke-width="4"/>
  <text x="430" y="140" font-size="12" font-weight="bold">String 2</text>
  <text x="420" y="170" font-size="11">μ₂ = 5.00 g/m</text>

  <!-- Knot/junction -->
  <circle cx="300" cy="150" r="10" fill="black"/>
  <text x="305" y="140" font-size="11">Knot</text>

  <!-- Hanging mass -->
  <line x1="300" y1="160" x2="300" y2="280" stroke="black" stroke-width="3"/>
  <rect x="270" y="280" width="60" height="60" fill="#8B4513" stroke="black" stroke-width="2"/>
  <text x="280" y="310" font-size="13" font-weight="bold" fill="white">M</text>
  <text x="270" y="330" font-size="11" fill="white">500 g</text>

  <!-- Tension arrows in strings -->
  <line x1="200" y1="150" x2="240" y2="150" stroke="green" stroke-width="3" marker-end="url(#arrow71)"/>
  <text x="210" y="130" font-size="11" fill="green">T₁</text>

  <line x1="400" y1="150" x2="360" y2="150" stroke="green" stroke-width="3" marker-end="url(#arrow72)"/>
  <text x="400" y="130" font-size="11" fill="green">T₂</text>

  <!-- Weight force -->
  <line x1="300" y1="340" x2="300" y2="380" stroke="purple" stroke-width="4" marker-end="url(#arrow73)"/>
  <text x="305" y="365" font-size="12" fill="purple" font-weight="bold">Mg</text>

  <!-- Wave representation on String 1 -->
  <path d="M 80,130 Q 95,120 110,130 Q 125,140 140,130"
        fill="none" stroke="cyan" stroke-width="2"/>
  <text x="95" y="115" font-size="10" fill="cyan">wave</text>

  <!-- Data box -->
  <rect x="30" y="220" width="280" height="110" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="240" font-size="12" font-weight="bold">String Properties:</text>
  <text x="40" y="260" font-size="11">String 1: μ₁ = 3.00 g/m</text>
  <text x="40" y="278" font-size="11">String 2: μ₂ = 5.00 g/m</text>
  <text x="40" y="296" font-size="11">Hanging mass: M = 500 g</text>
  <text x="40" y="318" font-size="11" font-weight="bold">Wave speed: v = √(T/μ)</text>

  <!-- Question box -->
  <rect x="330" y="220" width="290" height="110" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="340" y="240" font-size="12" font-weight="bold">Find:</text>
  <text x="340" y="260" font-size="11">(a) Wave speed on String 1?</text>
  <text x="340" y="278" font-size="11">(b) Wave speed on String 2?</text>
  <text x="340" y="298" font-size="11" font-weight="bold">(c) If block split into M₁ + M₂</text>
  <text x="350" y="316" font-size="10">such that equal wave speeds,</text>
  <text x="350" y="330" font-size="10">what are M₁ and M₂?</text>

  <!-- Note -->
  <rect x="30" y="360" width="590" height="75" fill="#FFFFCC" stroke="black" stroke-width="2"/>
  <text x="40" y="380" font-size="11" font-weight="bold">Notes:</text>
  <text x="40" y="398" font-size="10">• In setup shown: both strings have same tension T = Mg (assuming massless knot)</text>
  <text x="40" y="413" font-size="10">• Wave speed v = √(T/μ), so different speeds due to different linear densities</text>
  <text x="40" y="428" font-size="10">• For part (c): need T₁/μ₁ = T₂/μ₂ where T₁ = M₁g and T₂ = M₂g</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow71" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow72" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow73" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''

def create_q56_two_strings_duplicate():
    """Q56: Same as Q55"""
    return create_q55_two_strings()

def create_q57_two_strings_duplicate2():
    """Q57: Same as Q55"""
    return create_q55_two_strings()

def create_q58_body_armor():
    """Q58: Body armor - projectile impact"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Body Armor Physics: Energy Dissipation</text>

  <!-- Body armor fabric (front view) -->
  <rect x="200" y="100" width="250" height="200" fill="#3C3C3C" stroke="black" stroke-width="3"/>
  <text x="280" y="320" font-size="12" font-weight="bold">Body Armor Fabric</text>

  <!-- Projectile approaching -->
  <circle cx="80" cy="180" r="8" fill="red" stroke="black" stroke-width="2"/>
  <line x1="95" y1="180" x2="180" y2="180" stroke="red" stroke-width="4" marker-end="url(#arrow74)"/>
  <text x="120" y="170" font-size="12" fill="red" font-weight="bold">v_projectile</text>
  <text x="110" y="200" font-size="10">(high speed)</text>

  <!-- Impact point -->
  <circle cx="200" cy="180" r="12" fill="yellow" stroke="orange" stroke-width="3"/>
  <text x="215" y="185" font-size="11" font-weight="bold">Impact</text>

  <!-- Cone-shaped dent (cross-section) -->
  <path d="M 200,180 L 260,140 L 260,220 Z" fill="#555555" stroke="orange" stroke-width="2"/>
  <text x="220" y="185" font-size="10" fill="white">Cone</text>

  <!-- Pulses spreading radially -->
  <circle cx="200" cy="180" r="40" fill="none" stroke="cyan" stroke-width="2" stroke-dasharray="5,3"/>
  <circle cx="200" cy="180" r="70" fill="none" stroke="cyan" stroke-width="2" stroke-dasharray="5,3" opacity="0.7"/>
  <circle cx="200" cy="180" r="100" fill="none" stroke="cyan" stroke-width="2" stroke-dasharray="5,3" opacity="0.4"/>

  <!-- Pulse arrows -->
  <line x1="200" y1="180" x2="240" y2="140" stroke="cyan" stroke-width="3" marker-end="url(#arrow75)"/>
  <text x="245" y="135" font-size="10" fill="cyan">Pulse</text>

  <line x1="200" y1="180" x2="240" y2="220" stroke="cyan" stroke-width="3" marker-end="url(#arrow76)"/>
  <line x1="200" y1="180" x2="150" y2="150" stroke="cyan" stroke-width="3" marker-end="url(#arrow77)"/>
  <line x1="200" y1="180" x2="150" y2="210" stroke="cyan" stroke-width="3" marker-end="url(#arrow78)"/>

  <!-- Data box -->
  <rect x="470" y="100" width="160" height="200" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="480" y="125" font-size="11" font-weight="bold">Energy Dissipation:</text>
  <text x="480" y="148" font-size="10">1. Impact creates</text>
  <text x="490" y="162" font-size="9">cone-shaped dent</text>
  <text x="480" y="180" font-size="10">2. Longitudinal +</text>
  <text x="490" y="194" font-size="9">transverse pulses</text>
  <text x="490" y="208" font-size="9">spread radially</text>
  <text x="480" y="226" font-size="10">3. Pulses carry</text>
  <text x="490" y="240" font-size="9">energy away from</text>
  <text x="490" y="254" font-size="9">impact point</text>
  <text x="480" y="275" font-size="10" font-weight="bold" fill="blue">Result:</text>
  <text x="480" y="291" font-size="9">Energy spread over</text>
  <text x="480" y="305" font-size="9">large area quickly</text>

  <!-- Description box -->
  <rect x="30" y="350" width="590" height="90" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="40" y="375" font-size="12" font-weight="bold">Body Armor Mechanism:</text>
  <text x="40" y="395" font-size="11">• High-speed projectile (bullet/fragment) hits armor fabric</text>
  <text x="40" y="411" font-size="11">• Fabric stops projectile by quickly spreading energy over large area</text>
  <text x="40" y="427" font-size="11">• Spreading done by longitudinal and transverse wave pulses moving radially from impact</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow74" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow75" markerWidth="8" markerHeight="8" refX="8" refY="2" orient="auto">
      <polygon points="0,0 8,2 0,4" fill="cyan"/>
    </marker>
    <marker id="arrow76" markerWidth="8" markerHeight="8" refX="8" refY="2" orient="auto">
      <polygon points="0,0 8,2 0,4" fill="cyan"/>
    </marker>
    <marker id="arrow77" markerWidth="8" markerHeight="8" refX="8" refY="2" orient="auto">
      <polygon points="0,0 8,2 0,4" fill="cyan"/>
    </marker>
    <marker id="arrow78" markerWidth="8" markerHeight="8" refX="8" refY="2" orient="auto">
      <polygon points="0,0 8,2 0,4" fill="cyan"/>
    </marker>
  </defs>
</svg>'''

def create_q59_three_charges_equilibrium():
    """Q59: Three charged particles in equilibrium"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="130" y="25" font-size="15" font-weight="bold">Three Charged Particles: Find Equilibrium Position</text>

  <!-- X-axis -->
  <line x1="100" y1="250" x2="550" y2="250" stroke="black" stroke-width="2"/>
  <polygon points="550,250 545,245 545,255" fill="black"/>
  <text x="560" y="255" font-size="14" font-weight="bold">x</text>

  <!-- Particle 1 at x=0 -->
  <circle cx="150" cy="250" r="15" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="140" y="258" font-size="13" font-weight="bold">1</text>
  <text x="130" y="280" font-size="12">+q</text>
  <text x="130" y="225" font-size="11">x = 0</text>

  <!-- Particle 2 at x=L -->
  <circle cx="350" cy="250" r="18" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="340" y="258" font-size="13" font-weight="bold">2</text>
  <text x="320" y="280" font-size="12">+4.00q</text>
  <text x="330" y="225" font-size="11">x = L</text>
  <text x="315" y="210" font-size="10">L = 9.00 cm</text>

  <!-- Distance L -->
  <line x1="150" y1="230" x2="350" y2="230" stroke="green" stroke-width="2"/>
  <text x="235" y="220" font-size="12" font-weight="bold" fill="green">L = 9.00 cm</text>

  <!-- Particle 3 (unknown position) -->
  <circle cx="250" cy="150" r="14" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="242" y="157" font-size="13" font-weight="bold">3</text>
  <text x="230" y="130" font-size="11">q₃ = ?</text>
  <text x="260" y="155" font-size="10">(x=?, y=?)</text>

  <!-- Forces on particle 3 -->
  <line x1="250" y1="150" x2="210" y2="190" stroke="red" stroke-width="3" marker-end="url(#arrow79)"/>
  <text x="210" y="180" font-size="10" fill="red">F₃₁</text>

  <line x1="250" y1="150" x2="290" y2="190" stroke="blue" stroke-width="3" marker-end="url(#arrow80)"/>
  <text x="285" y="180" font-size="10" fill="blue">F₃₂</text>

  <!-- Question marks -->
  <text x="235" y="185" font-size="14" fill="purple" font-weight="bold">?</text>

  <!-- Result box -->
  <rect x="400" y="100" width="230" height="180" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="410" y="125" font-size="12" font-weight="bold">Find:</text>
  <text x="410" y="148" font-size="11">(a) x-coordinate of</text>
  <text x="420" y="163" font-size="11">particle 3?</text>
  <text x="410" y="185" font-size="11">(b) y-coordinate of</text>
  <text x="420" y="200" font-size="11">particle 3?</text>
  <text x="410" y="222" font-size="11">(c) Ratio q₃/q = ?</text>
  <text x="410" y="250" font-size="10" font-weight="bold">Condition:</text>
  <text x="410" y="267" font-size="9">All three particles</text>
  <text x="410" y="280" font-size="9">remain in place when</text>

  <!-- Data box -->
  <rect x="30" y="320" width="590" height="115" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="40" y="345" font-size="12" font-weight="bold">Equilibrium Condition:</text>
  <text x="40" y="365" font-size="11">For all three particles to remain stationary when released:</text>
  <text x="50" y="383" font-size="11">• Net force on particle 1 must be zero: F₁₂ + F₁₃ = 0</text>
  <text x="50" y="399" font-size="11">• Net force on particle 2 must be zero: F₂₁ + F₂₃ = 0</text>
  <text x="50" y="415" font-size="11">• Net force on particle 3 must be zero: F₃₁ + F₃₂ = 0</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow79" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow80" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="blue"/>
    </marker>
  </defs>
</svg>'''

def create_q60_rod_particle_collision():
    """Q60: Rod rotating with particle collision"""
    return '''<svg width="650" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="110" y="25" font-size="15" font-weight="bold">Rod-Particle Collision: Angular Momentum Conservation</text>

  <!-- Before collision -->
  <text x="80" y="60" font-size="13" font-weight="bold" fill="blue">Before Collision:</text>

  <!-- Rod (horizontal) -->
  <rect x="150" y="95" width="200" height="10" fill="#8B4513" stroke="black" stroke-width="2"/>
  <circle cx="250" cy="100" r="8" fill="gray" stroke="black" stroke-width="2"/>
  <text x="255" y="105" font-size="10">Center</text>
  <text x="240" y="130" font-size="11">Uniform rod</text>
  <text x="230" y="145" font-size="10">L = 0.600 m, mass M</text>

  <!-- Rotation arrow on rod -->
  <path d="M 280,100 A 40,40 0 0,1 280,140" fill="none" stroke="green" stroke-width="2" marker-end="url(#arrow81)"/>
  <text x="290" y="125" font-size="11" fill="green" font-weight="bold">ω₀ = 80 rad/s</text>

  <!-- Particle approaching -->
  <circle cx="80" cy="100" r="10" fill="red" stroke="black" stroke-width="2"/>
  <text x="70" y="127" font-size="10">Particle</text>
  <text x="60" y="142" font-size="10">mass M/3</text>

  <!-- Velocity arrow -->
  <line x1="90" y1="100" x2="130" y2="100" stroke="red" stroke-width="4" marker-end="url(#arrow82)"/>
  <text x="95" y="90" font-size="11" fill="red" font-weight="bold">v₀ = 40 m/s</text>

  <!-- Distance d -->
  <line x1="140" y1="100" x2="150" y2="100" stroke="purple" stroke-width="2"/>
  <text x="135" y="115" font-size="10" fill="purple">d</text>

  <!-- Perpendicular indicator -->
  <path d="M 135,95 L 135,105 L 145,105" fill="none" stroke="purple" stroke-width="1"/>

  <!-- After collision -->
  <text x="80" y="230" font-size="13" font-weight="bold" fill="red">After Collision (stick together):</text>

  <!-- Rod with particle stuck -->
  <rect x="150" y="265" width="200" height="10" fill="#8B4513" stroke="black" stroke-width="2"/>
  <circle cx="250" cy="270" r="8" fill="gray" stroke="black" stroke-width="2"/>

  <!-- Particle stuck on rod -->
  <circle cx="150" cy="270" r="10" fill="red" stroke="black" stroke-width="2"/>
  <text x="120" y="275" font-size="10">Particle</text>
  <text x="125" y="290" font-size="10">stuck</text>

  <!-- New rotation -->
  <path d="M 280,270 A 40,40 0 0,1 280,310" fill="none" stroke="orange" stroke-width="3" marker-end="url(#arrow83)"/>
  <text x="290" y="295" font-size="12" fill="orange" font-weight="bold">ω_f = ?</text>

  <!-- Question box -->
  <rect x="400" y="80" width="230" height="200" fill="#FFF9E6" stroke="black" stroke-width="2"/>
  <text x="410" y="105" font-size="12" font-weight="bold">Problem:</text>
  <text x="410" y="125" font-size="11">• Rod: length L = 0.600 m,</text>
  <text x="420" y="140" font-size="11">mass M, rotating at</text>
  <text x="420" y="155" font-size="11">ω₀ = 80.0 rad/s CCW</text>
  <text x="410" y="175" font-size="11">• Particle: mass M/3.00,</text>
  <text x="420" y="190" font-size="11">v₀ = 40.0 m/s</text>
  <text x="410" y="210" font-size="11">• Hits perpendicularly</text>
  <text x="420" y="225" font-size="11">at distance d from</text>
  <text x="420" y="240" font-size="11">rod's center</text>
  <text x="410" y="265" font-size="11" font-weight="bold" fill="blue">Find: d such that</text>
  <text x="420" y="280" font-size="11">ω_f = 0 after collision</text>

  <!-- Conservation equation box -->
  <rect x="30" y="350" width="590" height="135" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="40" y="375" font-size="12" font-weight="bold">Angular Momentum Conservation:</text>
  <text x="40" y="398" font-size="11">L_initial = L_final (about center of rod)</text>
  <text x="40" y="420" font-size="11">L_i = I_rod × ω₀ + (M/3) × v₀ × d</text>
  <text x="50" y="438" font-size="10">where I_rod = (1/12)ML²</text>
  <text x="40" y="460" font-size="11">L_f = (I_rod + I_particle) × ω_f</text>
  <text x="50" y="478" font-size="10">where I_particle = (M/3) × d²</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow81" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arrow82" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="red"/>
    </marker>
    <marker id="arrow83" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
      <polygon points="0,0 12,3 0,6" fill="orange"/>
    </marker>
  </defs>
</svg>'''


# Main execution
def main():
    print("Generating detailed SVG figures for questions 51-60...")

    with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    questions = soup.find_all('div', class_='question-card')

    # Map of SVG generators
    svg_generators = {
        51: create_q51_hoop_rod_assembly,
        52: create_q52_judo_sweep,
        53: create_q53_disk_rotation,
        54: create_q54_ball_loop,
        55: create_q55_two_strings,
        56: create_q56_two_strings_duplicate,
        57: create_q57_two_strings_duplicate2,
        58: create_q58_body_armor,
        59: create_q59_three_charges_equilibrium,
        60: create_q60_rod_particle_collision,
    }

    count = 0
    for i in range(51, 61):
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

    print(f"\n✅ Successfully added {count} detailed SVG figures (Q51-Q60)")
    print("Saved to problematic_physics_questions.html")

if __name__ == "__main__":
    main()
