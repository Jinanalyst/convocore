'use client';

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

export interface TokenAnalysisRequest {
  token: string;
  includeRisk?: boolean;
  includeMarketData?: boolean;
}

export interface OnChainAnalysisRequest {
  data: string | object;
  dataType: 'transactions' | 'whale_activity' | 'liquidity' | 'general';
  format?: 'json' | 'text';
}

export interface ChainScopeResponse {
  success: boolean;
  analysis: string;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
}

class ChainScopeService {
  private async callAnthropicAPI(prompt: string): Promise<{ content: string; tokensUsed: number }> {
    if (!anthropic) {
      throw new Error('Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.');
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.1, // Low temperature for factual analysis
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic API');
      }

      return {
        content: content.text,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens
      };
    } catch (error) {
      console.error('ChainScope API Error:', error);
      throw error;
    }
  }

  async analyzeToken(request: TokenAnalysisRequest): Promise<ChainScopeResponse> {
    const startTime = Date.now();

    try {
      const prompt = `You are ChainScope, a specialized cryptocurrency and blockchain analysis expert. 

Please provide a comprehensive analysis of the token: ${request.token}

Structure your response using the following format with markdown headers and bullet points:

## 📊 ${request.token} Analysis

### 🏢 Project Background
- Brief history and founding details
- Core mission and use case
- Development team and leadership
- Key partnerships and collaborations

### 💰 Tokenomics
- Total supply and circulating supply
- Token distribution breakdown
- Inflation/deflation mechanisms
- Utility and governance features
- Staking and rewards structure

### 🌐 Community & Adoption
- Community size and engagement metrics
- Social media presence and sentiment
- Developer activity and ecosystem growth
- Real-world adoption and use cases
- Institutional support and partnerships

### ⚠️ Risk Assessment
- Technical risks and smart contract audits
- Regulatory and compliance considerations
- Market volatility and liquidity risks
- Competition and market position
- Recent controversies or issues

### 📈 Recent Events & Market Activity
- Recent price movements and catalysts
- Major announcements or updates
- Trading volume and market metrics
- Notable news or developments

**Disclaimer**: This analysis is for informational purposes only and should not be considered financial advice. Always conduct your own research before making investment decisions.

Please provide accurate, objective analysis based on publicly available information. Use clear markdown formatting with bullet points for maximum readability.`;

      const response = await this.callAnthropicAPI(prompt);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysis: response.content,
        metadata: {
          model: 'claude-3-sonnet-20240229',
          tokensUsed: response.tokensUsed,
          processingTime
        }
      };
    } catch (error) {
      return {
        success: false,
        analysis: '',
        error: error instanceof Error ? error.message : 'Failed to analyze token',
        metadata: {
          model: 'claude-3-sonnet-20240229',
          tokensUsed: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  async analyzeOnChainData(request: OnChainAnalysisRequest): Promise<ChainScopeResponse> {
    const startTime = Date.now();

    try {
      const dataString = typeof request.data === 'object' 
        ? JSON.stringify(request.data, null, 2)
        : request.data;

      const prompt = `You are ChainScope, a specialized blockchain data analysis expert.

Please analyze the following on-chain data and provide a human-readable summary:

**Data Type**: ${request.dataType}
**Data Format**: ${request.format || 'auto-detected'}

**Raw Data**:
\`\`\`
${dataString}
\`\`\`

Structure your analysis using the following format with markdown headers and bullet points:

## 🔍 On-Chain Data Analysis

### 📊 Data Summary
- Data type and time period covered
- Key metrics and volume information
- Overall data quality and completeness

### 📈 Transaction Trends
- Transaction volume patterns
- Peak activity periods
- Average transaction sizes
- Notable volume spikes or drops

### 🐋 Whale Activity
- Large transaction identification
- Whale wallet movements
- Accumulation vs. distribution patterns
- Impact on market dynamics

### 💧 Liquidity Analysis
- Liquidity pool changes
- Market depth variations
- DEX vs CEX activity
- Trading pair performance

### 🚨 Suspicious Patterns
- Unusual transaction patterns
- Potential wash trading signals
- Coordinated activity detection
- Risk indicators and anomalies

### 💡 Key Insights
- Main takeaways from the data
- Market implications
- Potential trading signals
- Risk considerations

**Note**: This analysis is based on the provided data and should be verified with additional sources for trading decisions.

Please provide clear, objective analysis with specific data points and percentages where relevant. Use markdown formatting for optimal readability.`;

      const response = await this.callAnthropicAPI(prompt);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysis: response.content,
        metadata: {
          model: 'claude-3-sonnet-20240229',
          tokensUsed: response.tokensUsed,
          processingTime
        }
      };
    } catch (error) {
      return {
        success: false,
        analysis: '',
        error: error instanceof Error ? error.message : 'Failed to analyze on-chain data',
        metadata: {
          model: 'claude-3-sonnet-20240229',
          tokensUsed: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  async processChainScopeMessage(message: string): Promise<ChainScopeResponse> {
    const lowerMessage = message.toLowerCase();

    // Check for token analysis request
    const analyzeMatch = lowerMessage.match(/@chainscope\s+analyze\s+\$([a-zA-Z0-9]+)/i);
    if (analyzeMatch) {
      const token = analyzeMatch[1].toUpperCase();
      return this.analyzeToken({ token });
    }

    // Check for on-chain data analysis request
    const onchainMatch = lowerMessage.match(/@chainscope\s+onchain/i);
    if (onchainMatch) {
      // Extract data after "onchain" keyword
      const dataMatch = message.match(/@chainscope\s+onchain\s+([\s\S]+)/i);
      if (dataMatch) {
        const rawData = dataMatch[1].trim();
        
        // Try to detect if it's JSON
        let dataType: OnChainAnalysisRequest['dataType'] = 'general';
        let parsedData: string | object = rawData;
        
        try {
          parsedData = JSON.parse(rawData);
          // Try to detect data type from JSON structure
          if (typeof parsedData === 'object' && parsedData !== null) {
            const keys = Object.keys(parsedData as object);
            if (keys.some(k => k.toLowerCase().includes('transaction'))) {
              dataType = 'transactions';
            } else if (keys.some(k => k.toLowerCase().includes('whale') || k.toLowerCase().includes('large'))) {
              dataType = 'whale_activity';
            } else if (keys.some(k => k.toLowerCase().includes('liquidity') || k.toLowerCase().includes('pool'))) {
              dataType = 'liquidity';
            }
          }
        } catch {
          // Not JSON, keep as text
          if (rawData.toLowerCase().includes('transaction')) {
            dataType = 'transactions';
          } else if (rawData.toLowerCase().includes('whale') || rawData.toLowerCase().includes('large')) {
            dataType = 'whale_activity';
          } else if (rawData.toLowerCase().includes('liquidity') || rawData.toLowerCase().includes('pool')) {
            dataType = 'liquidity';
          }
        }

        return this.analyzeOnChainData({
          data: parsedData,
          dataType,
          format: typeof parsedData === 'object' ? 'json' : 'text'
        });
      } else {
        return {
          success: false,
          analysis: '',
          error: 'Please provide on-chain data to analyze. Usage: @chainscope onchain [your data]'
        };
      }
    }

    // If no specific pattern matched, provide usage instructions
    return {
      success: true,
      analysis: `## 🔗 ChainScope - Crypto Analysis Assistant

Welcome to ChainScope! I can help you analyze cryptocurrency tokens and on-chain blockchain data.

### 📋 Available Commands:

**Token Analysis:**
\`@chainscope analyze $TOKEN\` - Get comprehensive analysis of any cryptocurrency token

Examples:
- \`@chainscope analyze $ETH\` - Analyze Ethereum
- \`@chainscope analyze $BTC\` - Analyze Bitcoin  
- \`@chainscope analyze $USDC\` - Analyze USD Coin

**On-Chain Data Analysis:**
\`@chainscope onchain [data]\` - Analyze raw blockchain data

Examples:
- \`@chainscope onchain {"transactions": [...], "volume": "1000 ETH"}\`
- \`@chainscope onchain Large whale moved 5000 BTC to unknown wallet\`

### 🎯 What I Analyze:
- **Tokens**: Project background, tokenomics, community sentiment, risks
- **On-Chain**: Transaction trends, whale activity, liquidity changes, suspicious patterns

### 💡 Tips:
- Use proper token symbols (e.g., $ETH, $BTC, $USDC)
- Provide clear, structured data for on-chain analysis
- All analysis is for informational purposes only

Ready to analyze some crypto data? Just use one of the commands above!`,
      metadata: {
        model: 'claude-3-sonnet-20240229',
        tokensUsed: 0,
        processingTime: 0
      }
    };
  }
}

export const chainScopeService = new ChainScopeService(); 