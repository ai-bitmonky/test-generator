# CRITICAL SVG FIXES REQUIRED

## URGENT - INCORRECT VALUES (Must Fix First!)

### Question 36 - physics_questions_01_of_05.html
**CRITICAL ERROR:** SVG shows "r = 0.20 m" but question says "r = 1.0 cm"
- **Current:** r = 0.20 m (WRONG!)
- **Should be:** r = 1.0 cm
- **Action:** Change the radius label in the SVG from "0.20 m" to "1.0 cm"

---

## HIGH PRIORITY - Missing Critical Values

### Question 14 - physics_questions_01_of_05.html
**Issue:** Four-capacitor circuit diagram has NO capacitor values labeled
- **Missing:** C₁ = 1.00 μF, C₂ = 2.00 μF, C₃ = 3.00 μF, C₄ = 4.00 μF
- **Impact:** Circuit cannot be analyzed without these values
- **Action:** Add all four capacitor values as labels near their components

### Question 31 - physics_questions_01_of_05.html
**Issue:** Charged disk diagram missing both critical dimensions
- **Missing:** R = 64.0 cm (disk radius), D = 25.9 cm (point P distance)
- **Impact:** Problem setup unclear
- **Action:** Add "R = 64.0 cm" to disk and "D = 25.9 cm" to point P

### Questions 10 & 11 - physics_questions_01_of_05.html
**Issue:** Cylindrical container diagrams missing dimensions
- **Missing:** r = 0.20 m (radius), h = 10 cm (height)
- **Impact:** Physical setup unclear
- **Action:** Add dimension labels "r = 0.20 m" and "h = 10 cm" to both cylinder diagrams

### Question 194 - physics_questions_04_of_05.html
**Issue:** Loop-the-loop diagram missing loop radius
- **Missing:** r = 0.48 m (loop radius)
- **Impact:** Cannot visualize the problem geometry
- **Action:** Add "r = 0.48 m" label to the circular loop

### Question 171 & 182 - physics_questions_04_of_05.html
**Issue:** Spherical shell and pulley system missing all dimensions
- **Missing:**
  - M = 4.5 kg (shell mass)
  - R = 8.5 cm (shell radius)
  - r = 5.0 cm (pulley radius)
  - m = 0.60 kg (hanging mass)
- **Impact:** System cannot be analyzed
- **Action:** Add all four labels to the diagram components

---

## MEDIUM PRIORITY - Important Missing Values

### Capacitor Problems
- **Q12:** Add d = 7.12 mm (plate separation)
- **Q16:** Add C₁ = 2.00 μF, C₂ = 8.00 μF
- **Q37:** Add q₁ = 3.40 pC, q₂ = 6.00 pC values

### Distance/Separation Problems
- **Q20, Q23:** Add d = 4.0 cm (particle separation)
- **Q26, Q35:** Add d = 1.40 cm (distance labels)
- **Q42:** Add R = 8.20 cm (ring radius)
- **Q41:** Add r = 1.0 cm (sphere radius)

### Mechanics Problems with Missing Dimensions
- **Q109:** Add h = 0.10 m (height), d = 0.506 m (distance)
- **Q119:** Add L = 0.500 m (rod length), M = 4.00 kg (mass), θ = 60.0° (angle)
- **Q152, Q178, Q197:** Add h = 20 cm (height), L = 40 cm (rod length)
- **Q198, Q213:** Add d = 0.506 m (landing distance) and heights

### Angle Problems
- **Q108:** Add 63.0° and 48.0° angles to vectors
- **Q121:** Add θ₁ = 60.0° and θ₂ = 30.0° angles
- **Q149:** Add θ₁ = 30°, θ₂ = 180°, θ₃ = 60° to force vectors
- **Q183, Q201:** Add θ = 35.0° angle marker

### Radius/Length Problems
- **Q173, Q199, Q215:** Add R = 11 cm (bowling ball radius)
- **Q175:** Change "R" to "R = 14.0 cm" (loop radius with value)
- **Q180:** Add r = 0.25 m (disk radius)
- **Q187, Q190, Q192:** Add R = 0.150 m (hoop radius)

---

## SUMMARY BY FILE

### physics_questions_01_of_05.html
- **Critical:** Q36 (wrong value!)
- **High Priority:** Q10, Q11, Q14, Q31
- **Medium Priority:** Q12, Q16, Q20, Q23, Q26, Q35, Q37, Q41, Q42

### physics_questions_02_of_05.html
- **Medium Priority:** Q73 (add mass), Q82 (add mass)

### physics_questions_03_of_05.html
- **High Priority:** Q108, Q119, Q121, Q149
- **Medium Priority:** Q109, Q132, Q138

### physics_questions_04_of_05.html
- **High Priority:** Q171, Q182, Q194
- **Medium Priority:** Q152, Q155, Q173, Q175, Q178, Q180, Q183, Q187, Q188, Q190, Q192, Q197, Q198, Q199

### physics_questions_05_of_05.html
- **Medium Priority:** Q201, Q206, Q208, Q213, Q215, Q238, Q243, Q246, Q247

---

## QUICK FIX CHECKLIST

1. [ ] **Q36** - Fix incorrect radius (0.20 m → 1.0 cm) ⚠️ CRITICAL
2. [ ] **Q14** - Add all 4 capacitor values
3. [ ] **Q31** - Add disk radius R and distance D
4. [ ] **Q10** - Add cylinder radius r and height h
5. [ ] **Q11** - Add cylinder radius r and height h
6. [ ] **Q194** - Add loop radius
7. [ ] **Q171** - Add all 4 missing values (shell mass/radius, pulley radius, hanging mass)
8. [ ] **Q182** - Add all 4 missing values (same as Q171)
9. [ ] **Q119** - Add rod length, mass, and bullet angle
10. [ ] **Q109** - Add height and landing distance

Complete these 10 questions first, then proceed with the medium priority items.

---

## NOTES

- Some "issues" are false positives where the value is present but formatted differently (e.g., "100 V" vs "100.0 V")
- Focus on the CRITICAL and HIGH PRIORITY items first
- Double-check that all numerical values mentioned in question text appear in the diagram
- Maintain consistent units throughout (use the same units as in the question text)
