const Anthropic = require('@anthropic');
const logger = require('../utils/logger');

class BiasDetectionService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    this.biasTypes = {
      'confirmation-bias': {
        name: 'Confirmation Bias',
        description: 'Tendency to favor information that confirms existing beliefs',
        indicators: ['only considers positive evidence', 'ignores contradictory data', 'selective perception'],
        intervention: 'What evidence contradicts your assumption?',
      },
      'optimism-bias': {
        name: 'Optimism Bias',
        description: 'Overestimating positive outcomes and underestimating risks',
        indicators: ['unrealistic timelines', 'underestimating costs', 'overconfidence'],
        intervention: 'What could go wrong with your plan?',
      },
      'planning-fallacy': {
        name: 'Planning Fallacy',
        description: 'Underestimating time and resources needed',
        indicators: ['aggressive timelines', 'insufficient resources', 'complexity underestimation'],
        intervention: 'How would you double your time and resource estimates?',
      },
      'curse-of-knowledge': {
        name: 'Curse of Knowledge',
        description: 'Assuming others have the same knowledge as you',
        indicators: ['technical jargon', 'complex explanations', 'assumed understanding'],
        intervention: 'Explain this to someone completely new to your industry',
      },
      'availability-heuristic': {
        name: 'Availability Heuristic',
        description: 'Overweighting recent or easily recalled information',
        indicators: ['recent examples', 'vivid cases', 'personal experience'],
        intervention: 'What data beyond recent examples supports your view?',
      },
      'anchoring-bias': {
        name: 'Anchoring Bias',
        description: 'Relying too heavily on first piece of information',
        indicators: ['initial assumptions', 'first impressions', 'reference points'],
        intervention: 'What if your initial assumption was completely wrong?',
      },
    };
  }

  // Assess founder bias from simulation data
  async assessFounderBias(simulation) {
    try {
      const userResponses = this.extractUserResponses(simulation);
      const biasAnalysis = await this.analyzeResponsesForBias(userResponses, simulation);
      
      return {
        detectedBiases: biasAnalysis.biases,
        overallScore: biasAnalysis.overallScore,
        riskLevel: this.calculateRiskLevel(biasAnalysis.overallScore),
        recommendations: this.generateRecommendations(biasAnalysis.biases),
        assessment: this.generateAssessment(biasAnalysis),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error assessing founder bias:', error);
      throw error;
    }
  }

  // Extract user responses from simulation
  extractUserResponses(simulation) {
    const responses = [];
    
    simulation.phaseHistory.forEach(phase => {
      phase.responses.forEach(response => {
        if (response.agent === 'user') {
          responses.push({
            phase: phase.phase,
            response: response.answer,
            timestamp: response.timestamp,
            evaluation: response.evaluation,
          });
        }
      });
    });
    
    return responses;
  }

  // Analyze responses for bias
  async analyzeResponsesForBias(userResponses, simulation) {
    try {
      const biases = [];
      let totalBiasScore = 0;
      let responseCount = userResponses.length;
      
      for (const response of userResponses) {
        const biasAnalysis = await this.detectBiasInResponse(
          response.response,
          response.phase,
          simulation.venture
        );
        
        if (biasAnalysis.detectedBiases.length > 0) {
          biasAnalysis.detectedBiases.forEach(bias => {
            const existingBias = biases.find(b => b.type === bias.type);
            if (existingBias) {
              existingBias.count += 1;
              existingBias.severity = Math.max(existingBias.severity, bias.severity);
              existingBias.instances.push({
                phase: response.phase,
                response: response.response.substring(0, 100),
                timestamp: response.timestamp,
              });
            } else {
              biases.push({
                type: bias.type,
                name: this.biasTypes[bias.type].name,
                description: this.biasTypes[bias.type].description,
                severity: bias.severity,
                count: 1,
                instances: [{
                  phase: response.phase,
                  response: response.response.substring(0, 100),
                  timestamp: response.timestamp,
                }],
              });
            }
          });
        }
      }
      
      // Calculate overall bias score (0-100, lower is better)
      totalBiasScore = this.calculateOverallBiasScore(biases, responseCount);
      
      return {
        biases,
        overallScore: totalBiasScore,
        responseCount,
      };
    } catch (error) {
      logger.error('Error analyzing responses for bias:', error);
      return {
        biases: [],
        overallScore: 50,
        responseCount: 0,
      };
    }
  }

  // Detect bias in individual response
  async detectBiasInResponse(response, phase, ventureContext) {
    try {
      const prompt = `Analyze this founder response for cognitive biases. Be thorough but fair.

Response: "${response}"
Phase: ${phase}
Venture Context: ${JSON.stringify(ventureContext)}

Check for these biases:
${Object.keys(this.biasTypes).map(type => 
  `${this.biasTypes[type].name}: ${this.biasTypes[type].description}`
).join('\n')}

For each bias detected, provide:
1. Type of bias
2. Severity (low, medium, high)
3. Evidence from the text
4. Confidence level (0-100%)

Return JSON format:
{
  "detectedBiases": [
    {
      "type": "confirmation-bias",
      "severity": "medium",
      "evidence": "Only mentions positive market data",
      "confidence": 75
    }
  ]
}`;

      const message = {
        role: 'user',
        content: prompt,
      };

      const aiResponse = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 800,
        temperature: 0.3,
        messages: [message],
      });

      try {
        const analysis = JSON.parse(aiResponse.content[0].text);
        return {
          detectedBiases: analysis.detectedBiases || [],
        };
      } catch (parseError) {
        // Fallback: simple keyword-based detection
        return this.fallbackBiasDetection(response);
      }
    } catch (error) {
      logger.error('Error detecting bias in response:', error);
      return { detectedBiases: [] };
    }
  }

  // Fallback bias detection using keywords
  fallbackBiasDetection(response) {
    const responseLower = response.toLowerCase();
    const detectedBiases = [];
    
    Object.keys(this.biasTypes).forEach(biasType => {
      const biasConfig = this.biasTypes[biasType];
      const indicators = biasConfig.indicators;
      
      const matchCount = indicators.filter(indicator => 
        responseLower.includes(indicator.toLowerCase())
      ).length;
      
      if (matchCount > 0) {
        const severity = matchCount >= 3 ? 'high' : matchCount >= 2 ? 'medium' : 'low';
        
        detectedBiases.push({
          type: biasType,
          severity,
          evidence: `Found ${matchCount} indicators`,
          confidence: Math.min(90, matchCount * 30),
        });
      }
    });
    
    return { detectedBiases };
  }

  // Calculate overall bias score
  calculateOverallBiasScore(biases, responseCount) {
    if (biases.length === 0 || responseCount === 0) {
      return 25; // Low bias default
    }
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    biases.forEach(bias => {
      const severityWeight = { low: 1, medium: 2, high: 3 }[bias.severity] || 1;
      const frequencyScore = (bias.count / responseCount) * 100;
      
      totalScore += frequencyScore * severityWeight;
      maxPossibleScore += 100 * severityWeight;
    });
    
    // Normalize to 0-100 scale (lower is better)
    const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    return Math.round(normalizedScore);
  }

  // Calculate risk level
  calculateRiskLevel(overallScore) {
    if (overallScore >= 75) return 'high';
    if (overallScore >= 50) return 'medium';
    if (overallScore >= 25) return 'low';
    return 'minimal';
  }

  // Generate recommendations
  generateRecommendations(detectedBiases) {
    const recommendations = [];
    
    detectedBiases.forEach(bias => {
      const biasConfig = this.biasTypes[bias.type];
      if (biasConfig) {
        recommendations.push({
          bias: bias.name,
          recommendation: biasConfig.intervention,
          priority: bias.severity === 'high' ? 'high' : bias.severity === 'medium' ? 'medium' : 'low',
          frequency: bias.count,
        });
      }
    });
    
    // Add general recommendations
    if (detectedBiases.length > 2) {
      recommendations.push({
        bias: 'Multiple Biases Detected',
        recommendation: 'Consider working with a mentor to get objective feedback on your venture assumptions',
        priority: 'high',
        frequency: 'multiple',
      });
    }
    
    return recommendations;
  }

  // Generate assessment
  generateAssessment(biasAnalysis) {
    const biasCount = biasAnalysis.biases.length;
    const overallScore = biasAnalysis.overallScore;
    
    let assessment = '';
    
    if (biasCount === 0) {
      assessment = 'Shows strong objectivity and balanced thinking patterns.';
    } else if (biasCount <= 2 && overallScore < 50) {
      assessment = 'Demonstrates generally balanced thinking with minor cognitive biases.';
    } else if (biasCount <= 4 && overallScore < 75) {
      assessment = 'Shows some cognitive biases that could impact decision quality.';
    } else {
      assessment = 'Exhibits significant cognitive biases that may hinder objective venture evaluation.';
    }
    
    return {
      summary: assessment,
      biasCount,
      overallScore,
      riskLevel: this.calculateRiskLevel(overallScore),
    };
  }

  // Generate bias intervention question
  generateInterventionQuestion(biasType, context = {}) {
    const biasConfig = this.biasTypes[biasType];
    if (!biasConfig) {
      return 'What assumptions are you making about your venture?';
    }
    
    const baseQuestion = biasConfig.intervention;
    
    // Customize based on phase
    const phaseCustomizations = {
      0: `Considering the market data we've discussed, ${baseQuestion.toLowerCase()}`,
      1: `When thinking about your core problem, ${baseQuestion.toLowerCase()}`,
      2: `From your customer's perspective, ${baseQuestion.toLowerCase()}`,
      3: `For your technical solution, ${baseQuestion.toLowerCase()}`,
      4: `In your business model, ${baseQuestion.toLowerCase()}`,
      5: `For your go-to-market strategy, ${baseQuestion.toLowerCase()}`,
      6: `Considering risks and resilience, ${baseQuestion.toLowerCase()}`,
    };
    
    return phaseCustomizations[context.phase] || baseQuestion;
  }

  // Check for bias in real-time during simulation
  async checkResponseBias(response, phase, ventureContext) {
    try {
      const biasAnalysis = await this.detectBiasInResponse(response, phase, ventureContext);
      
      if (biasAnalysis.detectedBiases.length > 0) {
        const highSeverityBiases = biasAnalysis.detectedBiases.filter(
          bias => bias.severity === 'high' && bias.confidence >= 70
        );
        
        if (highSeverityBiases.length > 0) {
          return {
            detected: true,
            biases: highSeverityBiases,
            intervention: this.generateInterventionQuestion(
              highSeverityBiases[0].type,
              { phase }
            ),
            shouldIntervene: true,
          };
        }
      }
      
      return {
        detected: false,
        biases: [],
        intervention: null,
        shouldIntervene: false,
      };
    } catch (error) {
      logger.error('Error checking response bias:', error);
      return {
        detected: false,
        biases: [],
        intervention: null,
        shouldIntervene: false,
      };
    }
  }

  // Get bias education content
  getBiasEducation(biasType) {
    const biasConfig = this.biasTypes[biasType];
    if (!biasConfig) {
      return null;
    }
    
    return {
      name: biasConfig.name,
      description: biasConfig.description,
      examples: this.getBiasExamples(biasType),
      mitigation: this.getBiasMitigation(biasType),
      resources: this.getBiasResources(biasType),
    };
  }

  // Get bias examples
  getBiasExamples(biasType) {
    const examples = {
      'confirmation-bias': [
        'Only citing market research that supports your venture idea',
        'Ignoring competitor failures that contradict your assumptions',
        'Seeking opinions from people who agree with your perspective',
      ],
      'optimism-bias': [
        'Assuming your product will be adopted much faster than industry averages',
        'Underestimating development time and costs',
        'Believing customers will pay more than market research indicates',
      ],
      'planning-fallacy': [
        'Planning to launch in 3 months when similar products took 12 months',
        'Budgeting $50k when comparable startups spent $200k',
        'Assuming you can build a complex MVP with a small team',
      ],
      'curse-of-knowledge': [
        'Using technical jargon that customers don\'t understand',
        'Assuming investors understand your industry-specific challenges',
        'Writing marketing copy that only experts can comprehend',
      ],
      'availability-heuristic': [
        'Basing decisions on a recent success story you read about',
        'Overweighting personal experience with a specific technology',
        'Focusing on vivid examples rather than statistical data',
      ],
      'anchoring-bias': [
        'Sticking to initial price estimates despite new cost data',
        'Being influenced by the first valuation you heard',
        'Unable to pivot from original idea despite market feedback',
      ],
    };
    
    return examples[biasType] || [];
  }

  // Get bias mitigation strategies
  getBiasMitigation(biasType) {
    const mitigation = {
      'confirmation-bias': [
        'Actively seek disconfirming evidence',
        'Assign a "devil\'s advocate" to challenge assumptions',
        'Use structured decision-making frameworks',
      ],
      'optimism-bias': [
        'Conduct pre-mortem analysis (what could go wrong)',
        'Use objective benchmarks and industry data',
        'Build in buffer time and contingency budgets',
      ],
      'planning-fallacy': [
        'Break down projects into smaller, estimable tasks',
        'Use historical data from similar projects',
        'Get independent estimates from experienced professionals',
      ],
      'curse-of-knowledge': [
        'Test explanations with non-experts',
        'Use analogies and simple language',
        'Validate understanding with target audience',
      ],
      'availability-heuristic': [
        'Seek diverse data sources and timeframes',
        'Use statistical analysis over anecdotal evidence',
        'Consider base rates and historical patterns',
      ],
      'anchoring-bias': [
        'Generate multiple independent estimates',
        'Consider opposite scenarios',
        'Use reference class forecasting',
      ],
    };
    
    return mitigation[biasType] || [];
  }

  // Get bias resources
  getBiasResources(biasType) {
    const resources = {
      'confirmation-bias': [
        'Book: "Thinking, Fast and Slow" by Daniel Kahneman',
        'Article: "The Confirmation Bias" in Harvard Business Review',
        'Tool: Six Thinking Hats by Edward de Bono',
      ],
      'optimism-bias': [
        'Book: "The Black Swan" by Nassim Taleb',
        'Article: "Optimism Bias in Entrepreneurship" - MIT Sloan',
        'Tool: Pre-mortem analysis framework',
      ],
      'planning-fallacy': [
        'Book: "The Planning Fallacy" in Psychological Science',
        'Article: "Why Software Projects Run Late" - IEEE',
        'Tool: Reference class forecasting techniques',
      ],
      'curse-of-knowledge': [
        'Book: "Made to Stick" by Chip and Dan Heath',
        'Article: "The Curse of Knowledge" - Psychological Review',
        'Tool: Feynman Technique for explanation',
      ],
      'availability-heuristic': [
        'Book: "Nudge" by Richard Thaler',
        'Article: "Availability Heuristic" - Cognitive Science',
        'Tool: Statistical thinking frameworks',
      ],
      'anchoring-bias': [
        'Book: "Influence" by Robert Cialdini',
        'Article: "Anchoring Bias" - Journal of Economic Psychology',
        'Tool: Delphi method for estimation',
      ],
    };
    
    return resources[biasType] || [];
  }

  // Track bias improvement over time
  trackBiasImprovement(userId, currentBiasAnalysis, historicalData = []) {
    try {
      const trend = this.calculateBiasTrend(currentBiasAnalysis.overallScore, historicalData);
      const improvement = this.calculateImprovement(currentBiasAnalysis, historicalData);
      
      return {
        currentScore: currentBiasAnalysis.overallScore,
        trend,
        improvement,
        recommendations: this.generateImprovementRecommendations(currentBiasAnalysis, trend),
        nextMilestone: this.getNextMilestone(currentBiasAnalysis.overallScore),
      };
    } catch (error) {
      logger.error('Error tracking bias improvement:', error);
      return null;
    }
  }

  // Calculate bias trend
  calculateBiasTrend(currentScore, historicalData) {
    if (historicalData.length < 2) {
      return 'insufficient-data';
    }
    
    const recentScores = historicalData.slice(-5).map(d => d.overallScore);
    const averageRecent = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    
    if (currentScore < averageRecent - 10) {
      return 'improving';
    } else if (currentScore > averageRecent + 10) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  // Calculate improvement metrics
  calculateImprovement(currentAnalysis, historicalData) {
    if (historicalData.length === 0) {
      return { percentageChange: 0, absoluteChange: 0 };
    }
    
    const firstScore = historicalData[0].overallScore;
    const currentScore = currentAnalysis.overallScore;
    
    const absoluteChange = firstScore - currentScore;
    const percentageChange = (absoluteChange / firstScore) * 100;
    
    return {
      percentageChange: Math.round(percentageChange),
      absoluteChange: Math.round(absoluteChange),
      timeframe: `${historicalData.length} assessments`,
    };
  }

  // Generate improvement recommendations
  generateImprovementRecommendations(currentAnalysis, trend) {
    const recommendations = [];
    
    if (trend === 'declining') {
      recommendations.push({
        priority: 'high',
        recommendation: 'Your bias awareness is declining. Consider working with a mentor to get objective feedback.',
      });
    }
    
    if (currentAnalysis.overallScore > 60) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Focus on your most frequently occurring biases to see the biggest improvement.',
      });
    }
    
    if (currentAnalysis.biases.length > 3) {
      recommendations.push({
        priority: 'high',
        recommendation: 'You have multiple cognitive biases. Consider taking a structured approach to decision-making.',
      });
    }
    
    return recommendations;
  }

  // Get next milestone
  getNextMilestone(currentScore) {
    if (currentScore >= 75) {
      return {
        target: 'Excellent (< 25)',
        current: currentScore,
        gap: currentScore - 25,
        description: 'You\'re doing great! Focus on maintaining awareness.',
      };
    } else if (currentScore >= 50) {
      return {
        target: 'Good (25-50)',
        current: currentScore,
        gap: currentScore - 50,
        description: 'You\'re making good progress. Keep working on bias awareness.',
      };
    } else {
      return {
        target: 'Needs Improvement (50-75)',
        current: currentScore,
        gap: currentScore - 75,
        description: 'Focus on identifying and challenging your assumptions.',
      };
    }
  }
}

module.exports = new BiasDetectionService();
