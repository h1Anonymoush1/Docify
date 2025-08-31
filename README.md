# Docify

A modern documentation platform built for the [Appwrite Sites Hackathon 2025](https://hackathon.appwrite.network). Docify combines the power of SvelteKit frontend with Appwrite's backend services to create a seamless documentation experience.

## 🚀 Project Overview

**Hackathon Details:**
- **Event**: Appwrite Sites Hackathon 2025
- **Duration**: Aug 29 - Sept 12, 2025
- **Deployed URL**: `[Your Deployed URL]`
- **Site ID**: `[Your Site ID]`

## 🛠️ Tech Stack

### Frontend
- **Framework**: SvelteKit 2.16.0 with Svelte 5.0
- **Language**: JavaScript/TypeScript
- **Styling**: Custom CSS with CSS Variables
- **Build Tool**: Vite 6.0
- **Package Manager**: npm

### Backend & Services
- **Backend-as-a-Service**: Appwrite Cloud
- **Endpoint**: `[Your Appwrite Endpoint]`
- **Project ID**: `[Your Project ID]`
- **Project Name**: `[Your Project Name]`

### Development Tools
- **Code Quality**: Prettier with Svelte plugin
- **Type Checking**: TypeScript 5.5.3
- **Linting**: Svelte-check 4.0.0

## 📁 Project Structure

```
Docify/
├── website/              # SvelteKit Frontend Application
│   ├── src/
│   │   ├── app.css      # Global styles with custom CSS variables
│   │   ├── app.html     # HTML template
│   │   ├── lib/
│   │   │   └── appwrite.js  # Appwrite client configuration
│   │   └── routes/
│   │       └── +page.svelte # Main page component
│   ├── static/          # Static assets
│   ├── package.json     # Dependencies and scripts
│   ├── svelte.config.js # SvelteKit configuration
│   ├── vite.config.js   # Vite build configuration
│   └── .env             # Environment variables (gitignored)
├── functions/           # Appwrite Functions Directory
├── docs/               # Project Documentation
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `website/` directory:

```env
PUBLIC_APPWRITE_ENDPOINT=[Your Appwrite Endpoint]
PUBLIC_APPWRITE_PROJECT_ID=[Your Project ID]
PUBLIC_APPWRITE_PROJECT_NAME=[Your Project Name]
```

### Appwrite Integration
The project uses the Appwrite Web SDK for:
- Client initialization and configuration
- Database operations
- User authentication (ready for implementation)
- Real-time subscriptions (ready for implementation)

## 🚦 Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Docify
   ```

2. **Install dependencies**
   ```bash
   cd website
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Appwrite configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

In the `website/` directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Run type checking in watch mode

## 🌐 Deployment

The project is deployed on **Appwrite Sites** with automatic deployments from the main branch:

- **Production URL**: `[Your Production URL]`
- **Platform**: Appwrite Sites (Cloud)
- **Domain**: `.appwrite.network` subdomain

## 🎯 Hackathon Compliance

This project meets all Appwrite Sites Hackathon requirements:

- ✅ **Built from scratch** during hackathon period
- ✅ **Solo project** (1 team member)
- ✅ **Deployed on Appwrite Sites** (mandatory requirement)
- ✅ **Open source** with public GitHub repository
- ✅ **Modern tech stack** with AI tools assistance allowed

## 🏆 Judging Criteria Focus

The project will be evaluated on:

1. **Impact of Idea**: Creating a comprehensive documentation platform
2. **Creativity in Design**: Modern UI/UX with SvelteKit and custom CSS theming
3. **Technical Execution**: Clean code, proper architecture, and Appwrite integration

## 📦 Key Dependencies

### Production Dependencies
- `appwrite: ^16.1.0` - Appwrite Web SDK
- `@appwrite.io/pink-icons: ^0.25.0` - Appwrite icon library
- `@sveltejs/adapter-node: ^5.2.12` - Node.js adapter for deployment

### Development Dependencies
- `@sveltejs/kit: ^2.16.0` - SvelteKit framework
- `svelte: ^5.0.0` - Svelte compiler
- `typescript: ^5.5.3` - TypeScript support
- `prettier-plugin-svelte: ^3.3.3` - Code formatting

## 🔮 Future Enhancements

Planned features for the documentation platform:
- User authentication and authorization
- Document creation and editing
- Real-time collaboration
- File upload and management
- Search functionality
- Team workspaces
- API documentation generator
- Version control for documents

## 📝 License

MIT License - see [LICENSE](website/LICENSE) file for details.

## 🤝 Contributing

This is a hackathon project built for the Appwrite Sites Hackathon 2025. The project showcases modern web development practices with SvelteKit and Appwrite integration.

---

**Built with ❤️ for the Appwrite Sites Hackathon 2025**