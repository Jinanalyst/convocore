# 🔗 ChainScope - Crypto Analysis Agent

ChainScope is a specialized AI agent powered by Anthropic Claude 3 Sonnet for comprehensive cryptocurrency and blockchain analysis.

## 🎯 Features

### Token Analysis
- **Project Background**: History, mission, team, partnerships
- **Tokenomics**: Supply, distribution, utility, staking
- **Community & Adoption**: Social metrics, ecosystem growth
- **Risk Assessment**: Technical, regulatory, market risks
- **Recent Events**: Price movements, announcements, developments

### On-Chain Data Analysis
- **Transaction Trends**: Volume patterns, peak periods
- **Whale Activity**: Large holder movements, accumulation patterns
- **Liquidity Analysis**: Pool changes, market depth, DEX/CEX activity
- **Suspicious Patterns**: Wash trading, coordinated activity, anomalies

## 📋 Usage Commands

### Token Analysis
```
@chainscope analyze $TOKEN
```

**Examples:**
- `@chainscope analyze $ETH` - Comprehensive Ethereum analysis
- `@chainscope analyze $BTC` - Bitcoin fundamentals and metrics
- `@chainscope analyze $USDC` - USD Coin stablecoin analysis
- `@chainscope analyze $SOL` - Solana ecosystem analysis
- `@chainscope analyze $AVAX` - Avalanche platform analysis

### On-Chain Data Analysis
```
@chainscope onchain [your data]
```

**Examples:**

**JSON Data:**
```
@chainscope onchain {
  "transactions": [
    {"amount": "5000 ETH", "from": "whale_wallet", "to": "exchange"},
    {"amount": "2500 ETH", "from": "exchange", "to": "unknown_wallet"}
  ],
  "volume_24h": "50000 ETH",
  "large_transfers": 12
}
```

**Text Data:**
```
@chainscope onchain Large whale moved 10,000 BTC to Binance exchange. Trading volume increased 300% in last 4 hours. Unusual activity detected in multiple wallets.
```

**Transaction Data:**
```
@chainscope onchain Liquidity pool USDC/ETH on Uniswap decreased by 15% in 2 hours. Multiple large withdrawals detected. Pool depth now $50M down from $59M.
```

## 🎯 Output Format

ChainScope responses are formatted in structured markdown with:

- **📊 Clear section headers** for easy navigation
- **🔍 Bullet points** for detailed information
- **⚠️ Risk assessments** with specific warnings
- **💡 Key insights** and actionable takeaways
- **📈 Market implications** and trading considerations
- **🚨 Disclaimer notices** for investment decisions

## ⚙️ Configuration

ChainScope requires the Anthropic API key to be configured:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Add this to your `.env.local` file for the service to function properly.

## 🔧 Technical Details

- **Model**: Claude 3 Sonnet (`claude-3-sonnet-20240229`)
- **Temperature**: 0.1 (low for factual accuracy)
- **Max Tokens**: 4000
- **Response Time**: Typically 2-5 seconds
- **Usage Tracking**: Integrated with Convocore usage limits

## 📊 Use Cases

### 1. Investment Research
- Research tokens before investment decisions
- Understand project fundamentals and risks
- Analyze community sentiment and adoption

### 2. Risk Assessment
- Identify potential red flags in projects
- Understand regulatory and technical risks
- Evaluate market position and competition

### 3. Market Analysis
- Analyze recent price movements and catalysts
- Understand trading volume and liquidity
- Track institutional adoption and partnerships

### 4. On-Chain Monitoring
- Interpret complex blockchain transaction data
- Monitor whale activity and large transfers
- Detect suspicious trading patterns
- Analyze liquidity pool changes

### 5. Due Diligence
- Comprehensive project evaluation
- Tokenomics structure analysis
- Smart contract risk assessment
- Community and developer activity review

## ⚠️ Important Disclaimers

- **Not Financial Advice**: All analysis is for informational purposes only
- **DYOR**: Always conduct your own research before investment decisions
- **Market Volatility**: Crypto markets are highly volatile and risky
- **Data Accuracy**: Analysis based on publicly available information
- **Time Sensitivity**: Market conditions change rapidly

## 🚀 Getting Started

1. **Ensure API Access**: Make sure `ANTHROPIC_API_KEY` is configured
2. **Start Simple**: Try `@chainscope analyze $ETH` for a basic analysis
3. **Explore Features**: Test both token analysis and on-chain data features
4. **Review Output**: Read through the structured analysis sections
5. **Verify Information**: Cross-check important details with other sources

## 💡 Tips for Best Results

1. **Use Standard Symbols**: Use proper token symbols (e.g., $ETH, $BTC)
2. **Provide Clear Data**: For on-chain analysis, structure your data clearly
3. **Specify Context**: Include relevant timeframes and metrics
4. **Multiple Queries**: Break down complex analysis into specific requests
5. **Combine Sources**: Use ChainScope analysis alongside other research tools

---

**Ready to analyze the crypto markets?** Start with `@chainscope analyze $BTC` to see ChainScope in action! 