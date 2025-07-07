# Steam Library Organizer

A modern web application that helps you manage and discover games in your Steam library using AI-powered recommendations and smart categorization.

## ✨ Features

### 🎮 Steam Integration
- **Steam OpenID Authentication** - Works with both public and private Steam profiles
- **Real-time Library Sync** - Fetches your complete game library with playtime data
- **User Profile Display** - Shows Steam avatar and profile information

### 🤖 AI-Powered Recommendations
- **Chat Interface** - Ask AI about your games in natural language
- **Smart Game Analysis** - AI understands your gaming patterns and preferences
- **Contextual Suggestions** - Get personalized recommendations based on your actual library
- **Mood-based Filtering** - Find games that match your current gaming mood

### 📊 Smart Game Categorization
- **Unplayed Games** - Discover games you've never launched
- **Abandoned Games** - Games with < 2 hours (likely didn't enjoy)
- **Worth Revisiting** - Games with moderate playtime that you haven't played recently
- **In Progress** - Games you're currently working through
- **Completed** - Games with 50+ hours that you've likely finished

### 🎨 Modern UI/UX
- **Dark/Light Themes** - Steam-inspired aesthetics with full theme support
- **Responsive Design** - Works perfectly on desktop and mobile
- **Game Details Modal** - Detailed view with launch links and Steam store integration
- **Advanced Filtering** - Search, sort, and filter by playtime, activity, and collections

### 📚 Collections Management
- **Auto-Collections** - Automatically generated based on your gaming patterns
- **Custom Collections** - Create and manage your own game categories
- **Visual Organization** - Color-coded collections with game counts

## 🛠 Tech Stack

- **Framework**: Nuxt 3 (Vue 3 + TypeScript)
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: Pinia
- **AI Integration**: OpenAI GPT-4 API
- **Steam API**: Steam Web API with OpenID authentication
- **Build Tool**: Vite

## 🚀 Setup

### Prerequisites
- Node.js 18+ 
- Steam Web API key ([Get one here](https://steamcommunity.com/dev/apikey))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd steam-library-organizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   STEAM_API_KEY=your_steam_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 📖 Usage

### Getting Started
1. **Connect Steam Account** - Use Steam OpenID or manually enter your Steam ID
2. **Library Analysis** - The app automatically fetches and analyzes your games
3. **Explore Features** - Try the AI chat, browse recommendations, and organize collections

### AI Chat Examples
Ask the AI questions like:
- "What should I play next?"
- "Find me a relaxing game for tonight"
- "What games haven't I finished?"
- "Recommend a good co-op game"
- "Which games in my library are worth revisiting?"

### Collections
- **Auto-Collections**: Automatically generated (Abandoned, Worth Revisiting, Binge-worthy, etc.)
- **Custom Collections**: Create your own categories and organize games manually

## 🔒 Privacy & Security

- **No Data Storage**: All user data is processed locally and not stored on servers
- **Secure Authentication**: Uses official Steam OpenID for authentication
- **API Key Safety**: Environment variables keep your API keys secure
- **Local Preferences**: Theme and collection preferences stored in browser localStorage

## 🏗 Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

For deployment, ensure your hosting platform supports:
- Node.js server-side rendering
- Environment variables for API keys
- Static file serving

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STEAM_API_KEY` | Your Steam Web API key | Yes |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

## 🤝 Contributing

This project was built in collaboration with [Claude Code](https://claude.ai/code). Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Note**: This application is not affiliated with Valve Corporation or Steam. Steam is a trademark of Valve Corporation.