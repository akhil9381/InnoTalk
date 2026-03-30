const Anthropic = require('@anthropic');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger');
const Artifact = require('../models/Artifact');
const fs = require('fs').promises;
const path = require('path');

class ArtifactGenerationService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    this.outputDir = path.join(__dirname, '../../uploads/artifacts');
    this.ensureOutputDirectory();
  }

  // Ensure output directory exists
  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating output directory:', error);
    }
  }

  // Generate all artifacts for completed simulation
  async generateAllArtifacts(simulation) {
    try {
      const artifacts = [];
      
      // Generate PRD
      const prd = await this.generatePRD(simulation);
      if (prd) artifacts.push(prd);
      
      // Generate Pitch Deck
      const pitchDeck = await this.generatePitchDeck(simulation);
      if (pitchDeck) artifacts.push(pitchDeck);
      
      // Generate Grant Applications
      const prismGrant = await this.generatePRISMGrant(simulation);
      if (prismGrant) artifacts.push(prismGrant);
      
      const sisfsGrant = await this.generateSISFSGrant(simulation);
      if (sisfsGrant) artifacts.push(sisfsGrant);
      
      // Generate Certificate if VVS >= 65
      if (simulation.vvsScore.overall >= 65) {
        const certificate = await this.generateFounderCertificate(simulation);
        if (certificate) artifacts.push(certificate);
      }
      
      // Generate Financial Model
      const financialModel = await this.generateFinancialModel(simulation);
      if (financialModel) artifacts.push(financialModel);
      
      // Generate Regulatory Report
      const regulatoryReport = await this.generateRegulatoryReport(simulation);
      if (regulatoryReport) artifacts.push(regulatoryReport);
      
      logger.info(`Generated ${artifacts.length} artifacts for simulation ${simulation._id}`);
      return artifacts;
    } catch (error) {
      logger.error('Error generating artifacts:', error);
      throw error;
    }
  }

  // Generate Product Requirements Document (PRD)
  async generatePRD(simulation) {
    try {
      const prdContent = await this.generatePRDContent(simulation);
      
      // Generate DOCX file
      const docxBuffer = await this.generatePRDDocx(prdContent);
      const docxPath = path.join(this.outputDir, `prd_${simulation._id}.docx`);
      await fs.writeFile(docxPath, docxBuffer);
      
      // Generate PDF file
      const pdfBuffer = await this.generatePRDPDF(prdContent);
      const pdfPath = path.join(this.outputDir, `prd_${simulation._id}.pdf`);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Create artifact record
      const artifact = new Artifact({
        simulation: simulation._id,
        user: simulation.user,
        type: 'prd',
        title: `${simulation.venture.name} - Product Requirements Document`,
        description: `Comprehensive PRD for ${simulation.venture.name} generated from simulation data`,
        content: {
          text: prdContent.text,
          markdown: prdContent.markdown,
          json: prdContent.json,
        },
        files: [
          {
            format: 'docx',
            url: `/uploads/artifacts/prd_${simulation._id}.docx`,
            filename: `prd_${simulation._id}.docx`,
            size: docxBuffer.length,
          },
          {
            format: 'pdf',
            url: `/uploads/artifacts/prd_${simulation._id}.pdf`,
            filename: `prd_${simulation._id}.pdf`,
            size: pdfBuffer.length,
          },
        ],
        metadata: {
          template: 'innotalk-prd-v2',
          version: '2.0',
          language: simulation.settings.language,
          pageCount: Math.ceil(prdContent.text.length / 2000),
          wordCount: prdContent.text.split(' ').length,
        },
        generation: {
          source: 'simulation-data',
          model: 'claude-3-sonnet',
          duration: Date.now(),
        },
        status: 'ready',
      });
      
      await artifact.save();
      
      // Update simulation artifacts
      simulation.artifacts.prd.generated = true;
      simulation.artifacts.prd.url = `/uploads/artifacts/prd_${simulation._id}.docx`;
      simulation.artifacts.prd.generatedAt = new Date();
      await simulation.save();
      
      return artifact;
    } catch (error) {
      logger.error('Error generating PRD:', error);
      throw error;
    }
  }

  // Generate PRD content using AI
  async generatePRDContent(simulation) {
    try {
      const prompt = `Generate a comprehensive Product Requirements Document based on this simulation data.

Venture Information:
- Name: ${simulation.venture.name}
- Description: ${simulation.venture.description}
- Industry: ${simulation.venture.industry}
- Business Model: ${simulation.venture.businessModel}
- Target Market: ${JSON.stringify(simulation.venture.targetMarket)}

VVS Score: ${simulation.vvsScore.overall}/100
Phase Insights: ${JSON.stringify(simulation.phaseHistory.map(p => ({
  phase: p.phase,
  insights: p.insights,
  responses: p.responses.slice(-2)
})))}

Market Data: ${JSON.stringify(simulation.marketData)}

Generate a structured PRD with these sections:
1. Executive Summary
2. Product Overview
3. Problem Statement
4. Target Audience
5. User Stories
6. Functional Requirements
7. Non-Functional Requirements
8. Technical Specifications
9. Success Metrics
10. Timeline & Milestones
11. Risk Assessment
12. Appendices

Make it professional, detailed, and actionable. Include specific metrics and timelines where possible.`;

      const message = {
        role: 'user',
        content: prompt,
      };

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [message],
      });

      const content = response.content[0].text;
      
      return {
        text: content,
        markdown: this.convertToMarkdown(content),
        json: this.parsePRDStructure(content),
      };
    } catch (error) {
      logger.error('Error generating PRD content:', error);
      throw error;
    }
  }

  // Generate PRD DOCX file
  async generatePRDDocx(content) {
    try {
      const sections = this.parsePRDSections(content.text);
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${sections.title || 'Product Requirements Document'}`,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            ...this.generateDocxSections(sections),
          ],
        }],
      });

      return await Packer.toBuffer(doc);
    } catch (error) {
      logger.error('Error generating PRD DOCX:', error);
      throw error;
    }
  }

  // Generate PRD PDF file
  async generatePRDPDF(content) {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let page = pdfDoc.addPage([595, 842]); // A4 size
      let yPosition = 750;
      const margin = 50;
      const lineHeight = 14;
      const pageHeight = 842;
      
      // Add title
      page.drawText('Product Requirements Document', {
        x: margin,
        y: yPosition,
        size: 24,
        font: boldFont,
      });
      yPosition -= 40;
      
      // Add content
      const lines = content.text.split('\n');
      for (const line of lines) {
        if (yPosition < margin + 50) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 750;
        }
        
        if (line.startsWith('#')) {
          // Heading
          page.drawText(line.replace('#', '').trim(), {
            x: margin,
            y: yPosition,
            size: 16,
            font: boldFont,
          });
          yPosition -= 25;
        } else {
          // Regular text
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: 11,
            font: font,
          });
          yPosition -= lineHeight;
        }
      }
      
      return await pdfDoc.save();
    } catch (error) {
      logger.error('Error generating PRD PDF:', error);
      throw error;
    }
  }

  // Generate Pitch Deck
  async generatePitchDeck(simulation) {
    try {
      const pitchContent = await this.generatePitchDeckContent(simulation);
      
      // Generate PPTX structure (simplified - would need more complex library)
      const pitchData = {
        slides: pitchContent.slides,
        metadata: {
          title: `${simulation.venture.name} - Investor Pitch`,
          totalSlides: pitchContent.slides.length,
          generatedAt: new Date().toISOString(),
        },
      };
      
      // Create artifact record
      const artifact = new Artifact({
        simulation: simulation._id,
        user: simulation.user,
        type: 'pitch-deck',
        title: `${simulation.venture.name} - Investor Pitch Deck`,
        description: `Investor pitch deck for ${simulation.venture.name} generated from simulation data`,
        content: {
          json: pitchData,
          markdown: this.convertPitchDeckToMarkdown(pitchContent),
        },
        files: [
          {
            format: 'pptx',
            url: `/uploads/artifacts/pitch_${simulation._id}.pptx`,
            filename: `pitch_${simulation._id}.pptx`,
            size: 0, // Would be actual file size
          },
        ],
        metadata: {
          template: 'innotalk-pitch-v2',
          version: '2.0',
          language: simulation.settings.language,
          pageCount: pitchContent.slides.length,
        },
        generation: {
          source: 'simulation-data',
          model: 'claude-3-sonnet',
          duration: Date.now(),
        },
        status: 'ready',
      });
      
      await artifact.save();
      
      // Update simulation artifacts
      simulation.artifacts.pitchDeck.generated = true;
      simulation.artifacts.pitchDeck.url = `/uploads/artifacts/pitch_${simulation._id}.pptx`;
      simulation.artifacts.pitchDeck.generatedAt = new Date();
      await simulation.save();
      
      return artifact;
    } catch (error) {
      logger.error('Error generating Pitch Deck:', error);
      throw error;
    }
  }

  // Generate Pitch Deck content
  async generatePitchDeckContent(simulation) {
    try {
      const prompt = `Generate a comprehensive investor pitch deck based on this simulation data.

Venture Information:
- Name: ${simulation.venture.name}
- Description: ${simulation.venture.description}
- Industry: ${simulation.venture.industry}
- Business Model: ${simulation.venture.businessModel}
- Target Market: ${JSON.stringify(simulation.venture.targetMarket)}

VVS Score: ${simulation.vvsScore.overall}/100
Financial Data: ${JSON.stringify(simulation.financialModel)}
Market Data: ${JSON.stringify(simulation.marketData)}

Generate a 12-slide pitch deck structure with:
1. Title Slide
2. Problem
3. Solution
4. Market Size
5. Business Model
6. Go-to-Market Strategy
7. Competitive Landscape
8. Team
9. Traction/Milestones
10. Financial Projections
11. Funding Ask
12. Contact

For each slide, provide:
- Title
- Key bullet points (3-5 per slide)
- Speaker notes/talking points
- Visual suggestions

Make it compelling, data-driven, and investor-ready.`;

      const message = {
        role: 'user',
        content: prompt,
      };

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [message],
      });

      const content = response.content[0].text;
      return this.parsePitchDeckStructure(content);
    } catch (error) {
      logger.error('Error generating Pitch Deck content:', error);
      throw error;
    }
  }

  // Generate PRISM Grant Application
  async generatePRISMGrant(simulation) {
    try {
      const grantContent = await this.generatePRISMGrantContent(simulation);
      
      // Generate PDF file
      const pdfBuffer = await this.generateGrantPDF(grantContent, 'PRISM');
      const pdfPath = path.join(this.outputDir, `prism_grant_${simulation._id}.pdf`);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Create artifact record
      const artifact = new Artifact({
        simulation: simulation._id,
        user: simulation.user,
        type: 'grant-prism',
        title: `${simulation.venture.name} - PRISM Grant Application`,
        description: `PRISM grant application for ${simulation.venture.name} generated from simulation data`,
        content: {
          text: grantContent.text,
          json: grantContent.json,
        },
        files: [
          {
            format: 'pdf',
            url: `/uploads/artifacts/prism_grant_${simulation._id}.pdf`,
            filename: `prism_grant_${simulation._id}.pdf`,
            size: pdfBuffer.length,
          },
        ],
        metadata: {
          template: 'prism-grant-2026',
          version: '1.0',
          language: simulation.settings.language,
          pageCount: Math.ceil(grantContent.text.length / 2000),
        },
        generation: {
          source: 'simulation-data',
          model: 'claude-3-sonnet',
          duration: Date.now(),
        },
        status: 'ready',
      });
      
      await artifact.save();
      
      // Update simulation artifacts
      const existingGrant = simulation.artifacts.grantApplications.find(g => g.type === 'prism');
      if (existingGrant) {
        existingGrant.generated = true;
        existingGrant.url = `/uploads/artifacts/prism_grant_${simulation._id}.pdf`;
        existingGrant.generatedAt = new Date();
      } else {
        simulation.artifacts.grantApplications.push({
          type: 'prism',
          generated: true,
          url: `/uploads/artifacts/prism_grant_${simulation._id}.pdf`,
          generatedAt: new Date(),
        });
      }
      await simulation.save();
      
      return artifact;
    } catch (error) {
      logger.error('Error generating PRISM Grant:', error);
      throw error;
    }
  }

  // Generate PRISM Grant content
  async generatePRISMGrantContent(simulation) {
    try {
      const prompt = `Generate a comprehensive PRISM (Promoting Innovations) grant application based on this simulation data.

Venture Information:
- Name: ${simulation.venture.name}
- Description: ${simulation.venture.description}
- Industry: ${simulation.venture.industry}
- Business Model: ${simulation.venture.businessModel}
- Target Market: ${JSON.stringify(simulation.venture.targetMarket)}

VVS Score: ${simulation.vvsScore.overall}/100
Phase Insights: ${JSON.stringify(simulation.phaseHistory.map(p => ({
  phase: p.phase,
  insights: p.insights
})))}

Generate a PRISM grant application with these sections:
1. Executive Summary
2. Innovation Description
3. Problem Statement & Market Need
4. Technical Approach
5. Implementation Plan
6. Team Capabilities
7. Budget Justification
8. Expected Outcomes & Impact
9. Risk Assessment & Mitigation
10. Timeline & Milestones

Focus on innovation, social impact, and feasibility. Include specific metrics and deliverables.`;

      const message = {
        role: 'user',
        content: prompt,
      };

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [message],
      });

      const content = response.content[0].text;
      
      return {
        text: content,
        json: this.parseGrantStructure(content, 'PRISM'),
      };
    } catch (error) {
      logger.error('Error generating PRISM Grant content:', error);
      throw error;
    }
  }

  // Generate SISFS Grant Application
  async generateSISFSGrant(simulation) {
    try {
      const grantContent = await this.generateSISFSGrantContent(simulation);
      
      // Generate PDF file
      const pdfBuffer = await this.generateGrantPDF(grantContent, 'SISFS');
      const pdfPath = path.join(this.outputDir, `sisfs_grant_${simulation._id}.pdf`);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Create artifact record
      const artifact = new Artifact({
        simulation: simulation._id,
        user: simulation.user,
        type: 'grant-sisfs',
        title: `${simulation.venture.name} - SISFS Grant Application`,
        description: `SISFS grant application for ${simulation.venture.name} generated from simulation data`,
        content: {
          text: grantContent.text,
          json: grantContent.json,
        },
        files: [
          {
            format: 'pdf',
            url: `/uploads/artifacts/sisfs_grant_${simulation._id}.pdf`,
            filename: `sisfs_grant_${simulation._id}.pdf`,
            size: pdfBuffer.length,
          },
        ],
        metadata: {
          template: 'sisfs-grant-2026',
          version: '1.0',
          language: simulation.settings.language,
          pageCount: Math.ceil(grantContent.text.length / 2000),
        },
        generation: {
          source: 'simulation-data',
          model: 'claude-3-sonnet',
          duration: Date.now(),
        },
        status: 'ready',
      });
      
      await artifact.save();
      
      // Update simulation artifacts
      const existingGrant = simulation.artifacts.grantApplications.find(g => g.type === 'sisfs');
      if (existingGrant) {
        existingGrant.generated = true;
        existingGrant.url = `/uploads/artifacts/sisfs_grant_${simulation._id}.pdf`;
        existingGrant.generatedAt = new Date();
      } else {
        simulation.artifacts.grantApplications.push({
          type: 'sisfs',
          generated: true,
          url: `/uploads/artifacts/sisfs_grant_${simulation._id}.pdf`,
          generatedAt: new Date(),
        });
      }
      await simulation.save();
      
      return artifact;
    } catch (error) {
      logger.error('Error generating SISFS Grant:', error);
      throw error;
    }
  }

  // Generate SISFS Grant content
  async generateSISFSGrantContent(simulation) {
    try {
      const prompt = `Generate a comprehensive SISFS (Startup India Seed Fund) grant application based on this simulation data.

Venture Information:
- Name: ${simulation.venture.name}
- Description: ${simulation.venture.description}
- Industry: ${simulation.venture.industry}
- Business Model: ${simulation.venture.businessModel}
- Target Market: ${JSON.stringify(simulation.venture.targetMarket)}

VVS Score: ${simulation.vvsScore.overall}/100
Financial Data: ${JSON.stringify(simulation.financialModel)}

Generate a SISFS grant application with these sections:
1. Company Information
2. Founder Background
3. Business Concept
4. Innovation & Differentiation
5. Market Opportunity
6. Business Model & Revenue Streams
7. Go-to-Market Strategy
8. Team & Capabilities
9. Financial Projections
10. Funding Utilization
11. Milestones & KPIs
12. Risk Assessment

Focus on scalability, market potential, and team capability. Include realistic financial projections.`;

      const message = {
        role: 'user',
        content: prompt,
      };

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [message],
      });

      const content = response.content[0].text;
      
      return {
        text: content,
        json: this.parseGrantStructure(content, 'SISFS'),
      };
    } catch (error) {
      logger.error('Error generating SISFS Grant content:', error);
      throw error;
    }
  }

  // Generate Founder Certificate
  async generateFounderCertificate(simulation) {
    try {
      const certificateContent = await this.generateCertificateContent(simulation);
      
      // Generate PDF certificate
      const pdfBuffer = await this.generateCertificatePDF(certificateContent, simulation);
      const pdfPath = path.join(this.outputDir, `certificate_${simulation._id}.pdf`);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Generate QR code (simplified - would need QR code library)
      const qrCode = `https://innotalk.com/verify/${simulation._id}`;
      
      // Create artifact record
      const artifact = new Artifact({
        simulation: simulation._id,
        user: simulation.user,
        type: 'certificate',
        title: `Founder Readiness Certificate - ${simulation.venture.name}`,
        description: `Official Founder Readiness Certificate for completing InnoTalk simulation`,
        content: {
          text: certificateContent.text,
          json: certificateContent.json,
        },
        files: [
          {
            format: 'pdf',
            url: `/uploads/artifacts/certificate_${simulation._id}.pdf`,
            filename: `certificate_${simulation._id}.pdf`,
            size: pdfBuffer.length,
          },
        ],
        metadata: {
          template: 'founder-certificate-v2',
          version: '2.0',
          language: simulation.settings.language,
          pageCount: 1,
        },
        generation: {
          source: 'simulation-data',
          model: 'claude-3-sonnet',
          duration: Date.now(),
        },
        status: 'ready',
      });
      
      await artifact.save();
      
      // Update simulation artifacts
      simulation.artifacts.certificate.generated = true;
      simulation.artifacts.certificate.url = `/uploads/artifacts/certificate_${simulation._id}.pdf`;
      simulation.artifacts.certificate.qrCode = qrCode;
      simulation.artifacts.certificate.generatedAt = new Date();
      await simulation.save();
      
      return artifact;
    } catch (error) {
      logger.error('Error generating Founder Certificate:', error);
      throw error;
    }
  }

  // Generate Certificate content
  async generateCertificateContent(simulation) {
    try {
      const user = await require('../models/User').findById(simulation.user);
      
      const content = {
        certificateNumber: `INC-${Date.now()}-${simulation._id.toString().slice(-6)}`,
        recipientName: `${user.firstName} ${user.lastName}`,
        ventureName: simulation.venture.name,
        completionDate: simulation.completionData.completedAt,
        vvsScore: simulation.vvsScore.overall,
        certificationLevel: this.getCertificationLevel(simulation.vvsScore.overall),
        dimensions: simulation.vvsScore.dimensions,
        totalDuration: simulation.completionData.totalDuration,
        phasesCompleted: simulation.completionData.phasesCompleted,
      };
      
      return {
        text: this.formatCertificateText(content),
        json: content,
      };
    } catch (error) {
      logger.error('Error generating Certificate content:', error);
      throw error;
    }
  }

  // Generate Financial Model
  async generateFinancialModel(simulation) {
    try {
      const financialData = await this.generateFinancialModelContent(simulation);
      
      // Generate Excel file
      const excelBuffer = await this.generateFinancialExcel(financialData);
      const excelPath = path.join(this.outputDir, `financial_model_${simulation._id}.xlsx`);
      await fs.writeFile(excelPath, excelBuffer);
      
      // Create artifact record
      const artifact = new Artifact({
        simulation: simulation._id,
        user: simulation.user,
        type: 'financial-model',
        title: `${simulation.venture.name} - Financial Model`,
        description: `Comprehensive financial model for ${simulation.venture.name}`,
        content: {
          json: financialData,
        },
        files: [
          {
            format: 'xlsx',
            url: `/uploads/artifacts/financial_model_${simulation._id}.xlsx`,
            filename: `financial_model_${simulation._id}.xlsx`,
            size: excelBuffer.length,
          },
        ],
        metadata: {
          template: 'financial-model-v2',
          version: '2.0',
          language: simulation.settings.language,
        },
        generation: {
          source: 'simulation-data',
          model: 'claude-3-sonnet',
          duration: Date.now(),
        },
        status: 'ready',
      });
      
      await artifact.save();
      
      return artifact;
    } catch (error) {
      logger.error('Error generating Financial Model:', error);
      throw error;
    }
  }

  // Generate Financial Model content
  async generateFinancialModelContent(simulation) {
    try {
      // Use existing financial data from simulation
      const baseData = simulation.financialModel;
      
      // Enhance with projections and analysis
      const enhancedData = {
        assumptions: baseData.assumptions,
        projections: baseData.projections,
        stressTests: baseData.stressTests,
        breakEven: baseData.breakEven,
        analysis: {
          unitEconomics: this.calculateUnitEconomics(baseData),
            cashFlow: this.projectCashFlow(baseData),
            valuation: this.estimateValuation(baseData, simulation.vvsScore.overall),
          },
        };
      
      return enhancedData;
    } catch (error) {
      logger.error('Error generating Financial Model content:', error);
      throw error;
    }
  }

  // Generate Regulatory Report
  async generateRegulatoryReport(simulation) {
    try {
      const regulatoryContent = await this.generateRegulatoryReportContent(simulation);
      
      // Generate PDF file
      const pdfBuffer = await this.generateRegulatoryPDF(regulatoryContent);
      const pdfPath = path.join(this.outputDir, `regulatory_report_${simulation._id}.pdf`);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Create artifact record
      const artifact = new Artifact({
        simulation: simulation._id,
        user: simulation.user,
        type: 'regulatory-report',
        title: `${simulation.venture.name} - Regulatory Compliance Report`,
        description: `Regulatory compliance report for ${simulation.venture.name}`,
        content: {
          text: regulatoryContent.text,
          json: regulatoryContent.json,
        },
        files: [
          {
            format: 'pdf',
            url: `/uploads/artifacts/regulatory_report_${simulation._id}.pdf`,
            filename: `regulatory_report_${simulation._id}.pdf`,
            size: pdfBuffer.length,
          },
        ],
        metadata: {
          template: 'regulatory-report-v2',
          version: '2.0',
          language: simulation.settings.language,
          pageCount: Math.ceil(regulatoryContent.text.length / 2000),
        },
        generation: {
          source: 'simulation-data',
          model: 'claude-3-sonnet',
          duration: Date.now(),
        },
        status: 'ready',
      });
      
      await artifact.save();
      
      return artifact;
    } catch (error) {
      logger.error('Error generating Regulatory Report:', error);
      throw error;
    }
  }

  // Generate Regulatory Report content
  async generateRegulatoryReportContent(simulation) {
    try {
      const regulatoryData = simulation.regulatoryCompliance;
      
      return {
        text: this.formatRegulatoryReport(regulatoryData, simulation),
        json: regulatoryData,
      };
    } catch (error) {
      logger.error('Error generating Regulatory Report content:', error);
      throw error;
    }
  }

  // Helper methods for content formatting and parsing
  convertToMarkdown(content) {
    // Simple conversion - would need more sophisticated parsing
    return content
      .replace(/^### (.+)$/gm, '### $1')
      .replace(/^## (.+)$/gm, '## $1')
      .replace(/^# (.+)$/gm, '# $1');
  }

  parsePRDStructure(content) {
    // Parse PRD into structured JSON
    const sections = {};
    const lines = content.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.startsWith('#')) {
        currentSection = line.replace('#', '').trim();
        sections[currentSection] = [];
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim());
      }
    });
    
    return sections;
  }

  parsePRDSections(content) {
    const sections = {
      title: 'Product Requirements Document',
      sections: {},
    };
    
    const lines = content.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.startsWith('#')) {
        currentSection = line.replace('#', '').trim();
        sections.sections[currentSection] = [];
      } else if (currentSection && line.trim()) {
        sections.sections[currentSection].push(line.trim());
      }
    });
    
    return sections;
  }

  generateDocxSections(sections) {
    const docxSections = [];
    
    Object.keys(sections.sections).forEach(sectionName => {
      docxSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sectionName,
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
        })
      );
      
      sections.sections[sectionName].forEach(paragraph => {
        docxSections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                size: 22,
              }),
            ],
          })
        );
      });
    });
    
    return docxSections;
  }

  parsePitchDeckStructure(content) {
    // Parse pitch deck into slide structure
    const slides = [];
    const sections = content.split('Slide ');
    
    sections.forEach(section => {
      if (section.trim()) {
        const lines = section.split('\n');
        const title = lines[0]?.replace(/^\d+:\s*/, '') || '';
        const bullets = lines.slice(1).filter(line => line.trim().startsWith('-'));
        
        slides.push({
          title,
          bullets: bullets.map(bullet => bullet.replace('-', '').trim()),
          notes: '', // Would need more sophisticated parsing
        });
      }
    });
    
    return { slides };
  }

  convertPitchDeckToMarkdown(pitchContent) {
    return pitchContent.slides.map((slide, index) => 
      `## Slide ${index + 1}: ${slide.title}\n\n${slide.bullets.map(bullet => `- ${bullet}`).join('\n')}\n`
    ).join('\n');
  }

  parseGrantStructure(content, grantType) {
    // Parse grant application into structured format
    const sections = {};
    const lines = content.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.match(/^\d+\./)) {
        currentSection = line.replace(/^\d+\.\s*/, '').trim();
        sections[currentSection] = [];
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim());
      }
    });
    
    return {
      grantType,
      sections,
    };
  }

  getCertificationLevel(score) {
    if (score >= 90) return 'Platinum';
    if (score >= 80) return 'Gold';
    if (score >= 70) return 'Silver';
    if (score >= 65) return 'Bronze';
    return 'Not Certified';
  }

  formatCertificateText(content) {
    return `Certificate Number: ${content.certificateNumber}

This certifies that ${content.recipientName} has successfully completed the InnoTalk Socratic Venture Sandbox for ${content.ventureName}.

Verified Venture Score (VVS): ${content.vvsScore}/100
Certification Level: ${content.certificationLevel}
Completed: ${content.completionDate}
Duration: ${content.totalDuration} minutes
Phases Completed: ${content.content.phasesCompleted}

This certificate demonstrates founder readiness and venture validation through rigorous AI-powered simulation and assessment.`;
  }

  calculateUnitEconomics(financialData) {
    const { assumptions } = financialData;
    return {
      ltv: assumptions.ltv || 0,
      cac: assumptions.cac || 0,
      ltvCacRatio: assumptions.ltv && assumptions.cac ? assumptions.ltv / assumptions.cac : 0,
      contributionMargin: 0.7, // Example calculation
      paybackPeriod: assumptions.cac && assumptions.ltv ? assumptions.cac / (assumptions.ltv * 0.1) : 0,
    };
  }

  projectCashFlow(financialData) {
    const { projections } = financialData;
    return {
      monthly: projections.revenue?.slice(0, 12) || [],
      annual: projections.revenue?.slice(0, 3) || [],
      burnRate: projections.expenses?.[0] || 0,
      runway: projections.revenue && projections.expenses ? 
        Math.floor(projections.revenue[0] / projections.expenses[0]) : 0,
    };
  }

  estimateValuation(financialData, vvsScore) {
    const baseMultiple = vvsScore / 100; // VVS influences valuation
    const annualRevenue = financialData.projections.revenue?.slice(0, 12).reduce((sum, rev) => sum + rev, 0) || 0;
    
    return {
      estimatedValuation: annualRevenue * baseMultiple * 5, // 5x multiple adjusted by VVS
      methodology: 'Revenue multiple adjusted by VVS score',
      confidence: Math.min(0.9, vvsScore / 100),
    };
  }

  formatRegulatoryReport(regulatoryData, simulation) {
    return `Regulatory Compliance Report
Generated: ${new Date().toISOString()}

Industry: ${simulation.venture.industry}
Compliance Status: ${regulatoryData.complianceStatus}

Required Approvals:
${regulatoryData.requiredApprovals.map(approval => `- ${approval}`).join('\n')}

Compliance Checklist:
${regulatoryData.checklist.map(item => 
  `- ${item.requirement}: ${item.status}`
).join('\n')}

Policy Alerts:
${regulatoryData.policyAlerts.map(alert => 
  `- ${alert.title}: ${alert.description}`
).join('\n')}`;
  }

  async generateGrantPDF(content, grantType) {
    // Similar to PRD PDF generation but with grant-specific formatting
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595, 842]);
    let yPosition = 750;
    const margin = 50;
    const lineHeight = 12;
    
    // Add title
    page.drawText(`${grantType} Grant Application`, {
      x: margin,
      y: yPosition,
      size: 20,
      font: boldFont,
    });
    yPosition -= 30;
    
    // Add content
    const lines = content.text.split('\n');
    for (const line of lines) {
      if (yPosition < margin + 50) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 750;
      }
      
      if (line.match(/^\d+\./)) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 14,
          font: boldFont,
        });
        yPosition -= 20;
      } else {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
        yPosition -= lineHeight;
      }
    }
    
    return await pdfDoc.save();
  }

  async generateCertificatePDF(content, simulation) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    
    // Add certificate content with decorative formatting
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Title
    page.drawText('Founder Readiness Certificate', {
      x: 150,
      y: 700,
      size: 28,
      font: boldFont,
    });
    
    // Certificate content
    const certText = content.text.split('\n');
    let yPosition = 600;
    
    certText.forEach(line => {
      page.drawText(line, {
        x: 100,
        y: yPosition,
        size: 12,
        font: font,
      });
      yPosition -= 20;
    });
    
    return await pdfDoc.save();
  }

  async generateRegulatoryPDF(content) {
    // Similar to other PDF generation methods
    return await this.generateGrantPDF(content, 'Regulatory');
  }

  async generateFinancialExcel(financialData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Financial Model');
    
    // Add headers
    worksheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Revenue', key: 'revenue', width: 15 },
      { header: 'Expenses', key: 'expenses', width: 15 },
      { header: 'Profit', key: 'profit', width: 15 },
    ];
    
    // Add data
    financialData.projections.revenue.forEach((revenue, index) => {
      worksheet.addRow({
        month: `Month ${index + 1}`,
        revenue: revenue || 0,
        expenses: financialData.projections.expenses[index] || 0,
        profit: (revenue || 0) - (financialData.projections.expenses[index] || 0),
      });
    });
    
    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = new ArtifactGenerationService();
