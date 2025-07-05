# SmartyPants-AI Academic Assistant

> Your 24/7 Learning Companion for Academic Excellence and ROTC Preparation

## 🎓 About

SmartyPants-AI is a comprehensive academic assistant that provides personalized tutoring, essay writing help, and specialized support for nursing students and ROTC cadets. Built as a Progressive Web App (PWA) with AI-powered responses and advanced syllabus management.

## ✨ Features

### 🤖 AI-Powered Assistance

- **Interactive Study Partner**: 24/7 personalized tutoring assistance
- **Essay Writing Master**: From brainstorming to polished final drafts
- **Math & Science Support**: Step-by-step problem-solving guidance
- **Technical Education**: Programming, engineering, and technical writing help
- **Nursing Excellence**: NCLEX prep, clinical case studies, medical terminology
- **ROTC Excellence**: Physical fitness test prep, leadership development

### 📚 Syllabus Management

- **Smart Syllabus Upload**: Support for PDF and Word documents
- **Unified Storage**: Local storage for non-authenticated users, database for authenticated users
- **Automatic Migration**: Seamless transition from local to database storage
- **Subject Detection**: Automatic categorization based on filename analysis
- **Active Syllabus Selection**: Toggle between multiple uploaded syllabi
- **Metadata Extraction**: Page count, word count, and text extraction

### 🔐 Authentication & User Management

- **User Registration & Login**: Secure authentication system
- **Session Management**: Persistent user sessions
- **Data Synchronization**: Cross-device syllabus access
- **Privacy Protection**: Secure data handling and storage

### 📱 Progressive Web App

- **Installable**: Native app experience on all devices
- **Offline Capability**: Works without internet connection
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Push Notifications**: Real-time updates (planned)

## 🚀 Live Demo

Visit the live site: **[https://getsmartyai.space](https://getsmartyai.space)**

## 🛠️ Tech Stack

### Frontend

- **HTML5**: Semantic markup and accessibility
- **CSS3**: Modern styling with responsive design
- **JavaScript (ES6+)**: Vanilla JS with modern features
- **Service Worker**: Offline functionality and caching

### Backend

- **Netlify Functions**: Serverless backend architecture
- **Supabase**: Database and authentication services
- **OpenAI API**: GPT-3.5 Turbo for AI responses

### Infrastructure

- **Netlify**: Hosting and deployment
- **Supabase Storage**: File storage for syllabi
- **PostgreSQL**: Database for user data and syllabi

## 📁 Project Structure

```
├── public/                 # Static assets
│   ├── index.html         # Main application
│   ├── style.css          # All styles
│   ├── js/                # JavaScript modules
│   │   ├── ui-controller.js    # Main UI controller
│   │   ├── services/      # Service modules
│   │   │   ├── ai-service.js   # AI chat service
│   │   │   ├── email-service.js # Email functionality
│   │   │   ├── payment-service.js # Payment processing
│   │   │   └── syllabus-service.js # Syllabus management
│   │   └── sw.js          # Service worker
│   ├── html/              # Legal pages
│   └── manifest.json      # PWA manifest
├── netlify/
│   └── functions/         # Serverless functions
│       ├── ask.ts         # AI chat endpoint
│       ├── health.ts      # Health check
│       ├── upload-syllabus.ts # Syllabus upload
│       ├── list-syllabi.ts # Syllabus listing
│       ├── remove-syllabus.ts # Syllabus removal
│       └── supabase-client.ts # Database client
├── netlify.toml           # Netlify configuration
└── package.json           # Dependencies
```

## 🔧 Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Netlify CLI (for local development)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd smartypants-ai

# Install dependencies
npm install

# Start local development
npm run dev
```

### Environment Variables

Required for production:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
SITE_URL=https://getsmartyai.space
```

## 📱 PWA Features

- **Installable**: Add to home screen on all devices
- **Offline Capability**: Core functionality works offline
- **Background Sync**: Automatic data synchronization
- **Push Notifications**: Real-time updates (planned)
- **Native App Experience**: Full-screen mode and app-like interface

## 🎯 Pricing Plans

- **Elementary Students**: $35/month - Basic tutoring and homework help
- **Middle School**: $45/month - Enhanced academic support
- **High School**: $55/month - College prep and advanced subjects
- **College**: $65/month - University-level assistance
- **Nursing Students**: $75/month - Specialized medical education
- **ROTC Cadets**: $85/month - Military training and leadership

## 🔒 Security & Privacy

- **Data Encryption**: All data encrypted in transit and at rest
- **User Privacy**: No data sharing with third parties
- **GDPR Compliance**: User data protection and control
- **Secure Authentication**: Industry-standard security practices

## 🚀 Deployment

The application is automatically deployed to Netlify:

1. **Automatic Deployment**: Changes to main branch trigger deployment
2. **Preview Deployments**: Pull requests get preview URLs
3. **Rollback Capability**: Easy rollback to previous versions
4. **Performance Monitoring**: Built-in analytics and monitoring

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Load Time**: < 2 seconds on 3G connection
- **Core Web Vitals**: Optimized for all metrics
- **Accessibility**: WCAG 2.1 AA compliant

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Email**: support@getsmartyai.space
- **Documentation**: [https://getsmartyai.space/docs](https://getsmartyai.space/docs)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**Built with ❤️ for students everywhere**

_Last updated: December 2024_
