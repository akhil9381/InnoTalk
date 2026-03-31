const logger = require('../utils/logger');

class RegulatoryService {
  constructor() {
    this.regulatoryDatabase = {
      // Industry-specific requirements
      fintech: {
        bodies: ['RBI', 'SEBI', 'IRDA'],
        licenses: ['NBFC', 'Payment Aggregator', 'P2P Lending'],
        compliance: ['AML', 'KYC', 'Data Protection', 'Cyber Security'],
        timeline: '6-12 months',
        estimatedCost: '₹5-25 lakhs',
      },
      healthcare: {
        bodies: ['DCGI', 'CDSCO', 'FDA'],
        licenses: ['Medical Device', 'Clinical Trial', 'Drug License'],
        compliance: ['HIPAA', 'GMP', 'Clinical Guidelines', 'Quality Standards'],
        timeline: '12-24 months',
        estimatedCost: '₹10-50 lakhs',
      },
      edtech: {
        bodies: ['AICTE', 'UGC', 'Ministry of Education'],
        licenses: ['Educational Institution', 'Online Learning Platform'],
        compliance: ['Data Privacy', 'Content Standards', 'Accessibility'],
        timeline: '3-6 months',
        estimatedCost: '₹2-10 lakhs',
      },
      ecommerce: {
        bodies: ['Ministry of Commerce', 'Consumer Affairs', 'GST Council'],
        licenses: ['GST Registration', 'E-commerce License', 'Consumer Protection'],
        compliance: ['Consumer Rights', 'Data Protection', 'GST Compliance'],
        timeline: '1-3 months',
        estimatedCost: '₹1-5 lakhs',
      },
      manufacturing: {
        bodies: ['Ministry of MSME', 'State Industrial Departments', 'Environmental Ministry'],
        licenses: ['Factory License', 'Pollution Control', 'BIS Certification'],
        compliance: ['Environmental Standards', 'Safety Regulations', 'Quality Control'],
        timeline: '6-18 months',
        estimatedCost: '₹5-30 lakhs',
      },
      agriculture: {
        bodies: ['Ministry of Agriculture', 'APEDA', 'FSSAI'],
        licenses: ['Food Processing', 'Organic Certification', 'Export License'],
        compliance: ['Food Safety', 'Quality Standards', 'Export Regulations'],
        timeline: '3-9 months',
        estimatedCost: '₹2-15 lakhs',
      },
      'renewable-energy': {
        bodies: ['MNRE', 'State Electricity Boards', 'Environmental Ministry'],
        licenses: ['Power Generation', 'Solar Certification', 'Grid Connection'],
        compliance: ['Environmental Clearance', 'Safety Standards', 'Grid Codes'],
        timeline: '6-12 months',
        estimatedCost: '₹10-40 lakhs',
      },
      biotech: {
        bodies: ['DBT', 'GEAC', 'ICMR'],
        licenses: ['Biotechnology Research', 'Clinical Trials', 'Manufacturing'],
        compliance: ['Biosafety', 'Ethical Guidelines', 'Quality Standards'],
        timeline: '12-36 months',
        estimatedCost: '₹20-100 lakhs',
      },
      'ai-ml': {
        bodies: ['MeitY', 'NASSCOM', 'Standardization Bodies'],
        licenses: ['AI System Certification', 'Data Processing'],
        compliance: ['Data Protection', 'AI Ethics', 'Algorithmic Transparency'],
        timeline: '3-6 months',
        estimatedCost: '₹3-15 lakhs',
      },
      blockchain: {
        bodies: ['MeitY', 'RBI', 'SEBI'],
        licenses: ['Crypto Exchange', 'Blockchain Platform', 'Digital Assets'],
        compliance: ['AML', 'KYC', 'Data Protection', 'Financial Regulations'],
        timeline: '6-12 months',
        estimatedCost: '₹10-50 lakhs',
      },
      iot: {
        bodies: ['MeitY', 'TRAI', 'Standardization Bodies'],
        licenses: ['IoT Device Certification', 'Spectrum License'],
        compliance: ['Data Security', 'Privacy', 'Interoperability'],
        timeline: '3-9 months',
        estimatedCost: '₹5-25 lakhs',
      },
      technology: {
        bodies: ['MeitY', 'STPI', 'State IT Departments'],
        licenses: ['Software Export', 'IT Services', 'Technology Platform'],
        compliance: ['Data Protection', 'IT Act', 'Intellectual Property'],
        timeline: '1-3 months',
        estimatedCost: '₹1-10 lakhs',
      },
    };

    this.stateLevelRegulations = {
      'Telangana': {
        incentives: ['TS-iPASS', 'TGSAP', 'TEAP'],
        additionalRequirements: ['State GST', 'Local Labor Laws'],
        timelineAdjustment: '+2 weeks',
      },
      'Karnataka': {
        incentives: ['KITS', 'Startup Karnataka', 'Biotech Policy'],
        additionalRequirements: ['State Pollution Board', 'Local Zoning'],
        timelineAdjustment: '+3 weeks',
      },
      'Maharashtra': {
        incentives: ['Maharashtra Startup Policy', 'MIDC'],
        additionalRequirements: ['State Industrial License', 'Local Clearances'],
        timelineAdjustment: '+4 weeks',
      },
    };
  }

