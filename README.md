# Deployment to GitHub Pages

This project is configured for automated deployment to GitHub Pages via GitHub Actions.

## Setting Up GitHub Pages

To enable automated deployment for your repository:

1. Push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** -> **Pages**.
3. Under **Build and deployment**, locate the **Source** dropdown menu.
4. Select **GitHub Actions** as the source.
5. Push changes to `main` or `master` branch to trigger the deployment workflow (`.github/workflows/deploy.yml`).

Once completed, your site will be built using Node 22 and published automatically to GitHub Pages.
