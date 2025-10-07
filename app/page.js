'use client'

import { useState, useEffect } from 'react'
import './styles.css'

export default function TestGenerator() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Test state
  const [questionsDB, setQuestionsDB] = useState({})
  const [selectedTopics, setSelectedTopics] = useState([])
  const [numQuestions, setNumQuestions] = useState(10)
  const [distribution, setDistribution] = useState('random')
  const [currentTest, setCurrentTest] = useState([])
  const [userAnswers, setUserAnswers] = useState({})
  const [questionTimings, setQuestionTimings] = useState({})
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [usedQuestionIds, setUsedQuestionIds] = useState(new Set())
  const [testSubmitted, setTestSubmitted] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [instructionCountdown, setInstructionCountdown] = useState(15)
  const [testStarted, setTestStarted] = useState(false)
  const [testStartTime, setTestStartTime] = useState(null)
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [replacementNotice, setReplacementNotice] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [testHistory, setTestHistory] = useState([])

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  // Load questions
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/data/questions.json')
        .then(res => res.json())
        .then(data => {
          setQuestionsDB(data)
          setSelectedTopics(Object.keys(data))
        })
        .catch(err => console.error('Error loading questions:', err))
    }
  }, [isAuthenticated])

  // Instruction countdown
  useEffect(() => {
    if (showInstructions && instructionCountdown > 0) {
      const timer = setTimeout(() => {
        setInstructionCountdown(instructionCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showInstructions && instructionCountdown === 0) {
      startTestAfterInstructions()
    }
  }, [showInstructions, instructionCountdown])

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed')
        return
      }

      if (authMode === 'register') {
        setAuthMode('login')
        setPassword('')
        setAuthError('Registration successful! Please login.')
        return
      }

      // Login successful
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      setIsAuthenticated(true)
      setEmail('')
      setPassword('')
    } catch (error) {
      setAuthError('Network error. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    setShowTest(false)
    setShowDashboard(false)
  }

  const loadTestHistory = async () => {
    try {
      const response = await fetch('/api/tests/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setTestHistory(data.tests)
        setShowDashboard(true)
      }
    } catch (error) {
      console.error('Error loading test history:', error)
    }
  }

  const selectAllTopics = () => {
    setSelectedTopics(Object.keys(questionsDB))
  }

  const deselectAllTopics = () => {
    setSelectedTopics([])
  }

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic))
    } else {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  const selectQuestions = (topics, count, strategy) => {
    let questions = []

    if (strategy === 'random') {
      topics.forEach(topic => {
        questionsDB[topic]?.forEach(q => questions.push({ ...q, topic }))
      })
      questions.sort(() => Math.random() - 0.5)
      return questions.slice(0, Math.min(count, questions.length))
    } else if (strategy === 'balanced') {
      const perTopic = Math.floor(count / topics.length)
      const remainder = count % topics.length
      topics.forEach((topic, idx) => {
        const topicQuestions = questionsDB[topic] || []
        const take = Math.min(perTopic + (idx < remainder ? 1 : 0), topicQuestions.length)
        const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5)
        for (let i = 0; i < take; i++) {
          questions.push({ ...shuffled[i], topic })
        }
      })
      return questions
    } else {
      for (let topic of topics) {
        for (let q of (questionsDB[topic] || [])) {
          questions.push({ ...q, topic })
          if (questions.length >= count) return questions
        }
      }
      return questions
    }
  }

  const generateTest = () => {
    if (selectedTopics.length === 0) {
      alert('⚠️ Please select at least one topic')
      return
    }

    const questions = selectQuestions(selectedTopics, numQuestions, distribution)
    setCurrentTest(questions)
    setUserAnswers({})
    setQuestionTimings({})
    setTestSubmitted(false)
    setFlaggedQuestions(new Set())
    setUsedQuestionIds(new Set(questions.map(q => q.id)))
    setShowTest(true)
    setShowResults(false)
    setTestStarted(false)
    setShowInstructions(false)
  }

  const startTest = () => {
    setShowInstructions(true)
    setInstructionCountdown(15)
  }

  const startTestAfterInstructions = () => {
    setShowInstructions(false)
    setTestStarted(true)
    setTestStartTime(Date.now())
    setCurrentQuestionStartTime(Date.now())
  }

  const selectOption = (questionIdx, option) => {
    if (testSubmitted) return

    // Calculate time for previous question
    if (currentQuestionStartTime) {
      const timeTaken = (Date.now() - currentQuestionStartTime) / 1000 // seconds
      setQuestionTimings(prev => ({
        ...prev,
        [questionIdx]: timeTaken
      }))
    }

    setUserAnswers({ ...userAnswers, [questionIdx]: option })
    setCurrentQuestionStartTime(Date.now())
  }

  const toggleFlag = (questionIdx) => {
    if (testSubmitted) return
    const newFlagged = new Set(flaggedQuestions)
    if (newFlagged.has(questionIdx)) {
      newFlagged.delete(questionIdx)
    } else {
      newFlagged.add(questionIdx)
    }
    setFlaggedQuestions(newFlagged)
  }

  const replaceQuestion = (questionIdx) => {
    if (testSubmitted) {
      alert('Cannot replace questions after submission!')
      return
    }

    const currentQuestion = currentTest[questionIdx]
    const topic = currentQuestion.topic
    const availableQuestions = (questionsDB[topic] || []).filter(q => !usedQuestionIds.has(q.id))

    if (availableQuestions.length === 0) {
      alert('No more questions available from this topic!')
      return
    }

    const replacement = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]

    const newUsedIds = new Set(usedQuestionIds)
    newUsedIds.delete(currentQuestion.id)
    newUsedIds.add(replacement.id)
    setUsedQuestionIds(newUsedIds)

    const newTest = [...currentTest]
    newTest[questionIdx] = { ...replacement, topic }
    setCurrentTest(newTest)

    const newAnswers = { ...userAnswers }
    delete newAnswers[questionIdx]
    setUserAnswers(newAnswers)

    const newTimings = { ...questionTimings }
    delete newTimings[questionIdx]
    setQuestionTimings(newTimings)

    const newFlagged = new Set(flaggedQuestions)
    newFlagged.delete(questionIdx)
    setFlaggedQuestions(newFlagged)

    setReplacementNotice(true)
    setTimeout(() => setReplacementNotice(false), 2000)
  }

  const submitTest = async () => {
    if (testSubmitted) {
      alert('Test already submitted!')
      return
    }

    if (Object.keys(userAnswers).length === 0) {
      if (!confirm('You have not answered any questions. Submit anyway?')) return
    }

    setTestSubmitted(true)
    setShowResults(true)

    // Calculate results
    let correct = 0, incorrect = 0, skipped = 0
    currentTest.forEach((question, idx) => {
      const userAnswer = userAnswers[idx]
      if (!userAnswer) {
        skipped++
      } else if (question.correct_answer && userAnswer === question.correct_answer) {
        correct++
      } else {
        incorrect++
      }
    })

    const totalTime = (Date.now() - testStartTime) / 1000

    // Save test to backend
    try {
      const response = await fetch('/api/tests/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questions: currentTest,
          answers: userAnswers,
          questionTimings: Object.entries(questionTimings).map(([idx, time]) => ({
            questionId: currentTest[idx].id,
            timeTaken: time
          })),
          totalTime,
          correctCount: correct,
          incorrectCount: incorrect,
          skippedCount: skipped
        })
      })

      if (!response.ok) {
        console.error('Failed to save test')
      }
    } catch (error) {
      console.error('Error saving test:', error)
    }

    setTimeout(() => {
      document.getElementById('resultsSummary')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const backToSettings = () => {
    if (testSubmitted || Object.keys(userAnswers).length === 0 || confirm('Are you sure? Your progress will be lost.')) {
      setShowTest(false)
      setShowResults(false)
      setTestStarted(false)
      setShowDashboard(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getResults = () => {
    let correct = 0, incorrect = 0, unattempted = 0

    currentTest.forEach((question, idx) => {
      const userAnswer = userAnswers[idx]
      const correctAnswer = question.correct_answer

      if (!userAnswer) {
        unattempted++
      } else if (correctAnswer && userAnswer === correctAnswer) {
        correct++
      } else {
        incorrect++
      }
    })

    const percentage = currentTest.length > 0 ? ((correct / currentTest.length) * 100).toFixed(1) : 0

    return { correct, incorrect, unattempted, percentage }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const totalTopics = Object.keys(questionsDB).length
  const totalQuestions = Object.values(questionsDB).reduce((sum, qs) => sum + qs.length, 0)
  const results = showResults ? getResults() : { correct: 0, incorrect: 0, unattempted: 0, percentage: 0 }
  const answeredCount = Object.keys(userAnswers).length
  const progressPercentage = currentTest.length > 0 ? (answeredCount / currentTest.length) * 100 : 0

  // Auth UI
  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="header">
          <h1>🎓 JEE Advanced Test Generator</h1>
          <p>Login to start practicing</p>
        </div>
        <div className="content">
          <div className="auth-container">
            <div className="auth-box">
              <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
              {authError && <div className="auth-error">{authError}</div>}
              <form onSubmit={handleAuth}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                  />
                </div>
                <button type="submit" className="btn btn-auth">
                  {authMode === 'login' ? 'Login' : 'Register'}
                </button>
              </form>
              <p className="auth-toggle">
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login')
                  setAuthError('')
                }}>
                  {authMode === 'login' ? 'Register' : 'Login'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard UI
  if (showDashboard) {
    return (
      <div className="container">
        {replacementNotice && (
          <div className="replacement-notice visible">
            ✅ Question replaced successfully!
          </div>
        )}

        <div className="header">
          <h1>📊 My Dashboard</h1>
          <p>Welcome, {user?.email}</p>
        </div>

        <div className="content">
          <div className="dashboard-header">
            <button className="btn" onClick={() => setShowDashboard(false)}>
              ← Back to Tests
            </button>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="dashboard-stats">
            <h3>Overall Performance</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{testHistory.length}</div>
                <div className="stat-label">Tests Taken</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {testHistory.reduce((sum, t) => sum + t.totalQuestions, 0)}
                </div>
                <div className="stat-label">Total Questions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value correct">
                  {testHistory.reduce((sum, t) => sum + t.correctCount, 0)}
                </div>
                <div className="stat-label">Correct Answers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {testHistory.length > 0
                    ? ((testHistory.reduce((sum, t) => sum + t.correctCount, 0) /
                        testHistory.reduce((sum, t) => sum + t.totalQuestions, 0)) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="stat-label">Average Score</div>
              </div>
            </div>
          </div>

          <div className="test-history">
            <h3>Test History</h3>
            {testHistory.length === 0 ? (
              <p className="no-tests">No tests taken yet. Start your first test!</p>
            ) : (
              <div className="test-history-list">
                {testHistory.map((test, idx) => (
                  <div key={test.id} className="test-history-item">
                    <div className="test-history-header">
                      <h4>Test #{testHistory.length - idx}</h4>
                      <span className="test-date">
                        {new Date(test.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="test-history-stats">
                      <div className="test-stat">
                        <span className="test-stat-label">Questions:</span>
                        <span className="test-stat-value">{test.totalQuestions}</span>
                      </div>
                      <div className="test-stat">
                        <span className="test-stat-label">Correct:</span>
                        <span className="test-stat-value correct">{test.correctCount}</span>
                      </div>
                      <div className="test-stat">
                        <span className="test-stat-label">Incorrect:</span>
                        <span className="test-stat-value incorrect">{test.incorrectCount}</span>
                      </div>
                      <div className="test-stat">
                        <span className="test-stat-label">Skipped:</span>
                        <span className="test-stat-value unattempted">{test.skippedCount}</span>
                      </div>
                      <div className="test-stat">
                        <span className="test-stat-label">Time:</span>
                        <span className="test-stat-value">{formatTime(test.totalTime)}</span>
                      </div>
                      <div className="test-stat">
                        <span className="test-stat-label">Score:</span>
                        <span className="test-stat-value percentage">
                          {((test.correctCount / test.totalQuestions) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="test-history-topics">
                      <strong>Topics:</strong> {[...new Set(test.questions.map(q => q.topic))].join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Instructions screen
  if (showInstructions) {
    return (
      <div className="container">
        <div className="instructions-screen">
          <div className="instructions-content">
            <h1>📋 Test Instructions</h1>
            <div className="countdown-timer">
              Starting in {instructionCountdown} seconds...
            </div>
            <div className="instructions-list">
              <h3>Please read carefully:</h3>
              <ul>
                <li>✅ This test contains {currentTest.length} questions from selected topics</li>
                <li>⏱️ Your time will be tracked for each question</li>
                <li>✏️ Click on an option to select your answer</li>
                <li>🚩 You can flag difficult questions for review</li>
                <li>🔄 You can replace a question with another from the same topic</li>
                <li>📊 Results will be shown immediately after submission</li>
                <li>💾 Your performance will be saved to your dashboard</li>
                <li>⚠️ Once submitted, you cannot change your answers</li>
              </ul>
            </div>
            <p className="instructions-footer">
              The test will start automatically when countdown reaches zero
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main App UI
  return (
    <div className="container">
      {replacementNotice && (
        <div className="replacement-notice visible">
          ✅ Question replaced successfully!
        </div>
      )}

      <div className="header">
        <h1>🎓 JEE Advanced Interactive Test</h1>
        <p>Welcome, {user?.email}</p>
        <div className="header-actions">
          <button className="btn btn-small" onClick={loadTestHistory}>
            📊 Dashboard
          </button>
          <button className="btn btn-secondary btn-small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="content">
        {!showTest && (
          <>
            <div className="stats">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{totalTopics}</div>
                  <div className="stat-label">Topics Available</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{totalQuestions}</div>
                  <div className="stat-label">Total Questions</div>
                </div>
              </div>
            </div>

            <div className="controls">
              <div className="control-group">
                <label htmlFor="numQuestions">📝 Number of Questions:</label>
                <input
                  type="number"
                  id="numQuestions"
                  min="1"
                  max="100"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label htmlFor="distribution">🎲 Selection Strategy:</label>
                <select
                  id="distribution"
                  value={distribution}
                  onChange={(e) => setDistribution(e.target.value)}
                >
                  <option value="random">Random Selection</option>
                  <option value="balanced">Balanced Distribution</option>
                  <option value="sequential">Sequential Order</option>
                </select>
              </div>
            </div>

            <div className="topic-selector">
              <h3>✓ Select Topics</h3>
              <div className="button-group">
                <button className="btn btn-secondary" onClick={selectAllTopics}>Select All</button>
                <button className="btn btn-secondary" onClick={deselectAllTopics}>Deselect All</button>
              </div>
              <div className="topic-grid">
                {Object.keys(questionsDB).sort().map(topic => (
                  <div
                    key={topic}
                    className="topic-item"
                    onClick={() => toggleTopic(topic)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                    />
                    <label>{topic}</label>
                    <span className="topic-count">{questionsDB[topic]?.length || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="button-group">
              <button className="btn" onClick={generateTest}>
                🎯 Generate Test Paper
              </button>
            </div>
          </>
        )}

        {showTest && !testStarted && (
          <div className="test-ready">
            <h2>Test Ready!</h2>
            <p>{currentTest.length} questions selected</p>
            <button className="btn btn-large" onClick={startTest}>
              🚀 Start Test
            </button>
            <button className="btn btn-secondary" onClick={backToSettings}>
              ← Back to Settings
            </button>
          </div>
        )}

        {showTest && testStarted && (
          <div className="test-paper visible" id="testPaper">
            <div className="test-header">
              <h2>JEE ADVANCED MATHEMATICS - PRACTICE TEST</h2>
              <div className="test-info">
                <div className="test-info-item">
                  <strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="test-info-item">
                  <strong>Questions:</strong> {currentTest.length}
                </div>
                <div className="test-info-item">
                  <strong>Time Elapsed:</strong> {testStartTime ? formatTime((Date.now() - testStartTime) / 1000) : '0:00'}
                </div>
              </div>
            </div>

            <div className="flagged-info">
              <strong>ℹ️ Tip:</strong> You can flag questions you find confusing and replace them with new ones from the same topic!
            </div>

            {showResults && (
              <div className="results-summary visible" id="resultsSummary">
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📊 Test Results</h3>
                <div className="results-grid">
                  <div className="result-card">
                    <div className="result-value correct">{results.correct}</div>
                    <div className="stat-label">Correct</div>
                  </div>
                  <div className="result-card">
                    <div className="result-value incorrect">{results.incorrect}</div>
                    <div className="stat-label">Incorrect</div>
                  </div>
                  <div className="result-card">
                    <div className="result-value unattempted">{results.unattempted}</div>
                    <div className="stat-label">Unattempted</div>
                  </div>
                  <div className="result-card">
                    <div className="result-value percentage">{results.percentage}%</div>
                    <div className="stat-label">Score</div>
                  </div>
                </div>
              </div>
            )}

            <div id="questionContainer">
              {currentTest.map((question, idx) => {
                const userAnswer = userAnswers[idx]
                const isFlagged = flaggedQuestions.has(idx)
                const isCorrect = testSubmitted && question.correct_answer && userAnswer === question.correct_answer
                const isIncorrect = testSubmitted && userAnswer && userAnswer !== question.correct_answer

                return (
                  <div
                    key={idx}
                    className={`question-wrapper ${isFlagged ? 'flagged' : ''} ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
                  >
                    <div className="question-header">
                      <span className="question-number">Question {idx + 1}</span>
                      <div className="question-actions">
                        <button
                          className={`flag-btn ${isFlagged ? 'active' : ''}`}
                          onClick={() => toggleFlag(idx)}
                          disabled={testSubmitted}
                          title="Flag this question"
                        >
                          {isFlagged ? '🚩 Flagged' : '🚩 Flag'}
                        </button>
                        <button
                          className="replace-btn"
                          onClick={() => replaceQuestion(idx)}
                          disabled={testSubmitted}
                          title="Replace with another question"
                        >
                          🔄 Replace
                        </button>
                        {testSubmitted && (
                          <span className={`question-status ${isCorrect ? 'correct' : isIncorrect ? 'incorrect' : ''}`}>
                            {!userAnswer ? 'Not Attempted' : isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        )}
                      </div>
                      <span className="difficulty">{question.difficulty}</span>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: question.question_html }} />
                    <div className="options-container">
                      {question.options.map(opt => {
                        const isSelected = userAnswer === opt.letter
                        const isCorrectAnswer = testSubmitted && question.correct_answer === opt.letter
                        const isWrongAnswer = testSubmitted && isSelected && !isCorrectAnswer

                        return (
                          <div
                            key={opt.letter}
                            className={`option-item ${isSelected ? 'selected' : ''} ${isCorrectAnswer ? 'correct-answer' : ''} ${isWrongAnswer ? 'wrong-answer' : ''}`}
                            onClick={() => selectOption(idx, opt.letter)}
                          >
                            <input
                              type="radio"
                              name={`q${idx}`}
                              value={opt.letter}
                              checked={isSelected}
                              onChange={() => selectOption(idx, opt.letter)}
                              disabled={testSubmitted}
                            />
                            <label>{opt.text}</label>
                          </div>
                        )
                      })}
                    </div>
                    {testSubmitted && question.correct_answer && (
                      <div className="solution-box visible">
                        <h4>💡 Solution</h4>
                        <p>
                          <strong>Correct Answer:</strong> ({question.correct_answer}) {question.options.find(o => o.letter === question.correct_answer)?.value}
                        </p>
                        <p>{question.solution || 'Solution not available for this question.'}</p>
                        {questionTimings[idx] && (
                          <p><strong>Time taken:</strong> {formatTime(questionTimings[idx])}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="submit-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercentage}%` }}>
                  {answeredCount}/{currentTest.length} answered
                </div>
              </div>
              <button
                className="btn btn-success"
                onClick={submitTest}
                disabled={testSubmitted}
              >
                {testSubmitted ? '✅ Test Submitted' : '✅ Submit Test'}
              </button>
              <button className="btn btn-secondary" onClick={backToSettings}>
                ⚙️ Back to Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
