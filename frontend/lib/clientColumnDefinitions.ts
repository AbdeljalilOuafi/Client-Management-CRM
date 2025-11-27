export interface ColumnDefinition {
  id: string;
  label: string;
  mandatory?: boolean;
  defaultVisible: boolean;
  renderCell?: (client: any) => React.ReactNode;
}

export const clientColumnDefinitions: ColumnDefinition[] = [
  {
    id: "name",
    label: "Name",
    mandatory: true,
    defaultVisible: true,
  },
  {
    id: "email",
    label: "Email",
    mandatory: false,
    defaultVisible: true,
  },
  {
    id: "phone",
    label: "Phone",
    mandatory: false,
    defaultVisible: true,
  },
  {
    id: "instagram_handle",
    label: "Instagram",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "dob",
    label: "DoB",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "id",
    label: "Client ID",
    mandatory: false,
    defaultVisible: true,
  },
  {
    id: "address",
    label: "Address",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "country",
    label: "Country",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "client_start_date",
    label: "Start Date",
    mandatory: false,
    defaultVisible: true,
  },
  {
    id: "client_end_date",
    label: "End Date",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "currency",
    label: "Default Currency",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "notice_given",
    label: "Notice Given",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "no_more_payments",
    label: "No More Payments",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "package_type",
    label: "Current Package Name",
    mandatory: false,
    defaultVisible: true,
  },
  {
    id: "start_date",
    label: "Current Package Start Date",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "end_date",
    label: "Current Package End Date",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "number_months_paid",
    label: "Months on Package",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "latest_payment_amount",
    label: "Latest Payment Amount",
    mandatory: false,
    defaultVisible: true,
  },
  {
    id: "latest_payment_date",
    label: "Latest Payment Date",
    mandatory: false,
    defaultVisible: true,
  },
  {
    id: "lead_origin",
    label: "Lead Origin",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "ghl_id",
    label: "GHL ID",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "payment_method",
    label: "Stripe Account/Payment Method",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "stripe_customer_id",
    label: "Stripe Customer ID",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "status",
    label: "Status",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "coach_name",
    label: "Coach",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "closer",
    label: "Closer",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "setter",
    label: "Setter",
    mandatory: false,
    defaultVisible: false,
  },
  {
    id: "ltv",
    label: "LTV",
    mandatory: false,
    defaultVisible: false,
  },
];

// Get default visible columns
export function getDefaultVisibleColumns(): Record<string, boolean> {
  return clientColumnDefinitions.reduce((acc, col) => {
    acc[col.id] = col.defaultVisible;
    return acc;
  }, {} as Record<string, boolean>);
}

// Load column visibility from localStorage
export function loadColumnVisibility(): Record<string, boolean> {
  if (typeof window === 'undefined') return getDefaultVisibleColumns();
  
  try {
    const saved = localStorage.getItem('clientColumnVisibility');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading column visibility:', error);
  }
  
  return getDefaultVisibleColumns();
}

// Save column visibility to localStorage
export function saveColumnVisibility(visibility: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('clientColumnVisibility', JSON.stringify(visibility));
  } catch (error) {
    console.error('Error saving column visibility:', error);
  }
}
