# Auto-Generate Website System

Automated website deployment system using Podman containers and Cloudflare Tunnel. Easily deploy static and dynamic websites with automatic subdomain routing.

## Features

- 🚀 **One-Click Deployment**: Create websites instantly via web dashboard
- 🐳 **Container Isolation**: Each website runs in its own Podman container
- 🌐 **Auto Subdomain**: Automatic subdomain creation and routing via Cloudflare Tunnel
- 📊 **Real-time Dashboard**: Monitor all websites, status, and recent activity
- 🔄 **Multi-Stack Support**: HTML, PHP, Node.js templates
- 💾 **Database Fallback**: Works with PostgreSQL or JSON file storage

## Architecture

```
User Request → Dashboard (Next.js) → Generator Script → Podman Container
                                                      ↓
Cloudflare Tunnel ← Nginx Proxy (8081) ← Container (random port)
```

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL (optional - has JSON fallback)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd auto-generate-website
   ```

2. Install dashboard dependencies:
   ```bash
   cd dashboard
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your settings
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Access dashboard at `http://localhost:3000`

## Production Deployment (Fedora Server)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete server setup instructions.

**Summary:**
1. Install Nginx and Podman
2. Clone this repository
3. Configure Cloudflare Tunnel with wildcard routing
4. Set up Nginx reverse proxy
5. Deploy websites via dashboard

## Project Structure

```
.
├── dashboard/          # Next.js web interface
├── scripts/           # Generator and utility scripts
│   ├── generator.js       # Main container creation script
│   ├── mock_generator.js  # Dev fallback script
│   └── nginx-updater.js   # Nginx config manager
├── nginx-proxy/       # Nginx configurations
├── database/          # PostgreSQL schemas and seeds
├── data/              # Runtime data (mock_db.json)
└── containers/        # Container workspaces (generated)
```

## Usage

### Creating a Website

1. Navigate to Dashboard → Websites → Create New
2. Enter website name (will be subdomain)
3. Select template (HTML, PHP, Node.js)
4. Click "Create Website"
5. Access at `https://yourname.citaks.my.id`

### Managing Websites

- **Start/Stop**: Control container lifecycle
- **View Logs**: Monitor container output
- **Delete**: Remove website and container

## Configuration

### Environment Variables

**Dashboard (.env.local):**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL`: Dashboard URL
- `GENERATOR_MODE`: `production` or `mock`

**Generator (process.env):**
- `DRY_RUN`: Set to `true` to simulate commands
- `CONTAINER_DIR`: Base directory for containers

## Development vs Production

**Development (Windows):**
- Uses `mock_generator.js` or `generator.js` in dry-run mode
- Saves to `data/mock_db.json`
- No real containers created

**Production (Fedora Server):**
- Uses `generator.js` with real Podman commands
- Integrates with PostgreSQL
- Auto-updates Nginx proxy
- Real containers and subdomain routing

## Troubleshooting

### Dashboard shows 0 websites
- Check `data/mock_db.json` exists
- Verify database connection in logs

### Container creation fails
- Ensure Podman is installed: `podman --version`
- Check permissions: `sudo usermod -aG podman $USER`

### Subdomain not accessible
- Verify Nginx running: `sudo systemctl status nginx`
- Check proxy mapping: `cat nginx-proxy/proxy_map.conf`
- Test tunnel: `sudo systemctl status cloudflared`

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
