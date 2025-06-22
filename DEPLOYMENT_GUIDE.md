# Convocore Production Deployment Guide

This guide will help you deploy Convocore to production with all necessary services configured.

## Prerequisites

Before deploying, ensure you have:
- ✅ OpenAI API key with sufficient credits
- ✅ Anthropic API key with sufficient credits
- ✅ Supabase project set up with database schema
- ✅ Domain name (optional but recommended)
- ✅ TRON wallet for receiving payments

## Deployment Platforms

### Recommended: Vercel (Easiest)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com/)
   - Import your GitHub repository
   - Configure environment variables (see below)
   - Deploy

3. **Environment Variables in Vercel**
   ```bash
   # API Keys
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   
   # TRON Configuration
   NEXT_PUBLIC_TRON_NETWORK=mainnet
   NEXT_PUBLIC_TRON_RECIPIENT_ADDRESS=TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ
   
   # Rate Limiting
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=900000
   
   # Feature Flags
   NEXT_PUBLIC_ENABLE_STREAMING=true
   NEXT_PUBLIC_ENABLE_VOICE_INPUT=false
   NEXT_PUBLIC_ENABLE_FILE_UPLOAD=false
   ```

### Alternative: Netlify

1. **Build Configuration**
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**
   - Connect your GitHub repository
   - Set the same environment variables as Vercel
   - Deploy

### Alternative: Railway

1. **Deploy**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY=your_key
   railway variables set ANTHROPIC_API_KEY=your_key
   # ... add all other variables
   ```

## Database Configuration

### Supabase Production Setup

1. **Create Production Project**
   - Create a new Supabase project for production
   - Choose a region close to your users
   - Upgrade to Pro plan for better performance (recommended)

2. **Run Database Schema**
   ```sql
   -- Copy and run the entire supabase/schema.sql file
   -- in your Supabase SQL editor
   ```

3. **Configure Authentication**
   - Enable email confirmation
   - Set up custom SMTP (optional)
   - Configure OAuth providers (Google, GitHub, etc.)

4. **Set Up RLS Policies**
   - Policies are included in the schema
   - Test with different user roles
   - Monitor logs for any issues

## Domain Configuration

### Custom Domain Setup

1. **Purchase Domain**
   - Use Namecheap, GoDaddy, or Google Domains
   - Choose a memorable, brandable name

2. **Configure DNS**
   ```
   # For Vercel
   CNAME www your-app.vercel.app
   A @ 76.76.19.61
   
   # For Netlify
   CNAME www your-app.netlify.app
   A @ 75.2.60.5
   ```

3. **SSL Certificate**
   - Automatic with Vercel/Netlify
   - Enable HTTPS redirect

## Performance Optimization

### Next.js Optimizations

1. **Image Optimization**
   ```typescript
   // next.config.ts
   const nextConfig = {
     images: {
       domains: ['your-domain.com'],
       formats: ['image/webp', 'image/avif'],
     },
   };
   ```

2. **Bundle Analysis**
   ```bash
   npm install @next/bundle-analyzer
   npm run analyze
   ```

3. **Caching Strategy**
   ```typescript
   // Set appropriate cache headers
   export const revalidate = 3600; // 1 hour
   ```

### Database Optimizations

1. **Connection Pooling**
   - Enable in Supabase dashboard
   - Set appropriate pool size

2. **Indexes**
   - Already included in schema
   - Monitor slow queries

3. **Row Level Security**
   - Properly configured in schema
   - Test performance impact

## Monitoring & Analytics

### Error Tracking

1. **Sentry Integration**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure Sentry**
   ```typescript
   // sentry.client.config.ts
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
   });
   ```

### Analytics

1. **Google Analytics**
   ```bash
   npm install @next/third-parties
   ```

2. **Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```

### Uptime Monitoring

1. **UptimeRobot**
   - Monitor main endpoints
   - Set up alerts

