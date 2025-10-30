# 💰 Expense Tracker Web App

<div align="center">

![Expense Tracker](https://img.shields.io/badge/Expense-Tracker-emerald?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)

A modern, feature-rich expense tracking application built with React, TypeScript, and TailwindCSS. Track expenses, manage budgets, visualize spending patterns, and control your finances with an intuitive, responsive interface.

## 🚀 [Live Demo](https://nikhil2004nk.github.io/expense-tracker-frontend-ts/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Usage](#-usage) • [Deployment](#-deployment) • [Project Structure](#-project-structure) • [Contributing](#-contributing) • [Troubleshooting](#-troubleshooting) • [License](#-license) • [Author](#-author) • [Support](#-support)

</div>

---

## ✨ Features

### 📊 Dashboard Analytics
- Real-time overview of spending
- Interactive charts for income vs. expenses
- Category-wise distribution and summaries

### 💸 Transaction Management
- Add transactions with amount, category, date, notes
- Upload receipt images or PDFs
- Filter by category and sort by date/amount
- Edit and delete with confirmation

### 🎯 Budget Planning
- Per-category budgets and progress
- Alerts when approaching or exceeding limits
- Quick edit/delete and currency support

### 👤 Profile & Settings
- Profile updates and preferences
- Theme customization (Light/Dark)
- Currency and regional settings

### 🎨 Design & UX
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and accessible UI
- Toast notifications for actions

### 🔒 Authentication & Security
- Secure login and registration
- Protected routes
- Client-side validation with Zod

---

## 🛠 Tech Stack

### Core
- React 19.1, TypeScript
- React Router 7
- Vite 7

### UI & Styling
- TailwindCSS 3.4
- Reusable components and responsive design

### Forms & Validation
- React Hook Form 7
- Zod 4 with `@hookform/resolvers`

### Data Visualization
- Recharts 3

### Quality & Tooling
- ESLint 9, Prettier, PostCSS, Autoprefixer

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running (see `expense-tracker-service`)

### Installation

```bash
npm install
```

### Environment

Create `.env.local` in the project root:

```bash
VITE_API_URL=http://localhost:3000
```

### Start Development Server

```bash
npm run dev
```

Open http://localhost:5173

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 📖 Usage

### First Time Setup
1. Register an account and log in
2. You will be redirected to the dashboard

### Add Transactions
1. Go to Transactions
2. Fill in amount, category, date, optional notes/receipt
3. Click Add Transaction

### Budgets
1. Open Budgets
2. Add per-category budgets
3. Monitor progress and alerts

### Settings
1. Adjust theme, currency, and regional preferences
2. Save changes

---

## 🚀 Deployment

- Deployed on GitHub Pages
- Ensure your CI workflow builds the project and publishes the `dist` folder
- Set `VITE_API_URL` for production to point to your backend

Live URL: https://nikhil2004nk.github.io/expense-tracker-frontend-ts/

---

## 📁 Project Structure

```bash
src/
├── components/          # Reusable UI components
│   ├── common/          # Shared components
│   └── transactions/    # Transaction-specific components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── pages/               # Page components (Dashboard, Transactions, Budgets, Profile, Settings)
├── services/            # API integration layer (api-client, auth, transactions)
├── utils/               # Utility functions
├── App.tsx              # Main app component
└── main.tsx             # App entry point
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## 🔧 Troubleshooting

- CORS errors: ensure backend CORS allows your frontend origin and credentials
- Auth issues: verify cookies are enabled and `VITE_API_URL` is correct
- Build failures: reinstall dependencies and run a clean build

---

## 📝 License

MIT

---

## 👨‍💻 Author

**Nikhil Kushwaha**

- GitHub: https://github.com/nikhil2004nk
- LinkedIn: https://www.linkedin.com/in/nikhil-kushwaha12
- Email: Nikdocuments12@gmail.com

---

## 📞 Support

- Open an issue or start a discussion
- For help, reach out via email

---

# Expense Tracker Frontend

## 🚀 [Live Demo](https://nikhil2004nk.github.io/expense-tracker-frontend-ts/)

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
