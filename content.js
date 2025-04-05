// content.js

// Debounce function to limit how often we process changes
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to highlight text
function highlightText() {
    // Get all text nodes in the document
    const textNodes = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Only process nodes that are visible and contain our target word
                const style = window.getComputedStyle(node.parentElement);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.textContent.includes('test') ? 
                    NodeFilter.FILTER_ACCEPT : 
                    NodeFilter.FILTER_REJECT;
            }
        },
        false
    );

    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    // Process the text nodes
    textNodes.forEach(node => {
        const text = node.nodeValue;
        if (text.includes('test')) {
            const span = document.createElement('span');
            span.innerHTML = text.replace(
                /(test)/gi,
                '<span style="background-color: yellow;">$1</span>'
            );
            node.parentNode.replaceChild(span, node);
        }
    });
}

// Create a debounced version of highlightText
const debouncedHighlight = debounce(highlightText, 250);

// Run once when the page loads
document.addEventListener('DOMContentLoaded', debouncedHighlight);

// Observe changes to the document
const observer = new MutationObserver(debouncedHighlight);
observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
}); 