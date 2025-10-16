# Physics Diagram Guidelines for IIT JEE

## Mandatory Standards for All Diagrams

This document defines the strict guidelines that **ALL** physics diagrams must follow. These rules ensure diagrams contain only problem setup information without revealing any solutions.

---

## 1. NO Solution Content (CRITICAL)

### ❌ NEVER Include:
- **NO Answers** - No numerical answers, formulas, or solution expressions
- **NO Solution Methods** - No hints about how to solve (e.g., "uses superposition principle")
- **NO Solution Hints** - No phrases like "UNIFORM field", "Independent of R", etc.
- **NO Questions Section** - No "Questions to Answer:" sections anywhere in diagrams
- **NO Question References** - No "(question a)", "(question b)" in descriptions

### ✅ Examples of PROHIBITED Content:
```
❌ "E⃗ = ρr⃗/(3ε₀)" (this is the answer formula)
❌ "Field is UNIFORM in cavity" (solution hint)
❌ "Uses superposition principle" (solution method)
❌ "Independent of cavity radius R" (solution insight)
❌ "Questions to Answer: (a) Show that..." (question statement)
❌ "Net force on pollen due to bee (question a)" (question reference)
```

---

## 2. Diagram Content Rules

### Visual Elements Only in Main Diagram
- Geometric shapes (spheres, circles, lines)
- Charge distributions (patterns, symbols)
- Vectors with proper notation
- Point markers (labeled O, C, P, etc.)
- Field lines (if showing field direction only)

### NO Descriptive Labels on Diagram
❌ WRONG:
```
Bee ← label directly on bee
(sphere center) ← description under point O
(test point) ← description under point P
```

✅ CORRECT:
```
O ← only the point label
C ← only the point label
P ← only the point label
```

All descriptions go in **Legend** or **Given Information** sections only.

---

## 3. Vector Notation Requirements

### Mandatory Overhead Arrow Notation
ALL vectors MUST use proper overhead arrows rendered as SVG `<path>` elements.

❌ WRONG (Unicode or plain text):
```
a⃗  (Unicode character)
E→  (Plain text arrow)
F_vec (Subscript notation)
```

✅ CORRECT (SVG path overhead arrows):
```xml
<!-- Vector label -->
<text x="100" y="100" font-style="italic">a</text>
<!-- Overhead arrow -->
<path d="M 98 85 L 110 85 L 108 83 M 110 85 L 108 87"
      stroke="#34495e" stroke-width="2" fill="none" stroke-linecap="round"/>
```

### Implementation Pattern:
```python
def draw_vector_with_overhead_arrow(label, x, y, color):
    """
    Draw vector label with proper overhead arrow
    """
    svg = f'<text x="{x}" y="{y}" font-size="26" font-style="italic" fill="{color}">{label}</text>'
    # Overhead arrow positioned above the label
    arrow_y = y - 17
    svg += f'<path d="M {x-2} {arrow_y} L {x+14} {arrow_y} L {x+12} {arrow_y-2} M {x+14} {arrow_y} L {x+12} {arrow_y+2}" stroke="{color}" stroke-width="2" fill="none" stroke-linecap="round"/>'
    return svg
```

---

## 4. Font Size Standards

### Consistent Typography Across All Sections

| Element | Font Size | Weight | Usage |
|---------|-----------|--------|-------|
| **Main Title** | 42px | bold | Diagram title at top |
| **Section Titles** | 32px | bold | "Given Information:", "Legend:" |
| **Subsection Headers** | 24-28px | bold | "Object Properties:", "Forces:" |
| **Body Text** | 26px | regular | Given info bullets, legend entries |
| **Small Text** | 20-22px | regular | Detailed descriptions |
| **Point Labels** | 44px | bold | O, C, P labels on diagram |
| **Vector Labels** | 36px | bold italic | Vector labels (a, r, E, F) |
| **Charge Symbols** | 22px | bold | +/− on objects |

### Font Size Application:
```python
# Title
f'<text font-size="42" font-weight="bold">Problem Title</text>'

# Section headers
f'<text font-size="32" font-weight="bold">Given Information:</text>'

# Body content
f'<text font-size="26">• Sphere has uniform volume charge density ρ</text>'

# Point labels
f'<text font-size="44" font-weight="bold">O</text>'

# Vector labels
f'<text font-size="36" font-weight="bold" font-style="italic">a</text>'
```

---

## 5. Information Architecture

### Three-Section Layout

#### A. Main Diagram Area (Left/Center)
- Visual elements only
- Geometric shapes
- Vectors with overhead arrows
- Point labels (O, C, P)
- NO descriptive text
- NO explanations

#### B. Given Information Section (Right, Top)
- Problem setup parameters
- Object definitions (what O, C, P represent)
- Physical quantities (charge density ρ, etc.)
- Vector definitions (what a⃗, r⃗, E⃗ represent)
- NO solution formulas
- NO answer values

