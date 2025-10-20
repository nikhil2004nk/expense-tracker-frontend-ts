# GitHub Pages Deployment Guide

This guide will help you deploy your Expense Tracker frontend to GitHub Pages.

## 🚀 Quick Setup

### Step 1: Push Changes to GitHub

First, commit and push the new configuration files:

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/YOUR-USERNAME/expense-tracker-frontend-ts`
2. Click on **Settings** (top navigation)
3. In the left sidebar, click on **Pages**
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**
5. Click **Save**

### Step 3: Wait for Deployment

- The GitHub Actions workflow will automatically run on push to main branch
- Go to the **Actions** tab in your repository to see the deployment progress
- Once complete (green checkmark ✓), your site will be live!

## 🌐 Your Live URL

Your site will be available at:
```
https://YOUR-USERNAME.github.io/expense-tracker-frontend-ts/
```

Replace `YOUR-USERNAME` with your actual GitHub username.

## 📝 How It Works

1. **vite.config.ts**: Configured with `base: '/expense-tracker-frontend-ts/'` to handle GitHub Pages subdirectory routing
2. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
   - Automatically triggers on every push to main branch
   - Installs dependencies
   - Builds the project (`npm run build`)
   - Deploys the `dist` folder to GitHub Pages

## 🔄 Updating Your Site

Every time you push changes to the main branch, GitHub Actions will automatically rebuild and redeploy your site. You don't need to do anything manually!

## 🛠️ Manual Deployment (Alternative)

If you prefer manual deployment instead of automatic:

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Deploy manually:
   ```bash
   npm run deploy
   ```

## 🐛 Troubleshooting

### Workflow fails with permission errors
- Make sure you've enabled GitHub Pages with **Source: GitHub Actions** in repository settings

### Site shows 404 error
- Verify the `base` path in `vite.config.ts` matches your repository name
- Check that the GitHub Actions workflow completed successfully

### Assets not loading
- Make sure all imports use relative paths
- The `base` configuration should handle asset paths automatically

### Backend API Issues
- Remember that GitHub Pages only hosts static files
- Make sure your backend API is deployed separately (e.g., Render, Railway, Heroku)
- Update API URLs in your frontend code to point to the live backend

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)

## 🔐 Environment Variables

Your backend API URL is already configured in the GitHub Actions workflow:
- **Production API**: `https://exptrackerapi.trishvifintech.com`

The `.env.local` file is set up for local development and uses the same backend URL.

### Updating the Backend URL

If you need to change the backend URL in the future:

1. **For GitHub Pages deployment**: Update the `VITE_API_URL` in `.github/workflows/deploy.yml`
2. **For local development**: Update the `VITE_API_URL` in `.env.local`

### Using Different Backends for Dev/Prod

If you want to use a local backend for development:

1. Update `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

2. Keep the production URL in the workflow file for deployment

Note: All `VITE_*` environment variables are embedded in the build at build time.

