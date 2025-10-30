# Expense Tracker Frontend

[Live Demo](https://nikhil2004nk.github.io/expense-tracker-frontend-ts/)

A modern, fully-featured expense tracking application built with React, TypeScript, and Tailwind CSS. This frontend integrates seamlessly with the NestJS backend API for complete expense management.

## Features

- 🔐 **Authentication**: Secure login and registration with JWT-based authentication
- 💰 **Transaction Management**: Create, read, update, and delete transactions
- 📊 **Dashboard**: Visual overview of expenses and spending patterns
- 📎 **Receipt Upload**: Support for uploading receipts (images and PDFs)
- 🌓 **Dark Mode**: Beautiful light and dark themes
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔍 **Search & Filter**: Filter transactions by category
- 📈 **Sorting**: Sort by date or amount
- ⚡ **Real-time Updates**: Automatic list refresh after mutations

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **React Router** for navigation
- **Context API** for state management

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see `expense-tracker-service`)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```bash
VITE_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Modal, Toast, Loader)
│   ├── transactions/   # Transaction-specific components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── ThemeToggle.tsx
├── contexts/           # React contexts
│   └── ThemeContext.tsx
├── hooks/              # Custom React hooks
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── pages/              # Page components
│   ├── auth/          # Login and Register pages
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   ├── Budgets.tsx
│   ├── Profile.tsx
│   └── Settings.tsx
├── routes/             # Route guards and configuration
│   └── RequireAuth.tsx
├── services/           # API integration layer
│   ├── api-client.ts  # Centralized API client
│   ├── auth.ts        # Authentication services
│   └── transactions.ts # Transaction services
├── utils/              # Utility functions
│   └── currency.ts
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## API Integration

The frontend integrates with the backend using a centralized API client that handles:

- **Authentication**: Automatic cookie-based JWT authentication
- **Error Handling**: Unified error handling with custom `ApiError` class
- **Type Safety**: Full TypeScript support for all API operations
- **Request Cancellation**: Support for AbortSignal to cancel requests

See `INTEGRATION_GUIDE.md` for detailed API integration documentation.

## Key Features Implementation

### Transaction Management

- **Create**: Upload receipts and create transactions with full validation
- **Read**: Fetch and display all transactions with filtering and sorting
- **Update**: Edit existing transactions with optimistic UI updates
- **Delete**: Delete transactions with confirmation modal

### Authentication Flow

1. User logs in via login page
2. Backend sets HTTP-only cookie with JWT
3. All API requests automatically include credentials
4. Protected routes check authentication status
5. Logout clears session and redirects to login

### Receipt Upload

- Supports images (JPG, PNG, GIF, WebP) and PDFs
- Maximum file size: 10MB
- Uploads to backend before creating transaction
- Displays receipt URL in transaction details

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Component Architecture

### Smart Components (Pages)

- Manage state and data fetching
- Coordinate child components
- Handle business logic

### Presentational Components

- Receive data via props
- Focus on UI rendering
- Reusable across the app

### Service Layer

- Encapsulates API calls
- Provides type-safe interfaces
- Handles request/response transformation

## Best Practices

- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Handling**: Centralized error handling with user-friendly messages
- **Loading States**: Loading indicators for all async operations
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: Semantic HTML and ARIA labels
- **Code Organization**: Clear separation of concerns

## Troubleshooting

### CORS Errors

Ensure the backend has proper CORS configuration:

```typescript
// backend: main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
})
```

### Authentication Issues

- Verify backend is running on the correct port
- Check that cookies are enabled in browser
- Ensure `VITE_API_URL` matches backend URL

### Build Errors

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
