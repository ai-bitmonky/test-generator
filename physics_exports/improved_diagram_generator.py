#!/usr/bin/env python3
"""
Improved Physics Diagram Generator with Comprehensive Question Parsing
Automatically handles ANY complex physics problem
"""

# Import the comprehensive generator
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from comprehensive_diagram_generator import (
    QuestionParser,
    ComprehensiveDiagramRenderer,
    generate_comprehensive_diagram
)

def generate_diagram_from_question(question_text: str, output_file: str, topic: str = ""):
    """Main entry point - uses comprehensive generator"""
    generate_comprehensive_diagram(question_text, output_file)

if __name__ == "__main__":
    test_question = "capacitor C₁ = 10 μF and C₂ = 5 μF connected in series with 300 V battery"
    generate_diagram_from_question(test_question, "test_improved.svg", "Capacitance")
