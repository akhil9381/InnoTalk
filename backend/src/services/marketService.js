const { google } = require('googleapis');
const axios = require('axios');
const logger = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

class MarketService {
  constructor() {
    this.customSearch = google.customsearch('v1');
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Get market data for industry and geography
  async getMarketData(industry, geography = 'national', timeframe = '2026') {
    try {
      const cacheKey = `market:${industry}:${geography}:${timeframe}`;
      
      // Check cache first
      const cached = await this.getCachedData(cacheKey);
      if (cached) {
        logger.debug(`Market data retrieved from cache: ${cacheKey}`);
        return cached;
      }

      const marketData = {
        industry,
        geography,
        timeframe,
        trends: await this.getMarketTrends(industry, geography, timeframe),
        competitors: await this.getCompetitors(industry, geography),
        fundingRounds: await this.getFundingRounds(industry, geography),
        marketSize: await this.getMarketSize(industry, geography),
        regulatoryInfo: await this.getRegulatoryInfo(industry, geography),
        lastUpdated: new Date().toISOString(),
      };

      // Cache the results
      await this.setCachedData(cacheKey, marketData);

      logger.info(`Market data fetched for ${industry} in ${geography}`);
      return marketData;
    } catch (error) {
      logger.error('Error getting market data:', error);
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
  }

  // Get market trends using Google Search
  async getMarketTrends(industry, geography, timeframe) {
    try {
      const searchQueries = this.buildTrendQueries(industry, geography, timeframe);
      const trends = [];

      for (const query of searchQueries) {
        try {
          const searchResults = await this.performSearch(query);
          const trend = this.parseTrendResults(searchResults, query.topic);
          if (trend) {
            trends.push(trend);
          }
        } catch (searchError) {
          logger.warn(`Search failed for query: ${query.q}`, searchError);
        }
      }

      return trends.slice(0, 5); // Return top 5 trends
    } catch (error) {
      logger.error('Error getting market trends:', error);
      return [];
    }
  }

  // Build trend search queries
  buildTrendQueries(industry, geography, timeframe) {
    const industryKeywords = this.getIndustryKeywords(industry);
    const geographyKeywords = this.getGeographyKeywords(geography);
    const trendKeywords = ['trends', 'outlook', 'forecast', 'growth', 'market analysis'];

    const queries = [];
    
    // Combine different aspects
    industryKeywords.forEach(indKeyword => {
      trendKeywords.forEach(trendKeyword => {
        queries.push({
          topic: `${indKeyword} ${trendKeyword}`,
          q: `${indKeyword} ${trendKeyword} ${timeframe} ${geographyKeywords.join(' ')}`,
          num: 5,
        });
      });
    });

    return queries.slice(0, 10); // Limit to 10 queries
  }

  // Get industry-specific keywords
  getIndustryKeywords(industry) {
    const keywordMap = {
      'technology': ['technology', 'software', 'SaaS', 'digital transformation'],
      'fintech': ['fintech', 'financial technology', 'digital payments', 'banking technology'],
      'healthcare': ['healthcare', 'medical technology', 'digital health', 'health tech'],
      'edtech': ['edtech', 'educational technology', 'online learning', 'digital education'],
      'ecommerce': ['e-commerce', 'online retail', 'digital commerce', 'marketplace'],
      'manufacturing': ['manufacturing', 'industrial technology', 'smart manufacturing', 'Industry 4.0'],
      'agriculture': ['agriculture', 'agtech', 'farming technology', 'digital agriculture'],
      'renewable-energy': ['renewable energy', 'clean energy', 'solar power', 'wind energy'],
      'biotech': ['biotechnology', 'biotech', 'life sciences', 'biopharma'],
      'ai-ml': ['artificial intelligence', 'machine learning', 'AI', 'ML'],
      'blockchain': ['blockchain', 'distributed ledger', 'cryptocurrency', 'Web3'],
      'iot': ['Internet of Things', 'IoT', 'connected devices', 'smart devices'],
    };
    return keywordMap[industry] || [industry];
  }

  // Get geography-specific keywords
  getGeographyKeywords(geography) {
    const geographyMap = {
      'local': ['local', 'city-level'],
      'regional': ['regional', 'state-level'],
      'national': ['India', 'Indian market'],
      'international': ['global', 'worldwide', 'international market'],
    };
    return geographyMap[geography] || ['India'];
  }

  // Perform Google Search
  async performSearch(query) {
    try {
      const response = await this.customSearch.cse.list({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query.q,
        num: query.num || 5,
        sort: 'date', // Sort by date for recent results
      });

      return response.data;
    } catch (error) {
      logger.error('Google Search API error:', error);
      throw error;
    }
  }

  // Parse trend results from search
  parseTrendResults(searchResults, topic) {
    try {
      const items = searchResults.items || [];
      if (items.length === 0) {
        return null;
      }

      // Extract relevant information from search results
      const topResult = items[0];
      const snippet = topResult.snippet || '';
      const title = topResult.title || '';
      const link = topResult.link || '';

      // Determine trend direction based on keywords
      const positiveKeywords = ['growth', 'increase', 'rise', 'expansion', 'boom', 'surge'];
      const negativeKeywords = ['decline', 'decrease', 'fall', 'contraction', 'slowdown', 'crisis'];

      const text = `${title} ${snippet}`.toLowerCase();
      let trend = 'neutral';
      
      if (positiveKeywords.some(keyword => text.includes(keyword))) {
        trend = 'positive';
      } else if (negativeKeywords.some(keyword => text.includes(keyword))) {
        trend = 'negative';
      }

      return {
        topic,
        trend,
        title: title.substring(0, 100),
        description: snippet.substring(0, 200),
        source: this.extractSource(link),
        timestamp: new Date().toISOString(),
        relevanceScore: this.calculateRelevanceScore(text, topic),
      };
    } catch (error) {
      logger.error('Error parsing trend results:', error);
      return null;
    }
  }

  // Extract source name from URL
  extractSource(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return 'Unknown';
    }
  }

  // Calculate relevance score for trend
  calculateRelevanceScore(text, topic) {
    const topicWords = topic.toLowerCase().split(' ');
    const textWords = text.toLowerCase().split(' ');
    
    let matches = 0;
    topicWords.forEach(word => {
      if (textWords.includes(word)) {
        matches++;
      }
    });
    
    return Math.min(100, (matches / topicWords.length) * 100);
  }

  // Get competitors in industry
  async getCompetitors(industry, geography) {
    try {
      const competitorQueries = [
        `top ${industry} companies ${geography}`,
        `${industry} market leaders ${geography}`,
        `${industry} startups funding ${geography}`,
      ];

      const competitors = [];
      
      for (const query of competitorQueries) {
        try {
          const searchResults = await this.performSearch({ q: query, num: 5 });
          const parsedCompetitors = this.parseCompetitorResults(searchResults, industry);
          competitors.push(...parsedCompetitors);
        } catch (searchError) {
          logger.warn(`Competitor search failed for: ${query}`, searchError);
        }
      }

      // Remove duplicates and limit to top 10
      const uniqueCompetitors = competitors.filter((comp, index, self) =>
        index === self.findIndex(c => c.name === comp.name)
      ).slice(0, 10);

      return uniqueCompetitors;
    } catch (error) {
      logger.error('Error getting competitors:', error);
      return [];
    }
  }

  // Parse competitor results
  parseCompetitorResults(searchResults, industry) {
    try {
      const items = searchResults.items || [];
      
      return items.map(item => ({
        name: this.extractCompanyName(item.title),
        description: item.snippet?.substring(0, 200) || '',
        source: this.extractSource(item.link),
        marketShare: Math.random() * 20, // Placeholder - would need real data
        strengths: this.extractStrengths(item.snippet || ''),
        weaknesses: this.extractWeaknesses(item.snippet || ''),
      })).filter(comp => comp.name && comp.name !== 'Unknown');
    } catch (error) {
      logger.error('Error parsing competitor results:', error);
      return [];
    }
  }

  // Extract company name from title
  extractCompanyName(title) {
    try {
      // Simple extraction - would need more sophisticated parsing
      const words = title.split(' ');
      const company = words[0] || 'Unknown';
      
      // Clean up common words
      const cleanName = company.replace(/[^\w\s]/gi, '').trim();
      return cleanName.length > 2 ? cleanName : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  // Extract strengths from text
  extractStrengths(text) {
    const strengthKeywords = ['leader', 'innovative', 'fast-growing', 'successful', 'profitable'];
    const strengths = [];
    
    strengthKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        strengths.push(keyword);
      }
    });
    
    return strengths;
  }

