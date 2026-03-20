const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const dataDir = path.join(__dirname, '..', 'data');

// Get all flashcard decks
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir).filter(file => file.startsWith('deck_'));
    const decks = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      return { id: file.replace('deck_', '').replace('.json', ''), ...data };
    });
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific deck
router.get('/:id', (req, res) => {
  try {
    const filePath = path.join(dataDir, `deck_${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ id: req.params.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or upload a new deck
router.post('/', (req, res) => {
  try {
    const { name, cards } = req.body;
    if (!name || !cards) {
      return res.status(400).json({ error: 'Missing required fields: name, cards' });
    }
    
    const id = uuidv4();
    const filePath = path.join(dataDir, `deck_${id}.json`);
    const data = { name, cards, createdAt: new Date().toISOString() };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save study results for a deck
router.post('/:id/results', (req, res) => {
  try {
    const { completed, correctCount, totalCards, timeSpent } = req.body;
    const resultId = uuidv4();
    const resultPath = path.join(dataDir, `result_flashcard_${resultId}.json`);
    
    const result = {
      deckId: req.params.id,
      completed,
      correctCount,
      totalCards,
      timeSpent,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    res.json({ id: resultId, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get results for a deck
router.get('/:id/results', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir).filter(file => file.startsWith('result_flashcard_'));
    const results = files
      .map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
        return { id: file.replace('result_flashcard_', '').replace('.json', ''), ...data };
      })
      .filter(r => r.deckId === req.params.id);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a deck
router.delete('/:id', (req, res) => {
  try {
    const filePath = path.join(dataDir, `deck_${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;