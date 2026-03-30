const express = require('express');
const Simulation = require('../models/Simulation');
const User = require('../models/User');
const Artifact = require('../models/Artifact');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get platform analytics (admin only)
router.get('/platform', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    startDate.setDate(now.getDate() - days);

    // User analytics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: startDate } 
    });
    
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const usersByTier = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subscription.tier', count: { $sum: 1 } } },
    ]);

    // Simulation analytics
    const totalSimulations = await Simulation.countDocuments();
    const completedSimulations = await Simulation.countDocuments({ 
      status: 'completed' 
    });
    const activeSimulations = await Simulation.countDocuments({ 
      status: 'in-progress' 
    });
    
    const newSimulations = await Simulation.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    const avgVVS = await Simulation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgVVS: { $avg: '$vvsScore.overall' } } },
    ]);

    const simulationsByIndustry = await Simulation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$venture.industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Artifact analytics
    const totalArtifacts = await Artifact.countDocuments();
    const downloadedArtifacts = await Artifact.aggregate([
      { $group: { _id: null, totalDownloads: { $sum: '$sharing.downloadCount' } } },
    ]);

    const artifactsByType = await Artifact.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Calculate completion rate
    const completionRate = totalSimulations > 0 
      ? (completedSimulations / totalSimulations) * 100 
      : 0;

    // Calculate average session duration
    const avgDuration = await Simulation.aggregate([
      { $match: { status: 'completed', 'completionData.totalDuration': { $exists: true } } },
      { $group: { _id: null, avgDuration: { $avg: '$completionData.totalDuration' } } },
    ]);

    const analytics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        byRole: usersByRole,
        byTier: usersByTier,
      },
      simulations: {
        total: totalSimulations,
        completed: completedSimulations,
        active: activeSimulations,
        new: newSimulations,
        completionRate: Math.round(completionRate * 100) / 100,
        avgVVS: avgVVS[0]?.avgVVS ? Math.round(avgVVS[0].avgVVS) : 0,
        avgDuration: avgDuration[0]?.avgDuration ? Math.round(avgDuration[0].avgDuration) : 0,
        byIndustry: simulationsByIndustry,
      },
      artifacts: {
        total: totalArtifacts,
        totalDownloads: downloadedArtifacts[0]?.totalDownloads || 0,
        byType: artifactsByType,
      },
      timeframe,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error getting platform analytics:', error);
    res.status(500).json({
      error: 'Failed to get platform analytics',
      message: error.message,
    });
  }
});

// Get user analytics
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    startDate.setDate(now.getDate() - days);

    // User's simulations
    const userSimulations = await Simulation.find({ user: userId });
    const completedSimulations = userSimulations.filter(s => s.status === 'completed');
    const recentSimulations = userSimulations.filter(s => 
      new Date(s.createdAt) >= startDate
    );

    // Calculate VVS progression
    const vvsProgression = completedSimulations.map(sim => ({
      simulationId: sim._id,
      ventureName: sim.venture.name,
      vvsScore: sim.vvsScore.overall,
      completedAt: sim.completionData.completedAt,
      dimensions: sim.vvsScore.dimensions,
    }));

    // Calculate average scores
    const avgVVS = completedSimulations.length > 0
      ? completedSimulations.reduce((sum, sim) => sum + sim.vvsScore.overall, 0) / completedSimulations.length
      : 0;

    // Phase completion rates
    const phaseCompletionRates = {};
    for (let phase = 0; phase <= 7.5; phase += 0.5) {
      const phaseCount = userSimulations.filter(sim => 
        sim.phaseHistory.some(p => p.phase === phase && p.completedAt)
      ).length;
      phaseCompletionRates[phase] = userSimulations.length > 0 
        ? (phaseCount / userSimulations.length) * 100 
        : 0;
    }

    // Time spent per phase
    const phaseTimeSpent = {};
    for (let phase = 0; phase <= 7.5; phase += 0.5) {
      const phaseDurations = userSimulations
        .map(sim => sim.phaseHistory.find(p => p.phase === phase))
        .filter(p => p && p.duration)
        .map(p => p.duration);
      
      phaseTimeSpent[phase] = phaseDurations.length > 0
        ? Math.round(phaseDurations.reduce((sum, duration) => sum + duration, 0) / phaseDurations.length)
        : 0;
    }

    // Artifact generation
    const userArtifacts = await Artifact.find({ user: userId });
    const artifactsByType = {};
    userArtifacts.forEach(artifact => {
      artifactsByType[artifact.type] = (artifactsByType[artifact.type] || 0) + 1;
    });

    // Bias analysis trends
    const biasTrends = completedSimulations
      .filter(sim => sim.biasAnalysis && sim.biasAnalysis.overallBiasScore !== undefined)
      .map(sim => ({
        simulationId: sim._id,
        biasScore: sim.biasAnalysis.overallBiasScore,
        completedAt: sim.completionData.completedAt,
        detectedBiases: sim.biasAnalysis.detectedBiases?.length || 0,
      }));

    const analytics = {
      overview: {
        totalSimulations: userSimulations.length,
        completedSimulations: completedSimulations.length,
        recentSimulations: recentSimulations.length,
        avgVVS: Math.round(avgVVS * 100) / 100,
        totalArtifacts: userArtifacts.length,
        totalTimeSpent: userSimulations.reduce((sum, sim) => 
          sum + (sim.completionData.totalDuration || 0), 0
        ),
      },
      vvsProgression,
      phaseAnalytics: {
        completionRates: phaseCompletionRates,
        avgTimeSpent: phaseTimeSpent,
      },
      artifacts: {
        total: userArtifacts.length,
        byType: artifactsByType,
        totalDownloads: userArtifacts.reduce((sum, artifact) => 
          sum + artifact.sharing.downloadCount, 0
        ),
      },
      biasAnalysis: {
        trends: biasTrends,
        avgBiasScore: biasTrends.length > 0
          ? biasTrends.reduce((sum, trend) => sum + trend.biasScore, 0) / biasTrends.length
          : 0,
      },
      timeframe,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error getting user analytics:', error);
    res.status(500).json({
      error: 'Failed to get user analytics',
      message: error.message,
    });
  }
});