  // Get regulatory requirements for industry
  async getRegulatoryRequirements(industry, geography = 'national', businessModel = null) {
    try {
      const baseRequirements = this.regulatoryDatabase[industry] || this.regulatoryDatabase.technology;
      
      // Add geography-specific requirements
      let geographySpecific = {};
      if (geography !== 'national' && this.stateLevelRegulations[geography]) {
        geographySpecific = this.stateLevelRegulations[geography];
      }

      // Add business model specific requirements
      let businessModelSpecific = {};
      if (businessModel) {
        businessModelSpecific = this.getBusinessModelRequirements(businessModel, industry);
      }

      return {
        industry,
        geography,
        businessModel,
        requirements: {
          ...baseRequirements,
          ...geographySpecific,
          ...businessModelSpecific,
        },
        complianceChecklist: this.generateComplianceChecklist(industry, geography),
        timeline: this.calculateTimeline(baseRequirements.timeline, geographySpecific.timelineAdjustment),
        estimatedCost: baseRequirements.estimatedCost,
        riskLevel: this.assessRegulatoryRisk(industry, businessModel),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting regulatory requirements:', error);
      throw error;
    }
  }

  // Get business model specific requirements
  getBusinessModelRequirements(businessModel, industry) {
    const requirements = {};

    switch (businessModel) {
      case 'b2b':
        requirements.additionalCompliance = ['B2B Contracts', 'Service Level Agreements', 'Data Sharing Agreements'];
        break;
      case 'b2c':
        requirements.additionalCompliance = ['Consumer Protection', 'Refund Policies', 'Customer Data Protection'];
        break;
      case 'marketplace':
        requirements.additionalCompliance = ['Platform Liability', 'Seller Verification', 'Dispute Resolution'];
        break;
      case 'subscription':
        requirements.additionalCompliance = ['Subscription Regulations', 'Auto-renewal Rules', 'Cancellation Policies'];
        break;
      case 'freemium':
        requirements.additionalCompliance = ['Free Service Regulations', 'Premium Service Terms', 'Data Usage Policies'];
        break;
    }

    // Industry-specific business model requirements
    if (industry === 'fintech' && (businessModel === 'b2c' || businessModel === 'b2b')) {
      requirements.additionalCompliance.push('Financial Consumer Protection', 'Lending Regulations');
    }

    return requirements;
  }

  // Generate compliance checklist
  generateComplianceChecklist(industry, geography) {
    const baseChecklist = [
      {
        requirement: 'Business Registration',
        description: 'Register your business with appropriate authorities',
        status: 'pending',
        priority: 'high',
        deadline: 'Day 1',
        documents: ['Registration Certificate', 'PAN Card', 'GST Registration'],
      },
      {
        requirement: 'Bank Account',
        description: 'Open a dedicated business bank account',
        status: 'pending',
        priority: 'high',
        deadline: 'Day 7',
        documents: ['Bank Account Details', 'KYC Documents'],
      },
      {
        requirement: 'Legal Structure',
        description: 'Determine and register legal entity type',
        status: 'pending',
        priority: 'high',
        deadline: 'Day 15',
        documents: ['Incorporation Certificate', 'MOA/AOA', 'Director Details'],
      },
    ];

    const industrySpecific = this.getIndustrySpecificChecklist(industry);
    const geographySpecific = this.getGeographySpecificChecklist(geography);

    return [...baseChecklist, ...industrySpecific, ...geographySpecific];
  }

  // Get industry-specific checklist items
  getIndustrySpecificChecklist(industry) {
    const industryChecklists = {
      fintech: [
        {
          requirement: 'RBI Registration',
          description: 'Register with Reserve Bank of India for financial services',
          status: 'pending',
          priority: 'high',
          deadline: 'Month 3',
          documents: ['RBI Application', 'Business Plan', 'Financial Projections'],
        },
        {
          requirement: 'AML/KYC Compliance',
          description: 'Implement Anti-Money Laundering and Know Your Customer procedures',
          status: 'pending',
          priority: 'high',
          deadline: 'Month 2',
          documents: ['AML Policy', 'KYC Procedures', 'Compliance Officer Details'],
        },
      ],
      healthcare: [
        {
          requirement: 'Medical Device Registration',
          description: 'Register medical devices with appropriate authorities',
          status: 'pending',
          priority: 'high',
          deadline: 'Month 6',
          documents: ['Device Classification', 'Technical Specifications', 'Clinical Data'],
        },
        {
          requirement: 'Clinical Trial Approval',
          description: 'Get approval for clinical trials if required',
          status: 'pending',
          priority: 'medium',
          deadline: 'Month 9',
          documents: ['Trial Protocol', 'Ethics Committee Approval', 'Investigator Details'],
        },
      ],
      edtech: [
        {
          requirement: 'Educational Content Approval',
          description: 'Get approval for educational content and curriculum',
          status: 'pending',
          priority: 'medium',
          deadline: 'Month 3',
          documents: ['Curriculum Details', 'Content Samples', 'Educator Qualifications'],
        },
      ],
      ecommerce: [
        {
          requirement: 'Consumer Protection Registration',
          description: 'Register under consumer protection laws',
          status: 'pending',
          priority: 'high',
          deadline: 'Month 1',
          documents: ['Business Details', 'Privacy Policy', 'Terms of Service'],
        },
      ],
    };

    return industryChecklists[industry] || [];
  }

  // Get geography-specific checklist items
  getGeographySpecificChecklist(geography) {
    const geographyChecklists = {
      'Telangana': [
        {
          requirement: 'TS-iPASS Registration',
          description: 'Register under Telangana State Industrial Project Approval and Self-Certification System',
          status: 'pending',
          priority: 'medium',
          deadline: 'Month 2',
          documents: ['Project Details', 'Land Documents', 'Investment Plan'],
        },
      ],
      'Karnataka': [
        {
          requirement: 'Karnataka IT Policy Registration',
          description: 'Register under Karnataka IT/ITeS Policy benefits',
          status: 'pending',
          priority: 'medium',
          deadline: 'Month 3',
          documents: ['IT Policy Application', 'Business Plan', 'Employment Details'],
        },
      ],
    };

    return geographyChecklists[geography] || [];
  }

  // Calculate adjusted timeline
  calculateTimeline(baseTimeline, adjustment) {
    if (!adjustment) return baseTimeline;
    
    // Parse base timeline (e.g., "6-12 months")
    const match = baseTimeline.match(/(\d+)-(\d+)\s*(\w+)/);
    if (!match) return baseTimeline;
    
    const [, minMonths, maxMonths, unit] = match;
    const adjustmentWeeks = parseInt(adjustment.match(/\d+/)?.[0] || '0');
    const adjustmentMonths = adjustmentWeeks / 4;
    
    const newMin = Math.max(0, parseInt(minMonths) + adjustmentMonths);
    const newMax = Math.max(0, parseInt(maxMonths) + adjustmentMonths);
    
    return `${Math.round(newMin)}-${Math.round(newMax)} ${unit}`;
  }

  // Assess regulatory risk level
  assessRegulatoryRisk(industry, businessModel) {
    const riskMatrix = {
      'fintech': 'high',
      'healthcare': 'high',
      'biotech': 'high',
      'renewable-energy': 'medium',
      'manufacturing': 'medium',
      'agriculture': 'medium',
      'edtech': 'low',
      'ecommerce': 'low',
      'technology': 'low',
    };

    const baseRisk = riskMatrix[industry] || 'medium';
    
    // Adjust risk based on business model
    if (businessModel === 'marketplace' || businessModel === 'subscription') {
      return baseRisk === 'high' ? 'high' : baseRisk === 'medium' ? 'medium' : 'low';
    }

    return baseRisk;
  }

  // Get policy updates and alerts
  async getPolicyUpdates(industry, timeframe = '30d') {
    try {
      // Mock policy updates - in production, this would fetch from real sources
      const mockUpdates = [
        {
          title: 'New Digital Payments Guidelines',
          description: 'RBI releases new guidelines for digital payment platforms',
          effectiveDate: '2026-04-01',
          impact: 'high',
          industry: 'fintech',
          source: 'RBI',
          actionRequired: true,
        },
        {
          title: 'Data Protection Act Amendment',
          description: 'Parliament passes amendment to strengthen data protection',
          effectiveDate: '2026-05-15',
          impact: 'medium',
          industry: 'all',
          source: 'Parliament',
          actionRequired: true,
        },
        {
          title: 'Startup India Seed Fund Extension',
          description: 'Government extends seed fund scheme for another 2 years',
          effectiveDate: '2026-03-01',
          impact: 'low',
          industry: 'all',
          source: 'Startup India',
          actionRequired: false,
        },
      ];

      const filteredUpdates = industry === 'all' 
        ? mockUpdates 
        : mockUpdates.filter(update => update.industry === industry || update.industry === 'all');

      return {
        updates: filteredUpdates,
        total: filteredUpdates.length,
        timeframe,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting policy updates:', error);
      throw error;
    }
  }

  // Generate compliance report
  async generateComplianceReport(simulation) {
    try {
      const { venture, regulatoryCompliance } = simulation;
      
      const requirements = await this.getRegulatoryRequirements(
        venture.industry,
        venture.targetMarket.geography,
        venture.businessModel
      );

      const completedItems = regulatoryCompliance.checklist.filter(item => item.status === 'completed');
      const pendingItems = regulatoryCompliance.checklist.filter(item => item.status === 'pending');
      const blockedItems = regulatoryCompliance.checklist.filter(item => item.status === 'blocked');

      const complianceScore = Math.round((completedItems.length / regulatoryCompliance.checklist.length) * 100);

      const report = {
        venture: venture.name,
        industry: venture.industry,
        geography: venture.targetMarket.geography,
        businessModel: venture.businessModel,
        requirements,
        complianceStatus: {
          overall: complianceScore,
          completed: completedItems.length,
          pending: pendingItems.length,
          blocked: blockedItems.length,
          status: complianceScore >= 80 ? 'compliant' : complianceScore >= 60 ? 'partial' : 'non-compliant',
        },
        riskAssessment: {
          level: requirements.riskLevel,
          factors: this.identifyRiskFactors(simulation),
          mitigation: this.generateMitigationStrategies(requirements),
        },
        timeline: {
          estimated: requirements.timeline,
          criticalDeadlines: this.identifyCriticalDeadlines(regulatoryCompliance.checklist),
          nextSteps: this.generateNextSteps(pendingItems),
        },
        costAnalysis: {
          estimated: requirements.estimatedCost,
          breakdown: this.generateCostBreakdown(requirements),
          potentialFines: this.estimatePotentialFines(requirements, complianceScore),
        },
        recommendations: this.generateRecommendations(requirements, complianceScore),
        generatedAt: new Date().toISOString(),
      };

      return report;
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      throw error;
    }
  }

  // Identify risk factors
  identifyRiskFactors(simulation) {
    const factors = [];
    
    if (simulation.vvsScore.dimensions.regulatory < 60) {
      factors.push({
        factor: 'Low regulatory awareness',
        impact: 'high',
        description: 'VVS regulatory score indicates insufficient regulatory planning',
      });
    }

    if (simulation.venture.industry === 'fintech' || simulation.venture.industry === 'healthcare') {
      factors.push({
        factor: 'Highly regulated industry',
        impact: 'high',
        description: 'Industry requires extensive regulatory compliance',
      });
    }

    const incompleteCriticalItems = simulation.regulatoryCompliance.checklist.filter(
      item => item.priority === 'high' && item.status !== 'completed'
    );
    
    if (incompleteCriticalItems.length > 0) {
      factors.push({
        factor: 'Critical compliance items incomplete',
        impact: 'medium',
        description: `${incompleteCriticalItems.length} high-priority items not completed`,
      });
    }

    return factors;
  }

  // Generate mitigation strategies
  generateMitigationStrategies(requirements) {
    const strategies = [];

    if (requirements.riskLevel === 'high') {
      strategies.push({
        strategy: 'Engage regulatory consultant',
        description: 'Hire specialized regulatory consultant for complex compliance',
        priority: 'high',
        estimatedCost: '₹2-5 lakhs',
      });
    }

    strategies.push({
      strategy: 'Implement compliance tracking system',
      description: 'Set up system to track compliance deadlines and requirements',
      priority: 'medium',
      estimatedCost: '₹50,000 - 1 lakh',
    });

    strategies.push({
      strategy: 'Regular compliance audits',
      description: 'Conduct quarterly compliance audits to identify gaps',
      priority: 'medium',
      estimatedCost: '₹1-2 lakhs per audit',
    });

    return strategies;
  }

  // Identify critical deadlines
  identifyCriticalDeadlines(checklist) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return checklist
      .filter(item => item.priority === 'high' && item.status !== 'completed')
      .filter(item => {
        if (item.deadline) {
          const deadline = new Date(item.deadline);
          return deadline <= thirtyDaysFromNow;
        }
        return false;
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  // Generate next steps
  generateNextSteps(pendingItems) {
    return pendingItems
      .filter(item => item.priority === 'high')
      .slice(0, 5)
      .map(item => ({
        item: item.requirement,
        description: item.description,
        priority: item.priority,
        estimatedTime: this.estimateCompletionTime(item),
        resources: this.identifyRequiredResources(item),
      }));
  }

  // Estimate completion time for checklist item
  estimateCompletionTime(item) {
    const timeEstimates = {
      'Business Registration': '1-2 days',
      'Bank Account': '2-3 days',
      'Legal Structure': '5-7 days',
      'RBI Registration': '2-3 months',
      'Medical Device Registration': '3-6 months',
      'TS-iPASS Registration': '2-4 weeks',
    };

    return timeEstimates[item.requirement] || '1-2 weeks';
  }

  // Identify required resources
  identifyRequiredResources(item) {
    const resourceMap = {
      'RBI Registration': ['Legal Counsel', 'Financial Consultant', 'Documentation'],
      'Medical Device Registration': ['Regulatory Consultant', 'Technical Expert', 'Testing Facility'],
      'TS-iPASS Registration': ['CA/CS', 'Documentation Team', 'Government Liaison'],
    };

    return resourceMap[item.requirement] || ['Legal Counsel', 'Documentation Team'];
  }

  // Generate cost breakdown
  generateCostBreakdown(requirements) {
    const breakdown = {
      'Registration Fees': '20-30%',
      'Legal Consultation': '30-40%',
      'Documentation': '10-15%',
      'Testing & Certification': '15-20%',
      'Compliance Systems': '5-10%',
    };

    const estimatedMin = parseInt(requirements.estimatedCost.match(/₹(\d+)/)?.[1] || '10');
    const estimatedMax = parseInt(requirements.estimatedCost.match(/₹(\d+)-(\d+)/)?.[2] || estimatedMin);

    return Object.keys(breakdown).map(category => ({
      category,
      percentage: breakdown[category],
      minAmount: Math.round(estimatedMin * parseInt(breakdown[category]) / 100),
      maxAmount: Math.round(estimatedMax * parseInt(breakdown[category]) / 100),
    }));
  }

  // Estimate potential fines
  estimatePotentialFines(requirements, complianceScore) {
    if (complianceScore >= 80) return 'Minimal (₹10,000 - 50,000)';
    if (complianceScore >= 60) return 'Moderate (₹50,000 - 5 lakhs)';
    
    const baseFines = {
      'high': '₹5 lakhs - 50 lakhs',
      'medium': '₹2 lakhs - 20 lakhs',
      'low': '₹50,000 - 5 lakhs',
    };

    return baseFines[requirements.riskLevel] || '₹1 lakh - 10 lakhs';
  }

  // Generate recommendations
  generateRecommendations(requirements, complianceScore) {
    const recommendations = [];

    if (complianceScore < 60) {
      recommendations.push({
        priority: 'critical',
        recommendation: 'Immediate action required on compliance',
        description: 'Multiple critical compliance items are pending. Prioritize regulatory compliance.',
        actionItems: ['Engage regulatory consultant', 'Create compliance timeline', 'Allocate budget'],
      });
    }

    if (requirements.riskLevel === 'high') {
      recommendations.push({
        priority: 'high',
        recommendation: 'Implement robust compliance monitoring',
        description: 'Highly regulated industry requires continuous compliance monitoring.',
        actionItems: ['Hire compliance officer', 'Implement compliance software', 'Regular audits'],
      });
    }

    recommendations.push({
      priority: 'medium',
      recommendation: 'Stay updated on regulatory changes',
      description: 'Regulatory landscape evolves rapidly. Stay informed about changes.',
      actionItems: ['Subscribe to regulatory updates', 'Join industry associations', 'Regular consultant reviews'],
    });

    return recommendations;
  }
}

module.exports = new RegulatoryService();
