// New background.js with debugging logs
console.log("ShieldPhish background script loaded."); // Log 1: Confirms the script is running

const API_BASE = "https://shieldphish.onrender.com"; // Make sure your URL is correct here!

function showAlert(message) {
  alert(message);
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log("Tab updated event fired. Status:", changeInfo.status); // Log 2: Shows the listener is working

  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log("Checking URL:", tab.url); // Log 3: Confirms we are about to check the URL
    
    chrome.action.setIcon({ path: "icons/shield-default.png", tabId: tabId });

    try {
      const response = await fetch(`${API_BASE}/api/v1/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tab.url })
      });

      if (!response.ok) {
        // This will catch HTTP errors like 404 or 500
        console.error("API response was not OK. Status:", response.status);
        return; // Stop execution if the response is bad
      }
      
      const data = await response.json();
      console.log("API Response Data:", data); // Log 4: Shows the data received from Render

      if (data.label === 'phishing' || data.label === 'suspicious') {
        console.log("Result: Malicious. Setting icon to red."); // Log 5a
        chrome.action.setIcon({ path: "icons/shield-red.png", tabId: tabId });
        
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: showAlert,
          args: [`🚨 ShieldPhish Warning 🚨\n\nThis site is potentially malicious.\nReason: ${data.reasons.join(", ")}`]
        });

      } else {
        console.log("Result: Benign. Setting icon to green."); // Log 5b
        chrome.action.setIcon({ path: "icons/shield-green.png", tabId: tabId });
      }

    } catch (e) {
      // This will catch network errors (e.g., failed to fetch)
      console.error("ShieldPhish fetch error:", e.message); // Log 6: Catches any other errors
    }
  }
});
