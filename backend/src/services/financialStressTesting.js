const logger = require('../utils/logger');

class FinancialStressTestingService {
  constructor() {
    this.stressScenarios = {
      revenue: {
        'optimistic': { change: 0.2, probability: 0.2 },
        'base': { change: 0, probability: 0.6 },
        'pessimistic': { change: -0.3, probability: 0.2 },
      },
      costs: {
        'optimistic': { change: -0.1, probability: 0.2 },
        'base': { change: 0, probability: 0.6 },
        'pessimistic': { change: 0.4, probability: 0.2 },
      },
      market: {
        'growth': { change: 0.15, probability: 0.3 },
        'stable': { change: 0, probability: 0.4 },
        'recession': { change: -0.25, probability: 0.3 },
      },
      funding: {
        'on-time': { delay: 0, probability: 0.7 },
        'delayed': { delay: 3, probability: 0.2 },
        'reduced': { delay: 0, reduction: 0.3, probability: 0.1 },
      },
    };
  }

  // Perform comprehensive stress testing on financial model
  async performStressTest(financialModel, ventureContext) {
    try {
      const baseModel = this.validateAndNormalizeModel(financialModel);
      
      const stressTests = {
        revenueStress: this.testRevenueScenarios(baseModel),
        costStress: this.testCostScenarios(baseModel),
        marketStress: this.testMarketScenarios(baseModel),
        fundingStress: this.testFundingScenarios(baseModel),
        combinedStress: this.testCombinedScenarios(baseModel),
        monteCarlo: await this.runMonteCarloSimulation(baseModel),
      };

      const analysis = this.analyzeStressTestResults(stressTests, baseModel);
      const recommendations = this.generateFinancialRecommendations(analysis, ventureContext);

      return {
        baseModel,
        stressTests,
        analysis,
        recommendations,
        riskAssessment: this.assessOverallRisk(analysis),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error performing stress test:', error);
      throw error;
    }
  }

  // Validate and normalize financial model
  validateAndNormalizeModel(financialModel) {
    const defaults = {
      assumptions: {
        pricing: 100,
        marketSize: 1000000,
        cac: 50,
        ltv: 500,
        burnRate: 50000,
        runway: 12,
        conversionRate: 0.02,
        churnRate: 0.05,
        operatingMargin: 0.2,
      },
      projections: {
        revenue: Array(24).fill(0).map((_, i) => Math.floor(Math.random() * 100000) + 10000),
        expenses: Array(24).fill(0).map((_, i) => Math.floor(Math.random() * 80000) + 20000),
        profit: [],
      },
    };

    // Merge with provided model
    const normalized = {
      assumptions: { ...defaults.assumptions, ...financialModel.assumptions },
      projections: {
        revenue: financialModel.projections?.revenue || defaults.projections.revenue,
        expenses: financialModel.projections?.expenses || defaults.projections.expenses,
      },
    };

    // Calculate profit projections
    normalized.projections.profit = normalized.projections.revenue.map((revenue, i) => 
      revenue - (normalized.projections.expenses[i] || 0)
    );

    // Calculate break-even
    normalized.breakEven = this.calculateBreakEven(normalized);

    return normalized;
  }

  // Test revenue scenarios
  testRevenueScenarios(model) {
    const scenarios = {};
    
    Object.keys(this.stressScenarios.revenue).forEach(scenarioName => {
      const scenario = this.stressScenarios.revenue[scenarioName];
      const adjustedRevenue = model.projections.revenue.map(revenue => 
        revenue * (1 + scenario.change)
      );
      
      const adjustedExpenses = [...model.projections.expenses];
      const adjustedProfit = adjustedRevenue.map((revenue, i) => revenue - adjustedExpenses[i]);
      
      scenarios[scenarioName] = {
        revenue: adjustedRevenue,
        expenses: adjustedExpenses,
        profit: adjustedProfit,
        cumulativeProfit: this.calculateCumulativeProfit(adjustedProfit),
        breakEvenMonth: this.findBreakEvenMonth(adjustedProfit),
        probability: scenario.probability,
        description: this.getScenarioDescription('revenue', scenarioName),
      };
    });

    return scenarios;
  }

  // Test cost scenarios
  testCostScenarios(model) {
    const scenarios = {};
    
    Object.keys(this.stressScenarios.costs).forEach(scenarioName => {
      const scenario = this.stressScenarios.costs[scenarioName];
      const adjustedExpenses = model.projections.expenses.map(expense => 
        expense * (1 + scenario.change)
      );
      
      const adjustedRevenue = [...model.projections.revenue];
      const adjustedProfit = adjustedRevenue.map((revenue, i) => revenue - adjustedExpenses[i]);
      
      scenarios[scenarioName] = {
        revenue: adjustedRevenue,
        expenses: adjustedExpenses,
        profit: adjustedProfit,
        cumulativeProfit: this.calculateCumulativeProfit(adjustedProfit),
        breakEvenMonth: this.findBreakEvenMonth(adjustedProfit),
        probability: scenario.probability,
        description: this.getScenarioDescription('cost', scenarioName),
      };
    });

    return scenarios;
  }

  // Test market scenarios
  testMarketScenarios(model) {
    const scenarios = {};
    
    Object.keys(this.stressScenarios.market).forEach(scenarioName => {
      const scenario = this.stressScenarios.market[scenarioName];
      const marketMultiplier = 1 + scenario.change;
      
      // Adjust both revenue and costs based on market conditions
      const adjustedRevenue = model.projections.revenue.map(revenue => 
        revenue * marketMultiplier
      );
      
      const adjustedExpenses = model.projections.expenses.map((expense, i) => {
        // Costs are less elastic than revenue
        const costMultiplier = 1 + (scenario.change * 0.5);
        return expense * costMultiplier;
      });
      
      const adjustedProfit = adjustedRevenue.map((revenue, i) => revenue - adjustedExpenses[i]);
      
      scenarios[scenarioName] = {
        revenue: adjustedRevenue,
        expenses: adjustedExpenses,
        profit: adjustedProfit,
        cumulativeProfit: this.calculateCumulativeProfit(adjustedProfit),
        breakEvenMonth: this.findBreakEvenMonth(adjustedProfit),
        probability: scenario.probability,
        description: this.getScenarioDescription('market', scenarioName),
      };
    });

    return scenarios;
  }

  // Test funding scenarios
  testFundingScenarios(model) {
    const scenarios = {};
    
    Object.keys(this.stressScenarios.funding).forEach(scenarioName => {
      const scenario = this.stressScenarios.funding[scenarioName];
      
      let adjustedExpenses = [...model.projections.expenses];
      let adjustedRevenue = [...model.projections.revenue];
      
      // Apply funding delay or reduction
      if (scenario.delay > 0) {
        // Delay means higher burn rate initially
        const monthlyBurn = model.assumptions.burnRate;
        for (let i = 0; i < scenario.delay && i < adjustedExpenses.length; i++) {
          adjustedExpenses[i] += monthlyBurn * 0.2; // 20% increase during delay
        }
      }
      
      if (scenario.reduction) {
        // Reduced funding affects expenses
        adjustedExpenses = adjustedExpenses.map(expense => expense * (1 - scenario.reduction));
      }
      
      const adjustedProfit = adjustedRevenue.map((revenue, i) => revenue - adjustedExpenses[i]);
      
      scenarios[scenarioName] = {
        revenue: adjustedRevenue,
        expenses: adjustedExpenses,
        profit: adjustedProfit,
        cumulativeProfit: this.calculateCumulativeProfit(adjustedProfit),
        breakEvenMonth: this.findBreakEvenMonth(adjustedProfit),
        probability: scenario.probability,
        description: this.getScenarioDescription('funding', scenarioName),
      };
    });

    return scenarios;
  }

  // Test combined scenarios
  testCombinedScenarios(model) {
    const combinedScenarios = {};
    
    // Worst-case combination
    const worstCaseRevenue = model.projections.revenue.map(revenue => 
      revenue * (1 + this.stressScenarios.revenue.pessimistic.change)
    );
    const worstCaseExpenses = model.projections.expenses.map(expense => 
      expense * (1 + this.stressScenarios.costs.pessimistic.change)
    );
    const worstCaseProfit = worstCaseRevenue.map((revenue, i) => revenue - worstCaseExpenses[i]);
    
    combinedScenarios.worstCase = {
      revenue: worstCaseRevenue,
      expenses: worstCaseExpenses,
      profit: worstCaseProfit,
      cumulativeProfit: this.calculateCumulativeProfit(worstCaseProfit),
      breakEvenMonth: this.findBreakEvenMonth(worstCaseProfit),
      probability: 0.05, // Low probability for worst case
      description: 'Worst-case scenario: Revenue decline + Cost increase',
    };

    // Best-case combination
    const bestCaseRevenue = model.projections.revenue.map(revenue => 
      revenue * (1 + this.stressScenarios.revenue.optimistic.change)
    );
    const bestCaseExpenses = model.projections.expenses.map(expense => 
      expense * (1 + this.stressScenarios.costs.optimistic.change)
    );
    const bestCaseProfit = bestCaseRevenue.map((revenue, i) => revenue - bestCaseExpenses[i]);
    
    combinedScenarios.bestCase = {
      revenue: bestCaseRevenue,
      expenses: bestCaseExpenses,
      profit: bestCaseProfit,
      cumulativeProfit: this.calculateCumulativeProfit(bestCaseProfit),
      breakEvenMonth: this.findBreakEvenMonth(bestCaseProfit),
      probability: 0.05, // Low probability for best case
      description: 'Best-case scenario: Revenue growth + Cost reduction',
    };

    return combinedScenarios;
  }

  // Run Monte Carlo simulation
  async runMonteCarloSimulation(model, iterations = 1000) {
    const results = {
      revenue: [],
      profit: [],
      breakEvenMonths: [],
      finalValuations: [],
    };

    for (let i = 0; i < iterations; i++) {
      const scenario = this.generateRandomScenario();
      const simulatedModel = this.applyScenario(model, scenario);
      
      results.revenue.push(simulatedModel.projections.revenue[11]); // 12-month revenue
      results.profit.push(simulatedModel.projections.profit[11]); // 12-month profit
      results.breakEvenMonths.push(this.findBreakEvenMonth(simulatedModel.projections.profit));
      results.finalValuations.push(this.estimateValuation(simulatedModel));
    }

    return {
      iterations,
      statistics: {
        revenue: this.calculateStatistics(results.revenue),
        profit: this.calculateStatistics(results.profit),
        breakEvenMonth: this.calculateStatistics(results.breakEvenMonths),
        valuation: this.calculateStatistics(results.finalValuations),
      },
      distributions: {
        revenue: this.createDistribution(results.revenue),
        profit: this.createDistribution(results.profit),
      },
    };
  }

  // Generate random scenario for Monte Carlo
  generateRandomScenario() {
    return {
      revenueChange: this.randomNormal(0, 0.2), // Mean 0, SD 20%
      costChange: this.randomNormal(0, 0.15), // Mean 0, SD 15%
      marketChange: this.randomNormal(0, 0.1), // Mean 0, SD 10%
    };
  }

  // Apply scenario to model
  applyScenario(model, scenario) {
    const adjustedRevenue = model.projections.revenue.map(revenue => 
      revenue * (1 + scenario.revenueChange)
    );
    const adjustedExpenses = model.projections.expenses.map(expense => 
      expense * (1 + scenario.costChange)
    );
    const adjustedProfit = adjustedRevenue.map((revenue, i) => revenue - adjustedExpenses[i]);

    return {
      ...model,
      projections: {
        revenue: adjustedRevenue,
        expenses: adjustedExpenses,
        profit: adjustedProfit,
      },
    };
  }

  // Random normal distribution (Box-Muller transform)
  randomNormal(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  // Calculate statistics for Monte Carlo results
  calculateStatistics(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      percentiles: {
        p5: sorted[Math.floor(sorted.length * 0.05)],
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
      },
    };
  }

  // Create distribution data
  createDistribution(data) {
    const bins = 10;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    
    const distribution = [];
    for (let i = 0; i < bins; i++) {
      const binMin = min + i * binWidth;
      const binMax = min + (i + 1) * binWidth;
      const count = data.filter(val => val >= binMin && val < binMax).length;
      
      distribution.push({
        range: `${binMin.toFixed(0)}-${binMax.toFixed(0)}`,
        count,
        percentage: (count / data.length) * 100,
      });
    }
    
    return distribution;
  }

  // Calculate cumulative profit
  calculateCumulativeProfit(profitArray) {
    let cumulative = 0;
    return profitArray.map(profit => {
      cumulative += profit;
      return cumulative;
    });
  }

  // Find break-even month
  findBreakEvenMonth(profitArray) {
    for (let i = 0; i < profitArray.length; i++) {
      if (profitArray[i] >= 0) {
        return i + 1; // 1-based month
      }
    }
    return null; // No break-even in the period
  }

  // Calculate break-even point
  calculateBreakEven(model) {
    const fixedCosts = model.assumptions.burnRate * 0.7; // Assume 70% fixed costs
    const contributionMargin = model.assumptions.pricing - (model.assumptions.pricing * (1 - model.assumptions.operatingMargin));
    
    if (contributionMargin <= 0) {
      return { months: null, revenue: null, achievable: false };
    }
    
    const breakEvenUnits = Math.ceil(fixedCosts / contributionMargin);
    const breakEvenRevenue = breakEvenUnits * model.assumptions.pricing;
    const breakEvenMonths = Math.ceil(breakEvenUnits / (model.assumptions.marketSize * model.assumptions.conversionRate / 12));
    
    return {
      months: breakEvenMonths,
      revenue: breakEvenRevenue,
      units: breakEvenUnits,
      achievable: breakEvenMonths <= 24, // Within 2 years
    };
  }

  // Get scenario description
  getScenarioDescription(type, scenario) {
    const descriptions = {
      revenue: {
        optimistic: '20% revenue growth scenario',
        base: 'Base revenue projections',
        pessimistic: '30% revenue decline scenario',
      },
      cost: {
        optimistic: '10% cost reduction scenario',
        base: 'Base cost projections',
        pessimistic: '40% cost increase scenario',
      },
      market: {
        growth: '15% market growth scenario',
        stable: 'Stable market conditions',
        recession: '25% market recession scenario',
      },
      funding: {
        'on-time': 'Funding received on schedule',
        delayed: '3-month funding delay',
        reduced: '30% funding reduction',
      },
    };

    return descriptions[type]?.[scenario] || 'Unknown scenario';
  }

  // Analyze stress test results
  analyzeStressTestResults(stressTests, baseModel) {
    const analysis = {
      resilience: {},
      vulnerabilities: [],
      keyMetrics: {},
      scenarioComparison: {},
    };

    // Analyze revenue stress
    const revenueScenarios = stressTests.revenueStress;
    analysis.resilience.revenue = {
      worstCaseRevenue: revenueScenarios.pessimistic.revenue[11],
      revenueVolatility: this.calculateVolatility([
        revenueScenarios.optimistic.revenue[11],
        revenueScenarios.base.revenue[11],
        revenueScenarios.pessimistic.revenue[11],
      ]),
      breakEvenStability: this.analyzeBreakEvenStability(revenueScenarios),
    };

    // Analyze cost stress
    const costScenarios = stressTests.costStress;
    analysis.resilience.costs = {
      worstCaseCosts: costScenarios.pessimistic.expenses[11],
      costVolatility: this.calculateVolatility([
        costScenarios.optimistic.expenses[11],
        costScenarios.base.expenses[11],
        costScenarios.pessimistic.expenses[11],
      ]),
      costEfficiency: this.analyzeCostEfficiency(costScenarios),
    };

    // Analyze combined stress
    const combinedScenarios = stressTests.combinedStress;
    analysis.vulnerabilities = this.identifyVulnerabilities(combinedScenarios, baseModel);

    // Key metrics analysis
    analysis.keyMetrics = {
      baseBreakEven: baseModel.breakEven.months,
      worstCaseBreakEven: combinedScenarios.worstCase.breakEvenMonth,
      profitAtRisk: Math.max(0, baseModel.projections.profit[11] - combinedScenarios.worstCase.profit[11]),
      runwayVariation: this.analyzeRunwayVariation(stressTests),
    };

    // Scenario comparison
    analysis.scenarioComparison = this.compareScenarios(stressTests);

    return analysis;
  }

  // Calculate volatility
  calculateVolatility(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Analyze break-even stability
  analyzeBreakEvenStability(scenarios) {
    const breakEvenMonths = Object.values(scenarios)
      .map(scenario => scenario.breakEvenMonth)
      .filter(month => month !== null);

    if (breakEvenMonths.length === 0) return 'stable';

    const min = Math.min(...breakEvenMonths);
    const max = Math.max(...breakEvenMonths);
    const variation = max - min;

    if (variation <= 2) return 'stable';
    if (variation <= 6) return 'moderate';
    return 'unstable';
  }

  // Analyze cost efficiency
  analyzeCostEfficiency(scenarios) {
    const baseEfficiency = scenarios.base.revenue[11] / scenarios.base.expenses[11];
    const worstEfficiency = scenarios.pessimistic.revenue[11] / scenarios.pessimistic.expenses[11];
    
    const efficiencyLoss = (baseEfficiency - worstEfficiency) / baseEfficiency;
    
    if (efficiencyLoss <= 0.1) return 'high';
    if (efficiencyLoss <= 0.2) return 'moderate';
    return 'low';
  }

  // Identify vulnerabilities
  identifyVulnerabilities(combinedScenarios, baseModel) {
    const vulnerabilities = [];
    
    const worstCase = combinedScenarios.worstCase;
    const profitDecline = baseModel.projections.profit[11] - worstCase.profit[11];
    
    if (profitDecline > baseModel.projections.profit[11] * 0.5) {
      vulnerabilities.push({
        type: 'high_profit_volatility',
        severity: 'high',
        description: 'Profit could decline by more than 50% in worst-case scenario',
        impact: 'Severe cash flow risk',
      });
    }

    if (worstCase.breakEvenMonth === null || worstCase.breakEvenMonth > 24) {
      vulnerabilities.push({
        type: 'break_even_delay',
        severity: 'high',
        description: 'Break-even may not be achieved within 2 years in worst-case',
        impact: 'Extended funding requirements',
      });
    }

    const cumulativeLoss = Math.min(...worstCase.cumulativeProfit);
    if (cumulativeLoss < -baseModel.assumptions.burnRate * 6) {
      vulnerabilities.push({
        type: 'cash_flow_risk',
        severity: 'medium',
        description: 'Potential cash flow deficit exceeding 6 months of burn',
        impact: 'Liquidity crisis risk',
      });
    }

    return vulnerabilities;
  }

  // Analyze runway variation
  analyzeRunwayVariation(stressTests) {
    const baseRunway = 12; // Base assumption
    const scenarios = [
      stressTests.revenueStress.pessimistic,
      stressTests.costStress.pessimistic,
      stressTests.combinedStenarios.worstCase,
    ];

    const runways = scenarios.map(scenario => {
      let cumulative = 0;
      for (let i = 0; i < scenario.profit.length; i++) {
        cumulative += scenario.profit[i];
        if (cumulative <= -baseRunway * scenario.expenses[0]) {
          return i + 1;
        }
      }
      return scenario.profit.length;
    });

    const minRunway = Math.min(...runways);
    const maxRunway = Math.max(...runways);
    
    return {
      base: baseRunway,
      worst: minRunway,
      variation: baseRunway - minRunway,
      percentageChange: ((baseRunway - minRunway) / baseRunway) * 100,
    };
  }

  // Compare scenarios
  compareScenarios(stressTests) {
    const comparison = {};
    
    // Compare all scenarios
    const allScenarios = {
      'Revenue Optimistic': stressTests.revenueStress.optimistic,
      'Revenue Base': stressTests.revenueStress.base,
      'Revenue Pessimistic': stressTests.revenueStress.pessimistic,
      'Cost Optimistic': stressTests.costStress.optimistic,
      'Cost Base': stressTests.costStress.base,
      'Cost Pessimistic': stressTests.costStress.pessimistic,
      'Worst Case': stressTests.combinedScenarios.worstCase,
      'Best Case': stressTests.combinedScenarios.bestCase,
    };

    Object.entries(allScenarios).forEach(([name, scenario]) => {
      comparison[name] = {
        year1Revenue: scenario.revenue[11],
        year1Profit: scenario.profit[11],
        breakEvenMonth: scenario.breakEvenMonth,
        cumulativeProfit: scenario.cumulativeProfit[11],
      };
    });

    return comparison;
  }

  // Estimate valuation
  estimateValuation(model) {
    const year1Revenue = model.projections.revenue[11];
    const year1Profit = model.projections.profit[11];
    
    // Multiple-based valuation (simplified)
    const revenueMultiple = 3; // Typical for early-stage
    const profitMultiple = 15; // Typical for profitable companies
    
    const revenueValuation = year1Revenue * revenueMultiple;
    const profitValuation = year1Profit > 0 ? year1Profit * profitMultiple : 0;
    
    return Math.max(revenueValuation, profitValuation, 1000000); // Minimum $1M valuation
  }

  // Assess overall risk
  assessOverallRisk(analysis) {
    const riskFactors = [];
    let riskScore = 0;

    // Revenue volatility risk
    if (analysis.resilience.revenue.revenueVolatility > 50000) {
      riskFactors.push('High revenue volatility');
      riskScore += 25;
    }

    // Break-even instability
    if (analysis.resilience.revenue.breakEvenStability === 'unstable') {
      riskFactors.push('Unstable break-even point');
      riskScore += 20;
    }

    // Cost efficiency
    if (analysis.resilience.costs.costEfficiency === 'low') {
      riskFactors.push('Poor cost efficiency under stress');
      riskScore += 20;
    }

    // Vulnerabilities
    analysis.vulnerabilities.forEach(vuln => {
      riskFactors.push(vuln.description);
      riskScore += vuln.severity === 'high' ? 25 : 15;
    });

    // Runway variation
    if (analysis.keyMetrics.runwayVariation.percentageChange > 50) {
      riskFactors.push('High runway variation under stress');
      riskScore += 15;
    }

    const riskLevel = riskScore >= 75 ? 'high' : riskScore >= 50 ? 'medium' : 'low';

    return {
      score: Math.min(100, riskScore),
      level: riskLevel,
      factors: riskFactors,
      mitigation: this.generateRiskMitigation(riskLevel, riskFactors),
    };
  }

  // Generate risk mitigation strategies
  generateRiskMitigation(riskLevel, factors) {
    const strategies = [];

    if (riskLevel === 'high') {
      strategies.push({
        priority: 'critical',
        strategy: 'Build larger cash buffer',
        description: 'Increase runway to 18-24 months to weather adverse scenarios',
        estimatedCost: 'Additional funding required',
      });
    }

    if (factors.includes('High revenue volatility')) {
      strategies.push({
        priority: 'high',
        strategy: 'Diversify revenue streams',
        description: 'Reduce dependency on single revenue source',
        estimatedCost: 'Moderate investment in new offerings',
      });
    }

    if (factors.includes('Poor cost efficiency under stress')) {
      strategies.push({
        priority: 'medium',
        strategy: 'Implement variable cost structure',
        description: 'Convert fixed costs to variable where possible',
        estimatedCost: 'Process reengineering costs',
      });
    }

    strategies.push({
      priority: 'medium',
      strategy: 'Regular stress testing',
      description: 'Conduct quarterly stress tests to monitor financial health',
      estimatedCost: 'Minimal - internal process',
    });

    return strategies;
  }

  // Generate financial recommendations
  generateFinancialRecommendations(analysis, ventureContext) {
    const recommendations = [];

    // Based on break-even analysis
    if (analysis.keyMetrics.worstCaseBreakEven > 18) {
      recommendations.push({
        category: 'break-even',
        priority: 'high',
        recommendation: 'Accelerate break-even timeline',
        description: 'Current model shows break-even could extend beyond 18 months in worst-case',
        actionItems: [
          'Increase pricing or reduce initial costs',
          'Focus on higher-margin customer segments',
          'Consider phased rollout strategy',
        ],
        expectedImpact: 'Reduce break-even by 3-6 months',
      });
    }

    // Based on profit at risk
    if (analysis.keyMetrics.profitAtRisk > 100000) {
      recommendations.push({
        category: 'profit-protection',
        priority: 'high',
        recommendation: 'Implement profit protection measures',
        description: 'Significant profit exposure identified in stress scenarios',
        actionItems: [
          'Implement dynamic pricing',
          'Establish cost control mechanisms',
          'Create revenue insurance strategies',
        ],
        expectedImpact: 'Reduce profit volatility by 20-30%',
      });
    }

    // Based on runway variation
    if (analysis.keyMetrics.runwayVariation.percentageChange > 40) {
      recommendations.push({
        category: 'cash-management',
        priority: 'medium',
        recommendation: 'Strengthen cash management',
        description: 'Runway varies significantly under stress scenarios',
        actionItems: [
          'Establish revolving credit facility',
          'Implement conservative cash management',
          'Create contingency funding plan',
        ],
        expectedImpact: 'Improve runway stability by 25%',
      });
    }

    // Industry-specific recommendations
    if (ventureContext.industry === 'fintech') {
      recommendations.push({
        category: 'regulatory-capital',
        priority: 'high',
        recommendation: 'Maintain regulatory capital buffer',
        description: 'Fintech requires additional capital for regulatory compliance',
        actionItems: [
          'Allocate 15-20% additional capital for compliance',
          'Monitor regulatory capital requirements',
          'Plan for regulatory changes',
        ],
        expectedImpact: 'Ensure regulatory compliance and stability',
      });
    }

    // General recommendations
    recommendations.push({
      category: 'monitoring',
      priority: 'medium',
      recommendation: 'Implement financial early warning system',
      description: 'Set up alerts for key financial indicators',
      actionItems: [
        'Define key risk indicators',
        'Set up automated monitoring',
        'Establish response protocols',
      ],
      expectedImpact: 'Early detection of financial issues',
    });

    return recommendations;
  }
}

module.exports = new FinancialStressTestingService();
