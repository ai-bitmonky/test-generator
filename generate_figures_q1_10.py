#!/usr/bin/env python3
"""
Generate detailed SVG figures for questions 1-10 in problematic_physics_questions.html
"""

from bs4 import BeautifulSoup
import re

def create_q1_capacitor_circuit():
    """Q1: Capacitor network with switch S - detailed circuit"""
    return '''<svg width="650" height="350" xmlns="http://www.w3.org/2000/svg">
  <!-- Battery -->
  <line x1="50" y1="100" x2="50" y2="250" stroke="black" stroke-width="2"/>
  <line x1="40" y1="110" x2="60" y2="110" stroke="black" stroke-width="3"/>
  <line x1="45" y1="240" x2="55" y2="240" stroke="black" stroke-width="2"/>
  <text x="20" y="180" font-size="16" font-weight="bold">12V</text>
  <text x="30" y="95" font-size="14">+</text>
  <text x="30" y="260" font-size="14">−</text>

  <!-- Wire from + to point P -->
  <line x1="50" y1="110" x2="150" y2="110" stroke="black" stroke-width="2"/>
  <circle cx="150" cy="110" r="4" fill="black"/>
  <text x="155" y="105" font-size="14" font-weight="bold">P</text>

  <!-- C1 (8μF) - vertical from P -->
  <line x1="150" y1="110" x2="150" y2="150" stroke="black" stroke-width="2"/>
  <line x1="135" y1="150" x2="165" y2="150" stroke="black" stroke-width="3"/>
  <line x1="135" y1="155" x2="165" y2="155" stroke="black" stroke-width="3"/>
  <line x1="150" y1="155" x2="150" y2="180" stroke="black" stroke-width="2"/>
  <text x="170" y="155" font-size="13">C₁=8μF</text>

  <!-- C3 (8μF) - horizontal from P to right -->
  <line x1="150" y1="110" x2="280" y2="110" stroke="black" stroke-width="2"/>
  <line x1="280" y1="95" x2="280" y2="125" stroke="black" stroke-width="3"/>
  <line x1="285" y1="95" x2="285" y2="125" stroke="black" stroke-width="3"/>
  <line x1="285" y1="110" x2="320" y2="110" stroke="black" stroke-width="2"/>
  <text x="290" y="90" font-size="13">C₃=8μF</text>

  <!-- C2 (6μF) - vertical right branch -->
  <line x1="320" y1="110" x2="320" y2="150" stroke="black" stroke-width="2"/>
  <line x1="305" y1="150" x2="335" y2="150" stroke="black" stroke-width="3"/>
  <line x1="305" y1="155" x2="335" y2="155" stroke="black" stroke-width="3"/>
  <line x1="320" y1="155" x2="320" y2="180" stroke="black" stroke-width="2"/>
  <text x="340" y="155" font-size="13">C₂=6μF</text>

  <!-- Junction at bottom -->
  <line x1="150" y1="180" x2="320" y2="180" stroke="black" stroke-width="2"/>
  <circle cx="235" cy="180" r="4" fill="black"/>

  <!-- Switch S -->
  <line x1="235" y1="180" x2="235" y2="220" stroke="black" stroke-width="2"/>
  <line x1="235" y1="220" x2="260" y2="210" stroke="black" stroke-width="3"/>
  <circle cx="235" cy="220" r="3" fill="black"/>
  <circle cx="235" cy="250" r="3" fill="black"/>
  <text x="265" y="220" font-size="13" font-weight="bold">S</text>
  <text x="245" y="235" font-size="11" fill="blue">(initially open)</text>

  <!-- C4 (6μF, uncharged) below switch -->
  <line x1="235" y1="250" x2="235" y2="270" stroke="black" stroke-width="2"/>
  <line x1="220" y1="270" x2="250" y2="270" stroke="black" stroke-width="3"/>
  <line x1="220" y1="275" x2="250" y2="275" stroke="black" stroke-width="3"/>
  <line x1="235" y1="275" x2="235" y2="295" stroke="black" stroke-width="2"/>
  <text x="255" y="275" font-size="13">C₄=6μF</text>
  <text x="255" y="290" font-size="11" fill="red">(uncharged)</text>

  <!-- Wire back to battery negative -->
  <line x1="235" y1="295" x2="235" y2="320" stroke="black" stroke-width="2"/>
  <line x1="235" y1="320" x2="50" y2="320" stroke="black" stroke-width="2"/>
  <line x1="50" y1="320" x2="50" y2="240" stroke="black" stroke-width="2"/>

  <!-- Title and notes -->
  <text x="400" y="50" font-size="14" font-weight="bold">Initial Configuration:</text>
  <text x="400" y="75" font-size="12">• Switch S is OPEN</text>
  <text x="400" y="95" font-size="12">• C₁ and C₃ in series</text>
  <text x="400" y="115" font-size="12">• This combination || with C₂</text>
  <text x="400" y="135" font-size="12">• C₄ isolated (uncharged)</text>
  <text x="400" y="170" font-size="14" font-weight="bold" fill="blue">When S closes:</text>
  <text x="400" y="190" font-size="12">• C₄ connects to circuit</text>
  <text x="400" y="210" font-size="12">• Charge redistributes</text>
</svg>'''

