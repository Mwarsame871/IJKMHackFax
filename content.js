// content.js

// Import the API function
import { getDogWhistlesFromText } from './api.js';

// Function to get highlight color based on severity
function getSeverityColor(severity) {
    switch(severity) {
        case 1: return 'yellow';
        case 2: return 'orange';
        case 3: return 'red';
        default: return 'yellow';
    }
}

// Create and style the tooltip element
const tooltip = document.createElement('div');
tooltip.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 300px;
    display: none;
`;
document.body.appendChild(tooltip);

// Function to show tooltip
function showTooltip(event, explanation) {
    tooltip.textContent = explanation;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
}

// Function to hide tooltip
function hideTooltip() {
    tooltip.style.display = 'none';
}

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

// Function to process text with OpenAI API
async function processTextWithAPI(text) {
    try {
        const dogWhistles = await getDogWhistlesFromText(text);
        return dogWhistles;
    } catch (error) {
        console.error('Error processing text with API:', error);
        return [];
    }
}

// Function to highlight text
async function highlightText() {
    // Get all text nodes in the document
    const textNodes = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Only process nodes that are visible
                const style = window.getComputedStyle(node.parentElement);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );

    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    // Process the text nodes
    for (const node of textNodes) {
        const text = node.nodeValue;
        if (text.trim().length > 0) {
            const dogWhistles = await processTextWithAPI(text);
            
            if (dogWhistles.length > 0) {
                let newHTML = text;
                let hasMatch = false;

                for (const whistle of dogWhistles) {
                    const regex = new RegExp(`(${whistle.phrase})`, 'gi');
                    if (text.toLowerCase().includes(whistle.phrase.toLowerCase())) {
                        hasMatch = true;
                        const color = getSeverityColor(whistle.severity);
                        newHTML = newHTML.replace(
                            regex,
                            `<span class="dog-whistle-highlight" 
                                  style="background-color: ${color}; cursor: pointer;" 
                                  data-explanation="${whistle.reason}">$1</span>`
                        );
                    }
                }

                if (hasMatch) {
                    const span = document.createElement('span');
                    span.innerHTML = newHTML;
                    node.parentNode.replaceChild(span, node);
                }
            }
        }
    }

    // Add click handlers to highlighted phrases
    document.querySelectorAll('.dog-whistle-highlight').forEach(highlight => {
        highlight.addEventListener('click', (event) => {
            event.stopPropagation();
            showTooltip(event, highlight.dataset.explanation);
        });
    });
}

// Hide tooltip when clicking anywhere else
document.addEventListener('click', hideTooltip);

// Create a debounced version of highlightText
const debouncedHighlight = debounce(highlightText, 1000);

// Run once when the page loads
document.addEventListener('DOMContentLoaded', debouncedHighlight);

// Observe changes to the document
const observer = new MutationObserver(debouncedHighlight);
observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
}); 