// content.js

// Track if the extension is enabled
let isEnabled = false;

// Initialize extension state
chrome.storage.local.get('isEnabled', (result) => {
    isEnabled = result.isEnabled ?? false;
    if (isEnabled) {
        debouncedProcessPage();
    }
});

// Listen for toggle changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggleChange') {
        isEnabled = message.isEnabled;
        if (isEnabled) {
            debouncedProcessPage();
        } else {
            removeHighlights();
        }
    }
});

// Function to remove all highlights
function removeHighlights() {
    document.querySelectorAll('.dog-whistle-highlight').forEach(highlight => {
        const text = highlight.textContent;
        const textNode = document.createTextNode(text);
        highlight.parentNode.replaceChild(textNode, highlight);
    });
}

// Function to get highlight color based on severity
function getSeverityColor(severity) {
    switch(severity) {
        case 1: return 'yellow';
        case 2: return 'orange';
        case 3: return 'red';
        default: return 'yellow';
    }
}

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.style.cssText = `
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 300px;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
`;
document.body.appendChild(tooltip);

// Function to show tooltip
function showTooltip(event, explanation) {
    tooltip.textContent = explanation;
    tooltip.style.display = 'block';
    
    // Position tooltip near the mouse but ensure it stays within viewport
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = event.clientX + 10;
    let top = event.clientY + 10;
    
    // Adjust if tooltip would go off-screen
    if (left + rect.width > viewportWidth) {
        left = viewportWidth - rect.width - 10;
    }
    if (top + rect.height > viewportHeight) {
        top = viewportHeight - rect.height - 10;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

// Function to hide tooltip
function hideTooltip() {
    tooltip.style.display = 'none';
}

// Function to highlight a specific phrase with given severity
function highlightPhrase(node, phrase, severity, reason) {
    const text = node.textContent;
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    
    if (text.match(regex)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, (match) => {
            const color = getSeverityColor(severity);
            return `<span class="dog-whistle-highlight" 
                         style="background-color: ${color}; cursor: help;" 
                         data-reason="${reason}">${match}</span>`;
        });
        
        // Add event listeners to the new highlights
        span.querySelectorAll('.dog-whistle-highlight').forEach(highlight => {
            highlight.addEventListener('mouseenter', (e) => {
                showTooltip(e, highlight.dataset.reason);
            });
            highlight.addEventListener('mouseleave', hideTooltip);
        });
        
        node.parentNode.replaceChild(span, node);
        return true;
    }
    return false;
}

// Main function to process the page
async function processPage() {
    if (!isEnabled) return;

    try {
        console.log("Processing page...");
        // Get text blocks from parseVisibleText()
        const textBlocks = window.parseVisibleText();
        console.log("Text blocks:", textBlocks);
        
        // Combine blocks into one string
        const fullText = textBlocks.join('\n\n');
        
        // Skip if no substantial text
        if (fullText.trim().length < 50) {
            console.log("Not enough text to process");
            return;
        }
        
        // Get dog whistles from API
        console.log("Calling API...");
        const dogWhistles = await window.getDogWhistlesFromText(fullText);
        console.log("API response:", dogWhistles);
        
        if (!dogWhistles || !dogWhistles.length) {
            console.log("No dog whistles found");
            return;
        }
        
        // Process each text node in the document
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip if node is not visible
                    const style = window.getComputedStyle(node.parentElement);
                    if (style.display === 'none' || style.visibility === 'hidden') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip if node is in a script or style tag
                    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            // Process each dog whistle for this text node
            for (const whistle of dogWhistles) {
                highlightPhrase(node, whistle.phrase, whistle.severity, whistle.reason);
            }
        }
        
        // Update extension popup status if any dog whistles were found
        chrome.runtime.sendMessage({
            type: 'updateStatus',
            count: dogWhistles.length
        });
        
        console.log("Page processing complete");
        
    } catch (error) {
        console.error('Error processing page:', error);
    }
}

// Debounce function to limit processing frequency
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

// Create debounced version of processPage
const debouncedProcessPage = debounce(processPage, 1000);

// Run when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isEnabled) {
            console.log("Running on DOMContentLoaded");
            debouncedProcessPage();
        }
    });
} else {
    if (isEnabled) {
        console.log("Running immediately (page already loaded)");
        debouncedProcessPage();
    }
}

// Watch for content changes
const observer = new MutationObserver(() => {
    if (isEnabled) {
        debouncedProcessPage();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
}); 