def create_q2_capacitor_graph():
    """Q2: V1 vs C3 graph for variable capacitor"""
    return '''<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Circuit diagram (small, top) -->
  <g transform="translate(50, 30)">
    <text x="0" y="0" font-size="13" font-weight="bold">Circuit:</text>
    <rect x="10" y="10" width="30" height="20" fill="none" stroke="black" stroke-width="1.5"/>
    <text x="15" y="25" font-size="10">V</text>
    <line x1="40" y1="20" x2="60" y2="20" stroke="black" stroke-width="1.5"/>
    <rect x="60" y="10" width="20" height="20" fill="lightblue" stroke="black" stroke-width="1.5"/>
    <text x="63" y="25" font-size="9">C₁</text>
    <line x1="80" y1="20" x2="100" y2="20" stroke="black" stroke-width="1.5"/>
    <circle cx="100" cy="20" r="3" fill="black"/>
    <line x1="100" y1="20" x2="100" y2="40" stroke="black" stroke-width="1.5"/>
    <rect x="90" y="40" width="20" height="20" fill="lightgreen" stroke="black" stroke-width="1.5"/>
    <text x="93" y="55" font-size="9">C₂</text>
    <line x1="100" y1="20" x2="120" y2="20" stroke="black" stroke-width="1.5"/>
    <rect x="120" y="10" width="20" height="20" fill="yellow" stroke="black" stroke-width="1.5"/>
    <text x="123" y="25" font-size="9">C₃</text>
    <line x1="140" y1="20" x2="160" y2="20" stroke="black" stroke-width="1.5"/>
    <line x1="160" y1="20" x2="160" y2="60" stroke="black" stroke-width="1.5"/>
    <line x1="100" y1="60" x2="160" y2="60" stroke="black" stroke-width="1.5"/>
    <line x1="10" y1="30" x2="10" y2="60" stroke="black" stroke-width="1.5"/>
    <line x1="10" y1="60" x2="100" y2="60" stroke="black" stroke-width="1.5"/>
    <text x="170" y="25" font-size="11" fill="red">C₃ variable</text>
  </g>

  <!-- Graph axes -->
  <line x1="80" y1="350" x2="550" y2="350" stroke="black" stroke-width="2"/>
  <line x1="80" y1="350" x2="80" y2="120" stroke="black" stroke-width="2"/>

  <!-- Arrows on axes -->
  <polygon points="550,350 545,345 545,355" fill="black"/>
  <polygon points="80,120 75,125 85,125" fill="black"/>

  <!-- X-axis labels (C₃ in μF) -->
  <text x="70" y="370" font-size="13">0</text>
  <line x1="80" y1="350" x2="80" y2="355" stroke="black" stroke-width="2"/>

  <text x="200" y="370" font-size="13">6</text>
  <line x1="210" y1="350" x2="210" y2="355" stroke="black" stroke-width="2"/>

  <text x="325" y="370" font-size="13">12</text>
  <line x1="340" y1="350" x2="340" y2="355" stroke="black" stroke-width="2"/>
  <text x="323" y="385" font-size="11" fill="blue">C₃ₛ=12.0</text>

  <text x="460" y="370" font-size="13">18</text>
  <line x1="470" y1="350" x2="470" y2="355" stroke="black" stroke-width="2"/>

  <text x="280" y="400" font-size="15" font-weight="bold">C₃ (μF)</text>

  <!-- Y-axis labels (V₁ in V) -->
  <text x="55" y="355" font-size="13">0</text>
  <line x1="75" y1="350" x2="80" y2="350" stroke="black" stroke-width="2"/>

  <text x="50" y="310" font-size="13">2</text>
  <line x1="75" y1="305" x2="80" y2="305" stroke="black" stroke-width="2"/>

  <text x="50" y="265" font-size="13">4</text>
  <line x1="75" y1="260" x2="80" y2="260" stroke="black" stroke-width="2"/>

  <text x="50" y="220" font-size="13">6</text>
  <line x1="75" y1="215" x2="80" y2="215" stroke="black" stroke-width="2"/>

  <text x="50" y="175" font-size="13">8</text>
  <line x1="75" y1="170" x2="80" y2="170" stroke="black" stroke-width="2"/>

  <text x="45" y="135" font-size="13">10</text>
  <line x1="75" y1="130" x2="80" y2="130" stroke="black" stroke-width="2"/>

  <text x="30" y="240" font-size="15" font-weight="bold" transform="rotate(-90 40 240)">V₁ (V)</text>

  <!-- Curve: V₁ increases from 0 and approaches asymptote at 10V -->
  <!-- V₁ = 10 * C₃/(C₃ + some constant) type behavior -->
  <path d="M 80,350 Q 150,300 210,260 Q 270,200 340,160 Q 410,140 470,133 L 540,130"
        fill="none" stroke="blue" stroke-width="3"/>

  <!-- Key point marked: (6μF, 4V) -->
  <circle cx="210" cy="260" r="5" fill="red"/>
  <text x="220" y="255" font-size="11" fill="red">(6, 4)</text>

  <!-- Asymptote at V₁ = 10V -->
  <line x1="80" y1="130" x2="550" y2="130" stroke="red" stroke-width="1.5" stroke-dasharray="5,5"/>
  <text x="450" y="120" font-size="12" fill="red" font-weight="bold">Asymptote: V₁→10V</text>

  <!-- Title -->
  <text x="200" y="30" font-size="16" font-weight="bold">Electric Potential V₁ vs C₃</text>
  <text x="180" y="50" font-size="12">V₁ approaches 10V as C₃ → ∞</text>
</svg>'''

