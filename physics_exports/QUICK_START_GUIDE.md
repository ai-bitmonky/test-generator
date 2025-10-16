# Quick Start Guide - Unified Physics SVG Generator

## 5-Minute Quick Start

### 1. Generate Your First Diagram

```bash
cd /Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports
python3 unified_physics_svg_generator.py
```

**Output:** `unified_physics_diagram.svg`

### 2. View the Diagram

```bash
open unified_physics_diagram.svg
```

---

## Common Use Cases

### Use Case 1: Generate Question 50 Diagram

```python
from unified_physics_svg_generator import UnifiedPhysicsSVGGenerator

# Create generator
gen = UnifiedPhysicsSVGGenerator()

# Generate diagram
svg = gen.generate_charged_sphere_cavity()

# Save
with open('output.svg', 'w') as f:
    f.write(svg)
```

**Result:** Complete electrostatics diagram with:
- Charged sphere
- Spherical cavity
- Electric field lines
- Vector notation (a⃗, r⃗, E⃗)
- Formulas and legend

---

### Use Case 2: Add Custom Vectors

```python
gen = UnifiedPhysicsSVGGenerator()

# Add force vector
gen.add_vector(
    start=Point(400, 500),
    end=Point(500, 400),
    label="F",
    color="red",
    width=4
)

# Generate complete SVG
svg = gen.generate_svg_header()
svg += '\n'.join(gen.svg_elements)
svg += gen.generate_svg_footer()
```

---

### Use Case 3: Smart Label Placement

```python
from unified_physics_svg_generator import (
    UnifiedPhysicsSVGGenerator,
    LabelPosition,
    Point
)

gen = UnifiedPhysicsSVGGenerator()

# Place label automatically
label_pos = gen.label_placer.place_label(
    anchor=Point(500, 400),
    text="Test Point P",
    preferred_direction=LabelPosition.N
)

print(f"Label placed at: {label_pos}")
```

---

## Command-Line Usage

### Basic Generation

```bash
# Generate diagram and save
python3 unified_physics_svg_generator.py

# Open immediately
python3 unified_physics_svg_generator.py && open unified_physics_diagram.svg
```

---

## Python API Reference (Quick)

### Core Classes

#### 1. UnifiedPhysicsSVGGenerator
```python
gen = UnifiedPhysicsSVGGenerator(width=1600, height=1000)
```

**Key Methods:**
- `generate_charged_sphere_cavity()` → str
- `add_vector(start, end, label, color, width)` → None
- `generate_svg_header()` → str
- `generate_svg_footer()` → str

#### 2. Point
```python
p = Point(x=100, y=200)
p1 + p2        # Addition
p1 - p2        # Subtraction
p * 2          # Scaling
p.distance_to(p2)  # Distance
```

#### 3. Vector2D
```python
v = Vector2D(x=3, y=4)
v.magnitude()      # 5.0
v.normalize()      # Vector2D(0.6, 0.8)
v.perpendicular()  # Vector2D(-4, 3)
```

#### 4. PhysicsCoordinateSystem
```python
coord = PhysicsCoordinateSystem(width=1600, height=1000, scale=50)
svg_point = coord.world_to_svg(2, 3)
world_point = coord.svg_to_world(900, 350)
```

#### 5. CollisionGrid
```python
grid = CollisionGrid(width=1600, height=1000, cell_size=10)
grid.register_element(x, y, w, h, padding=5)
is_free = grid.is_free(x, y, w, h)
free_pos = grid.find_free_position(w, h, pref_x, pref_y)
```

#### 6. SmartLabelPlacer
```python
placer = SmartLabelPlacer(collision_grid, offset_distance=30)
position = placer.place_label(anchor, text, preferred_direction)
```

---

## Color Reference

### Available Colors
```python
colors = {
    'red': '#e74c3c',      # Forces, important vectors
    'blue': '#3498db',     # Velocity, displacement
    'green': '#27ae60',    # Electric field
    'purple': '#9b59b6',   # Magnetic field
    'orange': '#e67e22',   # Energy, power
    'black': '#2c3e50',    # Labels, boundaries
    'gray': '#95a5a6',     # Auxiliary lines
    'yellow': '#f1c40f',   # Highlights
    'pink': '#e91e63'      # Special markers
}
```

### Usage
```python
gen.add_vector(start, end, "F", color="red")     # Force
gen.add_vector(start, end, "v", color="blue")    # Velocity
gen.add_vector(start, end, "E", color="green")   # Electric field
```

---

## Label Positions

### 8-Position Model
```
        NW    N    NE
          \   |   /
           \  |  /
        W───●───E
           /  |  \
          /   |   \
        SW    S    SE
```

### Usage
```python
from unified_physics_svg_generator import LabelPosition

# Cardinal (preferred)
LabelPosition.N   # North
LabelPosition.E   # East
LabelPosition.S   # South
LabelPosition.W   # West

# Diagonal
LabelPosition.NE  # North-East
LabelPosition.SE  # South-East
LabelPosition.SW  # South-West
LabelPosition.NW  # North-West
```

---

## Common Patterns

### Pattern 1: Circle with Label
```python
gen = UnifiedPhysicsSVGGenerator()

# Register circle
center = Point(500, 400)
radius = 80
gen.collision_grid.register_circle(center.x, center.y, radius)

# Add circle SVG
gen.svg_elements.append(
    f'<circle cx="{center.x}" cy="{center.y}" r="{radius}" '
    f'fill="lightblue" stroke="black" stroke-width="2"/>'
)

# Place label
label_pos = gen.label_placer.place_label(center, "Charge Q")
gen.svg_elements.append(
    f'<text x="{label_pos.x}" y="{label_pos.y}" ...>Q</text>'
)
```

