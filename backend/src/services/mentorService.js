const User = require('../models/User');
const Simulation = require('../models/Simulation');
const Artifact = require('../models/Artifact');
const logger = require('../utils/logger');

class MentorService {
  constructor() {
    this.mentorMatchingCriteria = {
      industry: { weight: 0.3, importance: 'high' },
      experience: { weight: 0.25, importance: 'high' },
      expertise: { weight: 0.2, importance: 'medium' },
      stage: { weight: 0.15, importance: 'medium' },
      availability: { weight: 0.1, importance: 'low' },
    };

    this.mentorSessionTypes = {
      'strategy-review': {
        name: 'Strategy Review',
        duration: 60,
        description: 'Review overall venture strategy and direction',
        focus: ['market-fit', 'business-model', 'growth-strategy'],
      },
      'technical-advisory': {
        name: 'Technical Advisory',
        duration: 45,
        description: 'Technical architecture and development guidance',
        focus: ['architecture', 'scalability', 'technology-stack'],
      },
      'funding-prep': {
        name: 'Funding Preparation',
        duration: 60,
        description: 'Prepare for investor meetings and funding rounds',
        focus: ['pitch-deck', 'financial-model', 'investor-relations'],
      },
      'product-feedback': {
        name: 'Product Feedback',
        duration: 30,
        description: 'Review product and user experience',
        focus: ['user-experience', 'product-market-fit', 'feature-prioritization'],
      },
      'regulatory-guidance': {
        name: 'Regulatory Guidance',
        duration: 45,
        description: 'Navigate regulatory requirements and compliance',
        focus: ['compliance', 'legal-requirements', 'regulatory-strategy'],
      },
    };
  }

  // Find compatible mentors for a user
  async findCompatibleMentors(userId, simulationId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let ventureContext = null;
      if (simulationId) {
        const simulation = await Simulation.findById(simulationId);
        if (simulation) {
          ventureContext = {
            industry: simulation.venture.industry,
            businessModel: simulation.venture.businessModel,
            vvsScore: simulation.vvsScore.overall,
            currentPhase: simulation.currentPhase,
          };
        }
      }

      const userProfile = {
        industry: user.profile?.industry,
        experience: user.profile?.experience,
        persona: user.profile?.persona,
        location: user.profile?.location,
      };

      const mentors = await User.find({
        role: 'mentor',
        isActive: true,
        'mentorProfile.availableHours': { $gt: 0 },
      }).select('firstName lastName email profile mentorProfile');

      const scoredMentors = mentors.map(mentor => {
        const score = this.calculateMentorCompatibility(userProfile, ventureContext, mentor);
        return {
          mentor: mentor.toSafeObject(),
          compatibilityScore: score.overall,
          scoreBreakdown: score.breakdown,
          recommendation: this.generateMentorRecommendation(score, mentor),
        };
      });

      // Sort by compatibility score (descending)
      scoredMentors.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      return {
        userId,
        userProfile,
        ventureContext,
        mentors: scoredMentors.slice(0, 10), // Top 10 mentors
        totalAvailable: mentors.length,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error finding compatible mentors:', error);
      throw error;
    }
  }

