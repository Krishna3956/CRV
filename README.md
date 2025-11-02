# Track MCP

> World's Largest MCP Repository - Discover, Track, and Explore Over 10,000+ Model Context Protocol Servers, Clients & Tools

## 🌐 Live Site

**URL**: [https://www.trackmcp.com](https://www.trackmcp.com)

## 📖 About

Track MCP is a modern, searchable directory for Model Context Protocol (MCP) tools, servers, and connectors. Built for developers and AI enthusiasts to easily discover and explore the growing ecosystem of MCP resources.

### Features

- 🔍 **Advanced Search** - Search by name, description, or tags
- 📊 **Real-time Stats** - Track total tools and GitHub stars
- 🎯 **Smart Filtering** - Sort by stars, recent updates, or name
- 📱 **Responsive Design** - Works seamlessly on all devices
- ⚡ **Fast Performance** - Built with Vite and optimized for speed
- 🎨 **Modern UI** - Beautiful interface with shadcn/ui components

## 🚀 Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd track-mcp

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 🛠️ Tech Stack

This project is built with modern web technologies:

- **Vite** - Lightning-fast build tool
- **TypeScript** - Type-safe development
- **React** - UI library
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend and database
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

## 📦 Available Scripts

```sh
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate sitemap
npm run generate-sitemap

# Lint code
npm run lint
```

## 🌍 Deployment

This project is deployed on Vercel. Any push to the main branch will automatically trigger a new deployment.

## 🔍 SEO & Performance

### Core Web Vitals Optimization
- **Preconnect & DNS-prefetch** for external resources
- **Code splitting** with optimized chunks
- **Lazy loading** for images and components
- **CSS code splitting** for faster initial load

### Structured Data (Schema.org)
- ✅ **Organization schema** on homepage
- ✅ **WebSite schema** with search action
- ✅ **ItemList schema** for tool directory
- ✅ **SoftwareApplication schema** for individual tools
- ✅ **BreadcrumbList schema** for navigation

### XML Sitemap
The sitemap is automatically generated during build and includes all tool pages:
- **Location**: `https://www.trackmcp.com/sitemap.xml`
- **Auto-updated**: Runs on every production build
- **Dynamic URLs**: Fetches all tools from Supabase

To manually regenerate the sitemap:
```sh
npm run generate-sitemap
```

### Google Search Console Setup
See [public/google-search-console-setup.md](public/google-search-console-setup.md) for detailed instructions on:
- Site verification
- Sitemap submission
- Performance monitoring
- Core Web Vitals tracking

## 👨‍💻 Author

Built with ❤️ by [Krishna Goyal](https://www.linkedin.com/in/krishnaa-goyal/) for the MCP community.

## 📄 License

This project is open source and available under the MIT License.