  // Extract weaknesses from text
  extractWeaknesses(text) {
    const weaknessKeywords = ['challenge', 'struggle', 'decline', 'issue', 'problem'];
    const weaknesses = [];
    
    weaknessKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        weaknesses.push(keyword);
      }
    });
    
    return weaknesses;
  }

  // Get funding rounds for industry
  async getFundingRounds(industry, geography) {
    try {
      const fundingQueries = [
        `${industry} funding rounds ${geography} 2025 2026`,
        `${industry} venture capital ${geography}`,
        `${industry} startup investment ${geography}`,
      ];

      const fundingRounds = [];
      
      for (const query of fundingQueries) {
        try {
          const searchResults = await this.performSearch({ q: query, num: 5 });
          const parsedFunding = this.parseFundingResults(searchResults);
          fundingRounds.push(...parsedFunding);
        } catch (searchError) {
          logger.warn(`Funding search failed for: ${query}`, searchError);
        }
      }

      // Remove duplicates and limit to top 10
      const uniqueFunding = fundingRounds.filter((funding, index, self) =>
        index === self.findIndex(f => f.company === funding.company)
      ).slice(0, 10);

      return uniqueFunding;
    } catch (error) {
      logger.error('Error getting funding rounds:', error);
      return [];
    }
  }

  // Parse funding results
  parseFundingResults(searchResults) {
    try {
      const items = searchResults.items || [];
      
      return items.map(item => {
        const fundingData = this.extractFundingData(item.title, item.snippet || '');
        
        return {
          company: fundingData.company || this.extractCompanyName(item.title),
          amount: fundingData.amount || this.extractAmount(item.snippet || ''),
          stage: fundingData.stage || 'Unknown',
          date: fundingData.date || new Date().toISOString().split('T')[0],
          investors: fundingData.investors || [],
          source: this.extractSource(item.link),
        };
      }).filter(funding => funding.company && funding.company !== 'Unknown');
    } catch (error) {
      logger.error('Error parsing funding results:', error);
      return [];
    }
  }

  // Extract funding data from text
  extractFundingData(title, snippet) {
    const text = `${title} ${snippet}`.toLowerCase();
    
    // Extract company name
    const companyMatch = text.match(/^(\w+)\s/);
    const company = companyMatch ? companyMatch[1] : null;
    
    // Extract amount
    const amountMatch = text.match(/(\$?\d+(?:\.\d+)?\s?(million|billion|crore|lakh))/i);
    const amount = amountMatch ? amountMatch[0] : null;
    
    // Extract stage
    const stages = ['seed', 'series a', 'series b', 'series c', 'ipo', 'pre-seed'];
    const stage = stages.find(s => text.includes(s)) || 'Unknown';
    
    // Extract date
    const dateMatch = text.match(/(\d{4})/);
    const date = dateMatch ? `${dateMatch[1]}-01-01` : new Date().toISOString().split('T')[0];
    
    // Extract investors
    const investorKeywords = ['invested by', 'led by', 'backed by'];
    let investors = [];
    
    investorKeywords.forEach(keyword => {
      const match = text.match(new RegExp(`${keyword}\\s+([^,.]+)`));
      if (match) {
        investors.push(match[1].trim());
      }
    });
    
    return { company, amount, stage, date, investors };
  }

  // Extract amount from text
  extractAmount(text) {
    const amountMatch = text.match(/(\$?\d+(?:\.\d+)?\s?(million|billion|crore|lakh))/i);
    return amountMatch ? amountMatch[0] : null;
  }

  // Get market size estimation
  async getMarketSize(industry, geography) {
    try {
      const marketSizeQueries = [
        `${industry} market size ${geography} 2026`,
        `${industry} market value ${geography}`,
        `${industry} market forecast ${geography}`,
      ];

      for (const query of marketSizeQueries) {
        try {
          const searchResults = await this.performSearch({ q: query, num: 3 });
          const marketSize = this.parseMarketSizeResults(searchResults);
          if (marketSize) {
            return marketSize;
          }
        } catch (searchError) {
          logger.warn(`Market size search failed for: ${query}`, searchError);
        }
      }

      // Return default estimation if no data found
      return this.getDefaultMarketSize(industry);
    } catch (error) {
      logger.error('Error getting market size:', error);
      return this.getDefaultMarketSize(industry);
    }
  }

  // Parse market size results
  parseMarketSizeResults(searchResults) {
    try {
      const items = searchResults.items || [];
      const text = items.map(item => `${item.title} ${item.snippet}`).join(' ');
      
      // Look for market size patterns
      const sizePatterns = [
        /market size.*?(\$?\d+(?:\.\d+)?\s?(billion|million|crore))/i,
        /valued at.*?(\$?\d+(?:\.\d+)?\s?(billion|million|crore))/i,
        /worth.*?(\$?\d+(?:\.\d+)?\s?(billion|million|crore))/i,
      ];

      for (const pattern of sizePatterns) {
        const match = text.match(pattern);
        if (match) {
          return {
            estimatedValue: match[1],
            currency: 'USD',
            year: 2026,
            source: 'Market Research',
            confidence: 0.8,
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Error parsing market size results:', error);
      return null;
    }
  }

  // Get default market size estimation
  getDefaultMarketSize(industry) {
    const defaultSizes = {
      'technology': { value: '$500 billion', confidence: 0.3 },
      'fintech': { value: '$150 billion', confidence: 0.3 },
      'healthcare': { value: '$200 billion', confidence: 0.3 },
      'edtech': { value: '$50 billion', confidence: 0.3 },
      'ecommerce': { value: '$100 billion', confidence: 0.3 },
      'manufacturing': { value: '$300 billion', confidence: 0.3 },
      'agriculture': { value: '$80 billion', confidence: 0.3 },
      'renewable-energy': { value: '$120 billion', confidence: 0.3 },
      'biotech': { value: '$90 billion', confidence: 0.3 },
      'ai-ml': { value: '$200 billion', confidence: 0.3 },
      'blockchain': { value: '$30 billion', confidence: 0.3 },
      'iot': { value: '$70 billion', confidence: 0.3 },
    };

    const defaultSize = defaultSizes[industry] || { value: '$100 billion', confidence: 0.2 };
    
    return {
      estimatedValue: defaultSize.value,
      currency: 'USD',
      year: 2026,
      source: 'Default Estimation',
      confidence: defaultSize.confidence,
    };
  }

  // Get regulatory information
  async getRegulatoryInfo(industry, geography) {
    try {
      const regulatoryQueries = [
        `${industry} regulations ${geography}`,
        `${industry} compliance requirements ${geography}`,
        `${industry} legal framework ${geography}`,
      ];

      for (const query of regulatoryQueries) {
        try {
          const searchResults = await this.performSearch({ q: query, num: 3 });
          const regulatoryInfo = this.parseRegulatoryResults(searchResults);
          if (regulatoryInfo) {
            return regulatoryInfo;
          }
        } catch (searchError) {
          logger.warn(`Regulatory search failed for: ${query}`, searchError);
        }
      }

      return this.getDefaultRegulatoryInfo(industry);
    } catch (error) {
      logger.error('Error getting regulatory info:', error);
      return this.getDefaultRegulatoryInfo(industry);
    }
  }

  // Parse regulatory results
  parseRegulatoryResults(searchResults) {
    try {
      const items = searchResults.items || [];
      const text = items.map(item => `${item.title} ${item.snippet}`).join(' ');
      
      // Look for regulatory keywords
      const regulatoryKeywords = ['regulation', 'compliance', 'license', 'approval', 'certification'];
      const foundKeywords = regulatoryKeywords.filter(keyword => text.toLowerCase().includes(keyword));
      
      if (foundKeywords.length > 0) {
        return {
          requirements: foundKeywords,
          complexity: foundKeywords.length > 2 ? 'high' : foundKeywords.length > 1 ? 'medium' : 'low',
          source: 'Regulatory Search',
          lastUpdated: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error parsing regulatory results:', error);
      return null;
    }
  }

  // Get default regulatory info
  getDefaultRegulatoryInfo(industry) {
    const regulatoryComplexity = {
      'fintech': 'high',
      'healthcare': 'high',
      'biotech': 'high',
      ' edtech': 'medium',
      'technology': 'medium',
      'ecommerce': 'medium',
      'manufacturing': 'medium',
      'renewable-energy': 'medium',
      'agriculture': 'low',
      'ai-ml': 'medium',
      'blockchain': 'medium',
      'iot': 'low',
    };

    return {
      requirements: ['Basic business registration'],
      complexity: regulatoryComplexity[industry] || 'medium',
      source: 'Default Assessment',
      lastUpdated: new Date().toISOString(),
    };
  }

  // Get cached data
  async getCachedData(key) {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Error getting cached data:', error);
      return null;
    }
  }

  // Set cached data
  async setCachedData(key, data) {
    try {
      const redis = getRedisClient();
      await redis.setEx(key, 1800, JSON.stringify(data)); // 30 minutes
    } catch (error) {
      logger.error('Error setting cached data:', error);
    }
  }

  // Search for specific market information
  async searchMarketInfo(query, industry = null, geography = null) {
    try {
      const searchQuery = industry && geography 
        ? `${query} ${industry} ${geography}`
        : query;

      const searchResults = await this.performSearch({ q: searchQuery, num: 10 });
      
      return {
        query,
        results: searchResults.items?.map(item => ({
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          source: this.extractSource(item.link),
        })) || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error searching market info:', error);
      throw error;
    }
  }

  // Get industry benchmarks
  async getIndustryBenchmarks(industry) {
    try {
      const benchmarkQueries = [
        `${industry} industry benchmarks`,
        `${industry} key performance indicators`,
        `${industry} success metrics`,
      ];

      const benchmarks = [];
      
      for (const query of benchmarkQueries) {
        try {
          const searchResults = await this.performSearch({ q: query, num: 5 });
          const benchmarkData = this.parseBenchmarkResults(searchResults);
          benchmarks.push(...benchmarkData);
        } catch (searchError) {
          logger.warn(`Benchmark search failed for: ${query}`, searchError);
        }
      }

      return benchmarks.slice(0, 10);
    } catch (error) {
      logger.error('Error getting industry benchmarks:', error);
      return [];
    }
  }

  // Parse benchmark results
  parseBenchmarkResults(searchResults) {
    try {
      const items = searchResults.items || [];
      
      return items.map(item => ({
        metric: this.extractMetric(item.title),
        value: this.extractBenchmarkValue(item.snippet || ''),
        source: this.extractSource(item.link),
        industry: 'General',
      })).filter(benchmark => benchmark.metric && benchmark.value);
    } catch (error) {
      logger.error('Error parsing benchmark results:', error);
      return [];
    }
  }

  // Extract metric from title
  extractMetric(title) {
    const metricKeywords = ['growth rate', 'margin', 'roi', 'cac', 'ltv', 'churn', 'conversion'];
    const titleLower = title.toLowerCase();
    
    for (const keyword of metricKeywords) {
      if (titleLower.includes(keyword)) {
        return keyword;
      }
    }
    
    return null;
  }

  // Extract benchmark value from text
  extractBenchmarkValue(text) {
    // Look for percentage or number patterns
    const percentageMatch = text.match(/(\d+(?:\.\d+)?%)/);
    const numberMatch = text.match(/(\d+(?:\.\d+)?)/);
    
    return percentageMatch ? percentageMatch[1] : numberMatch ? numberMatch[1] : null;
  }
}

module.exports = new MarketService();
