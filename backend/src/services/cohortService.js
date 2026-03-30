const Simulation = require('../models/Simulation');
const User = require('../models/User');
const logger = require('../utils/logger');

class CohortService {
  constructor() {
    this.cohortDefinitions = {
      industry: {
        'technology': { name: 'Technology Startups', focus: ['SaaS', 'AI/ML', 'Blockchain', 'IoT'] },
        'fintech': { name: 'FinTech Ventures', focus: ['Payments', 'Lending', 'InsurTech', 'WealthTech'] },
        'healthcare': { name: 'Healthcare Innovation', focus: ['MedTech', 'HealthTech', 'Biotech', 'Digital Health'] },
        'edtech': { name: 'EdTech Solutions', focus: ['Online Learning', 'EdTech Platforms', 'Skill Development'] },
        'ecommerce': { name: 'E-commerce Ventures', focus: ['D2C', 'Marketplace', 'Social Commerce'] },
        'manufacturing': { name: 'Manufacturing & Industry 4.0', focus: ['Smart Manufacturing', 'IoT', 'Automation'] },
        'agriculture': { name: 'AgriTech & Food Tech', focus: ['Precision Agriculture', 'Food Processing', 'Supply Chain'] },
      },
      experience: {
        'student': { name: 'Student Innovators', range: '0-1 years' },
        '0-2': { name: 'Early Stage Founders', range: '0-2 years' },
        '3-5': { name: 'Growth Stage Founders', range: '3-5 years' },
        '6-10': { name: 'Experienced Entrepreneurs', range: '6-10 years' },
        '10+': { name: 'Serial Entrepreneurs', range: '10+ years' },
      },
      geography: {
        'hyderabad': { name: 'Hyderabad Ecosystem', focus: ['T-Hub', 'T-Works', 'IIIT-H'] },
        'bangalore': { name: 'Bangalore Ecosystem', focus: ['NASSCOM', 'Startup India Hub'] },
        'pune': { name: 'Pune Ecosystem', focus: ['SINE', 'COEP'] },
        'mumbai': { name: 'Mumbai Ecosystem', focus: ['Venture Catalysts', 'IIT Bombay'] },
        'delhi': { name: 'Delhi NCR Ecosystem', focus: ['TISS', 'IIT Delhi'] },
      },
      fundingStage: {
        'pre-seed': { name: 'Pre-Seed Stage', range: '$0-$250K' },
        'seed': { name: 'Seed Stage', range: '$250K-$2M' },
        'series-a': { name: 'Series A', range: '$2M-$15M' },
        'series-b': { name: 'Series B+', range: '$15M+' },
      },
    };
  }

  // Get cohort benchmarks for a simulation
  async getCohortBenchmarks(simulation) {
    try {
      const cohortGroups = this.identifyCohortGroups(simulation);
      const benchmarks = {};

      for (const [cohortType, cohortValue] of Object.entries(cohortGroups)) {
        benchmarks[cohortType] = await this.calculateCohortBenchmark(cohortType, cohortValue, simulation);
      }

      // Calculate overall benchmark
      benchmarks.overall = this.calculateOverallBenchmark(benchmarks);

      return {
        simulationId: simulation._id,
        cohortGroups,
        benchmarks,
        recommendations: this.generateCohortRecommendations(benchmarks, simulation),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting cohort benchmarks:', error);
      throw error;
    }
  }

  // Identify cohort groups for a simulation
  identifyCohortGroups(simulation) {
    const user = simulation.user;
    const venture = simulation.venture;

    return {
      industry: venture.industry,
      experience: user.profile?.experience || 'student',
      geography: user.profile?.location?.state?.toLowerCase() || 'hyderabad',
      fundingStage: this.estimateFundingStage(simulation),
      persona: user.profile?.persona || 'aspiring-founder',
      vvsTier: this.getVVSTier(simulation.vvsScore.overall),
    };
  }

  // Estimate funding stage based on simulation data
  estimateFundingStage(simulation) {
    const { financialModel, vvsScore } = simulation;
    
    if (!financialModel || !financialModel.assumptions) {
      return 'pre-seed';
    }

    const { marketSize, pricing } = financialModel.assumptions;
    const estimatedRevenue = (marketSize || 1000000) * (pricing || 100) * 0.01; // 1% penetration

    if (estimatedRevenue < 500000) return 'pre-seed';
    if (estimatedRevenue < 2000000) return 'seed';
    if (estimatedRevenue < 10000000) return 'series-a';
    return 'series-b';
  }

  // Get VVS tier
  getVVSTier(score) {
    if (score >= 85) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 65) return 'satisfactory';
    if (score >= 50) return 'needs-improvement';
    return 'critical';
  }

