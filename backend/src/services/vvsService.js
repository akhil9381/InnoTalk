const logger = require('../utils/logger');

class VVSService {
  constructor() {
    this.dimensions = {
      market: { weight: 0.20, name: 'Market Viability' },
      financial: { weight: 0.20, name: 'Financial Sustainability' },
      technical: { weight: 0.20, name: 'Technical Feasibility' },
      regulatory: { weight: 0.15, name: 'Regulatory Compliance' },
      team: { weight: 0.15, name: 'Team Capability' },
      execution: { weight: 0.10, name: 'Execution Strategy' },
    };
    
    this.phaseWeights = {
      0: { market: 0.4, financial: 0.3, team: 0.3 },
      0.5: { team: 0.5, execution: 0.5 },
      1: { market: 0.3, team: 0.4, execution: 0.3 },
      2: { market: 0.4, team: 0.3, execution: 0.3 },
      3: { technical: 0.5, execution: 0.3, financial: 0.2 },
      4: { financial: 0.5, market: 0.3, execution: 0.2 },
      5: { market: 0.4, team: 0.3, execution: 0.3 },
      6: { regulatory: 0.3, financial: 0.3, execution: 0.4 },
      7: {}, // Synthesis phase - no new scoring
      7.5: { financial: 0.4, market: 0.3, team: 0.3 },
    };
  }

  // Calculate VVS score based on evaluation and agent responses
  async calculateVVSScore(simulation, evaluation, agentResponses, currentPhase) {
    try {
      const currentScores = simulation.vvsScore.dimensions;
      const phaseWeight = this.phaseWeights[currentPhase] || {};
      
      // Calculate dimension scores for current phase
      const phaseScores = this.calculatePhaseScores(evaluation, agentResponses, currentPhase);
      
      // Update dimension scores with weighted average
      const updatedDimensions = { ...currentScores };
      
      Object.keys(phaseScores).forEach(dimension => {
        const phaseWeightValue = phaseWeight[dimension] || 0;
        const currentWeight = 1 - phaseWeightValue;
        
        if (phaseWeightValue > 0) {
          updatedDimensions[dimension] = Math.round(
            (currentScores[dimension] * currentWeight) + (phaseScores[dimension] * phaseWeightValue)
          );
        }
      });

      // Calculate overall score
      const overallScore = this.calculateOverallScore(updatedDimensions);
      
      // Calculate anti-fragility score
      const antiFragilityScore = this.calculateAntiFragilityScore(
        evaluation, agentResponses, simulation.biasAnalysis
      );

      return {
        overallScore,
        dimensionScores: updatedDimensions,
        antiFragilityScore,
        phaseScores,
      };
    } catch (error) {
      logger.error('Error calculating VVS score:', error);
      throw error;
    }
  }

  // Calculate scores for current phase
  calculatePhaseScores(evaluation, agentResponses, currentPhase) {
    const scores = {
      market: 0,
      financial: 0,
      technical: 0,
      regulatory: 0,
      team: 0,
      execution: 0,
    };

    // Base score from evaluation
    const baseScore = evaluation.overallScore || 50;

    // Phase-specific scoring logic
    switch (currentPhase) {
      case 0: // Market Confrontation
        scores.market = this.calculateMarketScore(evaluation, agentResponses);
        scores.financial = this.calculateFinancialScore(evaluation, agentResponses);
        scores.team = this.calculateTeamScore(evaluation, agentResponses);
        break;
        
      case 0.5: // Bias Calibration
        scores.team = this.calculateTeamScore(evaluation, agentResponses);
        scores.execution = this.calculateExecutionScore(evaluation, agentResponses);
        break;
        
      case 1: // Problem Validation
        scores.market = this.calculateMarketScore(evaluation, agentResponses);
        scores.team = this.calculateTeamScore(evaluation, agentResponses);
        scores.execution = this.calculateExecutionScore(evaluation, agentResponses);
        break;
        
      case 2: // Customer Discovery
        scores.market = this.calculateMarketScore(evaluation, agentResponses);
        scores.team = this.calculateTeamScore(evaluation, agentResponses);
        scores.execution = this.calculateExecutionScore(evaluation, agentResponses);
        break;
        
      case 3: // Solution Architecture
        scores.technical = this.calculateTechnicalScore(evaluation, agentResponses);
        scores.execution = this.calculateExecutionScore(evaluation, agentResponses);
        scores.financial = this.calculateFinancialScore(evaluation, agentResponses);
        break;
        
      case 4: // Business Model Design
        scores.financial = this.calculateFinancialScore(evaluation, agentResponses);
        scores.market = this.calculateMarketScore(evaluation, agentResponses);
        scores.execution = this.calculateExecutionScore(evaluation, agentResponses);
        break;
        
      case 5: // Go-to-Market Strategy
        scores.market = this.calculateMarketScore(evaluation, agentResponses);
        scores.team = this.calculateTeamScore(evaluation, agentResponses);
        scores.execution = this.calculateExecutionScore(evaluation, agentResponses);
        break;
        
      case 6: // Risk & Resilience
        scores.regulatory = this.calculateRegulatoryScore(evaluation, agentResponses);
        scores.financial = this.calculateFinancialScore(evaluation, agentResponses);
        scores.execution = this.calculateExecutionScore(evaluation, agentResponses);
        break;
        
      case 7.5: // Investor Panel
        scores.financial = this.calculateFinancialScore(evaluation, agentResponses);
        scores.market = this.calculateMarketScore(evaluation, agentResponses);
        scores.team = this.calculateTeamScore(evaluation, agentResponses);
        break;
        
      default:
        // Default scoring for other phases
        Object.keys(scores).forEach(dimension => {
          scores[dimension] = baseScore;
        });
    }

    return scores;
  }