def create_q3_parallel_plate_dielectric():
    """Q3: Parallel-plate capacitor with three dielectrics"""
    return '''<svg width="550" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="20" y="25" font-size="15" font-weight="bold">Parallel-Plate Capacitor with Dielectrics</text>
  <text x="20" y="45" font-size="12">A = 10.5 cm², d = 7.12 mm</text>

  <!-- Top plate -->
  <rect x="100" y="80" width="350" height="15" fill="#FFD700" stroke="black" stroke-width="2"/>
  <text x="230" y="75" font-size="13" font-weight="bold">Top Plate (+)</text>

  <!-- Left half: κ₁ = 21.0 -->
  <rect x="100" y="95" width="175" height="180" fill="#87CEEB" stroke="black" stroke-width="2"/>
  <text x="150" y="145" font-size="14" font-weight="bold">κ₁ = 21.0</text>
  <text x="140" y="165" font-size="11">(Left Half)</text>
  <text x="130" y="185" font-size="11">Area = A/2</text>
  <text x="130" y="200" font-size="11">= 5.25 cm²</text>
  <text x="135" y="220" font-size="11">Full height d</text>

  <!-- Right half top: κ₂ = 42.0 -->
  <rect x="275" y="95" width="175" height="90" fill="#FFB6C1" stroke="black" stroke-width="2"/>
  <text x="315" y="135" font-size="14" font-weight="bold">κ₂ = 42.0</text>
  <text x="315" y="155" font-size="11">(Top half)</text>
  <text x="305" y="170" font-size="11">Area = A/4</text>

  <!-- Right half bottom: κ₃ = 58.0 -->
  <rect x="275" y="185" width="175" height="90" fill="#98FB98" stroke="black" stroke-width="2"/>
  <text x="315" y="225" font-size="14" font-weight="bold">κ₃ = 58.0</text>
  <text x="305" y="245" font-size="11">(Bottom half)</text>
  <text x="305" y="260" font-size="11">Area = A/4</text>

  <!-- Bottom plate -->
  <rect x="100" y="275" width="350" height="15" fill="#FFD700" stroke="black" stroke-width="2"/>
  <text x="220" y="310" font-size="13" font-weight="bold">Bottom Plate (−)</text>

  <!-- Dimension arrows -->
  <line x1="90" y1="95" x2="90" y2="275" stroke="black" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
  <text x="50" y="190" font-size="12" font-weight="bold">d</text>

  <!-- Vertical divider -->
  <line x1="275" y1="80" x2="275" y2="290" stroke="black" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="280" y="100" font-size="10" fill="red">↓</text>
  <text x="280" y="285" font-size="10" fill="red">↑</text>

  <!-- Horizontal divider in right half -->
  <line x1="275" y1="185" x2="450" y2="185" stroke="black" stroke-width="2"/>

  <!-- Configuration box -->
  <rect x="20" y="330" width="520" height="55" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="30" y="350" font-size="12" font-weight="bold">Configuration:</text>
  <text x="30" y="368" font-size="11">• Left half (50%): uniform dielectric κ₁ = 21.0</text>
  <text x="30" y="382" font-size="11">• Right half: top quarter κ₂ = 42.0, bottom quarter κ₃ = 58.0</text>

  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
      <polygon points="0,0 10,5 0,10" fill="black"/>
    </marker>
  </defs>
</svg>'''

def create_q4_parallel_plate_dielectric_v2():
    """Q4: Similar to Q3 but with 2d separation"""
    return '''<svg width="550" height="420" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="20" y="25" font-size="15" font-weight="bold">Parallel-Plate Capacitor with Dielectrics</text>
  <text x="20" y="45" font-size="12">A = 10.5 cm², separation = 2d = 7.12 mm</text>

  <!-- Top plate -->
  <rect x="100" y="80" width="350" height="15" fill="#FFD700" stroke="black" stroke-width="2"/>
  <text x="230" y="75" font-size="13" font-weight="bold">Top Plate (+)</text>

  <!-- Left half: κ₁ = 21.0 (full height 2d) -->
  <rect x="100" y="95" width="175" height="200" fill="#87CEEB" stroke="black" stroke-width="2"/>
  <text x="150" y="160" font-size="14" font-weight="bold">κ₁ = 21.0</text>
  <text x="140" y="180" font-size="11">(Left Half)</text>
  <text x="130" y="200" font-size="11">Area = A/2</text>
  <text x="120" y="220" font-size="11">Full height = 2d</text>

  <!-- Right half top: κ₂ = 42.0 (height d) -->
  <rect x="275" y="95" width="175" height="100" fill="#FFB6C1" stroke="black" stroke-width="2"/>
  <text x="315" y="140" font-size="14" font-weight="bold">κ₂ = 42.0</text>
  <text x="320" y="160" font-size="11">(Top region)</text>
  <text x="310" y="175" font-size="11">Height = d</text>

  <!-- Right half bottom: κ₃ = 58.0 (height d) -->
  <rect x="275" y="195" width="175" height="100" fill="#98FB98" stroke="black" stroke-width="2"/>
  <text x="315" y="240" font-size="14" font-weight="bold">κ₃ = 58.0</text>
  <text x="310" y="260" font-size="11">(Bottom region)</text>
  <text x="310" y="275" font-size="11">Height = d</text>

  <!-- Bottom plate -->
  <rect x="100" y="295" width="350" height="15" fill="#FFD700" stroke="black" stroke-width="2"/>
  <text x="220" y="330" font-size="13" font-weight="bold">Bottom Plate (−)</text>

  <!-- Dimension arrows -->
  <line x1="85" y1="95" x2="85" y2="195" stroke="red" stroke-width="2"/>
  <text x="55" y="150" font-size="12" font-weight="bold" fill="red">d</text>
  <line x1="85" y1="195" x2="85" y2="295" stroke="red" stroke-width="2"/>
  <text x="55" y="250" font-size="12" font-weight="bold" fill="red">d</text>

  <line x1="90" y1="95" x2="90" y2="295" stroke="black" stroke-width="1.5"/>
  <text x="68" y="200" font-size="11" font-weight="bold">2d</text>

  <!-- Vertical divider -->
  <line x1="275" y1="80" x2="275" y2="310" stroke="black" stroke-width="3" stroke-dasharray="6,3"/>

  <!-- Horizontal divider in right half -->
  <line x1="275" y1="195" x2="450" y2="195" stroke="black" stroke-width="2"/>

  <!-- Configuration box -->
  <rect x="20" y="350" width="520" height="60" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="30" y="370" font-size="12" font-weight="bold">Configuration:</text>
  <text x="30" y="388" font-size="11">• Left half (50%): uniform dielectric κ₁ = 21.0, full height 2d</text>
  <text x="30" y="402" font-size="11">• Right half: divided at height d — top: κ₂ = 42.0, bottom: κ₃ = 58.0</text>
</svg>'''