Example:
```xml
<g id="given-info">
  <text x="1000" y="250" font-size="32" font-weight="bold">Given Information:</text>

  <text x="1020" y="300" font-size="26">• Sphere has uniform volume charge density ρ</text>
  <text x="1020" y="340" font-size="26">• O = center of sphere</text>
  <text x="1020" y="380" font-size="26">• C = center of cavity</text>

  <!-- Vector with overhead arrow -->
  <text x="1035" y="420" font-size="26" font-style="italic">a</text>
  <path d="..." stroke="#34495e" stroke-width="2"/>
  <text x="1048" y="420" font-size="26"> = displacement vector from O to C</text>
</g>
```

#### C. Legend Section (Right, Below Given Information)
- Vector symbol explanations
- Object specifications
- Distance measurements
- Force/field definitions
- NO questions
- NO answers

Example:
```xml
<g id="legend">
  <text x="1000" y="660" font-size="32" font-weight="bold">Legend:</text>

  <!-- Vector symbol with overhead arrow -->
  <line x1="1020" y1="705" x2="1110" y2="705" stroke="#e74c3c" marker-end="url(#arrowRed)"/>
  <text x="1125" y="713" font-size="26" font-style="italic">a</text>
  <path d="..." stroke="#2c3e50" stroke-width="2"/>
  <text x="1140" y="713" font-size="26"> = O to C (displacement)</text>
</g>
```

---

## 6. Canvas Dimensions

### Standard Canvas Size
- **Width**: 2000 pixels
- **Height**: 1400 pixels
- **Margin**: 150 pixels
- **ViewBox**: `0 0 2000 1400`

```python
def __init__(self, width: int = 2000, height: int = 1400):
    self.width = width
    self.height = height
    self.margin = 150
```

### Element Scaling Guidelines
When scaling diagrams, maintain these proportions:
- Sphere radii: 180-280px (based on importance)
- Small objects: 20-50px
- Vector stroke width: 3-4px
- Arrow markers: 5×5px
- Point markers: 6px radius

---

## 7. Color Palette

### Standardized Colors

| Element | Color Code | Usage |
|---------|------------|-------|
| **Primary text** | `#2c3e50` | Labels, main text |
| **Secondary text** | `#34495e` | Body content |
| **Accent text** | `#7f8c8d` | Light descriptions |
| **Section headers** | `#16a085` | "Given Information:", subsections |
| **Red** | `#e74c3c` | Important vectors (a⃗, F⃗_bee) |
| **Blue** | `#3498db` | Velocity, displacement, F⃗_stigma |
| **Green** | `#27ae60` | Electric field |
| **Purple** | `#9b59b6` | Test points, r⃗ vector |
| **Orange** | `#e67e22` | Boundaries (cavity) |
| **Gold** | `#FFD700` | Charged objects (bee) |

---

## 8. SVG Structure Template

### Standard SVG Header
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1400">
<rect width="2000" height="1400" fill="#ffffff"/>

<defs>
  <!-- Arrow markers -->
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
</defs>
```

### Standard Structure
```xml
<!-- Title -->
<text x="1000" y="50" text-anchor="middle" font-size="42" font-weight="bold">Title</text>

<!-- Main diagram elements -->
<g id="main-diagram">
  <!-- Shapes, vectors, labels -->
</g>

<!-- Given Information (if applicable) -->
<g id="given-info">
  <!-- Setup information -->
</g>

<!-- Legend -->
<g id="legend">
  <!-- Symbol explanations -->
</g>

</svg>
```

---

## 9. Pre-Commit Checklist

Before committing any new diagram, verify:

### Content Review
- [ ] NO answer formulas present
- [ ] NO solution methods mentioned
- [ ] NO solution hints included
- [ ] NO "Questions to Answer:" section
- [ ] NO question references like "(question a)"

### Notation Review
- [ ] ALL vectors use overhead arrow notation (SVG paths)
- [ ] NO Unicode arrows (⃗) in vector labels
- [ ] NO plain text arrows (→)
- [ ] Overhead arrows properly positioned above italic letters

### Typography Review
- [ ] Font sizes match standards (42/32/26/44/36)
- [ ] Section headers are 32px bold
- [ ] Body text is 26px regular
- [ ] Point labels are 44px bold
- [ ] Vector labels are 36px bold italic

### Layout Review
- [ ] NO descriptive labels on diagram elements
- [ ] Point labels are clean (O, C, P only)
- [ ] All descriptions in Legend or Given Information
- [ ] Given Information section properly formatted
- [ ] Legend section below Given Information (if both present)

### Technical Review
- [ ] Canvas size: 2000×1400
- [ ] Arrow markers: 5×5px
- [ ] Color palette matches standards
- [ ] SVG structure follows template

---

## 10. Common Mistakes to Avoid

### ❌ Mistake 1: Including Solutions
```xml
❌ WRONG:
<text>Electric field E⃗ = ρr⃗/(3ε₀)</text>

