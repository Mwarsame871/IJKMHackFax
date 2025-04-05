# # 🐶 Wissl Watch – Detect Hidden Dog Whistles in Real-Time

**Built by Team IJAM for HackFax 2025**
By: Idris Barakzai, Andy No, Mohamed Warsame, and Jack wallace

Wissl Watch is a Chrome extension that detects **dog whistle language** — subtle or coded phrases used to express harmful ideologies — while you browse websites like Reddit, Twitter/X, or news articles.

It highlights flagged phrases with colors based on severity and explains why they might be dangerous, giving users the tools to better understand hidden biases in online language.

---

## 🚀 Features

- **AI-powered detection** using OpenAI's GPT API
- **Color-coded highlights** (Yellow = mild, Orange = moderate, Red = severe)
- **Tooltips** that explain why each phrase was flagged, including a custom dog icon
- **Community Mode** (in progress): users can add their own dog whistles and explanations
- Works on:
  - Reddit
  - Twitter/X
  - Facebook
  - Most article-based websites

---

## 📸 Demo

![Wissl Watch detecting dog whistle phrases on Reddit](screenshot.png)

---

## 🔧 How It Works

1. The extension **parses visible text** on the page using a MutationObserver
2. Every 15 seconds, it checks for new content (with cooldown protection)
3. Parsed text is sent to the **OpenAI API**, which returns potential dog whistles
4. Flagged phrases are **highlighted** and explained via custom tooltips

---

## 🛠 Installation (Dev Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/Mwarsame871/IJKMHackFax.git

## Setup

1. Clone this repository
2. Copy `secrets.example.js` to `secrets.js`
3. Replace `YOUR_API_KEY_HERE` in `secrets.js` with your OpenAI API key (Make sure to provide your own API key!!)
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## API Key Setup

This extension requires an OpenAI API key to function. To set up your API key:

1. Sign up for an OpenAI account at https://platform.openai.com/
2. Generate an API key in your OpenAI dashboard
3. Create `secrets.js` by copying `secrets.example.js`
4. Replace `YOUR_API_KEY_HERE` with your actual OpenAI API key

**Important**: Never commit your `secrets.js` file to version control. It is already added to `.gitignore` to prevent accidental commits.

## Features

- Detects potentially racially coded language on web pages
- Highlights detected phrases with different colors based on severity
- Shows explanations in tooltips on hover
- Toggle extension on/off via popup
- Works on most websites including social media platforms

## Development

The extension uses:
- Chrome Extension Manifest V3
- OpenAI GPT API for detection
- Custom parsing for different types of web content

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

## Debugging Notice

1.If the extension doesn't work after a minute, make sure to refresh the page after turning the extension on!
   
## Security Note

Never share your API key or commit it to version control. The `secrets.js` file is ignored by git to prevent accidental exposure of API keys.
