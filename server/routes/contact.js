// File: routes/contact.js
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// @route   POST /api/contact
// @desc    Submit a new contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Create new contact
    const newContact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date()
    });

    // Save to database
    const savedContact = await newContact.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      data: {
        id: savedContact._id,
        subject: savedContact.subject,
        timestamp: savedContact.timestamp
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'There was an error processing your request. Please try again later.'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contacts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: contacts
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
});

module.exports = router;