✅ CORRECT:
<text>• E⃗ = electric field (shown as green arrows)</text>
```

### ❌ Mistake 2: Unicode Arrows
```xml
❌ WRONG:
<text>a⃗ = displacement vector</text>

✅ CORRECT:
<text font-style="italic">a</text>
<path d="M ... arrow path ..."/>
<text> = displacement vector</text>
```

### ❌ Mistake 3: Descriptive Labels on Diagram
```xml
❌ WRONG:
<text x="450" y="600">O</text>
<text x="420" y="625">(sphere center)</text>

✅ CORRECT:
<text x="450" y="600">O</text>
<!-- Description goes in Given Information section instead -->
```

### ❌ Mistake 4: Questions in Diagram
```xml
❌ WRONG:
<text>Questions to Answer:</text>
<text>(a) What is the magnitude of force...</text>

✅ CORRECT:
<!-- Remove questions section entirely -->
```

### ❌ Mistake 5: Inconsistent Font Sizes
```xml
❌ WRONG:
<text font-size="28">Given Information:</text>
<text font-size="22">• Sphere has...</text>

✅ CORRECT:
<text font-size="32" font-weight="bold">Given Information:</text>
<text font-size="26">• Sphere has...</text>
```

---

## 11. Implementation Reference

### Python Class Structure
```python
class PhysicsDiagramRenderer:
    """Base class for all physics diagram generators"""

    # Constants
    CANVAS_WIDTH = 2000
    CANVAS_HEIGHT = 1400
    MARGIN = 150

    # Font sizes
    FONT_TITLE = 42
    FONT_SECTION_HEADER = 32
    FONT_SUBSECTION = 24
    FONT_BODY = 26
    FONT_POINT_LABEL = 44
    FONT_VECTOR_LABEL = 36

    def __init__(self):
        self.width = self.CANVAS_WIDTH
        self.height = self.CANVAS_HEIGHT

    def draw_vector_with_overhead_arrow(self, x, y, label, color):
        """Draw vector with proper overhead arrow notation"""
        # Implementation here
        pass

    def add_given_information(self):
        """Add given information section - NO SOLUTIONS"""
        # Only problem setup, NO answers
        pass

    def add_legend(self):
        """Add legend section - NO QUESTIONS"""
        # Only symbol definitions, NO questions
        pass
```

---

## 12. Testing New Diagrams

### Validation Steps

1. **Visual Inspection**
   - Open SVG in browser
   - Verify no solution content visible
   - Check all vectors have overhead arrows
   - Confirm font sizes are consistent

2. **Content Audit**
   - Search for formula symbols: =, /, ρ, ε₀ in answers context
   - Search for: "question", "answer", "solution", "show that"
   - Search for Unicode arrows: ⃗, →
   - Verify only setup information present

3. **Code Review**
   - Check method names don't include "answer", "solution", "question"
   - Verify overhead arrow implementation
   - Confirm font size constants used

4. **User Test**
   - Show diagram to someone unfamiliar
   - Ask: "Can you solve this from the diagram?"
   - If NO: ✅ Diagram is correct
   - If YES: ❌ Diagram reveals too much

---

## 13. Version Control

### Commit Message Format
```
<action>: <brief description>

Detailed changes:
- Change 1
- Change 2

Compliance:
✓ NO solution content
✓ Proper overhead arrows
✓ Consistent fonts
✓ Clean labels

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Example Good Commit
```
Add: Inclined plane force diagram

Detailed changes:
- Created inclined plane with angle θ
- Added force vectors (N⃗, f⃗, W⃗) with overhead arrows
- Given Information section with setup only
- Legend with vector definitions

Compliance:
✓ NO solution content (no formulas like N=mgcosθ)
✓ Proper overhead arrows on all vectors
✓ Font sizes: 42/32/26/44/36
✓ Clean point labels only

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Summary

### Golden Rules (Never Break These)

1. ✅ **NO solutions, answers, or hints** in any diagram
2. ✅ **Overhead arrows** for ALL vectors (SVG paths, not Unicode)
3. ✅ **Clean labels** on diagram (O, C, P only - no descriptions)
4. ✅ **Consistent fonts** (42/32/26/44/36 sizes)
5. ✅ **Standard canvas** (2000×1400 pixels)
6. ✅ **Three sections**: Diagram + Given Information + Legend
7. ✅ **NO questions section** anywhere in diagram
8. ✅ **Color palette** from standardized set
9. ✅ **Pre-commit checklist** completed
10. ✅ **Test with users** to verify no solution revealed

---

**Document Version:** 1.0
**Last Updated:** 2025-01-16
**Status:** Mandatory for all diagrams
**Maintained By:** Physics Diagram Team