  // Calculate market score
  calculateMarketScore(evaluation, agentResponses) {
    let score = evaluation.overallScore || 50;
    
    // Boost for market awareness
    if (evaluation.categories?.includes('market-awareness')) {
      score += 10;
    }
    
    // Check agent responses for market insights
    const marketAgents = ['communityLead', 'vcAuditor'];
    const marketResponses = agentResponses.agents?.filter(agent => 
      marketAgents.includes(agent.agent)
    ) || [];
    
    if (marketResponses.length > 0) {
      const avgMarketResponse = marketResponses.reduce((sum, response) => {
        return sum + this.analyzeResponseQuality(response.response, 'market');
      }, 0) / marketResponses.length;
      
      score = Math.round((score + avgMarketResponse) / 2);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Calculate financial score
  calculateFinancialScore(evaluation, agentResponses) {
    let score = evaluation.overallScore || 50;
    
    // Boost for financial thinking
    if (evaluation.categories?.includes('financial-thinking')) {
      score += 10;
    }
    
    // Check finance head responses
    const financeResponse = agentResponses.agents?.find(agent => 
      agent.agent === 'financeHead'
    );
    
    if (financeResponse) {
      const financeQuality = this.analyzeResponseQuality(financeResponse.response, 'financial');
      score = Math.round((score + financeQuality) / 2);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Calculate technical score
  calculateTechnicalScore(evaluation, agentResponses) {
    let score = evaluation.overallScore || 50;
    
    // Boost for technical thinking
    if (evaluation.categories?.includes('technical-thinking')) {
      score += 10;
    }
    
    // Check tech lead responses
    const techResponse = agentResponses.agents?.find(agent => 
      agent.agent === 'techLead'
    );
    
    if (techResponse) {
      const techQuality = this.analyzeResponseQuality(techResponse.response, 'technical');
      score = Math.round((score + techQuality) / 2);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Calculate regulatory score
  calculateRegulatoryScore(evaluation, agentResponses) {
    let score = evaluation.overallScore || 50;
    
    // Boost for regulatory awareness
    if (evaluation.categories?.includes('regulatory-awareness')) {
      score += 10;
    }
    
    // Check for regulatory mentions in responses
    const allResponses = agentResponses.agents?.map(agent => agent.response).join(' ') || '';
    const regulatoryKeywords = ['compliance', 'regulation', 'legal', 'license', 'approval'];
    const regulatoryCount = regulatoryKeywords.filter(keyword => 
      allResponses.toLowerCase().includes(keyword)
    ).length;
    
    if (regulatoryCount > 0) {
      score += Math.min(15, regulatoryCount * 3);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Calculate team score
  calculateTeamScore(evaluation, agentResponses) {
    let score = evaluation.overallScore || 50;
    
    // Boost for team awareness
    if (evaluation.categories?.includes('team-awareness')) {
      score += 10;
    }
    
    // Check for team-related keywords
    const userResponse = evaluation.userResponse || '';
    const teamKeywords = ['team', 'skills', 'expertise', 'hiring', 'cofounder'];
    const teamCount = teamKeywords.filter(keyword => 
      userResponse.toLowerCase().includes(keyword)
    ).length;
    
    if (teamCount > 0) {
      score += Math.min(10, teamCount * 2);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Calculate execution score
  calculateExecutionScore(evaluation, agentResponses) {
    let score = evaluation.overallScore || 50;
    
    // Boost for execution thinking
    if (evaluation.categories?.includes('execution-thinking')) {
      score += 10;
    }
    
    // Check for execution-related keywords
    const userResponse = evaluation.userResponse || '';
    const executionKeywords = ['plan', 'timeline', 'milestone', 'steps', 'action', 'implement'];
    const executionCount = executionKeywords.filter(keyword => 
      userResponse.toLowerCase().includes(keyword)
    ).length;
    
    if (executionCount > 0) {
      score += Math.min(10, executionCount * 2);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Analyze response quality for specific dimension
  analyzeResponseQuality(response, dimension) {
    const responseLower = response.toLowerCase();
    let score = 50; // Base score
    
    const dimensionKeywords = {
      market: ['market', 'customer', 'competition', 'demand', 'size', 'growth'],
      financial: ['revenue', 'profit', 'cost', 'investment', 'roi', 'cash'],
      technical: ['technology', 'development', 'architecture', 'scalability', 'security'],
      regulatory: ['compliance', 'regulation', 'legal', 'license', 'approval'],
      team: ['team', 'skills', 'expertise', 'hiring', 'cofounder'],
      execution: ['plan', 'timeline', 'milestone', 'steps', 'action', 'implement'],
    };
    
    const keywords = dimensionKeywords[dimension] || [];
    const keywordCount = keywords.filter(keyword => responseLower.includes(keyword)).length;
    
    // Boost score based on keyword density
    score += Math.min(30, keywordCount * 5);
    
    // Check for specificity (numbers, metrics)
    const hasNumbers = /\d+/.test(response);
    if (hasNumbers) {
      score += 10;
    }
    
    // Check for length (longer responses tend to be more detailed)
    if (response.length > 200) {
      score += 5;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Calculate overall VVS score
  calculateOverallScore(dimensions) {
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.keys(this.dimensions).forEach(dimension => {
      const weight = this.dimensions[dimension].weight;
      const score = dimensions[dimension] || 0;
      
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    return Math.round(totalScore / totalWeight);
  }

  // Calculate anti-fragility score
  calculateAntiFragilityScore(evaluation, agentResponses, biasAnalysis) {
    let score = 50; // Base score
    
    // Boost for acknowledging risks
    if (evaluation.categories?.includes('risk-awareness')) {
      score += 15;
    }
    
    // Check for devil's advocate responses
    const devilAdvocateResponse = agentResponses.agents?.find(agent => 
      agent.agent === 'devilAdvocate'
    );
    
    if (devilAdvocateResponse) {
      // User engaged with devil's advocate - shows resilience
      score += 10;
    }
    
    // Consider bias analysis (lower bias = higher anti-fragility)
    if (biasAnalysis && biasAnalysis.overallBiasScore !== undefined) {
      const biasScore = biasAnalysis.overallBiasScore;
      // Inverse relationship: lower bias = higher anti-fragility
      score += Math.round((100 - biasScore) * 0.2);
    }
    
    // Check for specific anti-fragility indicators
    const userResponse = evaluation.userResponse || '';
    const antiFragilityKeywords = ['backup plan', 'contingency', 'risk mitigation', 'alternative', 'fallback'];
    const keywordCount = antiFragilityKeywords.filter(keyword => 
      userResponse.toLowerCase().includes(keyword)
    ).length;
    
    if (keywordCount > 0) {
      score += Math.min(15, keywordCount * 3);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Generate VVS report
  async generateVVSReport(simulation) {
    try {
      const vvsScore = simulation.vvsScore;
      const dimensions = vvsScore.dimensions;
      
      const report = {
        overallScore: vvsScore.overall,
        dimensions: Object.keys(dimensions).map(dimension => ({
          name: this.dimensions[dimension].name,
          score: dimensions[dimension],
          weight: this.dimensions[dimension].weight,
          weightedScore: Math.round(dimensions[dimension] * this.dimensions[dimension].weight),
          assessment: this.getDimensionAssessment(dimensions[dimension]),
          recommendations: this.getDimensionRecommendations(dimension, dimensions[dimension]),
        })),
        antiFragility: {
          score: vvsScore.antiFragility,
          assessment: this.getAntiFragilityAssessment(vvsScore.antiFragility),
        },
        trajectory: vvsScore.trajectory || [],
        strengths: this.identifyStrengths(dimensions),
        improvements: this.identifyImprovements(dimensions),
        certification: {
          eligible: vvsScore.overall >= 65,
          level: this.getCertificationLevel(vvsScore.overall),
          issuedAt: simulation.completionData?.completedAt,
        },
        generatedAt: new Date().toISOString(),
      };
      
      return report;
    } catch (error) {
      logger.error('Error generating VVS report:', error);
      throw error;
    }
  }

  // Get dimension assessment
  getDimensionAssessment(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    if (score >= 50) return 'Needs Improvement';
    return 'Critical';
  }

  // Get dimension recommendations
  getDimensionRecommendations(dimension, score) {
    const recommendations = {
      market: {
        low: ['Conduct deeper market research', 'Validate customer demand', 'Analyze competitive landscape'],
        medium: ['Refine target market definition', 'Gather more customer feedback', 'Study market trends'],
        high: ['Explore market expansion opportunities', 'Monitor emerging trends', 'Consider adjacent markets'],
      },
      financial: {
        low: ['Develop detailed financial model', 'Validate unit economics', 'Create realistic projections'],
        medium: ['Optimize cost structure', 'Improve revenue projections', 'Consider funding strategies'],
        high: ['Explore scaling opportunities', 'Optimize cash flow', 'Consider strategic investments'],
      },
      technical: {
        low: ['Conduct technical feasibility study', 'Define architecture', 'Assess development timeline'],
        medium: ['Refine technical approach', 'Consider scalability', 'Plan for maintenance'],
        high: ['Explore innovative technologies', 'Optimize performance', 'Plan technical evolution'],
      },
      regulatory: {
        low: ['Research regulatory requirements', 'Consult legal experts', 'Plan compliance strategy'],
        medium: ['Stay updated on regulations', 'Implement compliance measures', 'Document processes'],
        high: ['Leverage regulatory advantages', 'Monitor policy changes', 'Consider regulatory strategy'],
      },
      team: {
        low: ['Assess team skills gaps', 'Plan hiring strategy', 'Define roles and responsibilities'],
        medium: ['Strengthen team capabilities', 'Improve collaboration', 'Develop leadership'],
        high: ['Scale team effectively', 'Optimize team structure', 'Foster innovation culture'],
      },
      execution: {
        low: ['Create detailed action plan', 'Set realistic milestones', 'Establish metrics'],
        medium: ['Refine execution strategy', 'Improve planning', 'Monitor progress'],
        high: ['Optimize execution processes', 'Scale operations', 'Improve efficiency'],
      },
    };
    
    const level = score < 50 ? 'low' : score < 75 ? 'medium' : 'high';
    return recommendations[dimension]?.[level] || ['Continue improving this area'];
  }

  // Get anti-fragility assessment
  getAntiFragilityAssessment(score) {
    if (score >= 80) return 'Highly Resilient';
    if (score >= 70) return 'Resilient';
    if (score >= 60) return 'Moderately Resilient';
    if (score >= 50) return 'Vulnerable';
    return 'Fragile';
  }

  // Identify strengths
  identifyStrengths(dimensions) {
    const strengths = [];
    
    Object.keys(dimensions).forEach(dimension => {
      if (dimensions[dimension] >= 75) {
        strengths.push({
          dimension: this.dimensions[dimension].name,
          score: dimensions[dimension],
          description: `Strong performance in ${this.dimensions[dimension].name.toLowerCase()}`,
        });
      }
    });
    
    return strengths;
  }

  // Identify improvements
  identifyImprovements(dimensions) {
    const improvements = [];
    
    Object.keys(dimensions).forEach(dimension => {
      if (dimensions[dimension] < 60) {
        improvements.push({
          dimension: this.dimensions[dimension].name,
          score: dimensions[dimension],
          description: `Needs improvement in ${this.dimensions[dimension].name.toLowerCase()}`,
          priority: dimensions[dimension] < 50 ? 'high' : 'medium',
        });
      }
    });
    
    return improvements;
  }

  // Get certification level
  getCertificationLevel(score) {
    if (score >= 90) return 'Platinum';
    if (score >= 80) return 'Gold';
    if (score >= 70) return 'Silver';
    if (score >= 65) return 'Bronze';
    return null;
  }

  // Compare with cohort benchmarks
  async compareWithCohort(simulation, cohortData) {
    try {
      const userScore = simulation.vvsScore.overall;
      const cohortAvg = cohortData.avgVVS || 0;
      const cohortPercentile = this.calculatePercentile(userScore, cohortData.vvsDistribution || []);
      
      return {
        userScore,
        cohortAverage: Math.round(cohortAvg),
        percentile: Math.round(cohortPercentile),
        comparison: userScore >= cohortAvg ? 'Above Average' : 'Below Average',
        ranking: this.getRankingDescription(cohortPercentile),
      };
    } catch (error) {
      logger.error('Error comparing with cohort:', error);
      return null;
    }
  }

  // Calculate percentile
  calculatePercentile(score, distribution) {
    if (!distribution || distribution.length === 0) return 50;
    
    const sortedScores = distribution.sort((a, b) => a - b);
    const index = sortedScores.findIndex(s => s >= score);
    
    if (index === -1) return 100;
    if (index === 0) return 0;
    
    return (index / sortedScores.length) * 100;
  }

  // Get ranking description
  getRankingDescription(percentile) {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
  }
}

module.exports = new VVSService();
