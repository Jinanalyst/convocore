import { PublicKey } from '@solana/web3.js';
import { getSolanaRewardService } from './solana-reward-service';

// Security Configuration
export const SECURITY_CONFIG = {
  MAX_REWARDS_PER_HOUR: 50,
  MAX_REWARDS_PER_DAY: 1000,
  SUSPICIOUS_PATTERNS: {
    MIN_TIME_BETWEEN_REWARDS: 30000, // 30 seconds
    MAX_REWARDS_PER_SESSION: 20,
    MIN_CONVERSATION_QUALITY_SCORE: 0.7,
  },
  FRAUD_DETECTION: {
    ENABLED: true,
    CHECK_WALLET_HISTORY: true,
    CHECK_CONVERSATION_PATTERNS: true,
    CHECK_IP_ADDRESSES: true,
  },
};

// Types
export interface SecurityEvent {
  id: string;
  userId: string;
  walletAddress: string;
  eventType: 'reward_request' | 'fraud_detected' | 'rate_limit_exceeded' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: number; // 0-100
  reasons: string[];
  recommendations: string[];
}

export interface UserActivityProfile {
  userId: string;
  walletAddress: string;
  totalRewards: number;
  averageRewardAmount: number;
  lastRewardTime: number;
  rewardFrequency: number; // rewards per hour
  suspiciousActivities: number;
  riskScore: number;
  isFlagged: boolean;
}

// Security Service Class
export class RewardSecurityService {
  private securityEvents: SecurityEvent[] = [];
  private userProfiles: Map<string, UserActivityProfile> = new Map();
  private blockedAddresses: Set<string> = new Set();
  private suspiciousPatterns: Map<string, any[]> = new Map();

  constructor() {
    this.loadBlockedAddresses();
  }

  // Main security check function
  async performSecurityCheck(
    userId: string,
    walletAddress: string,
    rewardAmount: number,
    conversationData: any,
    requestMetadata: { ipAddress?: string; userAgent?: string }
  ): Promise<FraudDetectionResult> {
    const result: FraudDetectionResult = {
      isFraudulent: false,
      riskScore: 0,
      reasons: [],
      recommendations: [],
    };

    try {
      // Check if wallet is blocked
      if (this.blockedAddresses.has(walletAddress)) {
        result.isFraudulent = true;
        result.riskScore = 100;
        result.reasons.push('Wallet address is blocked');
        this.logSecurityEvent(userId, walletAddress, 'fraud_detected', 'critical', {
          reason: 'Blocked wallet address',
          rewardAmount,
        }, requestMetadata);
        return result;
      }

      // Update user profile
      const profile = this.getOrCreateUserProfile(userId, walletAddress);
      
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimiting(profile, rewardAmount);
      if (!rateLimitCheck.allowed) {
        result.isFraudulent = true;
        result.riskScore = 80;
        if (rateLimitCheck.reason) {
          result.reasons.push(rateLimitCheck.reason);
        }
        this.logSecurityEvent(userId, walletAddress, 'rate_limit_exceeded', 'high', {
          reason: rateLimitCheck.reason || 'Unknown rate limit violation',
          rewardAmount,
          currentTotal: profile.totalRewards,
        }, requestMetadata);
        return result;
      }

      // Check for suspicious patterns
      const patternCheck = this.checkSuspiciousPatterns(profile, conversationData);
      if (patternCheck.suspicious) {
        result.riskScore += patternCheck.riskScore;
        result.reasons.push(...patternCheck.reasons);
        this.logSecurityEvent(userId, walletAddress, 'suspicious_activity', 'medium', {
          reasons: patternCheck.reasons,
          rewardAmount,
        }, requestMetadata);
      }

      // Check conversation quality
      const qualityCheck = this.checkConversationQuality(conversationData);
      if (qualityCheck.score < SECURITY_CONFIG.SUSPICIOUS_PATTERNS.MIN_CONVERSATION_QUALITY_SCORE) {
        result.riskScore += 20;
        result.reasons.push('Low conversation quality');
        result.recommendations.push('Improve conversation quality for better rewards');
      }

      // Check wallet history (if enabled)
      if (SECURITY_CONFIG.FRAUD_DETECTION.CHECK_WALLET_HISTORY) {
        const walletCheck = await this.checkWalletHistory(walletAddress);
        if (walletCheck.suspicious) {
          result.riskScore += walletCheck.riskScore;
          result.reasons.push(...walletCheck.reasons);
        }
      }

      // Determine final result
      if (result.riskScore >= 80) {
        result.isFraudulent = true;
        result.recommendations.push('Account flagged for manual review');
      } else if (result.riskScore >= 50) {
        result.recommendations.push('Account under increased monitoring');
      }

      // Update profile
      this.updateUserProfile(profile, rewardAmount, result.riskScore);

      return result;
    } catch (error) {
      console.error('Security check error:', error);
      result.isFraudulent = true;
      result.riskScore = 100;
      result.reasons.push('Security check failed');
      return result;
    }
  }

