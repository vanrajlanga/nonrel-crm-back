// src/controllers/consultantController.js
const { Consultant, ExtraService } = require('../models/consultantModel');

exports.createConsultant = async (req, res, next) => {
  try {
    const consultant = await Consultant.create(req.body);
    return res.status(201).json(consultant);
  } catch (error) {
    next(error);
  }
};

exports.uploadProof = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert the buffer to a Base64 string.
    const base64String = req.file.buffer.toString('base64');

    // Update the consultant's record with this Base64 URL string.
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
      include: [ExtraService]
    });
    return res.status(200).json(consultants);
  } catch (error) {
    next(error);
  }
};

exports.getConsultantById = async (req, res, next) => {
  try {
    const consultant = await Consultant.findByPk(req.params.id, {
      include: [ExtraService]
    });
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

// Add a new method to handle extra services
exports.addExtraService = async (req, res, next) => {
  try {
    const consultant = await Consultant.findByPk(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }
    
    const extraService = await ExtraService.create({
      ...req.body,
      ConsultantId: consultant.id
    });
    
    return res.status(201).json(extraService);
  } catch (error) {
    next(error);
  }
};
