/**
 * Formats a Date/Timestamp in Denmark (Europe/Copenhagen) Timezone.
 * Handles both English and Danish readable formats with accurate CET/CEST conversion.
 */

export const formatDenmarkDateTime = (dateInput, options = {}) => {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';

    const locale = options.locale || 'da-DK';
    const timeZone = 'Europe/Copenhagen';

    // Formatter for date and time
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: options.monthFormat || 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: options.includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });

    return formatter.format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(dateInput);
  }
};

/**
 * Returns formatted date and time parts specifically for Europe/Copenhagen
 */
export const getDenmarkDateTimeParts = (dateInput) => {
  if (!dateInput) return { date: '—', time: '—', full: '—', relative: '—' };
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return { date: '—', time: '—', full: '—', relative: '—' };

    const timeZone = 'Europe/Copenhagen';

    const dateFormatter = new Intl.DateTimeFormat('da-DK', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });

    const timeFormatter = new Intl.DateTimeFormat('da-DK', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const fullFormatter = new Intl.DateTimeFormat('da-DK', {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Calculate relative time
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = 'Just now';
    if (diffMins < 1) relative = 'Just now';
    else if (diffMins < 60) relative = `${diffMins}m ago`;
    else if (diffHours < 24) relative = `${diffHours}h ago`;
    else if (diffDays === 1) relative = 'Yesterday';
    else if (diffDays < 30) relative = `${diffDays} days ago`;
    else relative = dateFormatter.format(date);

    return {
      date: dateFormatter.format(date),
      time: timeFormatter.format(date),
      full: fullFormatter.format(date),
      relative,
    };
  } catch {
    return { date: String(dateInput), time: '', full: String(dateInput), relative: '' };
  }
};
