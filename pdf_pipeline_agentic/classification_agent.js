/**
 * AI Classification Agent
 *
 * Validates and classifies questions:
 * 1. Subject Detection: Physics, Chemistry, Mathematics
 * 2. Exam Level: JEE Mains vs JEE Advanced
 *
 * JEE Advanced Criteria:
 * - Multi-concept integration
 * - Sophisticated reasoning
 * - Non-routine problems
 * - Advanced mathematical/scientific modelling
 * - Complex constraint analysis
 * - Multi-step solution pathways
 *
 * JEE Mains Criteria:
 * - Straightforward problems
 * - Basic formula applications
 * - Routine computational exercises
 * - Single-concept problems
 */

class ClassificationAgent {
  constructor(claudeAI) {
    this.claudeAI = claudeAI;
  }

  async classifyQuestion(question) {
    console.log(`🔍 Classifying question...`);

    const prompt = `You are an expert JEE examiner. Analyze this question and classify it.

QUESTION:
${question.question_text}

${question.options ? `OPTIONS: ${JSON.stringify(question.options)}` : ''}
${question.solution_html ? `SOLUTION: ${question.solution_html.replace(/<[^>]*>/g, ' ').substring(0, 500)}` : ''}

Classify based on:

1. SUBJECT: Which subject does this belong to?
   - Physics (mechanics, thermodynamics, electromagnetism, optics, modern physics, etc.)
   - Chemistry (physical, organic, inorganic chemistry)
   - Mathematics (algebra, calculus, coordinate geometry, trigonometry, etc.)

2. EXAM LEVEL: JEE Mains or JEE Advanced?

   **JEE ADVANCED** indicators:
   - Multi-concept integration (combines 2+ concepts)
   - Sophisticated reasoning required
   - Non-routine, novel problem formulation
   - Requires advanced mathematical/scientific modelling
   - Complex constraint analysis and optimization
   - Multi-step solution pathway (3+ major steps)
   - Requires deep conceptual understanding
   - Not solvable by simple formula substitution

   **JEE MAINS** indicators:
   - Single-concept application
   - Routine computational exercise
   - Direct formula application
   - Plug-and-play problem
   - Basic calculations
   - Standard problem pattern
   - 1-2 step solution
   - Straightforward approach

Return ONLY valid JSON:
{
  "subject": "Physics" | "Chemistry" | "Mathematics",
  "subject_confidence": 0.0-1.0,
  "exam_level": "JEE Mains" | "JEE Advanced",
  "exam_level_confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification",
  "complexity_factors": ["factor1", "factor2", ...],
  "is_multi_concept": true | false,
  "estimated_steps": number
}`;

    try {
      const response = await this.claudeAI.call(prompt, 1500);

      // Extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in classification response');
      }

      const classification = JSON.parse(jsonMatch[0]);

      console.log(`   ✅ Subject: ${classification.subject} (${(classification.subject_confidence * 100).toFixed(0)}%)`);
      console.log(`   ✅ Level: ${classification.exam_level} (${(classification.exam_level_confidence * 100).toFixed(0)}%)`);
      console.log(`   📝 Reasoning: ${classification.reasoning.substring(0, 100)}...`);

      return classification;
    } catch (error) {
      console.error(`   ⚠️  Classification failed: ${error.message}`);

      // Fallback classification
      return {
        subject: this.inferSubjectFromKeywords(question.question_text),
        subject_confidence: 0.5,
        exam_level: 'JEE Mains', // Default to Mains when uncertain
        exam_level_confidence: 0.5,
        reasoning: 'Fallback classification due to AI error',
        complexity_factors: [],
        is_multi_concept: false,
        estimated_steps: 1
      };
    }
  }

  /**
   * Fallback: Simple keyword-based subject detection
   */
  inferSubjectFromKeywords(text) {
    const lowerText = text.toLowerCase();

    // Physics keywords
    const physicsKeywords = [
      'force', 'velocity', 'acceleration', 'momentum', 'energy', 'power',
      'newton', 'friction', 'gravity', 'mass', 'tension', 'circuit',
      'current', 'voltage', 'resistance', 'magnetic', 'electric',
      'wave', 'frequency', 'wavelength', 'optics', 'lens', 'mirror',
      'thermodynamics', 'heat', 'temperature', 'pressure', 'gas'
    ];

    // Chemistry keywords
    const chemistryKeywords = [
      'molecule', 'atom', 'reaction', 'compound', 'element', 'bond',
      'acidic', 'basic', 'pH', 'molarity', 'mole', 'oxidation',
      'reduction', 'catalyst', 'organic', 'alkane', 'alkene',
      'benzene', 'periodic', 'electron configuration', 'ionic',
      'covalent', 'equilibrium', 'titration', 'solution'
    ];

    // Mathematics keywords
    const mathKeywords = [
      'derivative', 'integral', 'limit', 'function', 'equation',
      'polynomial', 'matrix', 'determinant', 'vector', 'angle',
      'triangle', 'circle', 'parabola', 'ellipse', 'hyperbola',
      'probability', 'permutation', 'combination', 'sequence',
      'series', 'logarithm', 'exponential', 'trigonometric'
    ];

    let physicsScore = 0;
    let chemistryScore = 0;
    let mathScore = 0;

    physicsKeywords.forEach(kw => {
      if (lowerText.includes(kw)) physicsScore++;
    });

    chemistryKeywords.forEach(kw => {
      if (lowerText.includes(kw)) chemistryScore++;
    });

    mathKeywords.forEach(kw => {
      if (lowerText.includes(kw)) mathScore++;
    });

    if (physicsScore > chemistryScore && physicsScore > mathScore) {
      return 'Physics';
    } else if (chemistryScore > physicsScore && chemistryScore > mathScore) {
      return 'Chemistry';
    } else if (mathScore > 0) {
      return 'Mathematics';
    }

    return 'Mathematics'; // Default
  }

  /**
   * Validate classification meets confidence thresholds
   */
  validateClassification(classification) {
    const issues = [];

    // Subject confidence check
    if (classification.subject_confidence < 0.7) {
      issues.push({
        type: 'warning',
        field: 'subject',
        message: `Low subject confidence: ${(classification.subject_confidence * 100).toFixed(0)}%`
      });
    }

    // Exam level confidence check
    if (classification.exam_level_confidence < 0.6) {
      issues.push({
        type: 'warning',
        field: 'exam_level',
        message: `Low exam level confidence: ${(classification.exam_level_confidence * 100).toFixed(0)}%`
      });
    }

    // Validate subject is one of the three
    if (!['Physics', 'Chemistry', 'Mathematics'].includes(classification.subject)) {
      issues.push({
        type: 'error',
        field: 'subject',
        message: `Invalid subject: ${classification.subject}`
      });
    }

    // Validate exam level
    if (!['JEE Mains', 'JEE Advanced'].includes(classification.exam_level)) {
      issues.push({
        type: 'error',
        field: 'exam_level',
        message: `Invalid exam level: ${classification.exam_level}`
      });
    }

    return issues;
  }

  /**
   * Check if question meets JEE Advanced criteria
   */
  isAdvancedLevel(classification) {
    const advancedIndicators = [
      classification.is_multi_concept,
      classification.estimated_steps >= 3,
      classification.complexity_factors.length >= 2,
      classification.exam_level_confidence >= 0.7
    ];

    const score = advancedIndicators.filter(Boolean).length;
    return score >= 2; // At least 2 indicators must be true
  }

  /**
   * Generate detailed classification report
   */
  generateClassificationReport(question, classification) {
    return {
      question_id: question.external_id || 'unknown',
      question_preview: question.question_text.substring(0, 100) + '...',
      classification: {
        subject: classification.subject,
        subject_confidence: classification.subject_confidence,
        exam_level: classification.exam_level,
        exam_level_confidence: classification.exam_level_confidence,
      },
      analysis: {
        is_multi_concept: classification.is_multi_concept,
        estimated_steps: classification.estimated_steps,
        complexity_factors: classification.complexity_factors,
        reasoning: classification.reasoning,
      },
      meets_advanced_criteria: this.isAdvancedLevel(classification),
    };
  }
}

module.exports = ClassificationAgent;
