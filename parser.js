/**
 * Used for standard web articles(not social media posts)
 * Grabs tags that are commonly found in webpage articles
 * */
function parseArticleText() {
    console.log("Running article parser...");
    const selectors = [
        'article',
        'section',
        'main',
        'div[id*="content"]',
        'div[class*="content"]',
        'div[class*="article"]',
        'p',
        'h1, h2, h3, h4',
        'ul',
        'ol',
        'li'
    ];
    //avoids duplicate chunks of text.
    const seen = new Set();
    //stores all parsed text blocks that will be analyzed
    const content = [];

    //gets all elements that contain the tags listed in selectors and adds them to content
    document.querySelectorAll(selectors.join(',')).forEach(el => {
        const text = el.innerText.trim();
        if (
            text.length > 50 &&
            !seen.has(text) &&
            el.offsetHeight > 0 &&
            el.offsetWidth > 0
        ) {
            seen.add(text);
            content.push(text);
        }
    });

    console.log(`Article parser found ${content.length} text blocks`);
    return content;
}

//Social media post parser
function parseSocialMediaText() {
    console.log("Running social media parser...");
    const allText = [];

    // Facebook posts
    document.querySelectorAll('div[data-ad-preview="message"]').forEach(post => {
        allText.push(post.innerText.trim());
    });

    // Twitter/X posts
    document.querySelectorAll('article div[lang]').forEach(post => {
        allText.push(post.innerText.trim());
    });

    // Reddit posts
    document.querySelectorAll('h3, .md').forEach(post => {
        allText.push(post.innerText.trim());
    });

    console.log(`Social media parser found ${allText.length} posts`);
    return allText;
}

/**
 * Twitter parser
 * */
const seenTexts = new Set();
function parseTwitterPosts() {
    console.log("Running Twitter parser...");
    const posts = [];

    // Select tweet containers
    document.querySelectorAll('article').forEach(article => {
        // Inside each article, find elements with a language attribute
        const tweetParts = article.querySelectorAll('div[lang]');

        const fullText = Array.from(tweetParts)
            .map(el => el.innerText.trim())
            .join('\n');

        if (fullText.length > 0 && !seenTexts.has(fullText)) {
            seenTexts.add(fullText);
            posts.push(fullText);
        }
    });

    console.log(`Twitter parser found ${posts.length} tweets`);
    return posts;
}

// Function to determine which parser to use based on the current site
function determineParser() {
    const hostname = window.location.hostname.toLowerCase();
    console.log("Determining parser for:", hostname);

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        console.log("Using Twitter parser");
        return parseTwitterPosts;
    } else if (
        hostname.includes('reddit.com') || 
        hostname.includes('facebook.com')
    ) {
        console.log("Using social media parser");
        return parseSocialMediaText;
    } else {
        console.log("Using article parser");
        return parseArticleText;
    }
}

// Attach the appropriate parser to window.parseVisibleText
function initializeParser() {
    try {
        window.parseVisibleText = determineParser();
        console.log("Parser initialized successfully");
    } catch (error) {
        console.error("Error initializing parser:", error);
        // Fallback to article parser if something goes wrong
        window.parseVisibleText = parseArticleText;
    }
}

// Initialize parser when the script loads
initializeParser();