def create_q5_variable_capacitor_graph():
    """Q5: V1 vs C3 graph with specific data point"""
    return '''<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Circuit diagram (small, top) -->
  <g transform="translate(50, 30)">
    <text x="0" y="0" font-size="13" font-weight="bold">Circuit Configuration:</text>
    <rect x="10" y="10" width="30" height="20" fill="none" stroke="black" stroke-width="1.5"/>
    <text x="15" y="25" font-size="10">V</text>
    <text x="13" y="8" font-size="9">+</text>
    <line x1="40" y1="20" x2="65" y2="20" stroke="black" stroke-width="1.5"/>
    <rect x="65" y="10" width="25" height="20" fill="lightblue" stroke="black" stroke-width="1.5"/>
    <text x="70" y="25" font-size="9">C₁</text>
    <line x1="90" y1="20" x2="110" y2="20" stroke="black" stroke-width="1.5"/>
    <circle cx="110" cy="20" r="3" fill="black"/>
    <line x1="110" y1="20" x2="110" y2="45" stroke="black" stroke-width="1.5"/>
    <rect x="97" y="45" width="25" height="20" fill="lightgreen" stroke="black" stroke-width="1.5"/>
    <text x="102" y="60" font-size="9">C₂</text>
    <line x1="110" y1="20" x2="140" y2="20" stroke="black" stroke-width="1.5"/>
    <rect x="140" y="10" width="25" height="20" fill="yellow" stroke="black" stroke-width="1.5"/>
    <text x="145" y="25" font-size="9">C₃</text>
    <text x="170" y="25" font-size="10" fill="red" font-weight="bold">variable</text>
  </g>

  <!-- Graph axes -->
  <line x1="80" y1="370" x2="550" y2="370" stroke="black" stroke-width="2"/>
  <line x1="80" y1="370" x2="80" y2="130" stroke="black" stroke-width="2"/>

  <!-- Arrows -->
  <polygon points="550,370 545,365 545,375" fill="black"/>
  <polygon points="80,130 75,135 85,135" fill="black"/>

  <!-- X-axis (C₃ in μF) -->
  <text x="70" y="390" font-size="13">0</text>
  <line x1="80" y1="370" x2="80" y2="375" stroke="black" stroke-width="2"/>

  <text x="140" y="390" font-size="13">3</text>
  <line x1="150" y1="370" x2="150" y2="375" stroke="black" stroke-width="2"/>

  <text x="200" y="390" font-size="13">6</text>
  <line x1="210" y1="370" x2="210" y2="375" stroke="black" stroke-width="2"/>

  <text x="260" y="390" font-size="13">9</text>
  <line x1="270" y1="370" x2="270" y2="375" stroke="black" stroke-width="2"/>

  <text x="315" y="390" font-size="13">12</text>
  <line x1="330" y1="370" x2="330" y2="375" stroke="black" stroke-width="2"/>
  <text x="313" y="405" font-size="11" fill="blue">C₃ₛ=12.0μF</text>

  <text x="380" y="390" font-size="13">15</text>
  <line x1="390" y1="370" x2="390" y2="375" stroke="black" stroke-width="2"/>

  <text x="280" y="420" font-size="15" font-weight="bold">C₃ (μF)</text>

  <!-- Y-axis (V₁ in V) -->
  <text x="55" y="375" font-size="13">0</text>
  <text x="50" y="330" font-size="13">2</text>
  <line x1="75" y1="325" x2="80" y2="325" stroke="black" stroke-width="2"/>

  <text x="50" y="285" font-size="13">4</text>
  <line x1="75" y1="280" x2="80" y2="280" stroke="black" stroke-width="2"/>

  <text x="50" y="240" font-size="13">6</text>
  <line x1="75" y1="235" x2="80" y2="235" stroke="black" stroke-width="2"/>

  <text x="50" y="195" font-size="13">8</text>
  <line x1="75" y1="190" x2="80" y2="190" stroke="black" stroke-width="2"/>

  <text x="45" y="155" font-size="13">10</text>
  <line x1="75" y1="150" x2="80" y2="150" stroke="black" stroke-width="2"/>

  <text x="28" y="260" font-size="15" font-weight="bold" transform="rotate(-90 38 260)">V₁ (V)</text>

  <!-- Curve -->
  <path d="M 80,370 Q 120,330 150,300 Q 180,285 210,280 Q 270,265 330,175 Q 390,158 450,152 L 540,150"
        fill="none" stroke="blue" stroke-width="3"/>

  <!-- Key point: (6μF, 4V) -->
  <circle cx="210" cy="280" r="6" fill="red" stroke="darkred" stroke-width="2"/>
  <text x="220" y="275" font-size="12" fill="red" font-weight="bold">(6.0, 4.0)</text>
  <line x1="210" y1="280" x2="210" y2="375" stroke="red" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="210" y1="280" x2="75" y2="280" stroke="red" stroke-width="1" stroke-dasharray="3,2"/>

  <!-- Asymptote -->
  <line x1="80" y1="150" x2="550" y2="150" stroke="red" stroke-width="1.5" stroke-dasharray="5,5"/>
  <text x="420" y="140" font-size="12" fill="red" font-weight="bold">Asymptote: V₁→10V</text>

  <!-- Title -->
  <text x="180" y="115" font-size="16" font-weight="bold">V₁ vs C₃ for Variable Capacitor</text>
</svg>'''

