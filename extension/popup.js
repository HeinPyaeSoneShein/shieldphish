document.addEventListener('DOMContentLoaded', async () => {
  const messageEl = document.getElementById('message');
  
  // Find the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    // Retrieve the stored scan result for this tab
    const result = await chrome.storage.local.get([`tab_${tab.id}`]);
    const data = result[`tab_${tab.id}`];

    if (data && !data.error) {
      if (data.label === 'benign') {
        messageEl.textContent = "✅ This site is considered safe.";
      } else {
        // This message will show if you click the red icon
        messageEl.textContent = `🚨 Status: ${data.label}\nScore: ${data.score}\nReason: ${data.reasons.join(', ')}`;
      }
    } else if (data && data.error) {
      messageEl.textContent = "Error checking this site. Could not connect to the API.";
    } else {
      messageEl.textContent = "No data available for this page.";
    }
  }
});
