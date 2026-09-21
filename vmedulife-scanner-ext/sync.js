// This script runs on the React App's page
chrome.storage.local.get(['assignmentsToSync'], (result) => {
  if (result.assignmentsToSync && result.assignmentsToSync.length > 0) {
    console.log("Found assignments to sync from Vmedulife!");
    
    try {
      // 1. Get existing assignments from React app's localStorage
      const existingDataStr = window.localStorage.getItem('tracker_assignments');
      let existingAssignments = [];
      if (existingDataStr) {
        existingAssignments = JSON.parse(existingDataStr);
      }

      const newAssignments = result.assignmentsToSync;
      let addedCount = 0;

      // 2. Merge avoiding duplicates (by Title and Subject)
      newAssignments.forEach(newA => {
        const exists = existingAssignments.some(e => e.title === newA.title && e.subject === newA.subject);
        if (!exists) {
          existingAssignments.push(newA);
          addedCount++;
        }
      });

      // 3. Save back to React app's localStorage
      window.localStorage.setItem('tracker_assignments', JSON.stringify(existingAssignments));
      
      // 4. Clear the chrome storage so it doesn't sync again on refresh
      chrome.storage.local.remove('assignmentsToSync');

      // 5. Alert the app to update UI
      if (addedCount > 0) {
        window.dispatchEvent(new Event('tracker_sync'));
        // Slight delay so the React state catches up before alert blocks thread
        setTimeout(() => {
          alert(`Successfully auto-synced ${addedCount} new assignments to your tracker!`);
        }, 100);
      } else {
        setTimeout(() => {
          alert("Sync complete: No new assignments found (all were already in the tracker).");
        }, 100);
      }

    } catch (e) {
      console.error("Failed to sync assignments:", e);
      alert("Error syncing assignments to the tracker.");
    }
  }
});
