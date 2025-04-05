
/**
 * Used for standard web articles(not social media posts)
 * Grabs tags that are commonly found in webpage articles
 * */
function parseVisibleText() {
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

    //gets all elements that contain the tags listed in selectors and adds them to content, it also gets rid of small text boxes that contain filler 
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

    //console.log("📄 Parsed article content:", content);
    return content;
}

//Social media post parser
function extractSocialMediaText() {
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

    //console.log("Parsed Social Media Posts:", allText);
    return allText;
}

/**
 * Twitter parser
 * */
const seenTexts = new Set();
function extractTwitterPosts() {
    const posts = [];

    // Select tweet containers (each "post" is an <article>)
    document.querySelectorAll('article').forEach(article => {
        // Inside each article, find elements with a language attribute (these usually hold tweet text)
        const tweetParts = article.querySelectorAll('div[lang]');

        const fullText = Array.from(tweetParts)
            .map(el => el.innerText.trim())
            .join('\n');

        if (fullText.length > 0 && !seenTexts.has(fullText)) {
            seenTexts.add(fullText);
            posts.push(fullText);
        }
    });
    /*
    if (posts.length > 0) {
        console.log("Parsed Twitter/X posts:", posts);
    }
        */

}

/**
* Starts a mutation observer for Twitter that runs the parser
*/
function observePosts(parserFunction) {
    parserFunction(); // Initial parse

    const observer = new MutationObserver(() => {
        setTimeout(parserFunction, 1000); // small delay to allow new tweets to finish loading
    });

    observer.observe(document.body, { childList: true, subtree: true });

   // console.log("observer running...");


    window.Observer = () => {
        observer.disconnect();
       // console.log("observer stopped");
    };
}
//calls the method
if (location.hostname.includes('reddit') || location.hostname.includes('facebook')) {
    extractSocialMediaText();
    setTimeout(() => observePosts(extractSocialMediaText), 2000);
} else if (location.hostname.includes('twitter') || location.hostname.includes('x')) {
    setTimeout(() => observePosts(extractTwitterPosts), 2000);
} else {
    setTimeout(() => parseVisibleText(), 2000);
}