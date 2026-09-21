import { differenceInHours, differenceInDays, parseISO, isPast, formatDistanceToNow, format } from 'date-fns';

const CURRENT_REFERENCE_DATE = new Date('2026-09-21T00:00:00'); // Based on user prompt context

export const getStatusDetails = (deadlineStr, status) => {
  if (status === 'Completed') {
    return { level: 'success', text: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  }

  const deadline = parseISO(deadlineStr);
  const now = CURRENT_REFERENCE_DATE; // In a real app, use new Date()
  
  if (isPast(deadline) && now > deadline) {
    return { level: 'expired', text: 'Expired', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  }

  const hoursLeft = differenceInHours(deadline, now);
  
  if (hoursLeft <= 48) {
    return { level: 'emergency', text: `Due in ${Math.max(1, Math.ceil(hoursLeft / 24))} days`, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]' };
  }
  
  const daysLeft = differenceInDays(deadline, now);
  if (daysLeft <= 5) {
    return { level: 'warning', text: `Due in ${daysLeft} days`, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  }

  return { level: 'upcoming', text: `Due ${format(deadline, 'MMM d')}`, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
};

export const isEmergency = (deadlineStr) => {
  const deadline = parseISO(deadlineStr);
  const now = CURRENT_REFERENCE_DATE;
  return !isPast(deadline) && differenceInHours(deadline, now) <= 48;
};

export const formatDisplayDate = (dateStr) => {
  return format(parseISO(dateStr), 'MMM d, yyyy (h:mm a)');
};
