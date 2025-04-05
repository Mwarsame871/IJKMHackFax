# # 🐶 Wissl Watch – Detect Hidden Dog Whistles in Real-Time

**Built by Team IJAM for HackFax 2025**
By: Idris Barakzai, Andy No, Mohamed Warsame, and Jack wallace

Wissl Watch is a Chrome extension that detects **dog whistle language** — subtle or coded phrases used to express harmful ideologies — while you browse websites like Reddit, Twitter/X, or news articles.

It highlights flagged phrases with colors based on severity and explains why they might be dangerous, giving users the tools to better understand hidden biases in online language.

---

## 🚀 Features

- **AI-powered detection** using OpenAI’s GPT API
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



How to Use Wissl Watch From Source Files (Dev Mode)
Follow these steps to install and use the extension locally on Chrome:

🔧 Step 1: Clone or Download the Repo
If you haven’t already, clone this repo:

bash
Copy
Edit
git clone https://github.com/Mwarsame871/IJKMHackFax.git
Or download the ZIP and extract it.

Step 2: Load the Extension in Chrome
Open Chrome and go to:
chrome://extensions/

In the top right, enable Developer Mode

Click “Load unpacked”

Select the folder where this project (IJKMHackFax/) is located

You’ll now see Wissl Watch in your list of extensions!

🔁 Step 3: Use the Extension
Click the Wissl Watch icon in your extensions bar

Toggle the switch to enable dog whistle detection

Navigate to Reddit, Twitter/X, or an article-based site

The extension will scan the visible content and highlight any flagged dog whistles with:

🟡 Yellow (mild)

🟠 Orange (moderate)

🔴 Red (severe)

Hover over a highlighted word to see an explanation tooltip powered by AI

⚠️ Note:
This extension runs in real time, scanning as you scroll

API calls are rate-limited to once every 15 seconds

You must have an internet connection for AI detection to work