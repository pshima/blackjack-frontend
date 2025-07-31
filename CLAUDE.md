# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fully-featured React + TypeScript blackjack casino frontend application, built with Vite and styled with Tailwind CSS. The application includes complete blackjack gameplay, comprehensive debugging tools, API integration for backend connectivity, and production-ready features with security best practices.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with Hot Module Replacement
- **Styling**: Tailwind CSS with custom green casino theme and animations
- **Package Manager**: npm
- **API Client**: Custom service layer with type safety
- **Development Tools**: Comprehensive debugging and testing components

## Project Structure

```
src/
├── components/
│   ├── game/               # Complete blackjack game components
│   │   ├── BlackjackGame.tsx        # Main game component
│   │   ├── BlackjackGameFixed.tsx   # Optimized game version
│   │   ├── Card.tsx                 # Animated card component
│   │   ├── Hand.tsx                 # Player/dealer hand display
│   │   ├── BettingControls.tsx      # Betting interface
│   │   ├── BlackjackControls.tsx    # Game action buttons
│   │   ├── GameResult.tsx           # Win/loss display
│   │   └── GameTable.tsx            # Game table layout
│   ├── debug/              # Development and testing tools
│   │   ├── TestComponents.tsx       # Component testing utilities
│   │   ├── BlackjackWorkflowTest.tsx # Game workflow testing
│   │   ├── BlackjackGameDebug.tsx   # Game state debugging
│   │   ├── ApiConnectionDebug.tsx   # API testing tools
│   │   └── ...                      # Additional debug components
│   └── ErrorBoundary.tsx   # Error handling wrapper
├── hooks/                  # Custom React hooks
│   ├── useBlackjackGame.ts          # Main game logic hook
│   ├── useBlackjackResults.ts       # Game results management
│   ├── useGameList.ts               # Game list management
│   └── useDeckTypes.ts              # Deck configuration
├── pages/
│   └── ApiTestPage.tsx              # API testing page
├── services/
│   └── cardgame-api.ts              # Blackjack API service layer
├── types/
│   └── cardgame.ts                  # Complete type definitions
├── utils/                  # Utility functions including security
└── assets/                 # Static assets
```

## Common Commands

- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Preview build**: `npm run preview`
- **Lint**: `npm run lint`

## Development Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure API base URL (default: `http://localhost:8080`)
3. Start development server: `npm run dev`
4. Navigate to different game modes using the navigation bar

## Application Navigation

The app includes a comprehensive navigation system with multiple modes:

- **🏠 Home** - Welcome page and overview
- **🃏 Blackjack Game** - Main production blackjack gameplay
- **🧪 Blackjack Test** - Workflow and integration testing
- **🔧 Debug Fix** - Development debugging and state monitoring
- **✅ Fixed Test** - Final integration and validation tests
- **🔌 API Test** - API connectivity and endpoint testing
- **🛠️ API Tools** - Advanced API debugging utilities

## Game Features

### Core Blackjack Functionality
- **Complete Game Logic**: Hit, stand, double down, split actions
- **Real-time State Management**: Live updates of hands, scores, game status
- **Betting System**: Configurable betting with balance management
- **Multiple Game Modes**: Various blackjack rule sets and configurations
- **Animated UI**: Smooth card dealing, flipping, and game transitions
- **Responsive Design**: Optimized for desktop and mobile devices

### Development Features
- **Debug Mode**: Real-time game state inspection and manipulation
- **API Testing**: Comprehensive backend connectivity validation
- **Error Boundaries**: Robust error handling with recovery options
- **Component Testing**: Individual component validation and testing
- **State Monitoring**: Live game state visualization and debugging

## API Integration

The application includes a comprehensive API service layer:

- **CardgameApiService**: Located in `src/services/cardgame-api.ts`
- **Complete Type Safety**: Full TypeScript definitions in `src/types/cardgame.ts`
- **Game Management**: Create games, perform actions, retrieve results
- **Error Handling**: Comprehensive error recovery and retry logic
- **Development Logging**: Request/response logging in debug mode

API base URL is configured via `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:8080`).

### API Endpoints
- `POST /games` - Create new blackjack game
- `POST /games/:id/actions` - Perform game actions (hit, stand, etc.)
- `GET /games/:id` - Get current game state
- `GET /games/:id/results` - Get game results

## Styling and Animations

- **Custom Green Casino Theme**: Defined in `tailwind.config.js` as `primary` colors
- **Card Animations**: CSS animations for dealing, flipping, and game interactions
- **Responsive Design**: Tailwind CSS utility classes for all screen sizes
- **Casino Aesthetic**: Professional gambling interface with gradients and shadows
- **Interactive Elements**: Hover effects, button states, and visual feedback

## Security Features

- **Content Security Policy**: Configurable CSP for production security
- **Input Validation**: Comprehensive validation utilities in `src/utils/validation.ts`
- **XSS Prevention**: Security measures in `src/utils/security.ts`
- **Secure Coding Practices**: Following OWASP guidelines throughout
- **Environment Configuration**: Secure handling of API endpoints and secrets

## Architecture Notes

- **Production-Ready**: Complete blackjack implementation with all game features
- **Modular Components**: Easily extensible game components and utilities
- **Type-Safe API**: Full TypeScript integration with backend services
- **Debug Infrastructure**: Comprehensive debugging and testing tools
- **Error Recovery**: Robust error boundaries and fallback mechanisms
- **Performance Optimized**: Efficient state management and rendering

## Best Practices

- **Testing**: When adding or changing code, ensure test coverage remains above 80%
- **Security**: Always implement security best practices and validate all inputs
- **Documentation**: Update README.md and CLAUDE.md to reflect current application state
- **Code Quality**: Follow existing patterns and maintain consistent code style
- **Error Handling**: Implement proper error boundaries and user feedback
- **Performance**: Consider performance implications of state updates and re-renders
- **Accessibility**: Ensure components are accessible with proper ARIA labels
- **Type Safety**: Maintain strict TypeScript usage throughout the application

## Development Workflow

1. **Component Development**: Create new components in appropriate directories
2. **Hook Creation**: Implement game logic in custom hooks for reusability
3. **API Integration**: Use the existing service layer for backend communication
4. **Testing**: Utilize the debug components for comprehensive testing
5. **Security Review**: Ensure all changes follow security best practices
6. **Documentation**: Update relevant documentation files

## Common Patterns

- **Game State Management**: Use `useBlackjackGame` hook for game logic
- **API Calls**: Leverage `CardgameApiService` for backend communication
- **Error Handling**: Wrap components in `ErrorBoundary` for robust error recovery
- **Debugging**: Use debug components for development and testing
- **Styling**: Follow the established green casino theme and animation patterns
-- **Tailwind**: Always use Tailwind 4.x syntax
-- **Design**: Try to stick to the style of a 1980s NES game, graphics only, do not try and turn the application into an NES.