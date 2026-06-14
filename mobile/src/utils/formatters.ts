/**
 * Wakhar WMS — Utility formatters for display values.
 */

/**
 * Format weight in kg with appropriate units.
 * e.g., 900 → "900 kg", 1500 → "1.5 MT"
 */
export function formatWeight(kg: number, forceUnit?: 'kg' | 'mt'): string {
  if (forceUnit === 'mt' || (!forceUnit && kg >= 1000)) {
    const mt = kg / 1000;
    return `${mt % 1 === 0 ? mt.toFixed(0) : mt.toFixed(1)} MT`;
  }
  return `${kg.toLocaleString('en-IN')} kg`;
}

/**
 * Format Indian currency with ₹ symbol.
 * e.g., 56250 → "₹56,250"
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format currency with decimals.
 * e.g., 62.5 → "₹62.50"
 */
export function formatRate(rate: number): string {
  return `₹${rate.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse date strings safely, ensuring naive datetime strings are parsed as UTC
 * to prevent timezone-shift bugs.
 */
function parseAPIDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // If it's a date-only string like "YYYY-MM-DD", parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // If it's a datetime string and doesn't have a timezone indicator, assume UTC
  if (dateStr.includes('T') && !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

/**
 * Format date string to locale display.
 * e.g., "2026-05-30" → "30 May 2026"
 */
export function formatDate(dateStr: string): string {
  const date = parseAPIDate(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format datetime string to locale display with time.
 * e.g., "2026-05-30T09:15:00Z" → "30 May 2026, 2:45 PM"
 */
export function formatDateTime(dateStr: string): string {
  const date = parseAPIDate(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday").
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = parseAPIDate(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Format percentage.
 * e.g., 12.4 → "12.4%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Mask Aadhaar number for display.
 * e.g., "4532-8901-4821" → "XXXX-XXXX-4821"
 */
export function maskAadhaar(aadhaar: string | null): string {
  if (!aadhaar) return '—';
  const parts = aadhaar.replace(/\s/g, '').replace(/-/g, '');
  if (parts.length < 4) return aadhaar;
  const last4 = parts.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * Get initials from a full name.
 * e.g., "Suresh Patil" → "SP"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Format grade enum to display label.
 */
export function formatGrade(grade: string): string {
  const map: Record<string, string> = {
    grade_a: 'Grade A',
    grade_b: 'Grade B',
    grade_c: 'Grade C',
    rejected: 'Rejected',
    pending: 'Pending',
  };
  return map[grade] ?? grade;
}

/**
 * Format lot status to display label.
 */
export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    available: 'Available',
    reserved: 'Reserved',
    qc_pending: 'QC Pending',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    returned: 'Returned',
    active: 'Active',
    amended: 'Amended',
    withdrawn: 'Withdrawn',
    expired: 'Expired',
    created: 'Created',
    cancelled: 'Cancelled',
    pending: 'Pending',
    accepted: 'Accepted',
    fulfilled: 'Fulfilled',
    confirmed: 'Confirmed',
    failed: 'Failed',
    none: 'None',
    applied: 'Applied',
    disbursed: 'Disbursed',
    released: 'Released',
  };
  return map[status] ?? status;
}

/**
 * Get color for grade badge.
 */
export function getGradeColor(grade: string): string {
  const map: Record<string, string> = {
    grade_a: '#2E7D32',
    grade_b: '#F57F17',
    grade_c: '#E65100',
    rejected: '#C62828',
    pending: '#757575',
  };
  return map[grade] ?? '#757575';
}

/**
 * Get color for lot status badge.
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    available: '#2E7D32',
    reserved: '#1565C0',
    qc_pending: '#F57F17',
    in_transit: '#6A1B9A',
    delivered: '#00695C',
    returned: '#C62828',
    active: '#2E7D32',
    amended: '#1565C0',
    withdrawn: '#757575',
    expired: '#C62828',
    created: '#1565C0',
    cancelled: '#757575',
  };
  return map[status] ?? '#757575';
}