def create_q6_switches_circuit():
    """Q6: Circuit with two switches S1 and S2"""
    return '''<svg width="650" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Battery -->
  <rect x="50" y="150" width="40" height="80" fill="none" stroke="black" stroke-width="2"/>
  <line x1="60" y1="160" x2="80" y2="160" stroke="black" stroke-width="3"/>
  <line x1="60" y1="220" x2="80" y2="220" stroke="black" stroke-width="2"/>
  <text x="95" y="195" font-size="16" font-weight="bold">12.0 V</text>
  <text x="30" y="165" font-size="14">+</text>
  <text x="30" y="228" font-size="14">−</text>

  <!-- Wire from + terminal -->
  <line x1="70" y1="150" x2="70" y2="100" stroke="black" stroke-width="2"/>
  <line x1="70" y1="100" x2="200" y2="100" stroke="black" stroke-width="2"/>
  <circle cx="200" cy="100" r="4" fill="black"/>

  <!-- Branch 1 with S1 -->
  <line x1="200" y1="100" x2="280" y2="100" stroke="black" stroke-width="2"/>

  <!-- Switch S1 -->
  <line x1="280" y1="100" x2="310" y2="85" stroke="black" stroke-width="3"/>
  <circle cx="280" cy="100" r="3" fill="black"/>
  <circle cx="320" cy="100" r="3" fill="black"/>
  <text x="290" y="75" font-size="13" font-weight="bold">S₁</text>

  <line x1="320" y1="100" x2="350" y2="100" stroke="black" stroke-width="2"/>

  <!-- C1 (1.00 μF) vertical -->
  <line x1="350" y1="100" x2="350" y2="140" stroke="black" stroke-width="2"/>
  <line x1="335" y1="140" x2="365" y2="140" stroke="black" stroke-width="3"/>
  <line x1="335" y1="145" x2="365" y2="145" stroke="black" stroke-width="3"/>
  <line x1="350" y1="145" x2="350" y2="180" stroke="black" stroke-width="2"/>
  <text x="370" y="145" font-size="13">C₁=1.00μF</text>

  <!-- C3 (3.00 μF) vertical -->
  <line x1="350" y1="180" x2="350" y2="220" stroke="black" stroke-width="2"/>
  <line x1="335" y1="220" x2="365" y2="220" stroke="black" stroke-width="3"/>
  <line x1="335" y1="225" x2="365" y2="225" stroke="black" stroke-width="3"/>
  <line x1="350" y1="225" x2="350" y2="260" stroke="black" stroke-width="2"/>
  <text x="370" y="225" font-size="13">C₃=3.00μF</text>

  <!-- Branch 2 with S2 -->
  <line x1="200" y1="100" x2="200" y2="180" stroke="black" stroke-width="2"/>
  <line x1="200" y1="180" x2="280" y2="180" stroke="black" stroke-width="2"/>

  <!-- Switch S2 -->
  <line x1="280" y1="180" x2="310" y2="165" stroke="black" stroke-width="3"/>
  <circle cx="280" cy="180" r="3" fill="black"/>
  <circle cx="320" cy="180" r="3" fill="black"/>
  <text x="290" y="155" font-size="13" font-weight="bold">S₂</text>

  <line x1="320" y1="180" x2="480" y2="180" stroke="black" stroke-width="2"/>

  <!-- C2 (2.00 μF) vertical -->
  <line x1="480" y1="180" x2="480" y2="140" stroke="black" stroke-width="2"/>
  <line x1="465" y1="140" x2="495" y2="140" stroke="black" stroke-width="3"/>
  <line x1="465" y1="145" x2="495" y2="145" stroke="black" stroke-width="3"/>
  <line x1="480" y1="145" x2="480" y2="100" stroke="black" stroke-width="2"/>
  <text x="500" y="145" font-size="13">C₂=2.00μF</text>

  <!-- C4 (4.00 μF) vertical -->
  <line x1="480" y1="180" x2="480" y2="220" stroke="black" stroke-width="2"/>
  <line x1="465" y1="220" x2="495" y2="220" stroke="black" stroke-width="3"/>
  <line x1="465" y1="225" x2="495" y2="225" stroke="black" stroke-width="3"/>
  <line x1="480" y1="225" x2="480" y2="260" stroke="black" stroke-width="2"/>
  <text x="500" y="225" font-size="13">C₄=4.00μF</text>

  <!-- Join branches at bottom -->
  <line x1="350" y1="260" x2="480" y2="260" stroke="black" stroke-width="2"/>
  <circle cx="415" cy="260" r="4" fill="black"/>

  <!-- Return to battery -->
  <line x1="415" y1="260" x2="415" y2="340" stroke="black" stroke-width="2"/>
  <line x1="415" y1="340" x2="70" y2="340" stroke="black" stroke-width="2"/>
  <line x1="70" y1="340" x2="70" y2="230" stroke="black" stroke-width="2"/>

  <!-- Title and notes -->
  <text x="200" y="30" font-size="15" font-weight="bold">Two-Switch Capacitor Circuit</text>
  <text x="150" y="50" font-size="12">Four uncharged capacitors, two switches</text>

  <!-- Question box -->
  <rect x="30" y="370" width="590" height="70" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="390" font-size="12" font-weight="bold">Questions:</text>
  <text x="40" y="408" font-size="11">• If only S₁ is closed: What is the charge on each capacitor?</text>
  <text x="40" y="424" font-size="11">• If both S₁ and S₂ are closed: What is the charge on each capacitor?</text>

  <!-- Branch labels -->
  <text x="320" y="120" font-size="11" fill="blue">Branch 1: C₁ in series with C₃</text>
  <text x="380" y="200" font-size="11" fill="green">Branch 2: C₂ in series with C₄</text>
</svg>'''