2. **Health Check Endpoint**
   ```typescript
   // app/api/health/route.ts
   export async function GET() {
     return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
   }
   ```

## Security Considerations

### API Security

1. **Rate Limiting**
   ```typescript
   // Implement rate limiting per user
   // Already configured in environment
   ```

2. **API Key Protection**
   - Never expose in client-side code
   - Use environment variables only
   - Rotate keys regularly

3. **CORS Configuration**
   ```typescript
   // next.config.ts
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/api/:path*',
           headers: [
             { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
           ],
         },
       ];
     },
   };
   ```

### User Data Protection

1. **GDPR Compliance**
   - Add privacy policy
   - Implement data deletion
   - Cookie consent (if EU users)

2. **Data Encryption**
   - Supabase handles encryption at rest
   - Use HTTPS for all communications

## Payment Processing

### TRON Integration

1. **Wallet Setup**
   - Secure your private keys
   - Use hardware wallet for large amounts
   - Set up monitoring for incoming payments

2. **Transaction Verification**
   - Implement webhook for payment confirmation
   - Add retry logic for failed verifications

3. **Subscription Management**
   - Automated renewal system
   - Grace period for failed payments
   - Downgrade logic

## Backup & Recovery

### Database Backups

1. **Supabase Backups**
   - Enable automatic daily backups
   - Test restore procedures
   - Download manual backups regularly

2. **Code Backups**
   - GitHub repository (primary)
   - Local backups
   - Environment variables backup (secure)

## Launch Checklist

### Pre-Launch

- [ ] All environment variables configured
- [ ] Database schema deployed and tested
- [ ] Authentication working (email + OAuth)
- [ ] Payment processing tested
- [ ] API rate limits configured
- [ ] Error tracking set up
- [ ] Domain configured with SSL
- [ ] Performance tested under load
- [ ] Security audit completed
- [ ] Backup procedures tested

### Launch Day

- [ ] Deploy to production
- [ ] Verify all functionality
- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Test user registration flow
- [ ] Monitor API usage
- [ ] Check database performance

### Post-Launch

- [ ] Set up monitoring dashboards
- [ ] Configure alerts
- [ ] Plan scaling strategy
- [ ] Schedule regular backups
- [ ] Plan feature updates
- [ ] Monitor user feedback

## Scaling Considerations

### Traffic Growth

1. **Database Scaling**
   - Upgrade Supabase plan
   - Consider read replicas
   - Optimize queries

2. **API Scaling**
   - Monitor OpenAI/Anthropic usage
   - Implement caching
   - Consider CDN for static assets

3. **Cost Management**
   - Monitor API costs
   - Implement usage alerts
   - Optimize model selection

## Support & Maintenance

### Regular Tasks

1. **Weekly**
   - Check error logs
   - Monitor API usage
   - Review user feedback

2. **Monthly**
   - Update dependencies
   - Review security
   - Analyze performance metrics

3. **Quarterly**
   - Security audit
   - Backup testing
   - Capacity planning

### Emergency Procedures

1. **Service Outage**
   - Check status pages (Vercel, Supabase, OpenAI)
   - Review error logs
   - Communicate with users

2. **Security Incident**
   - Rotate API keys
   - Review access logs
   - Update passwords

## Cost Estimation

### Monthly Costs (Estimated)

- **Hosting (Vercel Pro)**: $20/month
- **Database (Supabase Pro)**: $25/month
- **Domain**: $10-15/year
- **OpenAI API**: Variable ($0.002-0.06 per 1K tokens)
- **Anthropic API**: Variable ($0.25-15 per 1M tokens)
- **Monitoring (Sentry)**: $26/month (optional)

**Total**: ~$70-100/month + API usage costs

## Getting Help

- **Technical Issues**: Check GitHub issues
- **Supabase**: Official documentation and Discord
- **Vercel**: Support documentation
- **API Providers**: OpenAI and Anthropic support

---

**Ready to launch?** Follow this guide step by step, and you'll have a production-ready Convocore deployment! 