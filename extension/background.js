const API_BASE = "https://shieldphish.onrender.com"; // Your Render URL

function showAlert(message) {
  alert(message);
}

// This function runs automatically on page load
async function checkUrlAndSetIcon(tabId, url) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    
    // Save the result for the popup to access
    chrome.storage.local.set({ [`tab_${tabId}`]: data });

    if (data.label === 'phishing' || data.label === 'suspicious') {
      chrome.action.setIcon({ path: "icons/shield-red.png", tabId: tabId });
      // Show an immediate alert for dangerous sites
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: showAlert,
        args: [`🚨 ShieldPhish Warning 🚨\n\nThis site is potentially malicious.\nReason: ${data.reasons.join(", ")}`]
      });
    } else {
      chrome.action.setIcon({ path: "icons/shield-green.png", tabId: tabId });
    }

  } catch (error) {
    console.error("ShieldPhish Error:", error.message);
    // If there's an error, save an error state
    chrome.storage.local.set({ [`tab_${tabId}`]: { error: error.message } });
    chrome.action.setIcon({ path: "icons/shield-default.png", tabId: tabId });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    chrome.action.setIcon({ path: "icons/shield-default.png", tabId: tabId });
    checkUrlAndSetIcon(tabId, tab.url);
  }
});
