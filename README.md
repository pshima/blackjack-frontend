# Blackjack Casino Frontend

A React + TypeScript blackjack game application built with Vite and styled with Tailwind CSS. This frontend application provides a complete blackjack gaming experience with API integration for backend connectivity.

## Features

### 🎮 Game Features
- **Complete Blackjack Gameplay**: Hit, stand, double down, and split functionality
- **Real-time Game State**: Live updates of hands, scores, and game status
- **Betting System**: Configurable betting with balance management
- **Multiple Game Modes**: Various blackjack variants and rule sets
- **Animated Cards**: Smooth card dealing and flip animations
- **Responsive Design**: Works on desktop and mobile devices

### 🛠️ Development Features
- **Debug Mode**: Comprehensive debugging tools and test components
- **API Testing**: Built-in API connection testing and validation
- **Error Boundaries**: Robust error handling and recovery
- **Hot Module Replacement**: Fast development with Vite HMR
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with fast refresh
- **Styling**: Tailwind CSS with custom green casino theme
- **HTTP Client**: Custom API service layer
- **Package Manager**: npm

## Project Structure

```
src/
├── components/
│   ├── game/           # Blackjack game components
│   │   ├── BlackjackGame.tsx
│   │   ├── Card.tsx
│   │   ├── Hand.tsx
│   │   ├── BettingControls.tsx
│   │   └── ...
│   ├── debug/          # Development and testing components
│   └── ErrorBoundary.tsx
├── hooks/              # Custom React hooks
│   ├── useBlackjackGame.ts
│   ├── useBlackjackResults.ts
│   └── ...
├── pages/              # Page components
├── services/           # API service layer
│   └── cardgame-api.ts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── assets/             # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blackjack-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API base URL (default: http://localhost:8080)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Game Navigation

The application includes a navigation bar with multiple modes:

- **🏠 Home** - Welcome page and game overview
- **🃏 Blackjack Game** - Main blackjack gameplay
- **🧪 Blackjack Test** - Workflow testing and validation
- **🔧 Debug Fix** - Development debugging tools
- **✅ Fixed Test** - Final integration tests
- **🔌 API Test** - API connectivity testing
- **🛠️ API Tools** - API debugging utilities

## API Integration

The application is designed to work with a blackjack API backend:

- **Base URL**: Configurable via `VITE_API_BASE_URL` (default: `http://localhost:8080`)
- **Endpoints**: Game creation, actions (hit, stand, etc.), and result retrieval
- **Type Safety**: Full TypeScript definitions for all API responses
- **Error Handling**: Comprehensive error boundaries and retry logic

### API Service Features
- Automatic retry on network failures
- Request/response logging in development
- Type-safe API calls with full IntelliSense support
- Configurable timeouts and error handling

## Development

### Debug Mode
The application includes comprehensive debugging tools:
- Real-time game state monitoring
- API request/response inspection
- Component error boundaries
- Network connectivity testing

### Security Features
- Content Security Policy (CSP) configuration
- XSS and injection prevention
- Secure coding practices throughout
- Input validation and sanitization

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Configure production environment**
   - Update API base URL for production
   - Enable stricter CSP policies
   - Configure monitoring and analytics

3. **Deploy static files**
   The `dist/` folder contains all static assets ready for deployment to any web server or CDN.

## Contributing

1. Follow the existing code style and conventions
2. Maintain test coverage above 80%
3. Use security best practices for all changes
4. Update documentation when adding features
5. Test thoroughly in both development and production modes

## License

This project is licensed under the MIT License.
