const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Mock ecosystem data - in production, this would come from APIs
const ecosystemData = {
  resources: {
    incubators: [
      {
        id: 't-hub',
        name: 'T-Hub',
        description: 'Leading startup incubator in Hyderabad',
        website: 'https://t-hub.co',
        location: 'Hyderabad',
        focus: ['technology', 'fintech', 'healthcare'],
        applicationUrl: 'https://t-hub.co/apply',
        deadline: '2026-04-30',
        benefits: ['Mentorship', 'Funding opportunities', 'Network access'],
      },
      {
        id: 't-works',
        name: 'T-Works',
        description: 'Hardware prototyping and manufacturing facility',
        website: 'https://tworks.in',
        location: 'Hyderabad',
        focus: ['hardware', 'iot', 'manufacturing'],
        applicationUrl: 'https://tworks.in/apply',
        deadline: '2026-05-15',
        benefits: ['Prototyping lab', 'Technical support', 'Equipment access'],
      },
    ],
    grants: [
      {
        id: 'prism',
        name: 'PRISM Grant',
        description: 'Promoting Innovations in Individuals, Startups and MSMEs',
        website: 'https://prism.gov.in',
        maxAmount: 5000000,
        focus: ['technology', 'innovation', 'research'],
        applicationUrl: 'https://prism.gov.in/apply',
        deadline: '2026-06-30',
        eligibility: ['Indian citizens', 'Early-stage startups', 'MSMEs'],
      },
      {
        id: 'sisfs',
        name: 'SISFS - Startup India Seed Fund',
        description: 'Seed fund for early-stage startups',
        website: 'https://startupindia.gov.in',
        maxAmount: 50000000,
        focus: ['all-sectors'],
        applicationUrl: 'https://startupindia.gov.in/seed-fund',
        deadline: 'Rolling basis',
        eligibility: ['DPIIT recognized startups', 'Early-stage'],
      },
    ],
    events: [
      {
        id: 'demo-day-2026',
        name: 'Hyderabad Demo Day 2026',
        description: 'Showcase your startup to investors',
        website: 'https://hyddemoday.com',
        date: '2026-05-20',
        location: 'Hyderabad',
        focus: ['all-sectors'],
        registrationUrl: 'https://hyddemoday.com/register',
        deadline: '2026-04-30',
      },
      {
        id: 'startup-weekend',
        name: 'Startup Weekend Hyderabad',
        description: '54-hour startup competition',
        website: 'https://startupweekend.org/hyderabad',
        date: '2026-04-15',
        location: 'Hyderabad',
        focus: ['technology', 'innovation'],
        registrationUrl: 'https://startupweekend.org/hyderabad/register',
        deadline: '2026-04-10',
      },
    ],
    services: [
      {
        id: 'legal-services',
        name: 'Startup Legal Services',
        description: 'Legal and compliance services for startups',
        website: 'https://startuplegal.in',
        focus: ['legal', 'compliance', 'ipr'],
        contact: 'contact@startuplegal.in',
        pricing: 'Starting at ₹10,000/month',
      },
      {
        id: 'accounting-services',
        name: 'Startup Accounting Solutions',
        description: 'Accounting and financial services',
        website: 'https://startupaccounting.in',
        focus: ['accounting', 'taxation', 'financial-planning'],
        contact: 'info@startupaccounting.in',
        pricing: 'Starting at ₹5,000/month',
      },
    ],
  },
};

// Get all ecosystem resources
router.get('/resources', authenticate, async (req, res) => {
  try {
    const { type, focus, location } = req.query;
    
    let resources = [];
    
    if (!type || type === 'incubators') {
      let incubators = ecosystemData.resources.incubators;
      if (focus) {
        incubators = incubators.filter(inc => 
          inc.focus.some(f => f.toLowerCase().includes(focus.toLowerCase()))
        );
      }
      if (location) {
        incubators = incubators.filter(inc => 
          inc.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      resources.push(...incubators.map(inc => ({ ...inc, type: 'incubator' })));
    }
    
    if (!type || type === 'grants') {
      let grants = ecosystemData.resources.grants;
      if (focus) {
        grants = grants.filter(grant => 
          grant.focus.some(f => f.toLowerCase().includes(focus.toLowerCase()))
        );
      }
      resources.push(...grants.map(grant => ({ ...grant, type: 'grant' })));
    }
    
    if (!type || type === 'events') {
      let events = ecosystemData.resources.events;
      if (focus) {
        events = events.filter(event => 
          event.focus.some(f => f.toLowerCase().includes(focus.toLowerCase()))
        );
      }
      if (location) {
        events = events.filter(event => 
          event.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      resources.push(...events.map(event => ({ ...event, type: 'event' })));
    }
    
    if (!type || type === 'services') {
      let services = ecosystemData.resources.services;
      if (focus) {
        services = services.filter(service => 
          service.focus.some(f => f.toLowerCase().includes(focus.toLowerCase()))
        );
      }
      resources.push(...services.map(service => ({ ...service, type: 'service' })));
    }

    res.json({
      success: true,
      data: {
        resources,
        total: resources.length,
        filters: { type, focus, location },
      },
    });
  } catch (error) {
    logger.error('Error getting ecosystem resources:', error);
    res.status(500).json({
      error: 'Failed to get ecosystem resources',
      message: error.message,
    });
  }
});

// Get personalized recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    // In a real implementation, this would analyze the user's simulation data
    // and provide personalized recommendations
    
    const userIndustry = req.user.profile.industry;
    const userExperience = req.user.profile.experience;
    const userPersona = req.user.profile.persona;
    
    let recommendations = [];
    
    // Industry-specific recommendations
    if (userIndustry === 'technology' || userIndustry === 'fintech') {
      recommendations.push({
        type: 'incubator',
        resource: ecosystemData.resources.incubators[0], // T-Hub
        reason: 'Matches your technology/fintech focus',
        priority: 'high',
      });
    }
    
    if (userIndustry === 'hardware' || userIndustry === 'iot') {
      recommendations.push({
        type: 'service',
        resource: ecosystemData.resources.incubators[1], // T-Works
        reason: 'Hardware prototyping support for your industry',
        priority: 'high',
      });
    }
    
    // Experience-based recommendations
    if (userExperience === 'student' || userExperience === '0-2') {
      recommendations.push({
        type: 'grant',
        resource: ecosystemData.resources.grants[0], // PRISM
        reason: 'Suitable for early-stage innovators',
        priority: 'medium',
      });
    }
    
    // Persona-based recommendations
    if (userPersona === 'student-innovator') {
      recommendations.push({
        type: 'event',
        resource: ecosystemData.resources.events[1], // Startup Weekend
        reason: 'Great learning opportunity for student innovators',
        priority: 'medium',
      });
    }
    
    // General recommendations
    recommendations.push({
      type: 'service',
      resource: ecosystemData.resources.services[0], // Legal Services
      reason: 'Essential for startup compliance',
      priority: 'low',
    });

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        basedOn: {
          industry: userIndustry,
          experience: userExperience,
          persona: userPersona,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error.message,
    });
  }
});

