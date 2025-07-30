# Debug Components

This directory contains permanent debugging and development tools for the Blackjack application.

## Components

### ErrorBoundary.tsx
- **Purpose**: Catches React component errors and displays detailed debugging information
- **Features**: 
  - Stack trace display
  - Component name identification
  - Retry functionality
  - Console logging
- **Usage**: Wrap any component that might throw errors

### BlackjackWorkflowTest.tsx
- **Purpose**: Complete end-to-end testing of the blackjack game workflow
- **Features**:
  - Step-by-step game simulation
  - Real-time state monitoring
  - Activity logging with timestamps
  - Mock API responses
  - Error boundary integration
- **Workflow**: Navigate → Create Game → Place Bet → Hit/Stand → Game Over

### TestComponents.tsx
- **Purpose**: Simple test components for basic functionality verification
- **Components**:
  - `HomeTestComponent`: Development dashboard and status page
  - `ApiTestTestComponent`: Basic API connectivity test
  - `BlackjackTestComponent`: Simple blackjack component test

## Development Philosophy

These tools are designed to be **permanent fixtures** in the development environment, not temporary debugging code. They provide:

1. **Ongoing Monitoring**: Always-available tools to test functionality
2. **Regression Testing**: Quick verification that core workflows still work
3. **Development Aid**: Visual feedback during feature development
4. **Debugging Support**: Detailed error information when things break

## Navigation Structure

The app now has separate navigation for:
- **Production Pages**: Real game and API functionality
- **Debug Pages**: Testing and development tools

This dual structure allows for:
- Safe development without breaking production features
- Easy comparison between mock and real implementations
- Comprehensive testing at every stage of development

## Best Practices

1. **Always use Error Boundaries** around new components
2. **Log important state changes** to the console
3. **Include timestamps** in all logging
4. **Test workflows step-by-step** before integration
5. **Keep debug tools updated** as features evolve