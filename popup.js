// popup.js

document.addEventListener('DOMContentLoaded', async () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('status');

    // Load saved state
    const { isEnabled } = await chrome.storage.local.get('isEnabled');
    toggleSwitch.checked = isEnabled ?? false;
    updateStatus(isEnabled);

    // Handle toggle changes
    toggleSwitch.addEventListener('change', async (e) => {
        const isEnabled = e.target.checked;
        
        // Save state
        await chrome.storage.local.set({ isEnabled });
        
        // Update UI
        updateStatus(isEnabled);

        // Send message to all tabs to update content script
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'toggleChange',
                isEnabled: isEnabled
            }).catch(() => {
                // Ignore errors for tabs where content script isn't loaded
            });
        });
    });

    // Listen for status updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'updateStatus' && toggleSwitch.checked) {
            if (message.count > 0) {
                statusText.textContent = `Found ${message.count} dog whistle${message.count === 1 ? '' : 's'}!`;
            } else {
                statusText.textContent = 'no dog whistles detected...';
            }
        }
    });
});

// Update status text based on toggle state
function updateStatus(isEnabled) {
    const statusText = document.getElementById('status');
    if (!isEnabled) {
        statusText.textContent = 'Wissl Watch is disabled';
    } else {
        statusText.textContent = 'no dog whistles detected...';
    }
} 