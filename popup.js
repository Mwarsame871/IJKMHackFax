// popup.js

document.addEventListener('DOMContentLoaded', async () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('status');
    let isUpdatingState = false;

    // Function to safely update the toggle state
    async function updateToggleState(newState, userInitiated = false) {
        if (isUpdatingState) return;
        isUpdatingState = true;

        try {
            // Update storage
            await chrome.storage.local.set({ isEnabled: newState });
            
            // Update UI
            toggleSwitch.checked = newState;
            updateStatus(newState);

            // Only send message to tabs if this was triggered by user action
            if (userInitiated) {
                const tabs = await chrome.tabs.query({active: true, currentWindow: true});
                for (const tab of tabs) {
                    try {
                        // Skip chrome:// and other restricted URLs
                        if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                            await chrome.tabs.sendMessage(tab.id, {
                                type: 'toggleChange',
                                isEnabled: newState
                            });
                        }
                    } catch (error) {
                        console.error(`[DWD] Error sending message to tab ${tab.id}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('[DWD] Error updating toggle state:', error);
            // Revert UI if storage update failed
            toggleSwitch.checked = !newState;
            updateStatus(!newState);
        } finally {
            isUpdatingState = false;
        }
    }

    // Load saved state
    try {
        const { isEnabled } = await chrome.storage.local.get('isEnabled');
        await updateToggleState(isEnabled ?? false, false);
    } catch (error) {
        console.error('[DWD] Error loading initial state:', error);
        await updateToggleState(false, false);
    }

    // Handle toggle changes
    toggleSwitch.addEventListener('change', async (e) => {
        await updateToggleState(e.target.checked, true);
    });

    // Add transition style to status text
    statusText.style.transition = 'opacity 0.2s ease-in-out';

    // Listen for status updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'updateStatus') {
            if (message.error) {
                updateStatusWithAnimation(`error: ${message.error}`, true);
                return;
            }
            
            // Only update status if the toggle is still in the same state
            chrome.storage.local.get('isEnabled', (result) => {
                if (result.isEnabled === toggleSwitch.checked) {
                    if (toggleSwitch.checked) {
                        if (message.count > 0) {
                            statusText.textContent = `Found ${message.count} dog whistle${message.count === 1 ? '' : 's'}!`;
                        } else {
                            statusText.textContent = 'No dog whistles detected...';
                        }
                    }
                }
            });
        }
    });
});

// Update status text based on toggle state
function updateStatus(isEnabled) {
    const statusText = document.getElementById('status');
    if (!isEnabled) {
        statusText.textContent = 'Extension is disabled';
    } else {
        statusText.textContent = 'Scanning...';
    }
} 