  // Calculate mentor compatibility score
  calculateMentorCompatibility(userProfile, ventureContext, mentor) {
    let totalScore = 0;
    const breakdown = {};

    // Industry compatibility
    if (userProfile.industry && mentor.mentorProfile.expertise) {
      const industryMatch = mentor.mentorProfile.expertise.some(exp => 
        exp.toLowerCase().includes(userProfile.industry.toLowerCase()) ||
        userProfile.industry.toLowerCase().includes(exp.toLowerCase())
      );
      breakdown.industry = industryMatch ? 100 : 30;
    } else {
      breakdown.industry = 50; // Neutral
    }
    totalScore += breakdown.industry * this.mentorMatchingCriteria.industry.weight;

    // Experience level compatibility
    const experienceLevels = {
      'student': 0,
      '0-2': 1,
      '3-5': 2,
      '6-10': 3,
      '10+': 4,
    };

    const userExpLevel = experienceLevels[userProfile.experience] || 0;
    const mentorExpLevel = this.estimateMentorExperienceLevel(mentor);
    
    // Ideal mentor is 2-3 levels above user
    const idealGap = 2;
    const actualGap = mentorExpLevel - userExpLevel;
    const experienceScore = Math.max(0, 100 - (Math.abs(actualGap - idealGap) * 20));
    
    breakdown.experience = experienceScore;
    totalScore += experienceScore * this.mentorMatchingCriteria.experience.weight;

    // Expertise matching
    if (ventureContext && mentor.mentorProfile.expertise) {
      const relevantExpertise = this.getRelevantExpertise(ventureContext);
      const expertiseMatch = relevantExpertise.some(exp => 
        mentor.mentorProfile.expertise.some(mentorExp => 
          mentorExp.toLowerCase().includes(exp.toLowerCase()) ||
          exp.toLowerCase().includes(mentorExp.toLowerCase())
        )
      );
      breakdown.expertise = expertiseMatch ? 100 : 40;
    } else {
      breakdown.expertise = 60;
    }
    totalScore += breakdown.expertise * this.mentorMatchingCriteria.expertise.weight;

    // Stage compatibility
    if (ventureContext) {
      const stageScore = this.calculateStageCompatibility(ventureContext, mentor);
      breakdown.stage = stageScore;
    } else {
      breakdown.stage = 70;
    }
    totalScore += stageScore * this.mentorMatchingCriteria.stage.weight;

    // Availability
    const availabilityScore = Math.min(100, mentor.mentorProfile.availableHours * 5); // 20 hours = 100 points
    breakdown.availability = availabilityScore;
    totalScore += availabilityScore * this.mentorMatchingCriteria.availability.weight;

    return {
      overall: Math.round(totalScore),
      breakdown,
    };
  }

  // Estimate mentor experience level
  estimateMentorExperienceLevel(mentor) {
    const experience = mentor.mentorProfile.experience?.toLowerCase() || '';
    
    if (experience.includes('15+') || experience.includes('20+')) return 5;
    if (experience.includes('10+') || experience.includes('15')) return 4;
    if (experience.includes('5+') || experience.includes('10')) return 3;
    if (experience.includes('2+') || experience.includes('5')) return 2;
    return 1;
  }

  // Get relevant expertise based on venture context
  getRelevantExpertise(ventureContext) {
    const expertise = [];
    
    // Industry-specific expertise
    expertise.push(ventureContext.industry);
    
    // Business model expertise
    if (ventureContext.businessModel === 'b2b') expertise.push('b2b', 'enterprise-sales');
    if (ventureContext.businessModel === 'b2c') expertise.push('b2c', 'consumer-products');
    if (ventureContext.businessModel === 'marketplace') expertise.push('marketplace', 'platform');
    
    // Phase-specific expertise
    if (ventureContext.currentPhase <= 2) {
      expertise.push('idea-validation', 'customer-discovery', 'market-research');
    } else if (ventureContext.currentPhase <= 4) {
      expertise.push('product-development', 'mvp', 'prototyping');
    } else {
      expertise.push('scaling', 'growth', 'operations');
    }
    
    // VVS-based expertise
    if (ventureContext.vvsScore < 60) {
      expertise.push('turnaround', 'strategy', 'business-model-innovation');
    } else if (ventureContext.vvsScore > 80) {
      expertise.push('scaling', 'international-expansion', 'exit-strategy');
    }
    
    return expertise;
  }