def create_q7_two_spheres():
    """Q7: Two conducting spheres connected by wire"""
    return '''<svg width="650" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Two Conducting Spheres Connected by Wire</text>

  <!-- Initial state (top) -->
  <text x="50" y="60" font-size="13" font-weight="bold" fill="blue">Initial State (far apart):</text>

  <!-- Sphere 1 -->
  <circle cx="150" cy="130" r="40" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="135" y="135" font-size="14" font-weight="bold">+q₁</text>
  <text x="125" y="185" font-size="12">R₁ = 0.500 m</text>
  <text x="115" y="200" font-size="12">q₁ = +2.00 μC</text>

  <!-- Sphere 2 -->
  <circle cx="350" cy="130" r="60" fill="lightgreen" stroke="black" stroke-width="2"/>
  <text x="335" y="135" font-size="14" font-weight="bold">+q₂</text>
  <text x="315" y="210" font-size="12">R₂ = 1.00 m</text>
  <text x="305" y="225" font-size="12">q₂ = +1.00 μC</text>

  <!-- Distance indicator -->
  <text x="230" y="120" font-size="11" fill="red">far apart</text>

  <!-- Arrow down -->
  <line x1="500" y1="100" x2="500" y2="240" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="510" y="170" font-size="12">Connect</text>
  <text x="510" y="185" font-size="12">with wire</text>

  <!-- Final state (bottom) -->
  <text x="50" y="270" font-size="13" font-weight="bold" fill="green">Final State (equilibrium):</text>

  <!-- Sphere 1 after -->
  <circle cx="150" cy="330" r="40" fill="#FFE4B5" stroke="black" stroke-width="2"/>
  <text x="135" y="335" font-size="14" font-weight="bold">q₁′</text>
  <text x="125" y="385" font-size="12">R₁ = 0.500 m</text>

  <!-- Wire connecting -->
  <line x1="190" y1="330" x2="290" y2="330" stroke="black" stroke-width="2"/>
  <text x="220" y="320" font-size="10">thin wire</text>

  <!-- Sphere 2 after -->
  <circle cx="350" cy="330" r="60" fill="#FFE4B5" stroke="black" stroke-width="2"/>
  <text x="335" y="335" font-size="14" font-weight="bold">q₂′</text>
  <text x="315" y="410" font-size="12">R₂ = 1.00 m</text>

  <!-- Equilibrium conditions -->
  <rect x="420" y="280" width="220" height="115" fill="#E6F3FF" stroke="black" stroke-width="1.5"/>
  <text x="430" y="300" font-size="12" font-weight="bold">At Equilibrium:</text>
  <text x="430" y="318" font-size="11">• Same potential V</text>
  <text x="430" y="334" font-size="11">• q₁′ + q₂′ = q₁ + q₂</text>
  <text x="435" y="350" font-size="11">= 3.00 μC</text>
  <text x="430" y="370" font-size="11" font-weight="bold">Find:</text>
  <text x="430" y="386" font-size="11">(a) q₁′ = ?</text>

  <!-- Arrow marker -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="black"/>
    </marker>
  </defs>
</svg>'''

