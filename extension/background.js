// ~/phish-project/extension/background.js - FINAL CORRECTED VERSION
const API_BASE = "https://shieldphish.onrender.com"; // Your Render URL

// This function will be INJECTED into the page, not called directly.
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

    if (data.label === 'phishing') {
      // STATE 1: MALICIOUS (Red Cross)
      chrome.action.setIcon({ path: { "128": "icons/shield-default.png" }, tabId: tabId });
      chrome.action.setBadgeText({ text: "X", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#D93025", tabId: tabId }); // Red
      // *** THE FIX IS HERE ***
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: showAlert,
        args: [`🚨 ShieldPhish Warning 🚨\n\nThis site is FLAGGED AS MALICIOUS.\nReason: ${data.reasons.join(", ")}`]
      });

    } else if (data.label === 'suspicious') {
      // STATE 2: SUSPICIOUS (Yellow Siren)
      chrome.action.setIcon({ path: { "128": "icons/shield-default.png" }, tabId: tabId });
      chrome.action.setBadgeText({ text: "🚨", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#F29900", tabId: tabId }); // Yellow/Amber
      // *** THE FIX IS HERE ***
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: showAlert,
        args: [`🚨 ShieldPhish Warning 🚨\n\nThis site is POTENTIALLY SUSPICIOUS.\nReason: ${data.reasons.join(", ")}`]
      });

    } else {
      // STATE 3: SAFE (Green Checkmark)
      chrome.action.setIcon({ path: { "128": "icons/shield-green.png" }, tabId: tabId });
      chrome.action.setBadgeText({ text: "✓", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#1E8E3E", tabId: tabId }); // Green
    }
  } catch (error) {
    console.error("ShieldPhish Error:", error.message);
    chrome.storage.local.set({ [`tab_${tabId}`]: { error: error.message } });
    chrome.action.setIcon({ path: { "128": "icons/shield-default.png" }, tabId: tabId });
    chrome.action.setBadgeText({ text: "", tabId: tabId });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    chrome.action.setIcon({ path: { "128": "icons/shield-default.png" }, tabId: tabId });
    chrome.action.setBadgeText({ text: "", tabId: tabId });
    checkUrlAndSetIcon(tabId, tab.url);
  }
});
