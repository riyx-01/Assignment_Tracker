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

  const rows = targetTable.querySelectorAll('tbody tr');
  
  rows.forEach((row, index) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 10) {
      const subject = cells[2]?.textContent.trim() || '';
      const instructor = cells[3]?.textContent.trim() || '';
      const title = cells[4]?.textContent.trim() || '';
      const instructions = cells[5]?.textContent.trim() || '';
      const totalMarks = parseFloat(cells[6]?.textContent.trim() || '0');
      
      let actions = '';
      let datesStr = '';
      
      for(let i = cells.length - 1; i >= 0; i--) {
        const text = cells[i].textContent.trim();
        if (text.includes('Time:')) {
          datesStr = text;
        } else if (text === 'Completed' || text.includes('View Assignment') || text.includes('Submission link') || text.includes('expired')) {
          actions = text;
        }
      }

      if (actions && !actions.includes('Completed') && !actions.includes('expired')) {
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

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assignments, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "vmedulife_pending_assignments.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  
  alert(`Successfully exported ${assignments.length} pending assignments!`);
}

function injectButton() {
  if (document.getElementById('vmedulife-scanner-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'vmedulife-scanner-btn';
  btn.className = 'vmedulife-scanner-btn';
  btn.innerHTML = '📥 Download Pending Tasks';
  
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