// Get simulation analytics
router.get('/simulation/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const simulation = await Simulation.findById(id)
      .populate('user', 'firstName lastName email');

    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    // Check ownership or admin/mentor access
    const isOwner = simulation.user._id.toString() === req.user._id.toString();
    const isMentorOrAdmin = ['mentor', 'admin'].includes(req.user.role);

    if (!isOwner && !isMentorOrAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this simulation analytics',
      });
    }

    // Calculate detailed analytics
    const phaseAnalytics = simulation.phaseHistory.map(phase => ({
      phase: phase.phase,
      phaseName: this.getPhaseName(phase.phase),
      duration: phase.duration,
      responseCount: phase.responses.length,
      insightCount: phase.insights.length,
      startedAt: phase.startedAt,
      completedAt: phase.completedAt,
      avgResponseQuality: phase.responses.length > 0
        ? phase.responses.reduce((sum, response) => 
            sum + (response.evaluation?.score || 0), 0
          ) / phase.responses.length
        : 0,
    }));

    // Response quality trends
    const responseQualityTrends = [];
    simulation.phaseHistory.forEach(phase => {
      phase.responses.forEach(response => {
        if (response.evaluation && response.evaluation.score) {
          responseQualityTrends.push({
            phase: phase.phase,
            agent: response.agent,
            score: response.evaluation.score,
            timestamp: response.timestamp,
          });
        }
      });
    });

    // VVS progression
    const vvsProgression = simulation.vvsScore.trajectory.map(point => ({
      phase: point.phase,
      score: point.score,
      timestamp: point.timestamp,
      phaseName: this.getPhaseName(point.phase),
    }));

    // Insight analysis
    const insightAnalysis = {};
    simulation.phaseHistory.forEach(phase => {
      phase.insights.forEach(insight => {
        insightAnalysis[insight.type] = (insightAnalysis[insight.type] || 0) + 1;
      });
    });

    // Agent interaction analysis
    const agentInteractions = {};
    simulation.phaseHistory.forEach(phase => {
      phase.responses.forEach(response => {
        if (response.agent !== 'user') {
          agentInteractions[response.agent] = (agentInteractions[response.agent] || 0) + 1;
        }
      });
    });

    const analytics = {
      simulation: {
        id: simulation._id,
        ventureName: simulation.venture.name,
        industry: simulation.venture.industry,
        status: simulation.status,
        createdAt: simulation.createdAt,
        completedAt: simulation.completionData.completedAt,
        totalDuration: simulation.completionData.totalDuration,
        finalVVS: simulation.vvsScore.overall,
        certificationLevel: this.getCertificationLevel(simulation.vvsScore.overall),
      },
      phaseAnalytics,
      responseQuality: {
        trends: responseQualityTrends,
        averageScore: responseQualityTrends.length > 0
          ? responseQualityTrends.reduce((sum, trend) => sum + trend.score, 0) / responseQualityTrends.length
          : 0,
      },
      vvsProgression,
      insightAnalysis,
      agentInteractions,
      biasAnalysis: simulation.biasAnalysis,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error getting simulation analytics:', error);
    res.status(500).json({
      error: 'Failed to get simulation analytics',
      message: error.message,
    });
  }
});

