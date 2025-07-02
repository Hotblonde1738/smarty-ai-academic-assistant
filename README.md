# SmartyPants-AI Academic Assistant

> Your 24/7 Learning Companion for Academic Excellence and ROTC Preparation

## 🎓 About

SmartyPants-AI is a comprehensive academic assistant that provides personalized tutoring, essay writing help, and specialized support for nursing students and ROTC cadets. Built as a Progressive Web App (PWA) with AI-powered responses.

## ✨ Features

- **Interactive Study Partner**: 24/7 personalized tutoring assistance
- **Essay Writing Master**: From brainstorming to polished final drafts
- **Math & Science Support**: Step-by-step problem-solving guidance
- **Technical Education**: Programming, engineering, and technical writing help
- **Nursing Excellence**: NCLEX prep, clinical case studies, medical terminology
- **ROTC Excellence**: Physical fitness test prep, leadership development
- **PWA Support**: Install as a native app on any device

## 🚀 Live Demo

Visit the live site: **[https://getsmartyai.space](https://getsmartyai.space)**

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Netlify Functions (Serverless)
- **AI**: OpenAI GPT-3.5 Turbo
- **Deployment**: Netlify
- **PWA**: Service Worker, Web App Manifest

## 📁 Project Structure

```
├── public/                 # Static assets
│   ├── index.html         # Main application
│   ├── style.css          # All styles
│   ├── js/                # JavaScript modules
│   │   ├── ui-controller.js
│   │   ├── services/      # Service modules
│   │   └── sw.js          # Service worker
│   ├── html/              # Legal pages
│   └── manifest.json      # PWA manifest
├── netlify/
│   └── functions/         # Serverless functions
│       ├── ask.js         # AI chat endpoint
│       ├── health.js      # Health check
│       └── upload-syllabus.js
├── netlify.toml           # Netlify configuration
└── package.json           # Dependencies
```

## 🔧 Development

### Local Development

```bash
npm install
npm start
```

### Environment Variables

Required for production:

- `OPENAI_API_KEY`: Your OpenAI API key

## 📱 PWA Features

- Installable on all devices
- Offline capability
- Push notifications (planned)
- Native app experience

## 🎯 Target Audience

- **Elementary Students**: $35/month - Basic tutoring and homework help
- **Middle School**: $45/month - Enhanced academic support
- **High School**: $55/month - College prep and advanced subjects
- **College**: $65/month - University-level assistance
- **Nursing Students**: $75/month - Specialized medical education
- **ROTC Cadets**: $85/month - Military training and leadership

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

For support, email: support@getsmartyai.space

---

**Built with ❤️ for students everywhere**