// Get specific resource details
router.get('/resources/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let resource = null;
    
    // Search in all resource types
    for (const resourceType of ['incubators', 'grants', 'events', 'services']) {
      const found = ecosystemData.resources[resourceType].find(r => r.id === id);
      if (found) {
        resource = { ...found, type: resourceType.slice(0, -1) }; // Remove 's' from plural
        break;
      }
    }
    
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
      });
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    logger.error('Error getting resource details:', error);
    res.status(500).json({
      error: 'Failed to get resource details',
      message: error.message,
    });
  }
});

// Get upcoming events
router.get('/events/upcoming', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const upcomingEvents = ecosystemData.resources.events
      .filter(event => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        events: upcomingEvents,
        total: upcomingEvents.length,
      },
    });
  } catch (error) {
    logger.error('Error getting upcoming events:', error);
    res.status(500).json({
      error: 'Failed to get upcoming events',
      message: error.message,
    });
  }
});

// Get application deadlines
router.get('/deadlines', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const deadlines = [];
    
    // Collect all deadlines
    ecosystemData.resources.incubators.forEach(incubator => {
      if (incubator.deadline && new Date(incubator.deadline) > now) {
        deadlines.push({
          id: incubator.id,
          name: incubator.name,
          type: 'incubator',
          deadline: incubator.deadline,
          daysUntil: Math.ceil((new Date(incubator.deadline) - now) / (1000 * 60 * 60 * 24)),
        });
      }
    });
    
    ecosystemData.resources.grants.forEach(grant => {
      if (grant.deadline && new Date(grant.deadline) > now) {
        deadlines.push({
          id: grant.id,
          name: grant.name,
          type: 'grant',
          deadline: grant.deadline,
          daysUntil: Math.ceil((new Date(grant.deadline) - now) / (1000 * 60 * 60 * 24)),
        });
      }
    });
    
    ecosystemData.resources.events.forEach(event => {
      if (event.deadline && new Date(event.deadline) > now) {
        deadlines.push({
          id: event.id,
          name: event.name,
          type: 'event',
          deadline: event.deadline,
          daysUntil: Math.ceil((new Date(event.deadline) - now) / (1000 * 60 * 60 * 24)),
        });
      }
    });
    
    // Sort by closest deadline
    deadlines.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({
      success: true,
      data: {
        deadlines,
        total: deadlines.length,
      },
    });
  } catch (error) {
    logger.error('Error getting deadlines:', error);
    res.status(500).json({
      error: 'Failed to get deadlines',
      message: error.message,
    });
  }
});

// Save user preference
router.post('/preferences', authenticate, async (req, res) => {
  try {
    const { resourceType, resourceId, action } = req.body;
    
    // In a real implementation, this would save to database
    // For now, just return success
    
    logger.info(`User ${req.user.email} saved preference: ${action} ${resourceType} ${resourceId}`);

    res.json({
      success: true,
      message: 'Preference saved successfully',
    });
  } catch (error) {
    logger.error('Error saving preference:', error);
    res.status(500).json({
      error: 'Failed to save preference',
      message: error.message,
    });
  }
});

// Search ecosystem
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Search query is required',
      });
    }
    
    const query = q.toLowerCase();
    let results = [];
    
    const searchInResources = (resources, resourceType) => {
      return resources.filter(resource => {
        return (
          resource.name.toLowerCase().includes(query) ||
          resource.description.toLowerCase().includes(query) ||
          resource.focus.some(f => f.toLowerCase().includes(query))
        );
      }).map(resource => ({ ...resource, type: resourceType }));
    };
    
    if (!type || type === 'incubators') {
      results.push(...searchInResources(ecosystemData.resources.incubators, 'incubator'));
    }
    
    if (!type || type === 'grants') {
      results.push(...searchInResources(ecosystemData.resources.grants, 'grant'));
    }
    
    if (!type || type === 'events') {
      results.push(...searchInResources(ecosystemData.resources.events, 'event'));
    }
    
    if (!type || type === 'services') {
      results.push(...searchInResources(ecosystemData.resources.services, 'service'));
    }

    res.json({
      success: true,
      data: {
        results,
        total: results.length,
        query: q,
        type,
      },
    });
  } catch (error) {
    logger.error('Error searching ecosystem:', error);
    res.status(500).json({
      error: 'Failed to search ecosystem',
      message: error.message,
    });
  }
});

module.exports = router;
