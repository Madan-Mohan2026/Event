/**
 * Centralized Event & Registration Status Calculation Utility (Frontend JS)
 * All event lifecycle and registration availability calculations use IST (Asia/Kolkata / UTC+05:30).
 */

/**
 * Helper to parse Date input + Time string into an exact moment in IST (Asia/Kolkata +05:30)
 */
export function parseISTDateTime(dateInput, timeStr, defaultTime = '00:00:00') {
  if (!dateInput) return null;

  let yyyy = '';
  let mm = '';
  let dd = '';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(dateInput);
    const pMap = {};
    parts.forEach(p => { pMap[p.type] = p.value; });
    yyyy = pMap.year;
    mm = pMap.month;
    dd = pMap.day;
  } else if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    const datePart = trimmed.split('T')[0];
    if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      [yyyy, mm, dd] = datePart.split('-');
    } else {
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return null;
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(d);
      const pMap = {};
      parts.forEach(p => { pMap[p.type] = p.value; });
      yyyy = pMap.year;
      mm = pMap.month;
      dd = pMap.day;
    }
  }

  if (!yyyy || !mm || !dd) return null;

  let hh = '00';
  let min = '00';
  let ss = '00';

  const rawTime = (timeStr && typeof timeStr === 'string' && timeStr.trim()) ? timeStr.trim() : defaultTime;
  
  const ampmMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
    const period = ampmMatch[4] ? ampmMatch[4].toUpperCase() : null;

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    hh = String(hours).padStart(2, '0');
    min = String(minutes).padStart(2, '0');
    ss = String(seconds).padStart(2, '0');
  } else if (/^\d{1,2}:\d{2}$/.test(rawTime)) {
    const [h, m] = rawTime.split(':');
    hh = String(parseInt(h, 10)).padStart(2, '0');
    min = String(parseInt(m, 10)).padStart(2, '0');
  } else if (/^\d{1,2}:\d{2}:\d{2}$/.test(rawTime)) {
    const [h, m, s] = rawTime.split(':');
    hh = String(parseInt(h, 10)).padStart(2, '0');
    min = String(parseInt(m, 10)).padStart(2, '0');
    ss = String(parseInt(s, 10)).padStart(2, '0');
  }

  const isoStr = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`;
  const resultDate = new Date(isoStr);
  return isNaN(resultDate.getTime()) ? null : resultDate;
}

/**
 * Compute Overall Event Lifecycle Status: 'upcoming' | 'ongoing' | 'completed'
 */
export function getEventStatus(event, nowInput) {
  const now = nowInput ? new Date(nowInput) : new Date();

  const startDateTime = parseISTDateTime(event.date || event.startDate, event.time, '00:00:00');
  let endDateTime = parseISTDateTime(event.endDate || event.date || event.startDate, event.endTime, '23:59:59');

  if (!startDateTime) {
    return 'upcoming';
  }

  if (!endDateTime) {
    endDateTime = new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  const nowMs = now.getTime();
  const startMs = startDateTime.getTime();
  const endMs = endDateTime.getTime();

  if (nowMs < startMs) {
    return 'upcoming';
  } else if (nowMs >= startMs && nowMs <= endMs) {
    return 'ongoing';
  } else {
    return 'completed';
  }
}

/**
 * Compute Registration Availability Status & Details
 */
export function getRegistrationStatus(event, nowInput) {
  const now = nowInput ? new Date(nowInput) : new Date();

  const regStartDate = event.registrationStart || event.registrationStartDate || event.date;
  const regStartTime = event.registrationStartTime || (event.registrationStart ? '' : event.time);
  const regStart = parseISTDateTime(regStartDate, regStartTime, '00:00:00');

  const regEndDate = event.registrationEnd || event.registrationEndDate || event.registrationDeadline || event.endDate || event.date;
  const regEndTime = event.registrationEndTime || '23:59:59';
  const regEnd = parseISTDateTime(regEndDate, regEndTime, '23:59:59');

  const eventEnd = parseISTDateTime(event.endDate || event.date, event.endTime, '23:59:59');

  const formatOpts = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };

  const formattedStart = regStart ? new Intl.DateTimeFormat('en-IN', formatOpts).format(regStart) : '';
  const formattedEnd = regEnd ? new Intl.DateTimeFormat('en-IN', formatOpts).format(regEnd) : '';

  if (!regStart || !regEnd) {
    return {
      code: 'closed',
      label: 'Registration Closed',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      isAllowed: false,
      startDateTime: regStart,
      endDateTime: regEnd,
      formattedStart,
      formattedEnd
    };
  }

  const nowMs = now.getTime();
  const startMs = regStart.getTime();
  const endMs = regEnd.getTime();
  const eventEndMs = eventEnd ? eventEnd.getTime() : Infinity;

  if (nowMs < startMs) {
    return {
      code: 'not_open',
      label: 'Not Yet Open',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      isAllowed: false,
      startDateTime: regStart,
      endDateTime: regEnd,
      formattedStart,
      formattedEnd
    };
  }

  if (nowMs > endMs || nowMs > eventEndMs) {
    return {
      code: 'closed',
      label: 'Registration Closed',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      isAllowed: false,
      startDateTime: regStart,
      endDateTime: regEnd,
      formattedStart,
      formattedEnd
    };
  }

  if (event.capacity && event.capacity > 0 && event.registeredCount && event.registeredCount >= event.capacity) {
    return {
      code: 'closed',
      label: 'Registration Full',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      isAllowed: false,
      startDateTime: regStart,
      endDateTime: regEnd,
      formattedStart,
      formattedEnd
    };
  }

  return {
    code: 'open',
    label: 'Registration Open',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isAllowed: true,
    startDateTime: regStart,
    endDateTime: regEnd,
    formattedStart,
    formattedEnd
  };
}

/**
 * Check if registration is permitted right now
 */
export function isRegistrationAllowed(event, nowInput) {
  if (event.status && event.status !== 'published') {
    return false;
  }
  const regStatus = getRegistrationStatus(event, nowInput);
  return regStatus.isAllowed;
}
