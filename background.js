// background.js

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
    console.log('Dog Whistle Detector extension installed');
}); 