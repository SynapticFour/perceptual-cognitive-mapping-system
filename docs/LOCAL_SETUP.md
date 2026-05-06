# Local Setup Guide
## Perceptual & Cognitive Mapping System

### One-Command Setup (Recommended)

For macOS users (including MacBook Air M4), simply run:

```bash
./setup.sh
```

This script will automatically:
- Check system requirements (macOS, Homebrew, Node.js)
- Install missing dependencies
- Set up the project environment
- Build the application
- Provide instructions for starting the server

### Manual Setup

If you prefer manual setup or are not using macOS:

#### Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org) or install via Homebrew
- **npm** - Comes with Node.js
- **Git** - For cloning the repository (if needed)

#### Installation Steps

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd perceptual-cognitive-mapping-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your configuration (optional for testing):
   ```bash
   # For local-only runs, Supabase vars can be placeholders
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Server-only (research export, delete-session, ethics audit) — set when testing those APIs
   RESEARCH_EXPORT_API_KEY=your_secret
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   NODE_ENV=development
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

### Running the System

#### Start Development Server

```bash
npm run dev
```

The system will be available at (English default; German uses `/de/...`):
- **Landing**: http://localhost:3000/
- **Consent**: http://localhost:3000/consent
- **Assessment**: http://localhost:3000/questionnaire
- **Results**: http://localhost:3000/results (after completing assessment and assent when shown)

#### Build for Production

```bash
npm run build
npm start
```

### Testing Without Data Collection

You can test the complete system without setting up Supabase:

1. Run the setup script: `./setup.sh`
2. When prompted for Supabase credentials, you can skip this step
3. Start the server: `npm run dev`
4. Complete the assessment - all features work locally
5. Results are stored in browser localStorage only

### Setting Up Data Collection (Optional)

For full functionality including research data collection:

1. **Create Supabase Account**:
   - Visit [supabase.com](https://supabase.com)
   - Sign up for a free account

2. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Set project name (e.g., "pcms-research")
   - Set database password
   - Choose region closest to you

3. **Get API Credentials**:
   - Go to Settings > API
   - Copy the Project URL
   - Copy the anon public key

4. **Set Up Database**:
   - Preferred: use Supabase CLI and run `supabase db push` from this repository.
   - Alternative: apply SQL files in `supabase/migrations/` in timestamp order (base schema first).
   - Include ethics migrations if you use ethics/audit features.

5. **Update Environment**:
   - Edit `.env.local`
   - Add your Supabase URL and anon key:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. **Restart the Server**:
   ```bash
   npm run dev
   ```

### Troubleshooting

#### Common Issues

**"Command not found: node"**
```bash
# Install Node.js via Homebrew
brew install node
```

**"Permission denied" running setup script**
```bash
chmod +x setup.sh
./setup.sh
```

**Port 3000 already in use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

**Dependencies not installing**
```bash
# Clear npm cache
npm cache clean --force
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json
# Reinstall
npm install
```

#### macOS Specific Issues

**Apple Silicon (M1/M2/M4) Node.js Issues**
```bash
# Ensure you're using ARM64 version of Node
arch -arm64 node --version
# Reinstall Node for ARM64 if needed
brew uninstall node
brew install node
```

**Homebrew not in PATH**
```bash
# Add Homebrew to PATH (ARM64 Macs)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

### Development Workflow

#### Making Changes

1. Edit source files in `src/` directory
2. Changes auto-reload in development mode
3. Check browser console for errors
4. Test changes by completing assessment

#### Project Structure

```
src/
|-- app/[locale]/       # Next.js App Router + locale
|   |-- page.tsx        # Landing
|   |-- consent/        # Multi-step consent
|   |-- questionnaire/  # Assessment interface
|   |-- results/        # Results visualization
|-- i18n/               # next-intl
|-- components/         # React components
|   |-- questionnaire/  # Assessment components
|   |-- results/        # Results components
|-- model/             # Cognitive model definitions
|-- data/              # Questions and adaptations
|-- adaptive/          # Adaptive questionnaire engine
|-- scoring/           # Response processing
|-- lib/               # Utilities and data collection
```

#### Running Tests

```bash
# Typecheck + ESLint + question validation + Vitest
npm test

# Same static gate without unit tests
npm run check

# Linting only
npm run lint

# Type checking only
npm run type-check

# Unit tests only
npm run test:unit

# Build verification
npm run build
```

End-to-end (Playwright; starts `npm run dev` automatically unless a server is already on port 3000):

```bash
npx playwright install   # once per machine
npm run test:e2e
```

### Performance Optimization

#### For MacBook Air M4

The system is optimized for Apple Silicon Macs:

- **Native ARM64 support** through Next.js
- **Efficient bundle size** with code splitting
- **Optimized images** through Next.js Image component
- **Fast development server** with hot reload

#### Memory Usage

- Development server: ~200-400MB RAM
- Build process: ~500-800MB RAM
- Browser with application: ~100-300MB RAM

### Security Considerations

#### Local Development

- No external data collection without Supabase setup
- All data stored locally in browser
- No network requests for core functionality
- Pseudonymous assessment by default

#### Production Deployment

- Always use environment variables for secrets
- Enable HTTPS in production
- Review Supabase security settings
- Monitor data access logs

### Getting Help

#### Resources

- **README.md**: Main project documentation
- **docs/**: Detailed documentation
- **supabase/migrations/**: Database structure and policy migrations
- **setup.sh**: Automated setup script

#### Common Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Run setup script
./setup.sh

# Check Node.js version
node --version

# Check npm version
npm --version

# Clear development data
npm run clean  # if available
```

#### Support

For issues with:
- **Setup**: Check this guide first
- **Supabase**: Consult Supabase documentation
- **Node.js**: Check Node.js documentation
- **macOS**: Consult Apple support resources

---

**Note**: This system is designed for research and self-understanding purposes only. It is not a medical or diagnostic tool.
