# Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- GitHub repository
- Supabase project set up

### Steps

1. **Import Project to Vercel**
   \`\`\`bash
   # Connect your GitHub repository to Vercel
   # Visit vercel.com and click "New Project"
   # Import your GitHub repository
   \`\`\`

2. **Configure Environment Variables**
   Add these environment variables in Vercel dashboard:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-app.vercel.app/dashboard
   \`\`\`

3. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

## Manual Server Deployment

### Using PM2 (Production)

1. **Install PM2**
   \`\`\`bash
   npm install -g pm2
   \`\`\`

2. **Build Application**
   \`\`\`bash
   npm run build
   \`\`\`

3. **Start with PM2**
   \`\`\`bash
   pm2 start npm --name "blood-bank" -- start
   pm2 save
   pm2 startup
   \`\`\`

### Using Docker

1. **Create Dockerfile**
   \`\`\`dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   \`\`\`

2. **Build and Run**
   \`\`\`bash
   docker build -t blood-bank .
   docker run -p 3000:3000 blood-bank
   \`\`\`

## Database Migration

### Production Database Setup

1. **Run Migration Scripts**
   Execute in your production Supabase instance:
   - `scripts/01-create-tables.sql`
   - `scripts/02-insert-compatibility-data.sql`
   - `scripts/03-setup-rls-policies.sql`
   - `scripts/04-create-functions.sql`

2. **Verify Setup**
   - Check all tables are created
   - Verify RLS policies are active
   - Test authentication flow

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Authentication working
- [ ] Real-time features functional
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented

## Monitoring

### Health Checks
- `/api/health` - Application health
- Database connectivity
- Real-time subscriptions

### Performance Monitoring
- Next.js Analytics
- Supabase Dashboard
- Vercel Analytics (if using Vercel)

## Backup Strategy

### Database Backups
- Supabase automatic backups (Pro plan)
- Manual exports via Supabase dashboard
- Regular data exports for critical tables

### Application Backups
- GitHub repository (source code)
- Environment variables documentation
- Configuration files backup
