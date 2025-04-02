// src/controllers/consultantController.js
const { Consultant } = require('../models/consultantModel');

exports.createConsultant = async (req, res, next) => {
  try {
    // Validate required fields
    const requiredFields = [
      'fulllegalname',
      'technology',
      'dateOfBirth',
      'stateOfResidence',
      'visaStatus',
      'maritalStatus',
      'phone',
      'email',
      'currentAddress',
      'usaLandingDate'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate terms acceptance
    if (!req.body.termsAccepted) {
      return res.status(400).json({
        message: 'Terms and conditions must be accepted'
      });
    }

    console.log('Creating consultant with data:', req.body);

    const consultant = await Consultant.create(req.body);
    
    console.log('Consultant created successfully:', consultant.id);

    // Fetch the created consultant to verify it exists
    const createdConsultant = await Consultant.findByPk(consultant.id);
    console.log('Fetched created consultant:', createdConsultant ? 'exists' : 'not found');

    return res.status(201).json(consultant);
  } catch (error) {
    console.error('Error in createConsultant:', error);
    next(error);
  }
};

// Upload payment proof
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert the buffer to a Base64 string
    const base64String = req.file.buffer.toString('base64');

    // Update the consultant's record with this Base64 string
    const consultant = await Consultant.findByPk(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }
    
    await consultant.update({ registrationProof: base64String });
    return res.status(200).json(consultant);
  } catch (error) {
    next(error);
  }
};

exports.getAllConsultants = async (req, res, next) => {
  try {
    const consultants = await Consultant.findAll({
      attributes: {
        exclude: ['registrationProof']
      }
    });

    // Log the result for debugging
    console.log('Consultants found:', consultants.length);
    
    return res.status(200).json(consultants);
  } catch (error) {
    console.error('Error in getAllConsultants:', error);
    next(error);
  }
};

exports.getConsultantById = async (req, res, next) => {
  try {
    const consultant = await Consultant.findByPk(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }
    return res.status(200).json(consultant);
  } catch (error) {
    next(error);
  }
};

exports.updateConsultant = async (req, res, next) => {
  try {
    const consultant = await Consultant.findByPk(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }
    
    await consultant.update(req.body);
    return res.status(200).json(consultant);
  } catch (error) {
    next(error);
  }
};

exports.deleteConsultant = async (req, res, next) => {
  try {
    const consultant = await Consultant.findByPk(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }
    
    await consultant.destroy();
    return res.status(200).json({ message: 'Consultant deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { verifybtn } = req.body;
    
    if (verifybtn === true) {
      const consultant = await Consultant.findByPk(req.params.id);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      await consultant.update({ paymentStatus: true });
      
      return res.status(200).json({
        message: 'Payment verified successfully',
        consultant
      });
    } else {
      return res.status(400).json({ message: 'Verification not approved' });
    }
  } catch (error) {
    next(error);
  }
};