// Get cohort analytics
router.get('/cohort', authenticate, authorize('admin', 'mentor'), async (req, res) => {
  try {
    const { industry, timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    startDate.setDate(now.getDate() - days);

    // Build query
    const query = { 
      status: 'completed',
      'completionData.completedAt': { $gte: startDate }
    };
    
    if (industry) {
      query['venture.industry'] = industry;
    }

    const cohortSimulations = await Simulation.find(query)
      .populate('user', 'profile.experience profile.persona');

    // Calculate cohort metrics
    const cohortSize = cohortSimulations.length;
    
    if (cohortSize === 0) {
      return res.json({
        success: true,
        data: {
          cohortSize: 0,
          avgVVS: 0,
          completionRate: 0,
          avgDuration: 0,
          distribution: {},
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const avgVVS = cohortSimulations.reduce((sum, sim) => sum + sim.vvsScore.overall, 0) / cohortSize;
    const avgDuration = cohortSimulations.reduce((sum, sim) => sum + (sim.completionData.totalDuration || 0), 0) / cohortSize;

    // VVS distribution
    const vvsDistribution = {
      '90-100': cohortSimulations.filter(sim => sim.vvsScore.overall >= 90).length,
      '80-89': cohortSimulations.filter(sim => sim.vvsScore.overall >= 80 && sim.vvsScore.overall < 90).length,
      '70-79': cohortSimulations.filter(sim => sim.vvsScore.overall >= 70 && sim.vvsScore.overall < 80).length,
      '65-69': cohortSimulations.filter(sim => sim.vvsScore.overall >= 65 && sim.vvsScore.overall < 70).length,
      'Below 65': cohortSimulations.filter(sim => sim.vvsScore.overall < 65).length,
    };

    // Experience level distribution
    const experienceDistribution = {};
    cohortSimulations.forEach(sim => {
      const experience = sim.user.profile.experience || 'unknown';
      experienceDistribution[experience] = (experienceDistribution[experience] || 0) + 1;
    });

    // Persona distribution
    const personaDistribution = {};
    cohortSimulations.forEach(sim => {
      const persona = sim.user.profile.persona || 'unknown';
      personaDistribution[persona] = (personaDistribution[persona] || 0) + 1;
    });

    // Industry distribution (if not filtered)
    const industryDistribution = {};
    if (!industry) {
      cohortSimulations.forEach(sim => {
        const ind = sim.venture.industry || 'unknown';
        industryDistribution[ind] = (industryDistribution[ind] || 0) + 1;
      });
    }

    const analytics = {
      cohortSize,
      timeframe,
      filters: { industry },
      metrics: {
        avgVVS: Math.round(avgVVS * 100) / 100,
        avgDuration: Math.round(avgDuration),
        completionRate: 100, // All are completed by query
      },
      distributions: {
        vvs: vvsDistribution,
        experience: experienceDistribution,
        persona: personaDistribution,
        ...(industry && !industry ? { industry: industryDistribution } : {}),
      },
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error getting cohort analytics:', error);
    res.status(500).json({
      error: 'Failed to get cohort analytics',
      message: error.message,
    });
  }
});

// Helper methods
function getPhaseName(phase) {
  const phaseNames = {
    0: 'Market Confrontation',
    0.5: 'Bias Calibration',
    1: 'Problem Validation',
    2: 'Customer Discovery',
    3: 'Solution Architecture',
    4: 'Business Model Design',
    5: 'Go-to-Market Strategy',
    6: 'Risk & Resilience',
    7: 'Smart Report',
    7.5: 'Investor Panel',
  };
  return phaseNames[phase] || 'Unknown';
}

function getCertificationLevel(score) {
  if (score >= 90) return 'Platinum';
  if (score >= 80) return 'Gold';
  if (score >= 70) return 'Silver';
  if (score >= 65) return 'Bronze';
  return 'Not Certified';
}

module.exports = router;
