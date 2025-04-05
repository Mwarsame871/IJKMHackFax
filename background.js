// background.js

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
    console.log('Dog Whistle Detector extension installed');
    // Initialize extension state
    chrome.storage.local.set({ isEnabled: false });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateStatus') {
        // Forward the message to the popup if it's open
        chrome.runtime.sendMessage(message);
    }
}); 