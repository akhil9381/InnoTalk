const Anthropic = require('@anthropic-ai/sdk');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

class AIAgentService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Use Gemini instead of OpenAI
    this.gemini = geminiService;
  }

  // Agent personalities and configurations
  getAgentConfig(agentType, ventureContext = {}) {
    const configs = {
      financeHead: {
        name: 'Finance Head',
        personality: 'Analytical, risk-averse, focused on numbers and sustainability',
        communicationStyle: 'Direct, data-driven, uses financial metrics',
        priorities: ['profitability', 'cash-flow', 'unit-economics', 'funding', 'roi'],
        riskTolerance: 'conservative',
        expertise: ['financial-modeling', 'investment-analysis', 'cost-optimization'],
        promptTemplate: `You are the Finance Head in a venture evaluation boardroom. Your role is to challenge assumptions from a financial perspective.

Personality: Analytical, risk-averse, focused on numbers and sustainability
Communication Style: Direct, data-driven, uses financial metrics
Priorities: ${configs?.financeHead?.priorities?.join(', ') || 'profitability, cash-flow, unit-economics, funding, ROI'}

Venture Context:
- Industry: ${ventureContext.industry || 'Unknown'}
- Business Model: ${ventureContext.businessModel || 'Unknown'}
- Target Market: ${ventureContext.targetMarket || 'Unknown'}

Your response should:
1. Question financial assumptions with specific metrics
2. Highlight potential cash flow issues
3. Challenge unit economics
4. Focus on sustainability and profitability
5. Use concrete numbers and financial terminology
6. Be constructive but firm in your financial scrutiny

Current Phase: {phase}
User Response: {userResponse}
Previous Context: {context}

Provide your financial perspective as the Finance Head:`,
      },
      
      techLead: {
        name: 'Tech Lead',
        personality: 'Pragmatic, innovation-focused, concerned with technical feasibility',
        communicationStyle: 'Technical, solution-oriented, uses development terminology',
        priorities: ['technical-feasibility', 'scalability', 'development-timeline', 'tech-stack', 'mvp'],
        technicalFocus: ['software-architecture', 'scalability', 'security', 'performance'],
        buildVsBuyPreference: 'hybrid',
        promptTemplate: `You are the Tech Lead in a venture evaluation boardroom. Your role is to assess technical feasibility and implementation challenges.

Personality: Pragmatic, innovation-focused, concerned with technical feasibility
Communication Style: Technical, solution-oriented, uses development terminology
Priorities: ${configs?.techLead?.priorities?.join(', ') || 'technical-feasibility, scalability, development-timeline, tech-stack, MVP'}

Venture Context:
- Industry: ${ventureContext.industry || 'Unknown'}
- Technical Requirements: {technicalRequirements}

Your response should:
1. Assess technical feasibility realistically
2. Identify potential technical roadblocks
3. Suggest appropriate tech stack choices
4. Estimate development complexity and timeline
5. Consider scalability and maintenance
6. Balance innovation with practicality

Current Phase: {phase}
User Response: {userResponse}
Previous Context: {context}

Provide your technical perspective as the Tech Lead:`,
      },
      
      communityLead: {
        name: 'Community Lead',
        personality: 'Empathetic, user-centric, focused on market adoption and trust',
        communicationStyle: 'Relatable, uses customer-centric language, focuses on human factors',
        priorities: ['customer-adoption', 'trust-building', 'community-engagement', 'user-experience', 'market-fit'],
        communityFocus: ['customer-development', 'brand-building', 'community-growth', 'trust-signals'],
        promptTemplate: `You are the Community Lead in a venture evaluation boardroom. Your role is to advocate for customers and assess market adoption potential.

Personality: Empathetic, user-centric, focused on market adoption and trust
Communication Style: Relatable, uses customer-centric language, focuses on human factors
Priorities: ${configs?.communityLead?.priorities?.join(', ') || 'customer-adoption, trust-building, community-engagement, user-experience, market-fit'}

Venture Context:
- Target Market: ${ventureContext.targetMarket || 'Unknown'}
- Customer Segment: ${ventureContext.customerSegment || 'Unknown'}

Your response should:
1. Assess customer adoption potential realistically
2. Identify trust-building challenges
3. Consider user experience and accessibility
4. Evaluate community engagement strategies
5. Focus on human factors and emotional connections
6. Challenge assumptions about customer behavior

Current Phase: {phase}
User Response: {userResponse}
Previous Context: {context}

Provide your community perspective as the Community Lead:`,
      },
      
      vcAuditor: {
        name: 'VC Auditor',
        personality: 'Skeptical, market-aware, focused on scalability and competitive advantage',
        communicationStyle: 'Direct, challenging, uses investment terminology',
        priorities: ['market-size', 'competitive-advantage', 'scalability', 'team-capability', 'exit-potential'],
        focusAreas: ['market-analysis', 'competitive-intelligence', 'funding-landscape', 'investment-trends'],
        promptTemplate: `You are a VC Auditor conducting adversarial due diligence on this venture. Your role is to stress-test assumptions and identify fatal flaws.

Personality: Skeptical, market-aware, focused on scalability and competitive advantage
Communication Style: Direct, challenging, uses investment terminology
Priorities: ${configs?.vcAuditor?.priorities?.join(', ') || 'market-size, competitive-advantage, scalability, team-capability, exit-potential'}

Market Data: {marketData}
Competitive Landscape: {competitiveData}

Your response should:
1. Challenge market size assumptions with real data
2. Identify competitive threats and barriers to entry
3. Question scalability and unit economics
4. Assess team capability gaps
5. Highlight execution risks
6. Be brutally honest about investment viability

Current Phase: {phase}
User Response: {userResponse}
Previous Context: {context}

Provide your VC perspective as the Auditor:`,
      },
      
      devilAdvocate: {
        name: 'Devil\'s Advocate',
        personality: 'Contrarian, pessimistic, focused on finding flaws and failure modes',
        communicationStyle: 'Provocative, challenging, uses failure case studies',
        priorities: ['failure-modes', 'assumption-challenges', 'worst-case-scenarios', 'blindspots'],
        intensity: 'moderate',
        promptTemplate: `You are the Devil's Advocate, specifically tasked with constructing the strongest possible case against this venture. You draw from real-world startup failures.

Personality: Contrarian, pessimistic, focused on finding flaws and failure modes
Communication Style: Provocative, challenging, uses failure case studies
Priorities: ${configs?.devilAdvocate?.priorities?.join(', ') || 'failure-modes, assumption-challenges, worst-case-scenarios, blindspots'}

Failure Case Studies: {failureCases}
Industry Failure Patterns: {industryFailures}

Your response should:
1. Reference specific startup failure cases
2. Identify hidden assumptions and blindspots
3. Construct worst-case scenarios
4. Challenge every core premise
5. Use historical failures as evidence
6. Be deliberately contrarian and provocative

Current Phase: {phase}
User Response: {userResponse}
Previous Context: {context}

Provide your adversarial perspective as the Devil's Advocate:`,
      },
    };
    
    return configs[agentType] || null;
  }

  // Generate response from specific agent
  async generateAgentResponse(agentType, userResponse, context = {}) {
    try {
      const config = this.getAgentConfig(agentType, context.ventureContext);
      
      // Choose AI service based on agent type
      let aiResponse;
      if (this.gemini && ['techLead', 'communityLead', 'vcAuditor'].includes(agentType)) {
        aiResponse = await this.gemini.generateAgentResponse(agentType, userResponse, context);
      } else {
        aiResponse = await this.generateAnthropicResponse(agentType, userResponse, context);
      }

      const prompt = config.promptTemplate
        .replace('{phase}', context.phase || 'Unknown')
        .replace('{userResponse}', userResponse)
        .replace('{context}', JSON.stringify(context.previousContext || {}))
        .replace('{technicalRequirements}', JSON.stringify(context.technicalRequirements || {}))
        .replace('{marketData}', JSON.stringify(context.marketData || {}))
        .replace('{competitiveData}', JSON.stringify(context.competitiveData || {}))
        .replace('{failureCases}', JSON.stringify(context.failureCases || []))
        .replace('{industryFailures}', JSON.stringify(context.industryFailures || {}));

      // If using Gemini, return the response directly
      if (aiResponse && aiResponse.response) {
        return aiResponse;
      }

      // Otherwise use Anthropic
      const message = {
        role: 'user',
        content: prompt,
      };

      const anthropicResponse = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [message],
      });

      const agentResponse = anthropicResponse.content[0].text;

      // Log AI interaction
      logger.logAIInteraction(
        context.userId,
        agentType,
        context.phase,
        { type: 'agent_response', agentType, userResponse },
        { responseLength: agentResponse.length, model: 'claude-3-sonnet' }
      );

      return {
        agent: agentType,
        agentName: config.name,
        response: agentResponse,
        personality: config.personality,
        priorities: config.priorities,
        metadata: {
          model: 'claude-3-sonnet',
          temperature: 0.7,
          maxTokens: 1000,
        },
      };
    } catch (error) {
      logger.error(`Error generating agent response for ${agentType}:`, error);
      throw new Error(`Failed to generate response from ${agentType}: ${error.message}`);
    }
  }

  // Generate multi-agent boardroom discussion
  async generateBoardroomDiscussion(userResponse, context = {}) {
    try {
      const agents = context.devilAdvocateMode 
        ? ['financeHead', 'techLead', 'communityLead', 'devilAdvocate']
        : ['financeHead', 'techLead', 'communityLead'];

      const promises = agents.map(agentType => 
        this.generateAgentResponse(agentType, userResponse, context)
      );

      const responses = await Promise.all(promises);

      // Generate synthesis of agent perspectives
      const synthesis = await this.generateSynthesis(responses, context);

      return {
        userResponse,
        agents: responses,
        synthesis,
        timestamp: new Date().toISOString(),
        context,
      };
    } catch (error) {
      logger.error('Error generating boardroom discussion:', error);
      throw error;
    }
  }

  // Generate synthesis of multiple agent perspectives
  async generateSynthesis(agentResponses, context = {}) {
    try {
      const agentSummaries = agentResponses.map(response => 
        `${response.agentName}: ${response.response.substring(0, 200)}...`
      ).join('\n\n');

      const synthesisPrompt = `You are a strategic facilitator synthesizing perspectives from a venture evaluation boardroom. 

Agent Perspectives:
${agentSummaries}

User's Original Response: ${context.userResponse}

Current Phase: ${context.phase}

Provide a concise synthesis that:
1. Identifies key points of agreement and disagreement among agents
2. Highlights the most critical challenges raised
3. Suggests areas where the user needs to provide more clarity
4. Maintains a balanced, facilitative tone
5. Is no more than 300 words

Synthesis:`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 400,
        temperature: 0.5,
        messages: [{ role: 'user', content: synthesisPrompt }],
      });

      return {
        synthesis: response.content[0].text,
        keyThemes: this.extractKeyThemes(agentResponses),
        conflicts: this.identifyConflicts(agentResponses),
        actionItems: this.generateActionItems(agentResponses, context),
      };
    } catch (error) {
      logger.error('Error generating synthesis:', error);
      throw error;
    }
  }

  // Extract key themes from agent responses
  extractKeyThemes(agentResponses) {
    const themes = [];
    const responseTexts = agentResponses.map(r => r.response.toLowerCase());
    
    // Common theme detection
    const themeKeywords = {
      'Financial Viability': ['profitability', 'cash flow', 'unit economics', 'burn rate', 'revenue'],
      'Technical Feasibility': ['scalability', 'technical', 'development', 'implementation', 'architecture'],
      'Market Adoption': ['customers', 'market', 'adoption', 'users', 'community'],
      'Risk Assessment': ['risk', 'challenge', 'problem', 'issue', 'concern'],
      'Competitive Landscape': ['competition', 'competitors', 'market share', 'differentiation'],
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const mentionedIn = responseTexts.filter(text => 
        keywords.some(keyword => text.includes(keyword))
      );
      
      if (mentionedIn.length >= 2) {
        themes.push({
          theme,
          mentionedBy: mentionedIn.map((_, index) => agentResponses[index].agentName),
          priority: mentionedIn.length,
        });
      }
    });

    return themes.sort((a, b) => b.priority - a.priority);
  }

  // Identify conflicts between agent responses
  identifyConflicts(agentResponses) {
    const conflicts = [];
    
    // Simple conflict detection based on sentiment and keywords
    const positiveIndicators = ['opportunity', 'strength', 'advantage', 'potential', 'viable'];
    const negativeIndicators = ['risk', 'challenge', 'concern', 'problem', 'flaw'];

    agentResponses.forEach((response, index) => {
      const responseText = response.response.toLowerCase();
      const positiveCount = positiveIndicators.filter(word => responseText.includes(word)).length;
      const negativeCount = negativeIndicators.filter(word => responseText.includes(word)).length;
      
      const sentiment = positiveCount > negativeCount ? 'positive' : 
                       negativeCount > positiveCount ? 'negative' : 'neutral';

      // Compare with other agents
      agentResponses.forEach((otherResponse, otherIndex) => {
        if (index !== otherIndex) {
          const otherText = otherResponse.response.toLowerCase();
          const otherPositiveCount = positiveIndicators.filter(word => otherText.includes(word)).length;
          const otherNegativeCount = negativeIndicators.filter(word => otherText.includes(word)).length;
          const otherSentiment = otherPositiveCount > otherNegativeCount ? 'positive' :
                                otherNegativeCount > otherPositiveCount ? 'negative' : 'neutral';

          if (sentiment !== otherSentiment) {
            conflicts.push({
              agents: [response.agentName, otherResponse.agentName],
              type: 'sentiment-conflict',
              description: `${response.agentName} is ${sentiment} while ${otherResponse.agentName} is ${otherSentiment}`,
            });
          }
        }
      });
    });

    return conflicts;
  }

  // Generate action items based on agent responses
  generateActionItems(agentResponses, context) {
    const actionItems = [];
    
    agentResponses.forEach(response => {
      const responseText = response.response.toLowerCase();
      
      // Extract action-oriented phrases
      const actionPatterns = [
        /should\s+(.+?)(?:\.|$)/gi,
        /need\s+to\s+(.+?)(?:\.|$)/gi,
        /must\s+(.+?)(?:\.|$)/gi,
        /consider\s+(.+?)(?:\.|$)/gi,
      ];

      actionPatterns.forEach(pattern => {
        const matches = responseText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            actionItems.push({
              action: match.trim(),
              suggestedBy: response.agentName,
              priority: 'medium',
              phase: context.phase,
            });
          });
        }
      });
    });

    return actionItems.slice(0, 5); // Limit to top 5 action items
  }

  // Evaluate user response quality
  async evaluateResponse(userResponse, agentResponses, context = {}) {
    try {
      const evaluationPrompt = `You are an expert evaluator assessing the quality of a user's response in a venture simulation.

User Response: "${userResponse}"

Agent Perspectives: ${agentResponses.map(r => `${r.agentName}: ${r.response.substring(0, 150)}...`).join('\n')}

Phase: ${context.phase}

Evaluate the response on a scale of 1-10 for each criterion and provide specific feedback:

1. Specificity: How detailed and concrete is the response?
2. Relevance: How well does it address the agents' concerns?
3. Strategic Thinking: Does it show understanding of business fundamentals?
4. Self-Awareness: Does the user acknowledge limitations and risks?
5. Actionability: Are the proposed steps realistic and implementable?

Provide JSON output:
{
  "overallScore": 8,
  "criteria": {
    "specificity": {"score": 7, "feedback": "Good detail but could use more metrics"},
    "relevance": {"score": 8, "feedback": "Addresses most concerns raised"},
    "strategicThinking": {"score": 7, "feedback": "Shows good business acumen"},
    "selfAwareness": {"score": 6, "feedback": "Could acknowledge more risks"},
    "actionability": {"score": 9, "feedback": "Clear, actionable steps proposed"}
  },
  "strengths": ["Clear action plan", "Acknowledges market reality"],
  "improvements": ["Add specific metrics", "Consider competitive threats"],
  "nextQuestions": ["How will you measure success?", "What's your backup plan?"]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 800,
        temperature: 0.3,
        messages: [{ role: 'user', content: evaluationPrompt }],
      });

      try {
        const evaluation = JSON.parse(response.content[0].text);
        return evaluation;
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          overallScore: 5,
          criteria: {
            specificity: { score: 5, feedback: 'Unable to parse detailed evaluation' },
            relevance: { score: 5, feedback: 'Unable to parse detailed evaluation' },
            strategicThinking: { score: 5, feedback: 'Unable to parse detailed evaluation' },
            selfAwareness: { score: 5, feedback: 'Unable to parse detailed evaluation' },
            actionability: { score: 5, feedback: 'Unable to parse detailed evaluation' },
          },
          strengths: [],
          improvements: [],
          nextQuestions: [],
        };
      }
    } catch (error) {
      logger.error('Error evaluating response:', error);
      throw error;
    }
  }
}

module.exports = new AIAgentService();
