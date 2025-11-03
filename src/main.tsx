import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Budgets from './pages/Budgets'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import RequireAuth from './routes/RequireAuth'
import { SettingsProvider } from './contexts/SettingsContext'
import { I18nProvider } from './contexts/I18nContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CurrencyProvider } from './contexts/CurrencyContext'
import ErrorBoundary from './components/ErrorBoundary'

const router = createHashRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'categories', element: <Categories /> },
      { path: 'budgets', element: <Budgets /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '/login',
    element: (
      <SettingsProvider>
        <I18nProvider>
          <ThemeProvider>
            <Login />
          </ThemeProvider>
        </I18nProvider>
      </SettingsProvider>
    ),
  },
  {
    path: '/register',
    element: (
      <SettingsProvider>
        <I18nProvider>
          <ThemeProvider>
            <Register />
          </ThemeProvider>
        </I18nProvider>
      </SettingsProvider>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <CurrencyProvider>
        <RouterProvider router={router} />
      </CurrencyProvider>
    </ErrorBoundary>
  </StrictMode>,
)