def create_q8_three_particle_energy():
    """Q8: Three charged particles - potential energy vs position"""
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
  <line x1="150" y1="75" x2="350" y2="75" stroke="red" stroke-width="2" marker-start="url(#arrow2)" marker-end="url(#arrow2)"/>
  <text x="230" y="70" font-size="12" font-weight="bold" fill="red">d = 4.0 cm</text>

  <!-- Particle 3 (movable) -->
  <circle cx="500" cy="100" r="12" fill="green" stroke="black" stroke-width="2"/>
  <text x="495" y="105" font-size="11" font-weight="bold" fill="white">3</text>
  <text x="480" y="130" font-size="12">q₃ = ?</text>
  <text x="475" y="145" font-size="11">(movable)</text>
  <line x1="500" y1="112" x2="500" y2="125" stroke="black" stroke-width="1"/>
  <text x="495" y="85" font-size="11">x</text>
  <line x1="490" y1="100" x2="510" y2="100" stroke="green" stroke-width="3"/>
  <line x1="500" y1="90" x2="500" y2="110" stroke="green" stroke-width="3"/>

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
  <text x="28" y="305" font-size="13" font-weight="bold" transform="rotate(-90 35 305)">U (J)</text>

  <!-- Energy curve (complex shape) -->
  <path d="M 80,380 Q 100,350 150,310 Q 200,280 250,325 Q 300,360 350,340 Q 400,320 450,300 Q 500,285 550,275"
        fill="none" stroke="purple" stroke-width="3"/>

  <!-- Mark the scale point -->
  <line x1="75" y1="325" x2="585" y2="325" stroke="blue" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="500" y="320" font-size="10" fill="blue">Uₛ = 5.0 J</text>

  <!-- Question box -->
  <rect x="50" y="425" width="550" height="20" fill="#FFF9E6" stroke="black" stroke-width="1"/>
  <text x="60" y="439" font-size="11" font-weight="bold">Determine: charge q₃ of particle 3</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="red"/>
    </marker>
  </defs>
</svg>'''

def create_q9_semi_infinite_rod():
    """Q9: Semi-infinite rod with electric field at point P"""
    return '''<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Semi-Infinite Charged Rod</text>
  <text x="180" y="45" font-size="12">Electric Field at Point P</text>

  <!-- Coordinate axes -->
  <line x1="100" y1="280" x2="550" y2="280" stroke="black" stroke-width="2"/>
  <line x1="100" y1="280" x2="100" y2="80" stroke="black" stroke-width="2"/>
  <polygon points="550,280 545,275 545,285" fill="black"/>
  <polygon points="100,80 95,85 105,85" fill="black"/>
  <text x="560" y="285" font-size="14" font-weight="bold">x</text>
  <text x="90" y="70" font-size="14" font-weight="bold">y</text>

  <!-- Origin -->
  <circle cx="100" cy="280" r="3" fill="black"/>
  <text x="75" y="300" font-size="12" font-weight="bold">O (0,0)</text>

  <!-- Semi-infinite rod along positive x-axis -->
  <line x1="100" y1="280" x2="540" y2="280" stroke="red" stroke-width="8"/>
  <text x="450" y="265" font-size="12" fill="red" font-weight="bold">Rod (extends to +∞)</text>
  <text x="290" y="300" font-size="11">Uniform charge density λ</text>

  <!-- Arrow indicating extension -->
  <polygon points="540,280 530,275 530,285" fill="red"/>

  <!-- Point P on y-axis -->
  <circle cx="100" cy="150" r="6" fill="blue" stroke="darkblue" stroke-width="2"/>
  <text x="110" y="155" font-size="14" font-weight="bold">P</text>

  <!-- Distance R -->
  <line x1="100" y1="280" x2="100" y2="150" stroke="blue" stroke-width="2" marker-start="url(#arrow3)" marker-end="url(#arrow3)"/>
  <text x="65" y="220" font-size="13" font-weight="bold" fill="blue">R</text>

  <!-- Electric field components at P -->
  <!-- E parallel to rod (x-direction) -->
  <line x1="100" y1="150" x2="180" y2="150" stroke="green" stroke-width="3" marker-end="url(#arrowgreen)"/>
  <text x="140" y="140" font-size="12" fill="green">E∥</text>
  <text x="120" y="170" font-size="10" fill="green">(parallel to rod)</text>

  <!-- E perpendicular to rod (y-direction) -->
  <line x1="100" y1="150" x2="100" y2="100" stroke="orange" stroke-width="3" marker-end="url(#arroworange)"/>
  <text x="105" y="125" font-size="12" fill="orange">E⊥</text>
  <text x="105" y="110" font-size="10" fill="orange">(perpendicular)</text>

  <!-- Result angle -->
  <path d="M 130,150 Q 130,135 115,135" fill="none" stroke="purple" stroke-width="2"/>
  <text x="135" y="145" font-size="12" fill="purple" font-weight="bold">45°</text>

  <!-- Result box -->
  <rect x="300" y="90" width="270" height="100" fill="#E6F3FF" stroke="black" stroke-width="2"/>
  <text x="310" y="110" font-size="13" font-weight="bold">Result to Show:</text>
  <text x="310" y="130" font-size="12">Electric field E⃗ at P makes</text>
  <text x="310" y="148" font-size="12" font-weight="bold">angle of 45° with the rod</text>
  <text x="310" y="168" font-size="11">(independent of distance R)</text>

  <!-- Hint box -->
  <rect x="50" y="330" width="500" height="55" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="60" y="350" font-size="12" font-weight="bold">Hint:</text>
  <text x="60" y="368" font-size="11">Separately find E∥ (component parallel to rod) and</text>
  <text x="60" y="382" font-size="11">E⊥ (component perpendicular to rod), then find angle θ = arctan(E⊥/E∥)</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow3" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <polygon points="0,0 8,4 0,8" fill="blue"/>
    </marker>
    <marker id="arrowgreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="green"/>
    </marker>
    <marker id="arroworange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="orange"/>
    </marker>
  </defs>
