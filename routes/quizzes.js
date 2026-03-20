const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const dataDir = path.join(__dirname, '..', 'data');

// Get all quizzes
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir).filter(file => file.startsWith('quiz_'));
    const quizzes = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      return { id: file.replace('quiz_', '').replace('.json', ''), ...data };
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific quiz
router.get('/:id', (req, res) => {
  try {
    const filePath = path.join(dataDir, `quiz_${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ id: req.params.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or upload a new quiz
router.post('/', (req, res) => {
  try {
    const { title, description, questions } = req.body;
    if (!title || !questions) {
      return res.status(400).json({ error: 'Missing required fields: title, questions' });
    }
    
    const id = uuidv4();
    const filePath = path.join(dataDir, `quiz_${id}.json`);
    const data = { title, description: description || '', questions, createdAt: new Date().toISOString() };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save quiz results
router.post('/:id/results', (req, res) => {
  try {
    const { answers, score, totalQuestions, timeSpent } = req.body;
    const resultId = uuidv4();
    const resultPath = path.join(dataDir, `result_quiz_${resultId}.json`);
    
    const result = {
      quizId: req.params.id,
      answers,
      score,
      totalQuestions,
      percentage: ((score / totalQuestions) * 100).toFixed(2),
      timeSpent,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    res.json({ id: resultId, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get results for a quiz
router.get('/:id/results', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir).filter(file => file.startsWith('result_quiz_'));
    const results = files
      .map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
        return { id: file.replace('result_quiz_', '').replace('.json', ''), ...data };
      })
      .filter(r => r.quizId === req.params.id);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a quiz
router.delete('/:id', (req, res) => {
  try {
    const filePath = path.join(dataDir, `quiz_${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;