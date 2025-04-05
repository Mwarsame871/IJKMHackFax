// content.js

// Track if the extension is enabled
let isEnabled = false;
let processingTimeout = null;
let lastApiCallTime = 0;
const API_COOLDOWN_MS = 10000; // 10 seconds

// Add CSS for highlights and animations
const style = document.createElement('style');
style.textContent = `
    .dog-whistle-highlight {
        cursor: help;
        padding: 2px 0;
        border-radius: 2px;
    }
    
    .dog-whistle-highlight[data-severity="1"] {
        background-color: rgba(255, 255, 0, 0.3);
    }
    
    .dog-whistle-highlight[data-severity="2"] {
        background-color: rgba(255, 165, 0, 0.3);
    }
    
    .dog-whistle-highlight[data-severity="3"] {
        background-color: rgba(132, 2, 2, 0.44);
    }
`;
document.head.appendChild(style);

// Function to safely update the enabled state
async function updateEnabledState(newState) {
    try {
        // Update storage first
        await chrome.storage.local.set({ isEnabled: newState });
        // Only update local state if storage was successful
        isEnabled = newState;
        console.log("[DWD] Extension state updated:", isEnabled);
        return true;
    } catch (error) {
        console.error("[DWD] Failed to update extension state:", error);
        return false;
    }
}

// Initialize extension state
chrome.storage.local.get('isEnabled', async (result) => {
    console.log("[DWD] Loading initial extension state...");
    try {
        // Check if we're in a restricted URL
        if (window.location.protocol === 'chrome:' || window.location.protocol === 'chrome-extension:') {
            console.log("[DWD] Skipping initialization for restricted URL");
            return;
        }

        // Set initial state
        const success = await updateEnabledState(result.isEnabled ?? false);
        if (success && isEnabled) {
            console.log("[DWD] Extension enabled on load, starting scan...");
            processPage();
        }
    } catch (error) {
        console.error("[DWD] Error during initialization:", error);
    }
});

// Listen for toggle changes
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("[DWD] Received message:", message);
    
    if (message.type === 'toggleChange') {
        // Check if we're in a restricted URL
        if (window.location.protocol === 'chrome:' || window.location.protocol === 'chrome-extension:') {
            console.log("[DWD] Ignoring toggle for restricted URL");
            return;
        }

        const success = await updateEnabledState(message.isEnabled);
        if (!success) {
            // If state update failed, notify popup
            chrome.runtime.sendMessage({
                type: 'updateStatus',
                error: 'Failed to update extension state'
            });
            return;
        }

        if (isEnabled) {
            console.log("[DWD] Extension enabled, starting scan...");
            processPage();
        } else {
            console.log("[DWD] Extension disabled, removing highlights...");
            removeHighlights();
            // Notify popup that highlights were removed
            chrome.runtime.sendMessage({
                type: 'updateStatus',
                count: 0
            });
        }
    }
});

// Debounced version of processPage
function debouncedProcessPage() {
    if (processingTimeout) {
        clearTimeout(processingTimeout);
    }
    processingTimeout = setTimeout(processPage, 500);
}

