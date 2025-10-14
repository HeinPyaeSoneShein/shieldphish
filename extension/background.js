// ~/shieldphish-final/extension/background.js
const API_BASE = "https://shieldphish.onrender.com"; // Your Render URL

function showAlert(message) {
  alert(message);
}

async function checkUrlAndSetIcon(tabId, url) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url })
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    chrome.storage.local.set({ [`tab_${tabId}`]: data });

    if (data.label === 'phishing' || data.label === 'suspicious') {
      // Keep the default blue icon, but add a red "X" badge
      chrome.action.setIcon({ path: { "128": "icons/shield-default.png" }, tabId: tabId });
      chrome.action.setBadgeText({ text: "X", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#D93025", tabId: tabId }); // A strong red color

      // Show an immediate alert for dangerous sites
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: showAlert,
        args: [`🚨 ShieldPhish Warning 🚨\n\nThis site is potentially malicious.\nReason: ${data.reasons.join(", ")}`]
      });

    } else {
      // Set the icon to green for safe sites
      chrome.action.setIcon({ path: { "128": "icons/shield-green.png" }, tabId: tabId });
      // IMPORTANT: Remove the badge for safe sites by setting text to empty
      chrome.action.setBadgeText({ text: "", tabId: tabId });
    }
  } catch (error) {
    console.error("ShieldPhish Error:", error.message);
    chrome.storage.local.set({ [`tab_${tabId}`]: { error: error.message } });
    chrome.action.setIcon({ path: { "128": "icons/shield-default.png" }, tabId: tabId });
    // Ensure badge is also cleared on error
    chrome.action.setBadgeText({ text: "", tabId: tabId });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Set default icon and clear badge at the start of every check
    chrome.action.setIcon({ path: { "128": "icons/shield-default.png" }, tabId: tabId });
    chrome.action.setBadgeText({ text: "", tabId: tabId });
    checkUrlAndSetIcon(tabId, tab.url);
  }
});
