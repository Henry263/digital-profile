// File: routes/suggestion.js
const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');

// @route   POST /api/suggestions
// @desc    Submit a new suggestion
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, category, title, details } = req.body;

    // Basic validation
    if (!name || !email || !category || !title || !details) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Create new suggestion
    const newSuggestion = new Suggestion({
      name,
      email,
      category,
      title,
      details,
      timestamp: new Date()
    });

    // Save to database
    const savedSuggestion = await newSuggestion.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Thank you for your suggestion! We\'ll review it and get back to you soon.',
      data: {
        id: savedSuggestion._id,
        title: savedSuggestion.title,
        category: savedSuggestion.category,
        timestamp: savedSuggestion.timestamp
      }
    });

  } catch (error) {
    console.error('Suggestion submission error:', error);
    res.status(500).json({
      success: false,
      message: 'There was an error processing your suggestion. Please try again later.'
    });
  }
});

// @route   GET /api/suggestions
// @desc    Get all suggestions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions'
    });
  }
});

module.exports = router;