// Status badge component
const statusConfig = {
  // RFQ statuses
  draft: { label: 'Draft', class: 'badge-gray' },
  sent: { label: 'Sent', class: 'badge-blue' },
  under_comparison: { label: 'Under Review', class: 'badge-indigo' },
  pending_approval: { label: 'Pending Approval', class: 'badge-yellow' },
  approved: { label: 'Approved', class: 'badge-green' },
  rejected: { label: 'Rejected', class: 'badge-red' },
  closed: { label: 'Closed', class: 'badge-gray' },

  // Quotation statuses
  pending: { label: 'Pending', class: 'badge-yellow' },
  submitted: { label: 'Submitted', class: 'badge-blue' },
  under_review: { label: 'Under Review', class: 'badge-indigo' },
  accepted: { label: 'Accepted', class: 'badge-green' },

  // PO statuses
  generated: { label: 'Generated', class: 'badge-blue' },
  acknowledged: { label: 'Acknowledged', class: 'badge-indigo' },
  in_progress: { label: 'In Progress', class: 'badge-yellow' },
  delivered: { label: 'Delivered', class: 'badge-green' },
  cancelled: { label: 'Cancelled', class: 'badge-red' },

  // Invoice statuses
  paid: { label: 'Paid', class: 'badge-green' },
  overdue: { label: 'Overdue', class: 'badge-red' },

  // Vendor statuses
  active: { label: 'Active', class: 'badge-green' },
  inactive: { label: 'Inactive', class: 'badge-red' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: 'badge-gray' };
  return <span className={`badge ${config.class}`}>{config.label}</span>;
}

// Priority badge
export function PriorityBadge({ priority }) {
  const config = {
    low: { label: 'Low', class: 'badge-gray' },
    medium: { label: 'Medium', class: 'badge-blue' },
    high: { label: 'High', class: 'badge-red' },
  };
  const c = config[priority] || config.medium;
  return <span className={`badge ${c.class}`}>{c.label}</span>;
}