  private checkRateLimiting(profile: UserActivityProfile, rewardAmount: number): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Check hourly limit
    const hourlyRewards = profile.rewardFrequency * 1; // Simplified calculation
    if (hourlyRewards + rewardAmount > SECURITY_CONFIG.MAX_REWARDS_PER_HOUR) {
      return { allowed: false, reason: 'Hourly reward limit exceeded' };
    }

    // Check daily limit
    if (profile.totalRewards + rewardAmount > SECURITY_CONFIG.MAX_REWARDS_PER_DAY) {
      return { allowed: false, reason: 'Daily reward limit exceeded' };
    }

    // Check time between rewards
    if (now - profile.lastRewardTime < SECURITY_CONFIG.SUSPICIOUS_PATTERNS.MIN_TIME_BETWEEN_REWARDS) {
      return { allowed: false, reason: 'Too frequent reward requests' };
    }

    return { allowed: true };
  }

  private checkSuspiciousPatterns(profile: UserActivityProfile, conversationData: any): { suspicious: boolean; riskScore: number; reasons: string[] } {
    const result = { suspicious: false, riskScore: 0, reasons: [] as string[] };

    // Check for repetitive patterns
    if (conversationData.length < 10) {
      result.suspicious = true;
      result.riskScore += 15;
      result.reasons.push('Very short conversation');
    }

    // Check for duplicate content
    if (this.hasDuplicateContent(conversationData)) {
      result.suspicious = true;
      result.riskScore += 25;
      result.reasons.push('Duplicate conversation content detected');
    }

    // Check for automated patterns
    if (this.detectAutomatedPatterns(conversationData)) {
      result.suspicious = true;
      result.riskScore += 30;
      result.reasons.push('Automated conversation patterns detected');
    }

    return result;
  }

  private checkConversationQuality(conversationData: any): { score: number; issues: string[] } {
    let score = 1.0;
    const issues: string[] = [];

    // Check message length
    if (conversationData.length < 50) {
      score -= 0.3;
      issues.push('Short conversation');
    }

    // Check for meaningful content
    if (this.hasMeaningfulContent(conversationData)) {
      score += 0.2;
    } else {
      score -= 0.4;
      issues.push('Low meaningful content');
    }

    // Check for natural language patterns
    if (this.hasNaturalLanguagePatterns(conversationData)) {
      score += 0.1;
    } else {
      score -= 0.2;
      issues.push('Unnatural language patterns');
    }

    return { score: Math.max(0, Math.min(1, score)), issues };
  }

  private async checkWalletHistory(walletAddress: string): Promise<{ suspicious: boolean; riskScore: number; reasons: string[] }> {
    const result = { suspicious: false, riskScore: 0, reasons: [] as string[] };

    try {
      const rewardService = getSolanaRewardService();
      const history = await rewardService.getTransactionHistory(new PublicKey(walletAddress), 50);

      // Check for new wallets
      if (history.length < 5) {
        result.riskScore += 10;
        result.reasons.push('New wallet with limited transaction history');
      }

      // Check for suspicious transaction patterns
      const recentTransactions = history.filter(tx => 
        tx.blockTime && (Date.now() / 1000) - tx.blockTime < 3600 // Last hour
      );

      if (recentTransactions.length > 10) {
        result.suspicious = true;
        result.riskScore += 20;
        result.reasons.push('High transaction frequency');
      }

      return result;
    } catch (error) {
      console.error('Wallet history check error:', error);
      return result;
    }
  }

  private hasDuplicateContent(conversationData: any): boolean {
    // Simplified duplicate detection
    const messages = conversationData.messages || [];
    const uniqueMessages = new Set(messages.map((msg: any) => msg.content?.toLowerCase().trim()));
    return uniqueMessages.size < messages.length * 0.8; // If more than 20% are duplicates
  }

  private detectAutomatedPatterns(conversationData: any): boolean {
    const messages = conversationData.messages || [];
    
    // Check for repetitive timing patterns
    const timestamps = messages.map((msg: any) => msg.timestamp);
    const timeDiffs = timestamps.slice(1).map((time: number, i: number) => time - timestamps[i]);
    
    // Check for uniform timing (bot-like behavior)
    const avgDiff = timeDiffs.reduce((a: number, b: number) => a + b, 0) / timeDiffs.length;
    const variance = timeDiffs.reduce((sum: number, diff: number) => sum + Math.pow(diff - avgDiff, 2), 0) / timeDiffs.length;
    
    return variance < 1000; // Very low variance suggests automation
  }

  private hasMeaningfulContent(conversationData: any): boolean {
    const messages = conversationData.messages || [];
    const meaningfulWords = ['how', 'what', 'why', 'when', 'where', 'explain', 'help', 'understand', 'learn'];
    
    const content = messages.map((msg: any) => msg.content?.toLowerCase() || '').join(' ');
    return meaningfulWords.some(word => content.includes(word));
  }

  private hasNaturalLanguagePatterns(conversationData: any): boolean {
    const messages = conversationData.messages || [];
    
    // Check for natural language indicators
    const naturalPatterns = [
      /\b(i|you|he|she|we|they)\b/i,
      /\b(is|are|was|were|have|has|had)\b/i,
      /\b(and|or|but|because|however|therefore)\b/i,
    ];
    
    const content = messages.map((msg: any) => msg.content || '').join(' ');
    return naturalPatterns.some(pattern => pattern.test(content));
  }

  private getOrCreateUserProfile(userId: string, walletAddress: string): UserActivityProfile {
    const key = `${userId}-${walletAddress}`;
    
    if (!this.userProfiles.has(key)) {
      this.userProfiles.set(key, {
        userId,
        walletAddress,
        totalRewards: 0,
        averageRewardAmount: 0,
        lastRewardTime: 0,
        rewardFrequency: 0,
        suspiciousActivities: 0,
        riskScore: 0,
        isFlagged: false,
      });
    }
    
    return this.userProfiles.get(key)!;
  }

  private updateUserProfile(profile: UserActivityProfile, rewardAmount: number, riskScore: number): void {
    const now = Date.now();
    
    profile.totalRewards += rewardAmount;
    profile.averageRewardAmount = profile.totalRewards / (profile.totalRewards / rewardAmount);
    profile.lastRewardTime = now;
    profile.riskScore = Math.max(profile.riskScore, riskScore);
    
    if (riskScore > 50) {
      profile.suspiciousActivities++;
    }
    
    if (profile.suspiciousActivities > 5) {
      profile.isFlagged = true;
    }
  }

  private logSecurityEvent(
    userId: string,
    walletAddress: string,
    eventType: SecurityEvent['eventType'],
    severity: SecurityEvent['severity'],
    details: any,
    metadata: { ipAddress?: string; userAgent?: string }
  ): void {
    const event: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      walletAddress,
      eventType,
      severity,
      details,
      timestamp: Date.now(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    };
    
    this.securityEvents.push(event);
    console.log('Security Event:', event);
  }

  private loadBlockedAddresses(): void {
    // Load from environment or database
    const blockedAddresses = process.env.BLOCKED_WALLET_ADDRESSES?.split(',') || [];
    blockedAddresses.forEach(address => {
      if (address.trim()) {
        this.blockedAddresses.add(address.trim());
      }
    });
  }

  // Public methods for monitoring and administration
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getUserProfile(userId: string, walletAddress: string): UserActivityProfile | null {
    const key = `${userId}-${walletAddress}`;
    return this.userProfiles.get(key) || null;
  }

  blockWalletAddress(address: string): void {
    this.blockedAddresses.add(address);
    console.log(`Wallet address blocked: ${address}`);
  }

  unblockWalletAddress(address: string): void {
    this.blockedAddresses.delete(address);
    console.log(`Wallet address unblocked: ${address}`);
  }

  getSecurityStats(): any {
    const totalEvents = this.securityEvents.length;
    const fraudEvents = this.securityEvents.filter(e => e.eventType === 'fraud_detected').length;
    const blockedCount = this.blockedAddresses.size;
    const flaggedUsers = Array.from(this.userProfiles.values()).filter(p => p.isFlagged).length;
    
    return {
      totalEvents,
      fraudEvents,
      fraudRate: totalEvents > 0 ? (fraudEvents / totalEvents) * 100 : 0,
      blockedAddresses: blockedCount,
      flaggedUsers,
      totalUsers: this.userProfiles.size,
    };
  }
}

// Singleton instance
let securityServiceInstance: RewardSecurityService | null = null;

export function getRewardSecurityService(): RewardSecurityService {
  if (!securityServiceInstance) {
    securityServiceInstance = new RewardSecurityService();
  }
  return securityServiceInstance;
} 