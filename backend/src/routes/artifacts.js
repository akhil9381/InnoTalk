const express = require('express');
const Joi = require('joi');
const Artifact = require('../models/Artifact');
const Simulation = require('../models/Simulation');
const artifactGenerationService = require('../services/artifactGeneration');
const { authenticate, requireSubscription, checkOwnership } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const generateArtifactsSchema = Joi.object({
  simulationId: Joi.string().required(),
  artifactTypes: Joi.array().items(
    Joi.string().valid('prd', 'pitch-deck', 'grant-prism', 'grant-sisfs', 'certificate', 'financial-model', 'regulatory-report')
  ).default(['prd', 'pitch-deck']),
});

// Generate artifacts for simulation
router.post('/generate', authenticate, requireSubscription('pro', 'enterprise'), async (req, res) => {
  try {
    const { error, value } = generateArtifactsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { simulationId, artifactTypes } = value;

    // Check if user owns the simulation
    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    if (simulation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only generate artifacts for your own simulations',
      });
    }

    // Check if simulation is completed
    if (simulation.status !== 'completed') {
      return res.status(400).json({
        error: 'Simulation not completed',
        message: 'Artifacts can only be generated for completed simulations',
      });
    }

    // Generate artifacts
    const artifacts = await artifactGenerationService.generateAllArtifacts(simulation);

    // Filter by requested types
    const filteredArtifacts = artifacts.filter(artifact => 
      artifactTypes.includes(artifact.type)
    );

    logger.info(`Generated ${filteredArtifacts.length} artifacts for simulation ${simulationId}`);

    res.json({
      success: true,
      data: {
        artifacts: filteredArtifacts,
        totalGenerated: artifacts.length,
        requestedTypes: artifactTypes,
      },
      message: 'Artifacts generated successfully',
    });
  } catch (error) {
    logger.error('Error generating artifacts:', error);
    res.status(500).json({
      error: 'Failed to generate artifacts',
      message: error.message,
    });
  }
});

// Get user's artifacts
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    const options = {
      type,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const artifacts = await Artifact.findByUser(req.user._id, options)
      .populate('simulation', 'venture.name status')
      .sort({ createdAt: -1 })
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Artifact.countDocuments({ 
      user: req.user._id,
      ...(type && { type }),
      ...(status && { status }),
    });

    res.json({
      success: true,
      data: {
        artifacts,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting artifacts:', error);
    res.status(500).json({
      error: 'Failed to get artifacts',
      message: error.message,
    });
  }
});

// Get specific artifact
router.get('/:id', authenticate, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id)
      .populate('simulation', 'venture.name status vvsScore')
      .populate('user', 'firstName lastName email');

    if (!artifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    // Check ownership or public access
    const isOwner = artifact.user._id.toString() === req.user._id.toString();
    const isPublic = artifact.sharing.isPublic;
    const isMentorOrAdmin = ['mentor', 'admin'].includes(req.user.role);

    if (!isOwner && !isPublic && !isMentorOrAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this artifact',
      });
    }

    // Increment view count if not owner
    if (!isOwner) {
      await artifact.incrementView();
    }

    res.json({
      success: true,
      data: artifact,
    });
  } catch (error) {
    logger.error('Error getting artifact:', error);
    res.status(500).json({
      error: 'Failed to get artifact',
      message: error.message,
    });
  }
});

// Download artifact file
router.get('/:id/download/:format', authenticate, async (req, res) => {
  try {
    const { id, format } = req.params;
    const artifact = await Artifact.findById(id);

    if (!artifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    // Check ownership or public access with download permission
    const isOwner = artifact.user.toString() === req.user._id.toString();
    const isPublic = artifact.sharing.isPublic && artifact.sharing.permissions.canDownload;
    const isMentorOrAdmin = ['mentor', 'admin'].includes(req.user.role);

    if (!isOwner && !isPublic && !isMentorOrAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to download this artifact',
      });
    }

    // Find the requested file format
    const file = artifact.files.find(f => f.format === format);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: `Artifact file in ${format} format not available`,
      });
    }

    // Increment download count if not owner
    if (!isOwner) {
      await artifact.incrementDownload();
    }

    // Send file
    const filePath = path.join(__dirname, '../../uploads/artifacts', file.filename);
    res.download(filePath, file.filename, (err) => {
      if (err) {
        logger.error('Error downloading file:', err);
        res.status(500).json({
          error: 'Failed to download file',
          message: err.message,
        });
      }
    });
  } catch (error) {
    logger.error('Error downloading artifact:', error);
    res.status(500).json({
      error: 'Failed to download artifact',
      message: error.message,
    });
  }
});

