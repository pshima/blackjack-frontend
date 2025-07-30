# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript frontend application for a blackjack game, built with Vite and styled with Tailwind CSS. The application features a green theme and is structured to easily integrate with a backend API for data retrieval and storage.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom green theme
- **Package Manager**: npm

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (HomePage)
├── services/      # API service layer (api.ts)
├── hooks/         # Custom React hooks (useApi.ts)
├── utils/         # Utility functions
└── assets/        # Static assets
```

## Common Commands

- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Preview build**: `npm run preview`
- **Lint**: `npm run lint`

## Development Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure API base URL
3. Start development server: `npm run dev`

## API Integration

The project includes a ready-to-use API service layer:

- **ApiService**: Located in `src/services/api.ts` - handles HTTP requests
- **useApi hook**: Located in `src/hooks/useApi.ts` - for data fetching
- **useApiMutation hook**: For POST/PUT/DELETE operations

API base URL is configured via `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:3000/api`).

## Styling

- Custom green color palette defined in `tailwind.config.js` as `primary` colors
- Tailwind CSS utility classes for responsive design
- Clean, minimal aesthetic with subtle gradients and shadows

## Architecture Notes

- Prepared for blackjack game implementation with card-focused design elements
- Modular component structure for easy feature expansion
- Type-safe API integration ready for backend connection
- Environment-based configuration for different deployment stages

## Best Practices
- When adding or changing code, make sure the correct tests are added to keep coverage above 80%
- When adding or changing code, make sure good security practices are used.
- Update the README.md and CLAUDE.md often to make sure they reflect the current state of the application.