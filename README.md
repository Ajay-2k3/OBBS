# Online Blood Bank System

A comprehensive blood bank management system built with Next.js, Supabase, and modern web technologies. This system enables efficient management of blood donations, requests, inventory tracking, and real-time notifications for blood banks, donors, and recipients.

## 🩸 Features

### Core Functionality
- **Multi-role Authentication**: Separate dashboards for donors, recipients, blood bank staff, and administrators
- **Blood Donation Management**: Schedule donations, track donation history, and manage donor eligibility
- **Blood Request System**: Create urgent blood requests with medical details and priority levels
- **Inventory Management**: Real-time blood inventory tracking with expiration monitoring
- **Blood Bank Directory**: Search and locate nearby blood banks with current inventory
- **Real-time Notifications**: Live updates for critical requests, inventory changes, and donation schedules

### Advanced Features
- **Blood Compatibility Matching**: Automatic matching system based on ABO and Rh compatibility
- **Geolocation Services**: Find nearby blood banks and donation centers
- **Analytics Dashboard**: Comprehensive statistics and reporting for administrators
- **Mobile Responsive**: Optimized for all devices with smooth animations
- **Real-time Updates**: Live inventory and request status updates using Supabase real-time

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Styling**: Tailwind CSS, Framer Motion for animations
- **UI Components**: shadcn/ui, Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase account** (free tier available)

## 🛠️ Installation & Setup

### 1. Clone the Repository

\`\`\`bash
git clone <your-repository-url>
cd online-blood-bank
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new account
2. Create a new project
3. Wait for the project to be fully initialized

#### Get Your Supabase Credentials
1. Go to Project Settings → API
2. Copy your project URL and anon key
3. Go to Project Settings → Database
4. Copy your database password

### 4. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Development Configuration
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
\`\`\`

### 5. Database Setup

#### Run Database Scripts
Execute the SQL scripts in order in your Supabase SQL Editor:

1. **Create Tables**: Run `scripts/01-create-tables.sql`
2. **Insert Compatibility Data**: Run `scripts/02-insert-compatibility-data.sql`
3. **Setup RLS Policies**: Run `scripts/03-setup-rls-policies.sql`
4. **Create Functions**: Run `scripts/04-create-functions.sql`

#### Alternative: Use Supabase CLI (Recommended)
\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
\`\`\`

### 6. Run the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

### Core Tables

- **profiles**: User profiles with role-based access (donor, recipient, blood_bank, admin)
- **blood_banks**: Blood bank information and locations
- **blood_inventory**: Real-time blood stock tracking
- **donations**: Donation records and scheduling
- **blood_requests**: Blood request management with urgency levels
- **notifications**: Real-time notification system
- **blood_compatibility**: ABO and Rh compatibility matrix

### Key Features

- **Row Level Security (RLS)**: Secure data access based on user roles
- **Real-time Subscriptions**: Live updates for inventory and requests
- **Automated Functions**: Triggers for notifications and inventory updates
- **Geospatial Queries**: Location-based blood bank searches

## 👥 User Roles & Permissions

### Donor
- Schedule donations
- View donation history
- Receive eligibility notifications
- Search blood banks

### Recipient
- Create blood requests
- Track request status
- Search compatible blood
- Receive match notifications

### Blood Bank Staff
- Manage inventory
- Process donations
- Handle blood requests
- Update stock levels

### Administrator
- System-wide analytics
- User management
- Blood bank oversight
- Generate reports

## 🎨 Design System

### Colors
- **Primary**: Red (#DC2626) - Medical/urgency theme
- **Secondary**: Blue (#2563EB) - Trust and reliability
- **Success**: Green (#16A34A) - Positive actions
- **Warning**: Amber (#D97706) - Caution states
- **Neutral**: Gray scale for backgrounds and text

### Typography
- **Headings**: Inter Bold (600-700 weight)
- **Body**: Inter Regular (400-500 weight)
- **Monospace**: JetBrains Mono for data display

### Animations
- **Framer Motion**: Smooth page transitions and micro-interactions
- **Loading States**: Skeleton loaders and spinners
- **Real-time Updates**: Subtle animations for live data changes

## 🔧 Development

### Project Structure
\`\`\`
├── app/                    # Next.js app router pages
├── components/            # Reusable React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Role-specific dashboards
│   ├── layout/           # Layout components
│   ├── real-time/        # Real-time features
│   └── ui/               # UI components
├── lib/                  # Utility functions and configurations
│   ├── actions/          # Server actions
│   └── supabase/         # Supabase client configurations
├── scripts/              # Database migration scripts
└── public/               # Static assets
\`\`\`

### Available Scripts

\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Database
npm run db:generate  # Generate database types
npm run db:push      # Push schema changes
npm run db:reset     # Reset database
\`\`\`

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**:
   - Import your project to Vercel
   - Connect your GitHub repository

2. **Environment Variables**:
   - Add all environment variables from `.env.local`
   - Ensure `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` points to your production URL

3. **Deploy**:
   - Vercel will automatically build and deploy your application

### Manual Deployment

\`\`\`bash
# Build the application
npm run build

# Start production server
npm run start
\`\`\`

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Authentication**: Secure user authentication with Supabase Auth
- **Input Validation**: Zod schema validation for all forms
- **CSRF Protection**: Built-in Next.js security features
- **Environment Variables**: Secure configuration management

## 📱 Mobile Optimization

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Touch Interactions**: Optimized for mobile devices
- **Performance**: Optimized images and lazy loading
- **PWA Ready**: Service worker and manifest configuration

## 🧪 Testing

\`\`\`bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
\`\`\`

## 📊 Monitoring & Analytics

- **Real-time Metrics**: Built-in dashboard analytics
- **Error Tracking**: Integrated error boundary components
- **Performance Monitoring**: Next.js built-in analytics
- **User Activity**: Comprehensive activity logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub
- **Community**: Join our Discord server (link in repository)

## 🙏 Acknowledgments

- **Supabase**: For providing an excellent backend-as-a-service platform
- **Vercel**: For seamless deployment and hosting
- **shadcn/ui**: For beautiful and accessible UI components
- **Blood Bank Community**: For insights into blood bank operations

---

**⚠️ Important Note**: This system is designed for educational and demonstration purposes. For production use in actual medical facilities, ensure compliance with local healthcare regulations, data privacy laws (HIPAA, GDPR), and medical device standards.