  // Calculate cohort benchmark
  async calculateCohortBenchmark(cohortType, cohortValue, simulation) {
    try {
      const query = this.buildCohortQuery(cohortType, cohortValue);
      const cohortData = await Simulation.getCohortData(cohortType, cohortValue);

      if (!cohortData || cohortData.length === 0) {
        return this.getDefaultBenchmark(cohortType, simulation);
      }

      const userScore = simulation.vvsScore.overall;
      const percentile = this.calculatePercentile(userScore, cohortData.vvsDistribution);
      
      return {
        cohortType,
        cohortValue,
        cohortName: this.getCohortName(cohortType, cohortValue),
        userScore,
        cohortStats: {
          averageVVS: Math.round(cohortData.avgVVS),
          totalSimulations: cohortData.totalSimulations,
          averageDuration: Math.round(cohortData.avgDuration),
          completionRate: Math.round((cohortData.completedSimulations / cohortData.totalSimulations) * 100),
        },
        userPosition: {
          percentile: Math.round(percentile),
          rank: this.getRankDescription(percentile),
          aboveAverage: userScore >= cohortData.avgVVS,
          gap: Math.round(userScore - cohortData.avgVVS),
        },
        distribution: cohortData.vvsDistribution,
        insights: this.generateCohortInsights(cohortData, userScore, percentile),
      };
    } catch (error) {
      logger.error('Error calculating cohort benchmark:', error);
      return this.getDefaultBenchmark(cohortType, simulation);
    }
  }

  // Build cohort query
  buildCohortQuery(cohortType, cohortValue) {
    const query = { status: 'completed' };

    switch (cohortType) {
      case 'industry':
        query['venture.industry'] = cohortValue;
        break;
      case 'experience':
        query['user.profile.experience'] = cohortValue;
        break;
      case 'geography':
        query['user.profile.location.state'] = { $regex: new RegExp(cohortValue, 'i') };
        break;
      case 'fundingStage':
        // This would need more complex logic based on financial data
        break;
      case 'persona':
        query['user.profile.persona'] = cohortValue;
        break;
      case 'vvsTier':
        query['vvsScore.overall'] = this.getVVSRangeForTier(cohortValue);
        break;
    }

    return query;
  }

  // Get VVS range for tier
  getVVSRangeForTier(tier) {
    const ranges = {
      'excellent': { $gte: 85 },
      'good': { $gte: 75, $lt: 85 },
      'satisfactory': { $gte: 65, $lt: 75 },
      'needs-improvement': { $gte: 50, $lt: 65 },
      'critical': { $lt: 50 },
    };
    return ranges[tier] || { $gte: 0 };
  }

