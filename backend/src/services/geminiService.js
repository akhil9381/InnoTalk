const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not found in environment variables');
      this.genAI = null;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
    });
  }

  // Generate response using Gemini
  async generateResponse(prompt, context = {}) {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API not initialized');
      }

      const enhancedPrompt = this.buildEnhancedPrompt(prompt, context);
      
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      
      return {
        text: response.text(),
        metadata: {
          model: 'gemini-1.5-pro',
          temperature: 0.7,
          maxTokens: 1000,
        },
      };
    } catch (error) {
      logger.error('Error generating Gemini response:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  // Build enhanced prompt for specific agent types
  buildEnhancedPrompt(basePrompt, context) {
    const { agentType, phase, ventureContext } = context;
    
    let systemPrompt = `You are an AI assistant helping social entrepreneurs through a social innovation simulation. Keep every response grounded in social entrepreneurship, public value, inclusion, community trust, and responsible innovation. `;
    
    // Add agent-specific context
    if (agentType) {
      switch (agentType) {
        case 'financeHead':
          systemPrompt += `You are a Finance Head. Focus on financial viability, unit economics, cash flow, and sustainability. Be analytical and risk-aware while being constructive.`;
          break;
        case 'techLead':
          systemPrompt += `You are a Tech Lead. Focus on technical feasibility, scalability, architecture, and development timelines. Be pragmatic and innovation-focused.`;
          break;
        case 'communityLead':
          systemPrompt += `You are a Community Lead. Focus on customer adoption, user experience, market fit, and community building. Be empathetic and user-centric.`;
          break;
        case 'vcAuditor':
          systemPrompt += `You are a VC Auditor. Focus on market reality, competitive analysis, scalability, and investment viability. Be challenging but constructive.`;
          break;
        case 'devilAdvocate':
          systemPrompt += `You are a Devil's Advocate. Focus on identifying risks, assumptions, and potential failures. Be contrarian and thought-provoking.`;
          break;
      }
    }
    
    // Add phase context
    if (phase !== undefined) {
      systemPrompt += ` Current simulation phase: ${phase}.`;
    }
    
    // Add venture context
    if (ventureContext) {
      systemPrompt += ` Venture context: ${JSON.stringify(ventureContext)}`;
    }
    
    return `${systemPrompt}\n\n${basePrompt}`;
  }

  // Generate agent response with Gemini
  async generateAgentResponse(agentType, userResponse, context = {}) {
    try {
      const config = this.getAgentConfig(agentType, context.ventureContext);
      
      const prompt = config.promptTemplate
        .replace('{phase}', context.phase || 'Unknown')
        .replace('{userResponse}', userResponse)
        .replace('{context}', JSON.stringify(context.previousContext || {}))
        .replace('{technicalRequirements}', JSON.stringify(context.technicalRequirements || {}))
        .replace('{marketData}', JSON.stringify(context.marketData || {}))
        .replace('{competitiveData}', JSON.stringify(context.competitiveData || {}))
        .replace('{failureCases}', JSON.stringify(context.failureCases || []))
        .replace('{industryFailures}', JSON.stringify(context.industryFailures || {}));

      const geminiResponse = await this.generateResponse(prompt, {
        agentType,
        phase: context.phase,
        ventureContext: context.ventureContext,
      });

      return {
        agent: agentType,
        agentName: config.name,
        response: geminiResponse.text,
        personality: config.personality,
        priorities: config.priorities,
        metadata: {
          ...geminiResponse.metadata,
          agentType,
          model: 'gemini-1.5-pro',
        },
      };
    } catch (error) {
      logger.error(`Error generating ${agentType} response with Gemini:`, error);
      throw error;
    }
  }

  // Get agent configuration (same as in aiAgents.js)
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
Priorities: profitability, cash-flow, unit-economics, funding, ROI

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
Priorities: technical-feasibility, scalability, development-timeline, tech-stack, MVP

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
Priorities: customer-adoption, trust-building, community-engagement, user-experience, market-fit

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
Priorities: market-size, competitive-advantage, scalability, team-capability, exit-potential

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
Priorities: failure-modes, assumption-challenges, worst-case-scenarios, blindspots

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

  // Generate synthesis of multiple perspectives
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

      const result = await this.model.generateContent(synthesisPrompt);
      const response = await result.response;

      return {
        synthesis: response.text(),
        keyThemes: this.extractKeyThemes(agentResponses),
        conflicts: this.identifyConflicts(agentResponses),
        actionItems: this.generateActionItems(agentResponses, context),
      };
    } catch (error) {
      logger.error('Error generating synthesis with Gemini:', error);
      throw error;
    }
  }

  // Extract key themes from agent responses
  extractKeyThemes(agentResponses) {
    const themes = [];
    const responseTexts = agentResponses.map(r => r.response.toLowerCase());
    
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

  // Test Gemini API connectivity
  async testConnection() {
    try {
      const testPrompt = "Hello! Please respond with a simple greeting to test the connection.";
      const result = await this.generateResponse(testPrompt);
      
      return {
        success: true,
        message: 'Gemini API connection successful',
        response: result.text?.substring(0, 100),
        model: result.metadata?.model,
      };
    } catch (error) {
      logger.error('Gemini API connection test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateJson(prompt, fallback = null, context = {}) {
    try {
      const response = await this.generateResponse(
        `${prompt}\n\nReturn strict JSON only. Do not include markdown fences or commentary.`,
        context
      );

      return JSON.parse(response.text);
    } catch (error) {
      logger.warn('Failed to generate or parse Gemini JSON response:', error);

      if (fallback !== null) {
        return fallback;
      }

      throw error;
    }
  }

  async generateEvaluationQuestion({ phase, startupProfile, previousResponses = [] }) {
    try {
      if (!phase) {
        throw new Error('Phase configuration is required');
      }

      if (!this.genAI) {
        return this.buildFallbackEvaluationQuestion(
          phase,
          startupProfile,
          previousResponses,
          'Gemini is unavailable, so a dynamic local question was used.'
        );
      }

      const prompt = `You are generating one evaluation question for a social entrepreneurship and innovation assessment.

Startup profile:
${JSON.stringify(startupProfile, null, 2)}

Current phase:
${JSON.stringify({
  id: phase.id,
  name: phase.name,
  prompt: phase.prompt,
  guidance: phase.guidance,
  focusDimensions: phase.dimensions,
}, null, 2)}

Previous responses:
${JSON.stringify(previousResponses.slice(-3), null, 2)}

Generate a single high-quality question for this phase that:
1. Is specific to this startup profile
2. Helps assess whether the social venture is ready for responsible public adoption
3. Pushes for concrete evidence, not vague claims
4. Matches the phase focus and stakeholder lens
5. Sounds like a real social-innovation stakeholder is asking it, such as an impact investor, beneficiary institution, regulator, government body, community leader, procurement lead, or strategic partner
6. Uses concise, professional language
7. Explicitly reflects the mission, beneficiaries, solution approach, operating model, geography, and current stage
8. Clearly changes based on the most recent previous response instead of repeating a generic pattern

Do not ask generic startup or classroom questions. Ask pressure-test questions that stay purely within social entrepreneurship and innovation.

Also create answer options. Each option must represent a realistic strategic choice the founder could make in the market. Include likely consequences and a score hint from 0-100 based on how strong the option is for responsible market readiness.
The options must also change based on the specific solution approach and the most recent previous response.

Return exactly 3 options. The frontend will add a fourth "Other" option separately.

Return strict JSON only:
{
  "stakeholder": "string",
  "scenario": "string",
  "question": "string",
  "guidance": "string",
  "rationale": "string",
  "options": [
    {
      "id": "option-a",
      "label": "string",
      "consequence": "string",
      "scoreHint": 75
    }
  ],
  "allowOther": true
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        const dynamicFallback = this.buildFallbackEvaluationQuestion(
          phase,
          startupProfile,
          previousResponses,
          'Dynamic profile-aware question generated locally.'
        );

        return {
          stakeholder: parsed.stakeholder || this.getDefaultStakeholder(phase),
          scenario: parsed.scenario || this.getDefaultScenario(phase, startupProfile),
          question: this.isGenericQuestion(parsed.question, phase)
            ? dynamicFallback.question
            : parsed.question,
          guidance: parsed.guidance || dynamicFallback.guidance,
          rationale: parsed.rationale || 'Generated by Gemini.',
          options: this.normalizeOptions(parsed.options, phase, startupProfile, previousResponses),
          allowOther: parsed.allowOther !== false,
          source: 'gemini',
        };
      } catch (parseError) {
        logger.warn('Failed to parse Gemini evaluation question response, using fallback', parseError);
        return this.buildFallbackEvaluationQuestion(
          phase,
          startupProfile,
          previousResponses,
          'Gemini returned an unparsable response, so a dynamic local question was used.'
        );
      }
    } catch (error) {
      logger.error('Error generating evaluation question with Gemini:', error);
      return this.buildFallbackEvaluationQuestion(
        phase,
        startupProfile,
        previousResponses,
        'Gemini question generation failed, so a dynamic local question was used.'
      );
    }
  }

  getDefaultStakeholder(phase) {
    const stakeholderMap = {
      1: 'Impact Investor',
      2: 'End Customer',
      3: 'Field Operator',
      4: 'Funder Committee',
      5: 'Stakeholder Board',
      6: 'Policy Reviewer',
      7: 'Evidence Panel',
      8: 'Market Readiness Panel',
    };

    return stakeholderMap[phase.id] || 'Market Stakeholder';
  }

  getDefaultScenario(phase, startupProfile) {
    return `${this.getDefaultStakeholder(phase)} is reviewing ${startupProfile.startupName || 'this social venture'} before wider public adoption in ${startupProfile.geography || 'its target geography'}.`;
  }

  isGenericQuestion(question, phase) {
    if (!question) {
      return true;
    }

    const normalizedQuestion = question.trim().toLowerCase();
    const normalizedPrompt = phase.prompt.trim().toLowerCase();

    return normalizedQuestion === normalizedPrompt;
  }

  getPreviousResponseSignal(previousResponses = []) {
    const latest = previousResponses[previousResponses.length - 1];
    if (!latest || !latest.answer) {
      return 'No previous response was provided yet.';
    }

    return latest.answer.slice(0, 220);
  }

  buildProfileSpecificQuestion(phase, startupProfile, previousResponses = []) {
    const ventureName = startupProfile.startupName || 'this social venture';
    const beneficiaries = startupProfile.beneficiaries || 'the intended beneficiaries';
    const solutionApproach = startupProfile.solutionApproach || startupProfile.model || 'the proposed social innovation approach';
    const geography = startupProfile.geography || 'the target geography';
    const stage = startupProfile.stage || 'the current stage';
    const previousSignal = this.getPreviousResponseSignal(previousResponses);

    const byPhase = {
      1: `An impact investor asks: "Why does ${ventureName} deserve support now in ${geography}, and what evidence shows that ${beneficiaries} face a problem urgent enough to justify ${solutionApproach} at the ${stage} stage?"`,
      2: `A beneficiary institution asks: "Why would ${beneficiaries} trust ${ventureName}'s ${solutionApproach}, and what in your previous evidence about '${previousSignal}' makes you confident they would adopt it rather than reject it?"`,
      3: `A field operator asks: "Given the realities in ${geography}, why is ${ventureName}'s ${solutionApproach} practical for ${beneficiaries} when budgets, staffing, and infrastructure are constrained at this ${stage} stage?"`,
      4: `A CSR or grant committee asks: "Why should we keep funding or paying for ${ventureName}'s ${solutionApproach} for ${beneficiaries}, and how does your earlier position on '${previousSignal}' show the model can stay mission-aligned?"`,
      5: `A district-level stakeholder board asks: "Who in ${geography} can unblock or stall adoption of ${ventureName}'s ${solutionApproach} for ${beneficiaries}, and how does your last response about '${previousSignal}' change your rollout strategy?"`,
      6: `A policy reviewer asks: "What legal, safeguarding, or public-trust risks could interfere with deploying ${ventureName}'s ${solutionApproach} in ${geography}, especially given your previous answer about '${previousSignal}'?"`,
      7: `An evidence panel asks: "What proof would show that ${ventureName}'s ${solutionApproach} is improving outcomes for ${beneficiaries} in ${geography}, and how does that build on your earlier claim about '${previousSignal}'?"`,
      8: `A final social innovation panel asks: "Why is ${ventureName} ready for wider public adoption now, and how do your responses so far, especially '${previousSignal}', prove that ${solutionApproach} can scale responsibly for ${beneficiaries}?"`,
    };

    return byPhase[phase.id] || phase.prompt;
  }

  buildProfileSpecificOptions(phase, startupProfile, previousResponses = []) {
    const ventureName = startupProfile?.startupName || 'this social venture';
    const beneficiaries = startupProfile?.beneficiaries || 'the target beneficiaries';
    const solutionApproach = startupProfile?.solutionApproach || startupProfile?.model || 'the current approach';
    const geography = startupProfile?.geography || 'the target geography';
    const previousSignal = this.getPreviousResponseSignal(previousResponses);

    const byPhase = {
      1: [
        {
          id: 'option-1',
          label: `Present field evidence, interviews, and urgency data showing why ${beneficiaries} need ${solutionApproach} now`,
          consequence: `This strengthens the social entrepreneurship case for ${ventureName}, especially if the evidence is local to ${geography}.`,
          scoreHint: 86,
        },
        {
          id: 'option-2',
          label: `Lead with vision and founder passion, then promise stronger evidence later`,
          consequence: `This may sound inspiring, but most impact stakeholders will see weak proof and question whether the problem is urgent enough.`,
          scoreHint: 41,
        },
        {
          id: 'option-3',
          label: `Anchor the case in one institutional partner's support and one promising pilot story`,
          consequence: `This gives some credibility, but one partner alone may not prove the wider social problem is urgent across ${geography}.`,
          scoreHint: 69,
        },
      ],
      2: [
        {
          id: 'option-1',
          label: `Show interview, pilot, and usability feedback proving ${beneficiaries} trust ${solutionApproach}`,
          consequence: `This improves adoption confidence because it responds directly to how real people or institutions would react on the ground.`,
          scoreHint: 84,
        },
        {
          id: 'option-2',
          label: `Assume people will adopt once they understand the social mission`,
          consequence: `Mission alone rarely overcomes trust, affordability, or behavior-change barriers, so adoption risk stays high.`,
          scoreHint: 38,
        },
        {
          id: 'option-3',
          label: `Rely on a respected community or institutional intermediary to introduce ${solutionApproach}`,
          consequence: `This can accelerate trust for ${beneficiaries}, but adoption may stall if the intermediary's incentives change.`,
          scoreHint: 73,
        },
      ],
      3: [
        {
          id: 'option-1',
          label: `Adapt ${solutionApproach} into a low-cost, low-training, minimum workable field model`,
          consequence: `This makes delivery more realistic in ${geography} and shows operational discipline under resource constraints.`,
          scoreHint: 85,
        },
        {
          id: 'option-2',
          label: `Keep the full-featured model and expect field partners to build capacity around it`,
          consequence: `This can create heavy operational friction if staff, devices, or infrastructure are already constrained.`,
          scoreHint: 44,
        },
        {
          id: 'option-3',
          label: `Launch ${solutionApproach} only through better-resourced pilot sites first`,
          consequence: `This lowers near-term delivery risk, but it may delay proof that the model works for the harder-to-serve beneficiaries.`,
          scoreHint: 70,
        },
      ],
      4: [
        {
          id: 'option-1',
          label: `Use a blended model with grants, institutional payments, and safeguards against mission drift`,
          consequence: `This creates a stronger sustainability case because it balances revenue realism with mission protection.`,
          scoreHint: 83,
        },
        {
          id: 'option-2',
          label: `Depend mainly on future grants while keeping pricing and repayment assumptions vague`,
          consequence: `This weakens confidence that ${ventureName} can remain stable if grant cycles shift or funder priorities change.`,
          scoreHint: 40,
        },
        {
          id: 'option-3',
          label: `Start with one payer segment and cross-subsidize access for the most vulnerable ${beneficiaries}`,
          consequence: `This can protect mission and improve affordability, but only if the paying segment is credible and durable.`,
          scoreHint: 74,
        },
      ],
      5: [
        {
          id: 'option-1',
          label: `Map each stakeholder in ${geography} and sequence rollout around the ones who can unlock public trust and approvals`,
          consequence: `This improves rollout realism because it treats adoption as an ecosystem process rather than a simple sales motion.`,
          scoreHint: 86,
        },
        {
          id: 'option-2',
          label: `Push for direct rollout first and deal with government or institutional blockers later`,
          consequence: `This can trigger avoidable delays or resistance if the actors who control access were ignored too early.`,
          scoreHint: 39,
        },
        {
          id: 'option-3',
          label: `Start with one anchor institution and expand only after that partner publicly validates ${solutionApproach}`,
          consequence: `This builds legitimacy, but expansion speed and bargaining power may become too dependent on one institution.`,
          scoreHint: 72,
        },
      ],
      6: [
        {
          id: 'option-1',
          label: `Document compliance, safeguarding, public-trust risks, and fallback protocols before broader rollout`,
          consequence: `This shows responsible innovation discipline and lowers the chance that a foreseeable policy or trust issue will derail adoption.`,
          scoreHint: 88,
        },
        {
          id: 'option-2',
          label: `Assume compliance issues can be addressed after the innovation gains momentum`,
          consequence: `This creates serious policy and reputational exposure, especially if vulnerable communities are involved.`,
          scoreHint: 34,
        },
        {
          id: 'option-3',
          label: `Limit early implementation to low-risk use cases while building a stronger policy and compliance base`,
          consequence: `This reduces exposure and buys time, but it may also slow visible growth if the low-risk use case is too narrow.`,
          scoreHint: 76,
        },
      ],
      7: [
        {
          id: 'option-1',
          label: `Track adoption, social outcomes, trust, and efficiency metrics linked directly to ${beneficiaries}`,
          consequence: `This creates stronger proof that ${solutionApproach} is delivering measurable value, not just activity.`,
          scoreHint: 87,
        },
        {
          id: 'option-2',
          label: `Rely mostly on anecdotal success stories and broad claims about social impact`,
          consequence: `This may sound compelling, but it usually fails to convince serious evidence reviewers or funding committees.`,
          scoreHint: 37,
        },
        {
          id: 'option-3',
          label: `Use one lead metric tied to '${previousSignal}' and expand the evidence stack after the next pilot cycle`,
          consequence: `This can work as a starting point, but the proof base may still feel too narrow for large-scale support.`,
          scoreHint: 68,
        },
      ],
      8: [
        {
          id: 'option-1',
          label: `Make the final case with evidence of need, trust, operational readiness, sustainability, and policy preparedness`,
          consequence: `This gives the strongest cross-stakeholder case that ${ventureName} is ready for responsible wider adoption.`,
          scoreHint: 89,
        },
        {
          id: 'option-2',
          label: `Argue that the mission is compelling enough to justify immediate scaling despite unresolved gaps`,
          consequence: `This may appeal emotionally, but it leaves investors, public authorities, and institutions worried about execution risk.`,
          scoreHint: 35,
        },
        {
          id: 'option-3',
          label: `Ask for one more protected pilot cycle before wider adoption of ${solutionApproach}`,
          consequence: `This can improve credibility if gaps remain, but it may also signal that the venture is not yet ready for broader public rollout.`,
          scoreHint: 71,
        },
      ],
    };

    return byPhase[phase.id] || [];
  }

  normalizeOptions(options = [], phase, startupProfile, previousResponses = []) {
    const normalized = Array.isArray(options)
      ? options
          .filter(option => option && option.label)
          .slice(0, 3)
          .map((option, index) => ({
            id: option.id || `option-${index + 1}`,
            label: option.label,
            consequence: option.consequence || 'This choice has mixed market-readiness implications that should be examined carefully.',
            scoreHint: Number.isFinite(option.scoreHint) ? Math.max(0, Math.min(100, option.scoreHint)) : 60,
          }))
      : [];

    if (normalized.length > 0) {
      return normalized;
    }

    return this.buildProfileSpecificOptions(phase, startupProfile, previousResponses);
  }

  buildFallbackEvaluationQuestion(phase, startupProfile, previousResponses = [], rationale) {
    return {
      stakeholder: this.getDefaultStakeholder(phase),
      scenario: this.getDefaultScenario(phase, startupProfile),
      question: this.buildProfileSpecificQuestion(phase, startupProfile, previousResponses),
      guidance: phase.guidance,
      rationale,
      options: this.normalizeOptions([], phase, startupProfile, previousResponses),
      allowOther: true,
      source: 'fallback',
    };
  }
}

module.exports = new GeminiService();
