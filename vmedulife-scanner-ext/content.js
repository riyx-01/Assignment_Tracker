// Helper to parse the Vmedulife date format (e.g. "28th Sep,2026", Time: "07:00 am - 11:00 pm")
function parseDate(dateString, timeString, isEnd) {
  try {
    const dates = dateString.split('-');
    let targetDateStr = isEnd && dates.length > 1 ? dates[1].trim() : dates[0].trim();
    
    // Remove ordinal indicators (st, nd, rd, th)
    targetDateStr = targetDateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
    
    let targetTimeStr = "23:59";
    if (timeString && timeString.includes('Time:')) {
      const times = timeString.replace('Time:', '').split('-');
      let rawTime = isEnd && times.length > 1 ? times[1].trim() : times[0].trim();
      
      const [time, modifier] = rawTime.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier && modifier.toLowerCase() === 'pm') {
        hours = parseInt(hours, 10) + 12;
      }
      targetTimeStr = `${hours}:${minutes}`;
    }

    const finalDate = new Date(`${targetDateStr} ${targetTimeStr}`);
    if (isNaN(finalDate.getTime())) throw new Error("Invalid date");
    
    const offset = finalDate.getTimezoneOffset();
    const localDate = new Date(finalDate.getTime() - (offset*60*1000));
    return localDate.toISOString().slice(0,16);

  } catch (e) {
    console.warn("Could not parse date:", dateString, timeString);
    return new Date().toISOString().slice(0, 16); // Fallback to current date
  }
}

function scanAndDownload() {
  const assignments = [];
  const tables = document.querySelectorAll('table');
  let targetTable = null;
  
  for (const table of tables) {
    // Identify the assignment table
    if (table.textContent.includes('Title') && table.textContent.includes('Total Marks')) {
      targetTable = table;
      break;
    }
  }

  if (!targetTable) {
    alert("Could not find the assignments table on this page.");
    return;
  }

  const headerCells = targetTable.querySelector('tr').querySelectorAll('th, td');
  const headers = Array.from(headerCells).map(th => th.textContent.trim().toLowerCase());
  
  // Default indices based on typical Vmedulife structure
  let cSubj = 2, cInst = 3, cTitle = 4, cDesc = 5, cMarks = 6, cAct = 10, cDates = 11;
  
  // Dynamically map columns if headers exist
  headers.forEach((h, i) => {
    if (h.includes('subject')) cSubj = i;
    if (h.includes('instructor')) cInst = i;
    if (h.includes('title')) cTitle = i;
    if (h.includes('instructions')) cDesc = i;
    if (h.includes('total marks')) cMarks = i;
    if (h.includes('action')) cAct = i;
    if (h.includes('validity') || h.includes('date')) cDates = i;
  });

  const rows = targetTable.querySelectorAll('tbody tr, tr');
  
  rows.forEach((row, index) => {
    if (row.querySelector('th') || row === targetTable.querySelector('tr')) return; // Skip headers

    const cells = row.querySelectorAll('td');
    // Ensure the row has enough columns
    if (cells.length > Math.max(cAct, cDates) - 2) { 
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

      // If not completed/expired, and it actually has a title, it's a valid pending assignment
      if (!isCompleted && title) {
        const dateParts = datesStr.split('Time:');
        const rawDateStr = dateParts[0]?.trim() || '';
        const rawTimeStr = dateParts[1] ? 'Time: ' + dateParts[1].trim() : '';

        assignments.push({
          id: Date.now() + index, // Ensure unique
          subject,
          title,
          instructor,
          instructions,
          totalMarks,
          status: 'Pending',
          startDate: parseDate(rawDateStr, rawTimeStr, false),
          deadline: parseDate(rawDateStr, rawTimeStr, true)
        });
      }
    }
  });

  if (assignments.length === 0) {
    alert("No pending assignments found to export!");
    return;
  }

  // Send the payload to the background script to open the tracker tab
  chrome.runtime.sendMessage({ type: 'SYNC_DATA', payload: assignments }, (response) => {
    if (chrome.runtime.lastError) {
      alert("Error communicating with extension. Make sure the extension is fully loaded and updated.");
    }
  });
}

function injectButton() {
  if (document.getElementById('vmedulife-scanner-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'vmedulife-scanner-btn';
  btn.className = 'vmedulife-scanner-btn';
  btn.innerHTML = '🚀 Auto-Sync to Tracker';
  
  btn.addEventListener('click', scanAndDownload);
  
  document.body.appendChild(btn);
}

// The table might take time to render if it's a SPA. 
// Inject periodically or use MutationObserver for robust injection.
let retryCount = 0;
const interval = setInterval(() => {
  if (document.querySelector('table')) {
    injectButton();
    clearInterval(interval);
  }
  if (retryCount++ > 10) clearInterval(interval); // Stop trying after 10s
}, 1000);