### Pattern 2: Vector with Components
```python
# Main vector
gen.add_vector(start, end, "F", color="red")

# X-component
F_x = Point(start.x, end.y)
gen.add_vector(start, F_x, "Fₓ", color="red")

# Y-component
F_y = Point(end.x, start.y)
gen.add_vector(F_x, end, "Fᵧ", color="red")
```

### Pattern 3: Angle Indicator
```python
# Arc for angle
angle_deg = 30
arc_radius = 40

# SVG arc path
arc_path = f'M {start.x + arc_radius} {start.y} '
arc_path += f'A {arc_radius} {arc_radius} 0 0 0 '
arc_path += f'{start.x + arc_radius*cos(angle)} {start.y - arc_radius*sin(angle)}'

gen.svg_elements.append(
    f'<path d="{arc_path}" stroke="purple" fill="none" stroke-width="2"/>'
)
```

---

## Debugging Tips

### Tip 1: Check Collision Grid
```python
# Print grid statistics
print(f"Occupied cells: {len(gen.collision_grid.grid)}")
print(f"Registered elements: {len(gen.collision_grid.elements)}")
```

### Tip 2: Visualize Label Positions
```python
# Add debug markers at label anchor points
for label in gen.label_placer.placed_labels:
    anchor = label['anchor']
    gen.svg_elements.append(
        f'<circle cx="{anchor.x}" cy="{anchor.y}" r="3" fill="red"/>'
    )
```

### Tip 3: Check Coordinate Transformations
```python
# Test round-trip conversion
world = Point(2, 3)
svg = gen.coord_system.world_to_svg(world.x, world.y)
back = gen.coord_system.svg_to_world(svg.x, svg.y)

print(f"World: {world}")
print(f"SVG: {svg}")
print(f"Back: {back}")
# Should match original world coordinates
```

---

## Performance Tips

### Tip 1: Reduce Cell Size for Faster Collision
```python
# Larger cells = faster, less precise
grid = CollisionGrid(width=1600, height=1000, cell_size=20)  # Faster

# Smaller cells = slower, more precise
grid = CollisionGrid(width=1600, height=1000, cell_size=5)   # Slower
```

### Tip 2: Limit Search Radius
```python
# Smaller search radius = faster label placement
free_pos = grid.find_free_position(
    w, h, pref_x, pref_y,
    search_radius=50  # Reduce from default 100
)
```

### Tip 3: Batch Element Registration
```python
# Register all obstacles first
for obstacle in obstacles:
    grid.register_circle(obstacle.x, obstacle.y, obstacle.r)

# Then place all labels (can use cached grid state)
for label_info in labels:
    pos = placer.place_label(label_info.anchor, label_info.text)
```

---

## Troubleshooting

### Problem: Labels Overlapping

**Solution:**
```python
# Increase offset distance
placer = SmartLabelPlacer(grid, offset_distance=40)  # Increase from 30

# Or increase padding
grid.register_element(x, y, w, h, padding=10)  # Increase from 5
```

### Problem: Vector Arrows Too Small

**Solution:**
```python
# Increase arrow marker size in SVG header
# Edit generate_svg_header() method:
markerWidth="10"   # Increase from 8
markerHeight="10"  # Increase from 8
```

### Problem: Diagram Off-Center

**Solution:**
```python
# Adjust origin position
coord = PhysicsCoordinateSystem(width=1600, height=1000, scale=50)
coord.origin = Point(800, 600)  # Move origin down
```

---

## Examples

### Example 1: Simple Force Diagram
```python
gen = UnifiedPhysicsSVGGenerator()

svg = gen.generate_svg_header()

# Block
block = Point(800, 500)
gen.collision_grid.register_element(775, 475, 50, 50)
gen.svg_elements.append(
    f'<rect x="775" y="475" width="50" height="50" fill="blue"/>'
)

# Weight
gen.add_vector(block, Point(800, 600), "mg", "red", 4)

# Normal
gen.add_vector(block, Point(800, 400), "N", "green", 4)

svg += '\n'.join(gen.svg_elements)
svg += gen.generate_svg_footer()

with open('force_diagram.svg', 'w') as f:
    f.write(svg)
```

### Example 2: Electric Field Lines
```python
gen = UnifiedPhysicsSVGGenerator()

svg = gen.generate_svg_header()

# Charge
charge_pos = Point(800, 500)
gen.collision_grid.register_circle(800, 500, 30)
gen.svg_elements.append(
    f'<circle cx="800" cy="500" r="30" fill="red"/>'
)

# Field lines radiating outward
for angle in range(0, 360, 30):
    rad = math.radians(angle)
    start = Point(
        800 + 40 * math.cos(rad),
        500 + 40 * math.sin(rad)
    )
    end = Point(
        800 + 120 * math.cos(rad),
        500 + 120 * math.sin(rad)
    )
    gen.add_vector(start, end, "", "green", 2)

svg += '\n'.join(gen.svg_elements)
svg += gen.generate_svg_footer()
```

---

## Next Steps

1. **Read full documentation:** `UNIFIED_SYSTEM_DOCUMENTATION.md`
2. **Study examples:** See generated diagrams
3. **Modify templates:** Customize existing templates
4. **Create new templates:** Add your own physics diagrams
5. **Contribute:** Share improvements and new templates

---

## Key Takeaways

✅ **Always** register obstacles before placing labels
✅ **Use** physics coordinates for calculations, SVG for rendering
✅ **Leverage** smart label placement for collision-free diagrams
✅ **Apply** overhead arrow notation for vectors
✅ **Test** coordinate transformations for accuracy

---

**Happy Diagram Generation! 🎨🔬**

*For detailed API reference, see UNIFIED_SYSTEM_DOCUMENTATION.md*