// Function to remove all highlights
function removeHighlights() {
    try {
        const highlights = document.querySelectorAll('.dog-whistle-highlight');
        console.log(`Removing ${highlights.length} highlights`);
        highlights.forEach(highlight => {
            const text = highlight.textContent;
            const textNode = document.createTextNode(text);
            highlight.parentNode.replaceChild(textNode, highlight);
        });
    } catch (error) {
        console.error("Error removing highlights:", error);
    }
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
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 300px;
    min-width: 200px;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    overflow: hidden;
    color: black;
`;

// Create the title bar
const titleBar = document.createElement('div');
titleBar.textContent = 'Explanation';
titleBar.style.cssText = `
    padding: 8px 12px;
    font-weight: 600;
    color: white;
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #6b4de6;
`;

// Create the dog icon
const dogIcon = document.createElement('span');
dogIcon.textContent = '🐶';
dogIcon.style.cssText = `
    font-size: 16px;
`;

// Create the content container
const content = document.createElement('div');
content.style.cssText = `
    padding: 12px;
     background-color: #6b4de6;
    color: black;
`;

// Assemble the tooltip
titleBar.prepend(dogIcon);
tooltip.appendChild(titleBar);
tooltip.appendChild(content);
document.body.appendChild(tooltip);

// Function to show tooltip
function showTooltip(event, explanation, severity) {
    // Set the content
    content.textContent = explanation;
    
    // Set color based on severity
    const colors = {
        1: '#FFA500', // Orange for yellow highlights
        2: '#FF6B00', // Darker orange
        3: '#A60101'  // Red
    };
    titleBar.style.backgroundColor = colors[severity] || colors[1];
    
    // Show tooltip
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
    
    // Trigger fade in
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
    });
}

// Function to hide tooltip
function hideTooltip() {
    tooltip.style.opacity = '0';
    setTimeout(() => {
        if (tooltip.style.opacity === '0') {
            tooltip.style.display = 'none';
        }
    }, 200); // Match transition duration
}

// Function to highlight a specific phrase with given severity
function highlightPhrase(node, phrase, severity, reason) {
    try {
        const text = node.textContent;
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        
        if (text.match(regex)) {
            console.log("[DWD] Found match for phrase:", phrase);
            const span = document.createElement('span');
            span.innerHTML = text.replace(regex, (match) => {
                return `<span class="dog-whistle-highlight" 
                             data-reason="${reason}"
                             data-severity="${severity}">${match}</span>`;
            });
            
            // Add event listeners to the new highlights
            span.querySelectorAll('.dog-whistle-highlight').forEach(highlight => {
                highlight.addEventListener('mouseenter', (e) => {
                    console.log("[DWD] Showing tooltip for:", e.target.textContent);
                    showTooltip(e, highlight.dataset.reason, highlight.dataset.severity);
                });
                highlight.addEventListener('mouseleave', hideTooltip);
            });
            
            node.parentNode.replaceChild(span, node);
            return true;
        }
        return false;
    } catch (error) {
        console.error("[DWD] Error highlighting phrase:", error, { phrase, severity, reason });
        return false;
    }
}

// Main function to process the page
async function processPage() {
    if (!isEnabled) {
        console.log("[DWD] Extension disabled, skipping processing");
        return;
    }

    console.log("[DWD] Starting page processing...");
    try {
        // Check cooldown for API call
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCallTime;
        
        if (timeSinceLastCall < API_COOLDOWN_MS) {
            console.log(`[DWD] Skipping API call - ${Math.ceil((API_COOLDOWN_MS - timeSinceLastCall) / 1000)}s cooldown remaining`);
            return;
        }

        // Verify parser is available
        if (typeof window.parseVisibleText !== 'function') {
            throw new Error("Parser function not available - please refresh the page");
        }

        // Get text blocks from parseVisibleText()
        console.log("[DWD] Getting text blocks...");
        const textBlocks = window.parseVisibleText();
        console.log(`[DWD] Found ${textBlocks.length} text blocks`);
        
        // Combine blocks into one string
        const fullText = textBlocks.join('\n\n');//problem
        
        // Skip if no substantial text
        /*
        if (fullText.trim().length < 50) { //problem
            console.log("[DWD] Not enough text to process (< 50 characters)");
            chrome.runtime.sendMessage({
                type: 'updateStatus',
                count: 0
            });
            return;
        }
        */
        // Verify API function is available
        if (typeof window.getDogWhistlesFromText !== 'function') {
            throw new Error("API function not available - please refresh the page");
        }

        // Update last API call time
        lastApiCallTime = now;

        // Get dog whistles from API
        console.log("[DWD] Calling OpenAI API...");
        let dogWhistles;
        try {
            const response = await window.getDogWhistlesFromText(fullText);
            // Handle both string and JSON responses
            if (typeof response === 'string') {
                try {
                    dogWhistles = JSON.parse(response);
                } catch (e) {
                    console.error("[DWD] Failed to parse API response as JSON:", e);
                    dogWhistles = [];
                }
            } else {
                dogWhistles = response;
            }
        } catch (error) {
            console.error("[DWD] API call failed:", error);
            dogWhistles = [];
        }
        
        console.log("[DWD] API response:", dogWhistles);
        
        if (!Array.isArray(dogWhistles) || !dogWhistles.length) {
            console.log("[DWD] No valid dog whistles found");
            chrome.runtime.sendMessage({
                type: 'updateStatus',
                count: 0
            });
            return;
        }

        // Remove existing highlights before processing
        removeHighlights();
        
        // Process each text node in the document
        console.log(`[DWD] Processing ${dogWhistles.length} phrases...`);
        let highlightCount = 0;
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
        const nodes = [];
        let node;
        while (node = walker.nextNode()) {
            nodes.push(node);
        }
        for(const node of nodes){
            for (const whistle of dogWhistles) {
                if (whistle && typeof whistle === 'object' && whistle.phrase) {
                    if (highlightPhrase(node, whistle.phrase, whistle.severity || 1, whistle.reason || 'Potential dog whistle detected')) {
                        highlightCount++;
                    }
                }
            }
        }
        
        console.log(`[DWD] Added ${highlightCount} highlights to the page`);
        
        // Update the popup with the count
        chrome.runtime.sendMessage({
            type: 'updateStatus',
            count: highlightCount
        });

    } catch (error) {
        console.error("[DWD] Error processing page:", error);
        chrome.runtime.sendMessage({
            type: 'updateStatus',
            error: error.message
        });
    }
}

// Run when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isEnabled) {
            console.log("Running on DOMContentLoaded");
            processPage();
        }
    });
} else {
    if (isEnabled) {
        console.log("Running immediately (page already loaded)");
        processPage();
    }
}

// Watch for content changes
const observer = new MutationObserver(() => {
    if (isEnabled) {
        processPage();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
}); 