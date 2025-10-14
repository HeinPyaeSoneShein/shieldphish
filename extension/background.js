const API_BASE = "https://shieldphish.onrender.com"; // We will point this to your live Render URL

function showAlert(message) {
  alert(message);
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {

    chrome.action.setIcon({ path: "icons/shield-default.png", tabId: tabId });

    try {
      const response = await fetch(`${API_BASE}/api/v1/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tab.url })
      });
      const data = await response.json();

      if (data.label === 'phishing' || data.label === 'suspicious') {
        // Malicious: Set icon to red and show an alert
        chrome.action.setIcon({ path: "icons/shield-red.png", tabId: tabId });

        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: showAlert,
          args: [`🚨 ShieldPhish Warning 🚨\n\nThis site is potentially malicious.\nReason: ${data.reasons.join(", ")}`]
        });

      } else {
        // Benign: Just set the icon to green, no alert
        chrome.action.setIcon({ path: "icons/shield-green.png", tabId: tabId });
      }

    } catch (e) {
      console.error("ShieldPhish Error:", e.message);
    }
  }
});