  // Calculate stage compatibility
  calculateStageCompatibility(ventureContext, mentor) {
    const mentorDesignation = mentor.mentorProfile.designation?.toLowerCase() || '';
    const mentorCompany = mentor.mentorProfile.company?.toLowerCase() || '';
    
    let score = 70; // Base score
    
    // Boost for relevant experience
    if (ventureContext.currentPhase <= 2) {
      if (mentorDesignation.includes('founder') || mentorDesignation.includes('early-stage')) {
        score += 20;
      }
    } else if (ventureContext.currentPhase <= 4) {
      if (mentorDesignation.includes('vp') || mentorDesignation.includes('director')) {
        score += 15;
      }
    } else {
      if (mentorDesignation.includes('ceo') || mentorDesignation.includes('cto') || mentorDesignation.includes('c-level')) {
        score += 20;
      }
    }
    
    // Boost for relevant company stage
    if (mentorCompany.includes('startup') || mentorCompany.includes('venture')) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  // Generate mentor recommendation
  generateMentorRecommendation(score, mentor) {
    const recommendations = [];
    
    if (score.overall >= 80) {
      recommendations.push('Excellent match - highly recommended');
    } else if (score.overall >= 60) {
      recommendations.push('Good match - recommended');
    } else {
      recommendations.push('Consider based on specific expertise needs');
    }
    
    if (score.breakdown.industry >= 80) {
      recommendations.push('Strong industry expertise alignment');
    }
    
    if (score.breakdown.experience >= 80) {
      recommendations.push('Ideal experience level for your stage');
    }
    
    if (score.breakdown.expertise >= 80) {
      recommendations.push('Relevant expertise for your venture');
    }
    
    if (score.breakdown.availability < 50) {
      recommendations.push('Limited availability - plan sessions in advance');
    }
    
    return recommendations;
  }

  // Schedule mentor session
  async scheduleMentorSession(userId, mentorId, sessionDetails) {
    try {
      const user = await User.findById(userId);
      const mentor = await User.findById(mentorId);

      if (!user || !mentor) {
        throw new Error('User or mentor not found');
      }

      if (mentor.role !== 'mentor') {
        throw new Error('Specified user is not a mentor');
      }

      // Validate session details
      const sessionType = this.mentorSessionTypes[sessionDetails.type];
      if (!sessionType) {
        throw new Error('Invalid session type');
      }

      // Create session record
      const session = {
        user: userId,
        mentor: mentorId,
        type: sessionDetails.type,
        scheduledFor: new Date(sessionDetails.scheduledFor),
        duration: sessionType.duration,
        status: 'scheduled',
        agenda: sessionDetails.agenda || '',
        notes: sessionDetails.notes || '',
        artifacts: sessionDetails.artifacts || [],
        zoomLink: this.generateZoomLink(), // In production, integrate with Zoom API
        createdAt: new Date(),
      };

      // Update mentor availability (in production, this would be more sophisticated)
      mentor.mentorProfile.availableHours = Math.max(0, mentor.mentorProfile.availableHours - 1);
      await mentor.save();

      // Add session to simulation if provided
      if (sessionDetails.simulationId) {
        const simulation = await Simulation.findById(sessionDetails.simulationId);
        if (simulation) {
          simulation.mentorSessions.push({
            mentor: mentorId,
            sessionDate: session.scheduledFor,
            status: 'scheduled',
          });
          await simulation.save();
        }
      }

      logger.info(`Mentor session scheduled: User ${userId} with Mentor ${mentorId}`);

      return {
        session,
        mentor: mentor.toSafeObject(),
        sessionType,
        nextSteps: this.generateSessionNextSteps(session),
      };
    } catch (error) {
      logger.error('Error scheduling mentor session:', error);
      throw error;
    }
  }

  // Generate Zoom link (mock implementation)
  generateZoomLink() {
    return `https://zoom.us/j/${Math.random().toString(36).substring(2, 15)}`;
  }

  // Generate next steps for session
  generateSessionNextSteps(session) {
    const steps = [
      'Calendar invitation sent to both parties',
      'Prepare relevant artifacts and questions',
      'Test video conferencing setup',
      'Review mentor profile and expertise',
    ];

    if (session.artifacts && session.artifacts.length > 0) {
      steps.push('Share simulation artifacts with mentor in advance');
    }

    return steps;
  }

  // Complete mentor session
  async completeMentorSession(sessionId, completionData) {
    try {
      // In production, this would update a dedicated Session model
      // For now, we'll update the simulation record
      
      const simulation = await Simulation.findOne({
        'mentorSessions._id': sessionId,
      });

      if (simulation) {
        const mentorSession = simulation.mentorSessions.id(sessionId);
        if (mentorSession) {
          mentorSession.status = 'completed';
          mentorSession.notes = completionData.notes;
          mentorSession.rating = completionData.rating;
          mentorSession.artifacts = completionData.artifacts || [];
          
          await simulation.save();
        }
      }

      // Update user stats
      const user = await User.findById(completionData.userId);
      if (user) {
        user.stats.mentorSessions += 1;
        await user.save();
      }

      logger.info(`Mentor session completed: ${sessionId}`);

      return {
        sessionId,
        status: 'completed',
        completionData,
      };
    } catch (error) {
      logger.error('Error completing mentor session:', error);
      throw error;
    }
  }

  // Get mentor's sessions
  async getMentorSessions(mentorId, options = {}) {
    try {
      const { status, page = 1, limit = 10 } = options;
      
      const simulations = await Simulation.find({
        'mentorSessions.mentor': mentorId,
        ...(status && { 'mentorSessions.status': status }),
      })
      .populate('user', 'firstName lastName email')
      .sort({ 'mentorSessions.sessionDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

      const sessions = simulations.map(sim => ({
        simulationId: sim._id,
        ventureName: sim.venture.name,
        user: sim.user,
        sessions: sim.mentorSessions.filter(session => 
          session.mentor.toString() === mentorId &&
          (!status || session.status === status)
        ),
      }));

      const total = await Simulation.countDocuments({
        'mentorSessions.mentor': mentorId,
        ...(status && { 'mentorSessions.status': status }),
      });

      return {
        mentorId,
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting mentor sessions:', error);
      throw error;
    }
  }

  // Get mentor analytics
  async getMentorAnalytics(mentorId) {
    try {
      const mentor = await User.findById(mentorId);
      if (!mentor || mentor.role !== 'mentor') {
        throw new Error('Mentor not found');
      }

      const simulations = await Simulation.find({
        'mentorSessions.mentor': mentorId,
        'mentorSessions.status': 'completed',
      }).populate('user', 'firstName lastName');

      const totalSessions = simulations.reduce((sum, sim) => 
        sum + sim.mentorSessions.filter(session => 
          session.mentor.toString() === mentorId && session.status === 'completed'
        ).length, 0
      );

      const averageRating = simulations.reduce((sum, sim) => {
        const mentorSessions = sim.mentorSessions.filter(session => 
          session.mentor.toString() === mentorId && session.rating
        );
        const sessionRatings = mentorSessions.map(session => session.rating);
        return sum + (sessionRatings.reduce((a, b) => a + b, 0) / sessionRatings.length || 0);
      }, 0) / simulations.length || 0;

      const uniqueEntrepreneurs = new Set(
        simulations.map(sim => sim.user._id.toString())
      ).size;

      const successStories = simulations.filter(sim => 
        sim.vvsScore.overall >= 75 && 
        sim.mentorSessions.some(session => 
          session.mentor.toString() === mentorId && session.status === 'completed'
        )
      ).length;

      return {
        mentor: mentor.toSafeObject(),
        analytics: {
          totalSessions,
          averageRating: Math.round(averageRating * 10) / 10,
          uniqueEntrepreneurs,
          successStories,
          successRate: uniqueEntrepreneurs > 0 ? Math.round((successStories / uniqueEntrepreneurs) * 100) : 0,
          availability: mentor.mentorProfile.availableHours,
        },
        recentSessions: simulations.slice(0, 5).map(sim => ({
          ventureName: sim.venture.name,
          entrepreneur: `${sim.user.firstName} ${sim.user.lastName}`,
          vvsScore: sim.vvsScore.overall,
          sessionDate: sim.mentorSessions.find(session => 
            session.mentor.toString() === mentorId
          )?.sessionDate,
        })),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting mentor analytics:', error);
      throw error;
    }
  }

  // Get available session types
  getAvailableSessionTypes() {
    return Object.keys(this.mentorSessionTypes).map(type => ({
      type,
      ...this.mentorSessionTypes[type],
    }));
  }

  // Update mentor profile
  async updateMentorProfile(mentorId, profileData) {
    try {
      const mentor = await User.findById(mentorId);
      if (!mentor || mentor.role !== 'mentor') {
        throw new Error('Mentor not found');
      }

      // Update mentor profile
      if (profileData.expertise) {
        mentor.mentorProfile.expertise = profileData.expertise;
      }
      if (profileData.experience) {
        mentor.mentorProfile.experience = profileData.experience;
      }
      if (profileData.company) {
        mentor.mentorProfile.company = profileData.company;
      }
      if (profileData.designation) {
        mentor.mentorProfile.designation = profileData.designation;
      }
      if (profileData.availableHours !== undefined) {
        mentor.mentorProfile.availableHours = profileData.availableHours;
      }
      if (profileData.rate !== undefined) {
        mentor.mentorProfile.rate = profileData.rate;
      }
      if (profileData.certifications) {
        mentor.mentorProfile.certifications = profileData.certifications;
      }

      await mentor.save();

      logger.info(`Mentor profile updated: ${mentorId}`);

      return mentor.toSafeObject();
    } catch (error) {
      logger.error('Error updating mentor profile:', error);
      throw error;
    }
  }

  // Rate mentor session
  async rateMentorSession(userId, sessionId, rating, feedback) {
    try {
      const simulation = await Simulation.findOne({
        user: userId,
        'mentorSessions._id': sessionId,
      });

      if (!simulation) {
        throw new Error('Session not found');
      }

      const mentorSession = simulation.mentorSessions.id(sessionId);
      if (!mentorSession) {
        throw new Error('Session not found');
      }

      mentorSession.rating = rating;
      mentorSession.feedback = feedback;
      mentorSession.ratedAt = new Date();

      await simulation.save();

      // Update mentor's overall rating
      const mentor = await User.findById(mentorSession.mentor);
      if (mentor) {
        const allSessions = await Simulation.find({
          'mentorSessions.mentor': mentorSession.mentor,
          'mentorSessions.rating': { $exists: true },
        });

        const totalRating = allSessions.reduce((sum, sim) => {
          const sessions = sim.mentorSessions.filter(session => 
            session.mentor.toString() === mentorSession.mentor.toString() && session.rating
          );
          return sum + sessions.reduce((sessionSum, session) => sessionSum + session.rating, 0);
        }, 0);

        const totalSessionsCount = allSessions.reduce((sum, sim) => {
          return sum + sim.mentorSessions.filter(session => 
            session.mentor.toString() === mentorSession.mentor.toString() && session.rating
          ).length;
        }, 0);

        mentor.mentorProfile.rating = totalSessionsCount > 0 ? totalRating / totalSessionsCount : 0;
        mentor.mentorProfile.reviewsCount = totalSessionsCount;
        await mentor.save();
      }

      logger.info(`Mentor session rated: ${sessionId} - Rating: ${rating}`);

      return {
        sessionId,
        rating,
        feedback,
        mentorRating: mentor?.mentorProfile.rating,
      };
    } catch (error) {
      logger.error('Error rating mentor session:', error);
      throw error;
    }
  }
}

module.exports = new MentorService();