// Get artifacts for simulation
router.get('/simulation/:simulationId', authenticate, async (req, res) => {
  try {
    const { simulationId } = req.params;

    // Check if user owns the simulation
    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    if (simulation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view artifacts for your own simulations',
      });
    }

    const artifacts = await Artifact.findBySimulation(simulationId);

    res.json({
      success: true,
      data: {
        artifacts,
        simulation: {
          id: simulation._id,
          ventureName: simulation.venture.name,
          status: simulation.status,
          vvsScore: simulation.vvsScore.overall,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting simulation artifacts:', error);
    res.status(500).json({
      error: 'Failed to get simulation artifacts',
      message: error.message,
    });
  }
});

// Share artifact
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic, permissions } = req.body;

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    // Check ownership
    if (artifact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only share your own artifacts',
      });
    }

    // Update sharing settings
    artifact.sharing.isPublic = isPublic !== undefined ? isPublic : artifact.sharing.isPublic;
    
    if (permissions) {
      artifact.sharing.permissions = {
        ...artifact.sharing.permissions,
        ...permissions,
      };
    }

    // Generate share token if making public
    if (isPublic && !artifact.sharing.shareToken) {
      const shareToken = artifact.generateShareToken();
      await artifact.save();
      
      return res.json({
        success: true,
        data: {
          shareUrl: artifact.sharing.shareUrl,
          shareToken: shareToken,
          expiresAt: artifact.sharing.expiresAt,
        },
        message: 'Artifact shared successfully',
      });
    }

    await artifact.save();

    res.json({
      success: true,
      data: {
        sharing: artifact.sharing,
      },
      message: 'Sharing settings updated',
    });
  } catch (error) {
    logger.error('Error sharing artifact:', error);
    res.status(500).json({
      error: 'Failed to share artifact',
      message: error.message,
    });
  }
});

// Get shared artifact by token
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const artifact = await Artifact.findByShareToken(token);

    if (!artifact) {
      return res.status(404).json({
        error: 'Shared artifact not found or expired',
      });
    }

    // Increment view count
    await artifact.incrementView();

    res.json({
      success: true,
      data: {
        artifact,
        sharing: {
          viewCount: artifact.sharing.viewCount,
          downloadCount: artifact.sharing.downloadCount,
          expiresAt: artifact.sharing.expiresAt,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting shared artifact:', error);
    res.status(500).json({
      error: 'Failed to get shared artifact',
      message: error.message,
    });
  }
});

// Add feedback to artifact
router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments, useful } = req.body;

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    // Check if user can provide feedback
    const isOwner = artifact.user.toString() === req.user._id.toString();
    const isMentorOrAdmin = ['mentor', 'admin'].includes(req.user.role);

    if (!isOwner && !isMentorOrAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to provide feedback on this artifact',
      });
    }

    // Update feedback
    if (rating !== undefined) {
      artifact.feedback.rating = rating;
    }
    if (comments !== undefined) {
      artifact.feedback.comments = comments;
    }
    if (useful !== undefined) {
      artifact.feedback.useful = useful;
    }

    await artifact.save();

    res.json({
      success: true,
      data: {
        feedback: artifact.feedback,
      },
      message: 'Feedback added successfully',
    });
  } catch (error) {
    logger.error('Error adding feedback:', error);
    res.status(500).json({
      error: 'Failed to add feedback',
      message: error.message,
    });
  }
});

// Get artifact usage statistics
router.get('/stats/usage', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await Artifact.getUsageStats(userId);

    res.json({
      success: true,
      data: {
        stats,
        totalArtifacts: stats.reduce((sum, stat) => sum + stat.count, 0),
        totalDownloads: stats.reduce((sum, stat) => sum + stat.totalDownloads, 0),
        averageRating: stats.reduce((sum, stat) => sum + (stat.avgRating || 0), 0) / stats.length,
      },
    });
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics',
      message: error.message,
    });
  }
});

// Delete artifact
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    // Check ownership
    if (artifact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own artifacts',
      });
    }

    // Delete files from filesystem
    for (const file of artifact.files) {
      try {
        const filePath = path.join(__dirname, '../../uploads/artifacts', file.filename);
        await fs.unlink(filePath);
      } catch (fileError) {
        logger.warn(`Failed to delete file ${file.filename}:`, fileError);
      }
    }

    // Delete artifact from database
    await Artifact.findByIdAndDelete(req.params.id);

    logger.info(`Artifact deleted: ${req.params.id} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Artifact deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting artifact:', error);
    res.status(500).json({
      error: 'Failed to delete artifact',
      message: error.message,
    });
  }
});

// Regenerate artifact
router.post('/:id/regenerate', authenticate, requireSubscription('pro', 'enterprise'), async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    // Check ownership
    if (artifact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only regenerate your own artifacts',
      });
    }

    // Get simulation data
    const simulation = await Simulation.findById(artifact.simulation);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    // Regenerate specific artifact type
    let newArtifact;
    switch (artifact.type) {
      case 'prd':
        newArtifact = await artifactGenerationService.generatePRD(simulation);
        break;
      case 'pitch-deck':
        newArtifact = await artifactGenerationService.generatePitchDeck(simulation);
        break;
      case 'grant-prism':
        newArtifact = await artifactGenerationService.generatePRISMGrant(simulation);
        break;
      case 'grant-sisfs':
        newArtifact = await artifactGenerationService.generateSISFSGrant(simulation);
        break;
      case 'certificate':
        newArtifact = await artifactGenerationService.generateFounderCertificate(simulation);
        break;
      case 'financial-model':
        newArtifact = await artifactGenerationService.generateFinancialModel(simulation);
        break;
      case 'regulatory-report':
        newArtifact = await artifactGenerationService.generateRegulatoryReport(simulation);
        break;
      default:
        return res.status(400).json({
          error: 'Unsupported artifact type',
          message: `Cannot regenerate artifact of type: ${artifact.type}`,
        });
    }

    // Delete old artifact
    await Artifact.findByIdAndDelete(req.params.id);

    logger.info(`Artifact regenerated: ${req.params.id} -> ${newArtifact._id}`);

    res.json({
      success: true,
      data: newArtifact,
      message: 'Artifact regenerated successfully',
    });
  } catch (error) {
    logger.error('Error regenerating artifact:', error);
    res.status(500).json({
      error: 'Failed to regenerate artifact',
      message: error.message,
    });
  }
});

module.exports = router;