</svg>'''

def create_q10_work_charges():
    """Q10: Work to bring charge Q from infinity to point P"""
    return '''<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="150" y="25" font-size="15" font-weight="bold">Work to Bring Charge from Infinity</text>

  <!-- Fixed charges -->
  <!-- Charge q1 -->
  <circle cx="200" cy="200" r="18" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="190" y="208" font-size="14" font-weight="bold">+q₁</text>
  <text x="175" y="240" font-size="12">q₁ = +4e</text>
  <text x="165" y="255" font-size="11">= +6.4×10⁻¹⁹ C</text>

  <!-- Charge q2 -->
  <circle cx="420" cy="300" r="18" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="410" y="308" font-size="14" font-weight="bold">−q₂</text>
  <text x="395" y="335" font-size="12">q₂ = -2e</text>
  <text x="385" y="350" font-size="11">= -3.2×10⁻¹⁹ C</text>

  <!-- Point P -->
  <circle cx="280" cy="150" r="8" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="290" y="155" font-size="14" font-weight="bold">P</text>

  <!-- Distance from q1 to P -->
  <line x1="200" y1="200" x2="280" y2="150" stroke="green" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="220" y="165" font-size="12" font-weight="bold" fill="green">d = 1.40 cm</text>

  <!-- Distance from q2 to P -->
  <line x1="420" y1="300" x2="280" y2="150" stroke="blue" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="340" y="240" font-size="12" font-weight="bold" fill="blue">2.00d = 2.80 cm</text>

  <!-- Charge Q coming from infinity -->
  <circle cx="500" cy="80" r="15" fill="gold" stroke="black" stroke-width="2"/>
  <text x="492" y="87" font-size="13" font-weight="bold">Q</text>
  <text x="470" y="110" font-size="11">Q = +16e</text>

  <!-- Dashed line showing path -->
  <line x1="500" y1="80" x2="380" y2="110" stroke="purple" stroke-width="2" stroke-dasharray="8,4" marker-end="url(#arrow4)"/>
  <line x1="380" y1="110" x2="280" y2="150" stroke="purple" stroke-width="2" stroke-dasharray="8,4" marker-end="url(#arrow4)"/>
  <text x="400" y="95" font-size="11" fill="purple">Path from ∞</text>

  <!-- Infinity symbol -->
  <text x="520" y="65" font-size="20" font-weight="bold">∞</text>

  <!-- Work annotation -->
  <text x="340" y="130" font-size="12" fill="purple" font-weight="bold">W = ?</text>

  <!-- Data box -->
  <rect x="30" y="90" width="140" height="110" fill="#E6F3FF" stroke="black" stroke-width="1.5"/>
  <text x="40" y="110" font-size="12" font-weight="bold">Given:</text>
  <text x="40" y="128" font-size="11">q₁ = +4e</text>
  <text x="40" y="144" font-size="11">q₂ = -2e</text>
  <text x="40" y="160" font-size="11">Q = +16e</text>
  <text x="40" y="176" font-size="11">d = 1.40 cm</text>
  <text x="40" y="192" font-size="11">e = 1.6×10⁻¹⁹ C</text>

  <!-- Formula box -->
  <rect x="30" y="310" width="540" height="75" fill="#FFF9E6" stroke="black" stroke-width="1.5"/>
  <text x="40" y="330" font-size="12" font-weight="bold">Work Required:</text>
  <text x="40" y="350" font-size="11">W = Q × ΔV = Q × (V_P - V_∞)</text>
  <text x="40" y="368" font-size="11">where V_P = k(q₁/d + q₂/(2d)) and V_∞ = 0</text>
  <text x="40" y="382" font-size="11">Calculate the work to bring Q from infinity to point P</text>

  <!-- Markers -->
  <defs>
    <marker id="arrow4" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0,0 10,3 0,6" fill="purple"/>
    </marker>
  </defs>
</svg>'''


# Main execution
def main():
    print("Generating detailed SVG figures for questions 1-10...")

    with open('problematic_physics_questions.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    questions = soup.find_all('div', class_='question-card')

    # Map of SVG generators
    svg_generators = {
        1: create_q1_capacitor_circuit,
        2: create_q2_capacitor_graph,
        3: create_q3_parallel_plate_dielectric,
        4: create_q4_parallel_plate_dielectric_v2,
        5: create_q5_variable_capacitor_graph,
        6: create_q6_switches_circuit,
        7: create_q7_two_spheres,
        8: create_q8_three_particle_energy,
        9: create_q9_semi_infinite_rod,
        10: create_q10_work_charges,
    }

    count = 0
    for i in range(1, 11):
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

    print(f"\n✅ Successfully added {count} detailed SVG figures (Q1-Q10)")
    print("Saved to problematic_physics_questions.html")

if __name__ == "__main__":
    main()
