# Universal Physics Diagram Generator - Usage Examples

> **Practical examples for generating diagrams from ANY physics question**

---

## 🎯 Table of Contents

1. [Mechanics Examples](#mechanics-examples)
2. [Electrostatics Examples](#electrostatics-examples)
3. [Optics Examples](#optics-examples)
4. [Magnetism Examples](#magnetism-examples)
5. [Circuits Examples](#circuits-examples)
6. [Advanced Usage](#advanced-usage)

---

## Mechanics Examples

### Example 1: Inclined Plane with Friction

**Question:**
```
A block of mass 5 kg is placed on an inclined plane at angle 30 degrees.
The coefficient of friction is μ = 0.3. Find the acceleration.
```

**Command:**
```bash
python3 generate_diagram.py "A block of mass 5 kg is placed on an inclined plane at angle 30 degrees. The coefficient of friction is μ = 0.3" -o incline_friction.svg
```

**Generated Diagram Includes:**
- ✅ Inclined plane at 30°
- ✅ Block on the plane
- ✅ Force vectors: N (normal), W (weight), f (friction)
- ✅ Point label: A (for block)
- ✅ Given Information: mass, angle, coefficient
- ✅ Legend: Vector definitions
- ❌ NO acceleration formula
- ❌ NO solution steps

---

### Example 2: Pulley System (Atwood Machine)

**Question:**
```
Two blocks of mass 3 kg and 5 kg are connected by a massless rope
over a frictionless pulley. Find the acceleration and tension.
```

**Command:**
```bash
python3 generate_diagram.py "Two blocks of mass 3 kg and 5 kg are connected by a massless rope over a frictionless pulley" -o pulley_system.svg
```

**Generated Diagram Includes:**
- ✅ Two blocks at different heights
- ✅ Pulley at top
- ✅ Rope connecting them
- ✅ Weight vectors for both blocks
- ✅ Tension vectors
- ✅ Given Information: masses, frictionless
- ❌ NO acceleration value
- ❌ NO tension formula

---

### Example 3: Projectile Motion

**Question:**
```
A projectile is launched from ground level with velocity 20 m/s at
angle 45 degrees from horizontal. Find range and maximum height.
```

**Command:**
```bash
python3 generate_diagram.py "A projectile is launched from ground level with velocity 20 m/s at angle 45 degrees from horizontal" -o projectile.svg
```

**Generated Diagram Includes:**
- ✅ Launch point O
- ✅ Parabolic trajectory
- ✅ Initial velocity vector v at 45°
- ✅ Ground line
- ✅ Given Information: v₀ = 20 m/s, θ = 45°
- ❌ NO range formula
- ❌ NO maximum height calculation

---

### Example 4: Simple Harmonic Motion

**Question:**
```
A mass m is attached to a spring of spring constant k.
The mass is displaced by distance A from equilibrium.
```

**Command:**
```bash
python3 generate_diagram.py "A mass m is attached to a spring of spring constant k. The mass is displaced by distance A from equilibrium" -o shm.svg
```

---

## Electrostatics Examples

### Example 5: Point Charge Electric Field

**Question:**
```
A point charge Q = +5.0 μC is located at the origin.
Find the electric field at point P located at distance r = 10 cm.
```

**Command:**
```bash
python3 generate_diagram.py "A point charge Q = +5.0 μC is located at the origin. Find the electric field at point P located at distance r = 10 cm" -o point_charge.svg
```

**Generated Diagram Includes:**
- ✅ Point charge Q at origin O
- ✅ Point P at distance r
- ✅ Electric field lines radiating outward
- ✅ Position vector r
- ✅ Electric field vector E
- ✅ Given Information: Q = +5.0 μC, r = 10 cm
- ❌ NO E = kQ/r² formula
- ❌ NO numerical answer

---

### Example 6: Charged Sphere with Cavity

**Question:**
```
A uniformly charged sphere of radius R has volume charge density ρ.
A spherical cavity of radius r is created inside.
The displacement from sphere center O to cavity center C is a.
```

**Command:**
```bash
python3 generate_diagram.py "A uniformly charged sphere of radius R has volume charge density ρ. A spherical cavity of radius r is created inside. The displacement from sphere center O to cavity center C is a" -o sphere_cavity.svg
```

**Generated Diagram Includes:**
- ✅ Large sphere with charge pattern
- ✅ Spherical cavity (dashed)
- ✅ Points O and C
- ✅ Vector a (O to C) with overhead arrow
- ✅ Electric field lines in cavity
- ✅ Given Information: ρ, centers defined
- ❌ NO E = ρa/(3ε₀) formula
- ❌ NO "uniform field" statement

---

### Example 7: Electric Dipole

**Question:**
```
An electric dipole consists of charges +q and -q separated by
distance 2a. Find the electric field at a point P on the axial line.
```

**Command:**
```bash
python3 generate_diagram.py "An electric dipole consists of charges +q and -q separated by distance 2a. Find the electric field at a point P on the axial line" -o dipole.svg
```

**Generated Diagram Includes:**
- ✅ Positive charge +q
- ✅ Negative charge -q
- ✅ Separation distance 2a
- ✅ Point P on axis
- ✅ Electric field vectors from each charge
- ✅ Given Information: charges, separation
- ❌ NO dipole moment p = q·2a
- ❌ NO field formula

---

### Example 8: Parallel Plate Capacitor

**Question:**
```
A parallel plate capacitor has plates of area A separated by
distance d. The plates carry charges +Q and -Q.
```

**Command:**
```bash
python3 generate_diagram.py "A parallel plate capacitor has plates of area A separated by distance d. The plates carry charges +Q and -Q" -o capacitor.svg
```

---

## Optics Examples

### Example 9: Convex Lens Image Formation

**Question:**
```
A convex lens of focal length 10 cm has an object placed at
distance 15 cm from the lens. Find the image position.
```

**Command:**
```bash
python3 generate_diagram.py "A convex lens of focal length 10 cm has an object placed at distance 15 cm from the lens" -o convex_lens.svg
```

**Generated Diagram Includes:**
- ✅ Convex lens shape
- ✅ Principal axis
- ✅ Object arrow
- ✅ Focal points F and F'
- ✅ Ray paths (parallel, through F, through center)
- ✅ Given Information: f = 10 cm, u = 15 cm
- ❌ NO lens formula 1/v - 1/u = 1/f
- ❌ NO image distance value

---

### Example 10: Concave Mirror

**Question:**
```
A concave mirror has radius of curvature R = 20 cm.
An object is placed at distance 30 cm from the pole.
```

**Command:**
```bash
python3 generate_diagram.py "A concave mirror has radius of curvature R = 20 cm. An object is placed at distance 30 cm from the pole" -o concave_mirror.svg
```

---

### Example 11: Refraction at Interface

**Question:**
```
A ray of light travels from air (n₁ = 1.0) to glass (n₂ = 1.5)
at an angle of incidence 45 degrees. Find the refraction angle.
```

**Command:**
```bash
python3 generate_diagram.py "A ray of light travels from air to glass at an angle of incidence 45 degrees. Air has n = 1.0 and glass has n = 1.5" -o refraction.svg
```

**Generated Diagram Includes:**
- ✅ Interface between air and glass
- ✅ Incident ray at 45°
- ✅ Normal line
- ✅ Refracted ray
- ✅ Given Information: n₁ = 1.0, n₂ = 1.5, θᵢ = 45°
- ❌ NO Snell's law formula
- ❌ NO refraction angle value

---

## Magnetism Examples

### Example 12: Current-Carrying Wire

**Question:**
```
A long straight wire carries current I = 5 A.
Find the magnetic field at distance r = 10 cm from the wire.
```

**Command:**
```bash
python3 generate_diagram.py "A long straight wire carries current I = 5 A. Find the magnetic field at distance r = 10 cm from the wire" -o wire_magnetic_field.svg
```

---

### Example 13: Solenoid

**Question:**
```
A solenoid has N turns per unit length and carries current I.
Find the magnetic field inside the solenoid.
```

**Command:**
```bash
python3 generate_diagram.py "A solenoid has N turns per unit length and carries current I" -o solenoid.svg
```

---

## Circuits Examples

### Example 14: Series Circuit

**Question:**
```
Three resistors R₁ = 10Ω, R₂ = 20Ω, and R₃ = 30Ω are connected
in series with a battery of voltage V = 12V. Find the current.
```

**Command:**
```bash
python3 generate_diagram.py "Three resistors R₁ = 10Ω, R₂ = 20Ω, and R₃ = 30Ω are connected in series with a battery of voltage V = 12V" -o series_circuit.svg
```

---

### Example 15: RC Circuit

**Question:**
```
A resistor R and capacitor C are connected in series with a
battery of voltage V. Find the time constant.
```

**Command:**
```bash
python3 generate_diagram.py "A resistor R and capacitor C are connected in series with a battery of voltage V" -o rc_circuit.svg
```

---

## Advanced Usage

### Batch Processing Multiple Questions

Create a file `questions.txt`:
```
A block of mass 5kg is on an incline at 30 degrees
A point charge Q = +5μC is at origin
A convex lens has focal length 10cm
```

Then process all:
```bash
#!/bin/bash
i=1
while read question; do
  python3 generate_diagram.py "$question" -o "diagram_$i.svg"
  i=$((i+1))
done < questions.txt
```

---

### Python Scripting

```python
from universal_physics_diagram_generator import generate_diagram_from_question

# List of questions
questions = [
    "A block slides down an incline at angle 30 degrees",
    "A point charge Q creates electric field E",
    "A convex lens forms an image"
]

# Generate all diagrams
for i, question in enumerate(questions, 1):
    output = f"auto_diagram_{i}.svg"
    generate_diagram_from_question(question, output)
    print(f"✅ Generated: {output}")
```

---

### Custom Parsing

```python
from universal_physics_diagram_generator import QuestionParser

question = "A block of mass 5kg is on an incline at 30 degrees"

# Parse first
parsed = QuestionParser.parse_question(question)

print("Detected Information:")
print(f"  Topic: {parsed['topic']}")
print(f"  Diagram Type: {parsed['diagram_type']}")
print(f"  Objects: {parsed['objects']}")
print(f"  Vectors: {parsed['vectors']}")
print(f"  Given Info: {parsed['given_info']}")

# Then generate if satisfied
# ... generate diagram ...
```

---

### Quality Assurance Check

After generating a diagram, verify compliance:

```bash
# Check for solution content (should be empty)
grep -i "answer\|solution\|equal to.*=" generated_diagram.svg

# Check for proper vector notation (should find SVG paths)
grep "<path.*overhead" generated_diagram.svg

# Check font sizes
grep -o 'font-size="[0-9]*"' generated_diagram.svg | sort | uniq
```

Expected output:
```
# No matches for solution content
# Multiple matches for overhead arrows
# Font sizes: 20, 26, 32, 36, 42, 44
```

---

## 🎓 Tips for Best Results

### 1. Be Specific
❌ Bad: "A charge creates a field"
✅ Good: "A point charge Q = +5μC at origin creates electric field E"

### 2. Include Units
❌ Bad: "A block of mass 5"
✅ Good: "A block of mass 5 kg"

### 3. Mention Object Types
❌ Bad: "Two things connected by a rope"
✅ Good: "Two blocks connected by a rope"

### 4. Specify Vectors
❌ Bad: "Find the force"
✅ Good: "Find the force F acting on the block"

### 5. Avoid Solution Language
❌ Bad: "Show that F = ma"
✅ Good: "A force F acts on mass m"

---

## 📊 Success Checklist

After generating a diagram, verify:

- [ ] Correct physics topic detected
- [ ] Appropriate diagram type chosen
- [ ] All objects from question present
- [ ] Vectors have overhead arrows (SVG, not Unicode)
- [ ] NO solution formulas visible
- [ ] NO answer values shown
- [ ] Font sizes correct (42/32/26/44/36)
- [ ] Canvas size 2000×1400
- [ ] Clean point labels only
- [ ] Given Information section present (if applicable)
- [ ] Legend section present

---

## 🔍 Example Verification

### Good Diagram (✅)
```xml
<!-- Proper overhead arrow -->
<text font-style="italic">F</text>
<path d="M ... overhead arrow path ..." />

<!-- Clean label -->
<text font-size="44" font-weight="bold">O</text>

<!-- Given info (NO solution) -->
<text>• Block has mass m = 5 kg</text>
```

### Bad Diagram (❌)
```xml
<!-- Unicode arrow (wrong) -->
<text>F⃗</text>

<!-- Descriptive label (wrong) -->
<text>O (center of sphere)</text>

<!-- Solution content (FORBIDDEN) -->
<text>Force F = ma = 50 N</text>
```

---

**Remember:** The system is designed to NEVER include solution content. If you see any answers, formulas, or hints in the generated diagram, that's a bug - please report it!

---

**Version:** 1.0
**Last Updated:** 2025-10-16

---

**Happy Learning! 🎓**
