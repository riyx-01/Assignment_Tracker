// sync.js - Content script running on the Assignment Tracker web app

// In-app sleek notification banner
function showTrackerToast(message) {
  let toast = document.getElementById('tracker-sync-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tracker-sync-toast';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>${message}</span>`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
  }, 4000);
}

// Core merge and dispatch logic
function processSync(newAssignments) {
  if (!Array.isArray(newAssignments) || newAssignments.length === 0) return;

  try {
    // 1. Get existing assignments from React app's localStorage
    const existingDataStr = window.localStorage.getItem('tracker_assignments');
    let existingAssignments = [];
    if (existingDataStr) {
      try {
        existingAssignments = JSON.parse(existingDataStr);
      } catch (e) {
        existingAssignments = [];
      }
    }

    let addedCount = 0;
    let updatedCount = 0;

    const normalize = (str) => (str || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

    newAssignments.forEach(newA => {
      const existingIdx = existingAssignments.findIndex(e => 
        normalize(e.title) === normalize(newA.title) && 
        normalize(e.subject) === normalize(newA.subject)
      );

      if (existingIdx !== -1) {
        // Update deadline and details if changed
        existingAssignments[existingIdx] = {
          ...existingAssignments[existingIdx],
          deadline: newA.deadline || existingAssignments[existingIdx].deadline,
          startDate: newA.startDate || existingAssignments[existingIdx].startDate,
          details: newA.details || existingAssignments[existingIdx].details || '',
          totalMarks: newA.totalMarks ?? existingAssignments[existingIdx].totalMarks,
          instructor: newA.instructor || existingAssignments[existingIdx].instructor,
          instructions: newA.instructions || existingAssignments[existingIdx].instructions
        };
        updatedCount++;
      } else {
        existingAssignments.push(newA);
        addedCount++;
      }
    });

    // 2. Save back to localStorage
    window.localStorage.setItem('tracker_assignments', JSON.stringify(existingAssignments));

    // 3. Dispatch multi-channel events so React hook catches it across contexts
    // Channel A: postMessage (standard cross-world communication)
    window.postMessage({ 
      type: 'TRACKER_SYNC', 
      payload: existingAssignments,
      addedCount,
      updatedCount 
    }, '*');

    // Channel B: CustomEvents on window and document
    const syncEvent = new CustomEvent('tracker_sync', { detail: existingAssignments });
    window.dispatchEvent(syncEvent);
    document.dispatchEvent(syncEvent);

    // 4. Visual toast feedback
    if (addedCount > 0 || updatedCount > 0) {
      showTrackerToast(`🚀 Synced ${addedCount} new & updated ${updatedCount} assignments!`);
    } else {
      showTrackerToast("✅ Assignments are already up to date!");
    }

  } catch (err) {
    console.error("Failed to sync assignments:", err);
  }
}

// Update details for a specific assignment
function updateSingleAssignmentDetails({ title, details }) {
  if (!details) return;

  try {
    const existingDataStr = window.localStorage.getItem('tracker_assignments');
    if (!existingDataStr) return;
    const assignments = JSON.parse(existingDataStr);

    const normalize = (str) => (str || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
    const targetTitle = normalize(title);

    let updated = false;
    assignments.forEach(a => {
      if (!targetTitle || normalize(a.title).includes(targetTitle) || targetTitle.includes(normalize(a.title))) {
        a.details = details;
        updated = true;
      }
    });

    if (updated) {
      window.localStorage.setItem('tracker_assignments', JSON.stringify(assignments));
      window.postMessage({ type: 'TRACKER_SYNC', payload: assignments }, '*');
      window.dispatchEvent(new CustomEvent('tracker_sync', { detail: assignments }));
      document.dispatchEvent(new CustomEvent('tracker_sync', { detail: assignments }));
      showTrackerToast(`📋 Questions captured for "${title || 'assignment'}"!`);
    }
  } catch (e) {
    console.error("Error updating assignment details:", e);
  }
}

// 1. Ingest on initial page load if storage has pending assignments
chrome.storage.local.get(['assignmentsToSync'], (result) => {
  if (result.assignmentsToSync && result.assignmentsToSync.length > 0) {
    processSync(result.assignmentsToSync);
    chrome.storage.local.remove('assignmentsToSync');
  }
});

// 2. Listen for live storage updates across any open tab
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.assignmentsToSync && changes.assignmentsToSync.newValue) {
    processSync(changes.assignmentsToSync.newValue);
    chrome.storage.local.remove('assignmentsToSync');
  }
});

// 3. Direct message channel from background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'SYNC_NOW' && request.payload) {
    processSync(request.payload);
    chrome.storage.local.remove('assignmentsToSync');
  } else if (request.type === 'UPDATE_DETAILS' && request.payload) {
    updateSingleAssignmentDetails(request.payload);
  }
});