  // Get cohort name
  getCohortName(cohortType, cohortValue) {
    return this.cohortDefinitions[cohortType]?.[cohortValue]?.name || cohortValue;
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

  // Get rank description
  getRankDescription(percentile) {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
  }

  // Generate cohort insights
  generateCohortInsights(cohortData, userScore, percentile) {
    const insights = [];

    if (percentile >= 90) {
      insights.push({
        type: 'excellence',
        message: 'You are in the top 10% of your cohort',
        recommendation: 'Consider mentoring others in your cohort',
      });
    } else if (percentile <= 25) {
      insights.push({
        type: 'improvement-needed',
        message: 'You are in the bottom 25% of your cohort',
        recommendation: 'Focus on areas where your cohort excels',
      });
    }

    if (userScore > cohortData.avgVVS + 10) {
      insights.push({
        type: 'above-average',
        message: 'You significantly outperform your cohort average',
        recommendation: 'Leverage your strengths for competitive advantage',
      });
    } else if (userScore < cohortData.avgVVS - 10) {
      insights.push({
        type: 'below-average',
        message: 'You score below your cohort average',
        recommendation: 'Study successful strategies from your cohort',
      });
    }

    return insights;
  }

  // Get default benchmark
  getDefaultBenchmark(cohortType, simulation) {
    return {
      cohortType,
      cohortValue: 'unknown',
      cohortName: 'Unknown Cohort',
      userScore: simulation.vvsScore.overall,
      cohortStats: {
        averageVVS: 65,
        totalSimulations: 0,
        averageDuration: 120,
        completionRate: 70,
      },
      userPosition: {
        percentile: 50,
        rank: 'Average',
        aboveAverage: false,
        gap: 0,
      },
      distribution: [],
      insights: [{
        type: 'limited-data',
        message: 'Limited cohort data available',
        recommendation: 'Focus on improving your absolute score',
      }],
    };
  }

  // Calculate overall benchmark
  calculateOverallBenchmark(benchmarks) {
    const validBenchmarks = Object.values(benchmarks).filter(b => b.userPosition);
    
    if (validBenchmarks.length === 0) {
      return {
        overallPercentile: 50,
        overallRank: 'Average',
        strengths: [],
        improvements: [],
        summary: 'Insufficient data for overall benchmarking',
      };
    }

    const averagePercentile = validBenchmarks.reduce((sum, b) => sum + b.userPosition.percentile, 0) / validBenchmarks.length;
    
    const strengths = validBenchmarks
      .filter(b => b.userPosition.aboveAverage)
      .map(b => `${b.cohortType}: ${b.cohortName}`);

    const improvements = validBenchmarks
      .filter(b => !b.userPosition.aboveAverage)
      .map(b => `${b.cohortType}: ${b.cohortName}`);

    return {
      overallPercentile: Math.round(averagePercentile),
      overallRank: this.getRankDescription(averagePercentile),
      strengths,
      improvements,
      summary: `You perform better than ${Math.round(averagePercentile)}% of similar ventures`,
    };
  }

  // Generate cohort recommendations
  generateCohortRecommendations(benchmarks, simulation) {
    const recommendations = [];
    const { overall } = benchmarks;

    if (overall.overallPercentile >= 75) {
      recommendations.push({
        category: 'leverage',
        priority: 'medium',
        title: 'Leverage Your Competitive Advantage',
        description: 'You outperform most of your peers. Consider leveraging this for funding and partnerships.',
        actionItems: [
          'Highlight your percentile rankings in investor pitches',
          'Consider mentoring or advisory roles',
          'Share your success story to build your brand',
        ],
      });
    } else if (overall.overallPercentile <= 25) {
      recommendations.push({
        category: 'improvement',
        priority: 'high',
        title: 'Focus on Gap Areas',
        description: 'You have room for improvement compared to your peers. Prioritize these areas.',
        actionItems: [
          'Analyze top performers in your cohort',
          'Seek mentorship from successful cohort members',
          'Focus on your lowest-performing dimensions',
        ],
      });
    }

    // Specific recommendations based on cohort performance
    Object.values(benchmarks).forEach(benchmark => {
      if (benchmark.userPosition.gap < -15) {
        recommendations.push({
          category: 'cohort-specific',
          priority: 'medium',
          title: `Improve in ${benchmark.cohortName}`,
          description: `You score significantly below average in ${benchmark.cohortName}.`,
          actionItems: [
            `Study successful strategies in ${benchmark.cohortType}`,
            `Connect with high performers in this cohort`,
            `Focus on cohort-specific success factors`,
          ],
        });
      }
    });

    return recommendations;
  }

  // Get cohort leaderboard
  async getCohortLeaderboard(cohortType, cohortValue, limit = 10) {
    try {
      const query = this.buildCohortQuery(cohortType, cohortValue);
      
      const leaderboard = await Simulation.find(query)
        .populate('user', 'firstName lastName profile.persona')
        .sort({ 'vvsScore.overall': -1 })
        .limit(limit)
        .select('venture.name vvsScore.overall completionData.completedAt user');

      return {
        cohortType,
        cohortValue,
        cohortName: this.getCohortName(cohortType, cohortValue),
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          ventureName: entry.venture.name,
          founderName: `${entry.user.firstName} ${entry.user.lastName}`,
          persona: entry.user.profile?.persona,
          vvsScore: entry.vvsScore.overall,
          completedAt: entry.completionData?.completedAt,
        })),
        totalEntries: await Simulation.countDocuments(query),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting cohort leaderboard:', error);
      throw error;
    }
  }

  // Get cohort trends over time
  async getCohortTrends(cohortType, cohortValue, timeframe = '90d') {
    try {
      const query = this.buildCohortQuery(cohortType, cohortValue);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));

      const trends = await Simulation.aggregate([
        { $match: { ...query, 'completionData.completedAt': { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$completionData.completedAt' },
              month: { $month: '$completionData.completedAt' },
            },
            avgVVS: { $avg: '$vvsScore.overall' },
            count: { $sum: 1 },
            avgDuration: { $avg: '$completionData.totalDuration' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      return {
        cohortType,
        cohortValue,
        cohortName: this.getCohortName(cohortType, cohortValue),
        timeframe,
        trends: trends.map(trend => ({
          period: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          avgVVS: Math.round(trend.avgVVS),
          simulations: trend.count,
          avgDuration: Math.round(trend.avgDuration),
        })),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting cohort trends:', error);
      throw error;
    }
  }

  // Get cohort comparison
  async getCohortComparison(cohortType, cohortValues) {
    try {
      const comparisons = {};

      for (const cohortValue of cohortValues) {
        const query = this.buildCohortQuery(cohortType, cohortValue);
        const cohortData = await Simulation.getCohortData(cohortType, cohortValue);

        comparisons[cohortValue] = {
          cohortName: this.getCohortName(cohortType, cohortValue),
          avgVVS: Math.round(cohortData?.avgVVS || 0),
          totalSimulations: cohortData?.totalSimulations || 0,
          avgDuration: Math.round(cohortData?.avgDuration || 0),
          completionRate: cohortData?.totalSimulations > 0 
            ? Math.round((cohortData.completedSimulations / cohortData.totalSimulations) * 100)
            : 0,
        };
      }

      // Sort by average VVS
      const sortedEntries = Object.entries(comparisons)
        .sort(([,a], [,b]) => b.avgVVS - a.avgVVS);

      return {
        cohortType,
        comparisons,
        ranking: sortedEntries.map(([value, data]) => ({
          cohortValue: value,
          cohortName: data.cohortName,
          avgVVS: data.avgVVS,
          rank: sortedEntries.findIndex(([v]) => v === value) + 1,
        })),
        insights: this.generateComparisonInsights(comparisons),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting cohort comparison:', error);
      throw error;
    }
  }

  // Generate comparison insights
  generateComparisonInsights(comparisons) {
    const insights = [];
    const entries = Object.entries(comparisons);

    if (entries.length === 0) return insights;

    const avgVVSScores = entries.map(([, data]) => data.avgVVS);
    const maxScore = Math.max(...avgVVSScores);
    const minScore = Math.min(...avgVVSScores);
    const scoreRange = maxScore - minScore;

    if (scoreRange > 20) {
      insights.push({
        type: 'high-variance',
        message: `Significant performance variance exists between cohorts (${scoreRange} points difference)`,
        recommendation: 'Analyze top-performing cohorts for best practices',
      });
    }

    const topPerformer = entries.find(([, data]) => data.avgVVS === maxScore);
    if (topPerformer) {
      insights.push({
        type: 'top-performer',
        message: `${topPerformer[1].cohortName} leads with an average VVS of ${maxScore}`,
        recommendation: `Study success factors in ${topPerformer[0]} cohort`,
      });
    }

    return insights;
  }

  // Update cohort data for a completed simulation
  async updateCohortData(simulation) {
    try {
      const cohortGroups = this.identifyCohortGroups(simulation);

      // Update various cohort aggregations
      for (const [cohortType, cohortValue] of Object.entries(cohortGroups)) {
        await this.updateCohortAggregation(cohortType, cohortValue, simulation);
      }

      logger.info(`Updated cohort data for simulation ${simulation._id}`);
    } catch (error) {
      logger.error('Error updating cohort data:', error);
    }
  }

  // Update cohort aggregation
  async updateCohortAggregation(cohortType, cohortValue, simulation) {
    // This would typically update a separate collection for cohort analytics
    // For now, we'll just log the update
    logger.info(`Cohort update: ${cohortType}=${cohortValue}, VVS=${simulation.vvsScore.overall}`);
  }

  // Get cohort statistics for admin dashboard
  async getCohortStatistics() {
    try {
      const statistics = {};

      for (const [cohortType, cohortDefinitions] of Object.entries(this.cohortDefinitions)) {
        statistics[cohortType] = {};

        for (const [cohortValue, definition] of Object.entries(cohortDefinitions)) {
          const query = this.buildCohortQuery(cohortType, cohortValue);
          const cohortData = await Simulation.getCohortData(cohortType, cohortValue);

          statistics[cohortType][cohortValue] = {
            name: definition.name,
            totalSimulations: cohortData?.totalSimulations || 0,
            avgVVS: Math.round(cohortData?.avgVVS || 0),
            avgDuration: Math.round(cohortData?.avgDuration || 0),
            completionRate: cohortData?.totalSimulations > 0 
              ? Math.round((cohortData.completedSimulations / cohortData.totalSimulations) * 100)
              : 0,
          };
        }
      }

      return {
        statistics,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting cohort statistics:', error);
      throw error;
    }
  }
}

module.exports = new CohortService();
