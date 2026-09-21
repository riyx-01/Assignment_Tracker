// Background service worker for Vmedulife Scanner Extension

// Handle click on the Chrome Extension toolbar icon
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (tab && tab.url && tab.url.includes('vmedulife.com')) {
      // Trigger scan on the active Vmedulife tab
      triggerScanOnTab(tab.id);
    } else {
      // Look for an existing open Vmedulife tab
      const vmeduTabs = await chrome.tabs.query({ url: "*://*.vmedulife.com/*" });
      if (vmeduTabs && vmeduTabs.length > 0) {
        const targetTab = vmeduTabs[0];
        await chrome.tabs.update(targetTab.id, { active: true });
        if (targetTab.windowId) {
          await chrome.windows.update(targetTab.windowId, { focused: true });
        }
        triggerScanOnTab(targetTab.id);
      } else {
        // No Vmedulife tab found; navigate to the student assignment portal
        chrome.tabs.create({ url: "https://portal.vmedulife.com/student/Assignments//AssignmentList.php" });
      }
    }
  } catch (err) {
    console.error("Error in action.onClicked:", err);
  }
});

// Helper to reliably trigger scan on a tab
function triggerScanOnTab(tabId) {
  chrome.tabs.sendMessage(tabId, { action: 'TRIGGER_SCAN' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script may not have loaded yet, inject dynamically and retry
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }, () => {
        if (!chrome.runtime.lastError) {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'TRIGGER_SCAN' });
          }, 300);
        }
      });
    }
  });
}

// Handle incoming messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_DATA') {
    const assignments = request.payload || [];

    // Store assignments in extension storage
    chrome.storage.local.set({ assignmentsToSync: assignments }, async () => {
      // Show badge count
      if (assignments.length > 0) {
        chrome.action.setBadgeText({ text: `${assignments.length}` });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 5000);
      }

      // Check if an Assignment Tracker tab is already open (specifically localhost:5173 or vemedu-assign.vercel.app)
      const allTabs = await chrome.tabs.query({});
      
      // 1. Prefer local dev tab if already open
      let trackerTab = allTabs.find(t => 
        t.url && (
          t.url.includes('localhost:5173') ||
          t.url.includes('127.0.0.1:5173')
        )
      );

      // 2. Otherwise check for the specific vemedu-assign deployment
      if (!trackerTab) {
        trackerTab = allTabs.find(t => 
          t.url && t.url.includes('vemedu-assign.vercel.app')
        );
      }

      if (trackerTab) {
        // Focus existing tracker tab and inform it to sync immediately
        await chrome.tabs.update(trackerTab.id, { active: true });
        if (trackerTab.windowId) {
          await chrome.windows.update(trackerTab.windowId, { focused: true });
        }
        chrome.tabs.sendMessage(trackerTab.id, { 
          type: 'SYNC_NOW', 
          payload: assignments 
        });
      } else {
        // Check if localhost:5173 is alive before opening
        let targetUrl = "https://vemedu-assign.vercel.app/";
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600);
          await fetch("http://localhost:5173/", { signal: controller.signal, mode: 'no-cors' });
          clearTimeout(timeoutId);
          targetUrl = "http://localhost:5173/";
        } catch (e) {
          // localhost:5173 not running, use vercel deployment
        }

        chrome.tabs.create({ url: targetUrl });
      }

      sendResponse({ status: 'success', count: assignments.length });
    });

    return true; // Keep message channel open for async response
  }

  if (request.type === 'UPDATE_ASSIGNMENT_DETAILS') {
    const payload = request.payload || {};
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(t => {
        if (t.url && (t.url.includes('localhost:5173') || t.url.includes('vemedu-assign.vercel.app'))) {
          chrome.tabs.sendMessage(t.id, {
            type: 'UPDATE_DETAILS',
            payload
          });
        }
      });
    });
    sendResponse({ status: 'forwarded' });
    return true;
  }
});
