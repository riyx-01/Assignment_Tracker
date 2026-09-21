// Vmedulife Content Script - Scans assignments from Assignment section or Dashboard

// Helper to parse the Vmedulife date format (e.g. "28th Sep,2026", Time: "07:00 am - 11:00 pm")
function parseDate(dateString, timeString, isEnd) {
  try {
    if (!dateString) return new Date().toISOString().slice(0, 16);

    const dates = dateString.split('-');
    let targetDateStr = isEnd && dates.length > 1 ? dates[1].trim() : dates[0].trim();
    
    // Remove ordinal indicators (st, nd, rd, th)
    targetDateStr = targetDateStr.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
    
    let targetTimeStr = isEnd ? "23:59" : "07:00";
    if (timeString && timeString.includes('Time:')) {
      const times = timeString.replace('Time:', '').split('-');
      let rawTime = isEnd && times.length > 1 ? times[1].trim() : times[0].trim();
      
      const parts = rawTime.trim().split(' ');
      if (parts.length >= 1) {
        let [hours, minutes] = parts[0].split(':');
        let modifier = parts[1] ? parts[1].toLowerCase() : '';
        
        let h = parseInt(hours, 10);
        if (modifier === 'pm' && h < 12) h += 12;
        if (modifier === 'am' && h === 12) h = 0;
        
        const m = minutes || '00';
        targetTimeStr = `${h.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
      }
    }

    const finalDate = new Date(`${targetDateStr} ${targetTimeStr}`);
    if (isNaN(finalDate.getTime())) {
      // Fallback try standard date parsing
      const fallback = new Date(targetDateStr);
      if (!isNaN(fallback.getTime())) {
        return fallback.toISOString().slice(0, 16);
      }
      throw new Error("Invalid date: " + targetDateStr);
    }
    
    const offset = finalDate.getTimezoneOffset();
    const localDate = new Date(finalDate.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);

  } catch (e) {
    console.warn("Could not parse date:", dateString, timeString, e);
    return new Date().toISOString().slice(0, 16); // Fallback to current date
  }
}

// Show user feedback toast
function showToast(message, type = 'info') {
  let toast = document.getElementById('vmedulife-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vmedulife-toast';
    toast.className = 'vmedulife-toast';
    document.body.appendChild(toast);
  }

  const bgColors = {
    info: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    success: 'linear-gradient(135deg, #10b981, #059669)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)'
  };

  toast.style.background = bgColors[type] || bgColors.info;
  toast.innerHTML = `<span>${message}</span>`;
  toast.classList.add('show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Helper to clean modal text and extract pure assignment questions / instructions
function cleanModalDetails(rawText) {
  if (!rawText) return '';
  let text = rawText.trim();
  
  // Cut off upload instructions and file buttons at the end
  const cutoffKeywords = [
    '— Upload your response',
    'Upload your response',
    'Supported file formats',
    'Maximum allowed size',
    'BROWSE'
  ];

  for (const kw of cutoffKeywords) {
    const idx = text.indexOf(kw);
    if (idx !== -1) {
      text = text.substring(0, idx).trim();
    }
  }

  // Remove repeated header labels like Assignment: ..., Subject: ..., Instruction: ...
  text = text.replace(/Assignment:\s*[^\n\r]+/gi, '');
  text = text.replace(/Subject:\s*[^\n\r]+/gi, '');
  text = text.replace(/Instruction:\s*.*?(?=(1\)|Mark\(s\)|Type|\n\n|$))/gis, '');
  text = text.replace(/Marks:\s*[\d.]+/gi, '');

  return text.trim();
}

// Extract details from any currently visible modal on the page
function getOpenModalInfo() {
  const modalCandidates = document.querySelectorAll(
    '.modal.in, .modal.show, [role="dialog"], .ui-dialog, div[id*="modal"], div[class*="modal"]'
  );

  for (const modal of modalCandidates) {
    const isVisible = modal.offsetHeight > 80 && window.getComputedStyle(modal).display !== 'none';
    if (!isVisible) continue;

    const modalText = modal.textContent || '';
    if (modalText.includes('Assignment') || modalText.includes('Question') || modalText.includes('Mark(s)')) {
      // Try to extract title from modal
      const titleMatch = modalText.match(/Assignment:\s*([^\n\r]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      const details = cleanModalDetails(modalText);

      return { title, details, element: modal };
    }
  }
  return null;
}

// Extract assignments from a given DOM root (document or parsed DOM document)
function extractAssignmentsFromDocument(doc) {
  const assignments = [];
  const tables = doc.querySelectorAll('table');
  let targetTable = null;
  let headerRow = null;

  for (const table of tables) {
    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      const text = row.textContent.toLowerCase();
      // Identify the assignment table header row
      if (text.includes('title') && (text.includes('subject') || text.includes('validity') || text.includes('marks'))) {
        targetTable = table;
        headerRow = row;
        break;
      }
    }
    if (targetTable) break;
  }

  if (!targetTable || !headerRow) {
    return null;
  }

  const headerCells = headerRow.querySelectorAll('th, td');
  const headers = Array.from(headerCells).map(cell => cell.textContent.trim().toLowerCase());

  // Default column mappings based on standard Vmedulife structure
  let cSubj = -1, cInst = -1, cTitle = -1, cDesc = -1, cMarks = -1, cAct = -1, cDates = -1;

  headers.forEach((h, i) => {
    if (h.includes('subject') || h.includes('course')) cSubj = i;
    else if (h.includes('instructor') || h.includes('faculty')) cInst = i;
    else if (h.includes('title') || h.includes('topic')) cTitle = i;
    else if (h.includes('instruction') || h.includes('description')) cDesc = i;
    else if (h.includes('total marks') || h.includes('max marks') || (h.includes('marks') && !h.includes('obtained'))) cMarks = i;
    else if (h.includes('action') || h.includes('status')) cAct = i;
    else if (h.includes('validity') || h.includes('deadline') || h.includes('date')) cDates = i;
  });

  // Fallbacks if not detected by header name
  if (cSubj === -1) cSubj = 2;
  if (cInst === -1) cInst = 3;
  if (cTitle === -1) cTitle = 4;
  if (cDesc === -1) cDesc = 5;
  if (cMarks === -1) cMarks = 6;
  if (cAct === -1) cAct = 10;
  if (cDates === -1) cDates = 11;

  const allRows = targetTable.querySelectorAll('tbody tr, tr');
  const seenRows = new Set();
  const openModal = getOpenModalInfo();

  allRows.forEach((row, index) => {
    // Avoid duplicates if querySelectorAll returns same rows
    if (seenRows.has(row)) return;
    seenRows.add(row);

    // Skip header rows
    if (row.querySelector('th') || row === headerRow) return;

    const cells = row.querySelectorAll('td');
    if (cells.length < 5) return; // Not a valid data row

    const subject = cells[cSubj]?.textContent.trim() || '';
    const instructor = cells[cInst]?.textContent.trim() || '';
    const title = cells[cTitle]?.textContent.trim() || '';
    const instructions = cells[cDesc]?.textContent.trim() || '';
    const totalMarks = parseFloat(cells[cMarks]?.textContent.trim() || '0');
    const actions = cells[cAct]?.textContent.trim() || '';
    const datesStr = cells[cDates]?.textContent.trim() || '';

    const actionLower = actions.toLowerCase();
    const isCompleted = actionLower.includes('completed') || 
                        actionLower.includes('submitted') || 
                        actionLower.includes('expired');

    // Pending assignment check: has title and is not already completed/expired
    if (!isCompleted && title) {
      const dateParts = datesStr.split('Time:');
      const rawDateStr = dateParts[0]?.trim() || '';
      const rawTimeStr = dateParts[1] ? 'Time: ' + dateParts[1].trim() : '';

      // Check if open modal matches this assignment
      let details = '';
      if (openModal && openModal.details && openModal.title && title.toLowerCase().includes(openModal.title.toLowerCase())) {
        details = openModal.details;
      }

      assignments.push({
        id: Date.now() + index,
        subject,
        title,
        instructor,
        instructions,
        details: details || '',
        totalMarks: isNaN(totalMarks) ? 0 : totalMarks,
        status: 'Pending',
        startDate: parseDate(rawDateStr, rawTimeStr, false),
        deadline: parseDate(rawDateStr, rawTimeStr, true)
      });
    }
  });

  return assignments;
}

// Find the URL to the full Assignment section if we are on Dashboard
function findAssignmentSectionUrl() {
  // Look for navigation links in menu or sidebar
  const links = document.querySelectorAll('a[href]');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const text = link.textContent.toLowerCase();
    if (href.includes('AssignmentList') || (href.includes('Assignment') && !href.includes('#')) || text.includes('assignment')) {
      try {
        return new URL(href, window.location.href).href;
      } catch (e) {}
    }
  }

  // Known fallback paths on Vmedulife portals
  return window.location.origin + '/student/Assignments//AssignmentList.php';
}

// Main function to scan assignments and sync to tracker
async function scanAndSync() {
  showToast("🔍 Scanning assignments...", "info");

  // Step 1: Try parsing the table directly from the active page
  let assignments = extractAssignmentsFromDocument(document);

  // Step 2: If not found on active page (e.g. on Dashboard), fetch from the Assignment section in background
  if (!assignments || assignments.length === 0) {
    const assignmentUrl = findAssignmentSectionUrl();
    showToast("📥 Fetching from Assignment section...", "info");

    try {
      const response = await fetch(assignmentUrl, { credentials: 'include' });
      if (response.ok) {
        const html = await response.text();
        const parser = new DOMParser();
        const externalDoc = parser.parseFromString(html, 'text/html');
        assignments = extractAssignmentsFromDocument(externalDoc);
      }
    } catch (err) {
      console.warn("Background fetch failed:", err);
    }
  }

  // Step 3: Handle result
  if (!assignments || assignments.length === 0) {
    showToast("ℹ️ No pending assignments found on this page.", "warning");
    return;
  }

  showToast(`🚀 Syncing ${assignments.length} pending assignments to Tracker...`, "info");

  // Step 4: Send to background script for storage and dispatch to Tracker
  chrome.runtime.sendMessage({ type: 'SYNC_DATA', payload: assignments }, (response) => {
    if (chrome.runtime.lastError) {
      showToast("⚠️ Extension reload needed. Please refresh this page.", "error");
      console.error(chrome.runtime.lastError);
    } else {
      showToast(`✅ Successfully synced ${assignments.length} assignments!`, "success");
    }
  });
}

// Inject floating Action Button on Vmedulife pages
function injectButton() {
  if (document.getElementById('vmedulife-scanner-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'vmedulife-scanner-btn';
  btn.className = 'vmedulife-scanner-btn';
  btn.innerHTML = `
    <span class="vmedulife-icon">🚀</span>
    <span>Auto-Sync to Tracker</span>
  `;
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    scanAndSync();
  });
  
  document.body.appendChild(btn);
}

// Listen for messages from background script (e.g. toolbar extension icon click)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TRIGGER_SCAN') {
    scanAndSync();
    sendResponse({ status: 'started' });
    return true;
  }
});

// Setup floating button injection on DOM ready and observer for SPAs
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectButton);
} else {
  injectButton();
}

// Ensure button stays present even if page content dynamically updates
let lastSyncedModalDetails = '';
function checkAndSyncOpenModal() {
  const modalInfo = getOpenModalInfo();
  if (modalInfo && modalInfo.details && modalInfo.details !== lastSyncedModalDetails) {
    lastSyncedModalDetails = modalInfo.details;
    chrome.runtime.sendMessage({
      type: 'UPDATE_ASSIGNMENT_DETAILS',
      payload: {
        title: modalInfo.title,
        details: modalInfo.details
      }
    });
    showToast(`📋 Captured questions for ${modalInfo.title || 'assignment'}!`, 'info');
  }
}

const observer = new MutationObserver(() => {
  if (!document.getElementById('vmedulife-scanner-btn')) {
    injectButton();
  }
  checkAndSyncOpenModal();
});
observer.observe(document.body, { childList: true, subtree: true });

