const { Company } = require('../models/companyModel');
const { CompanyJob } = require('../models/companyJobModel');

// Create a new company
exports.createCompany = async (req, res, next) => {
  try {
    const { companyName, city, country } = req.body;

    // Validate required fields
    if (!companyName || !city || !country) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['companyName', 'city', 'country']
      });
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({
      where: { companyName }
    });

    if (existingCompany) {
      return res.status(400).json({
        message: 'Company with this name already exists'
      });
    }

    // Create company with user ID who created it
    const company = await Company.create({
      ...req.body,
      createdBy: req.user.id // From auth middleware
    });

    return res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

// Get all companies with their job postings
exports.getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Company.findAll({
      include: [{
        model: CompanyJob,
        attributes: ['id', 'jobTitle', 'isActive', 'createdAt']
      }]
    });

    return res.status(200).json(companies);
  } catch (error) {
    next(error);
  }
};

// Get company by ID with its job postings
exports.getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{
        model: CompanyJob,
        attributes: ['id', 'jobTitle', 'isActive', 'createdAt']
      }]
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    return res.status(200).json(company);
  } catch (error) {
    next(error);
  }
};

// Update company
exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await company.update(req.body);
    return res.status(200).json(company);
  } catch (error) {
    next(error);
  }
};

// Delete company (will also delete associated jobs due to CASCADE)
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await company.destroy();
    return res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add a job posting to a company
exports.addJobPosting = async (req, res, next) => {
  try {
    const { id: companyId } = req.params;
    const { jobTitle } = req.body;

    // Validate company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Validate required fields
    if (!jobTitle) {
      return res.status(400).json({
        message: 'Job title is required'
      });
    }

    // Create job posting
    const jobPosting = await CompanyJob.create({
      jobTitle,
      companyId,
      createdBy: req.user.id // From auth middleware
    });

    return res.status(201).json(jobPosting);
  } catch (error) {
    next(error);
  }
};

// Update job posting
exports.updateJobPosting = async (req, res, next) => {
  try {
    const { companyId, jobId } = req.params;

    const jobPosting = await CompanyJob.findOne({
      where: { id: jobId, companyId }
    });

    if (!jobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    await jobPosting.update(req.body);
    return res.status(200).json(jobPosting);
  } catch (error) {
    next(error);
  }
};

// Delete job posting
exports.deleteJobPosting = async (req, res, next) => {
  try {
    const { companyId, jobId } = req.params;

    const jobPosting = await CompanyJob.findOne({
      where: { id: jobId, companyId }
    });

    if (!jobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    await jobPosting.destroy();
    return res.status(200).json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get jobs for a specific company
exports.getCompanyJobs = async (req, res, next) => {
  try {
    const { id: companyId } = req.params;

    // Check if company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get all jobs for this company
    const jobs = await CompanyJob.findAll({
      where: { companyId },
      attributes: ['id', 'jobTitle', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']] // Most recent first
    });

    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
}; 