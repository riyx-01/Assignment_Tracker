chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_DATA') {
    chrome.storage.local.set({ assignmentsToSync: request.payload }, () => {
      // Open the tracker in a new tab so the sync script can inject the data
      chrome.tabs.create({ url: "https://vemedu-assign.vercel.app/" });
      sendResponse({ status: 'success' });
    });
    return true; // Keep message channel open for async response
  }
});
