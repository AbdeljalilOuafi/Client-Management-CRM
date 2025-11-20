/**
 * GoHighLevel Permissions Structure
 * Extracted from the GoHighLevel platform permissions interface
 * This structure matches EXACTLY the hierarchy and labels from the platform
 */

export interface GHLPermissionCategory {
  id: string;
  name: string;
  icon?: string;
  permissions: GHLPermission[];
}

export interface GHLPermission {
  id: string;
  label: string;
  type?: 'readonly' | 'write';
}

export const GOHIGHLEVEL_PERMISSIONS: GHLPermissionCategory[] = [
  {
    id: 'AI_AGENTS',
    name: 'AI Agents',
    permissions: [
      { id: 'voice-ai-agents.write', label: 'View & manage voice AI agents' },
      { id: 'voice-ai-agent-goals.readonly', label: 'View voice AI agent goals' },
      { id: 'voice-ai-agent-goals.write', label: 'View & manage voice AI agent goals' },
      { id: 'voice-ai-dashboard.readonly', label: 'View voice AI dashboard' },
      { id: 'text-ai-agents.write', label: 'View & manage Conversation AI agents' },
      { id: 'text-ai-agent-goals.readonly', label: 'View Conversation AI agent goals' },
      { id: 'text-ai-agent-goals.write', label: 'View & manage Conversation AI agent goals' },
      { id: 'text-ai-agent-training.write', label: 'View & manage Conversation AI agent training' },
      { id: 'text-ai-agents-dashboard.readonly', label: 'View Conversation AI Dashboard' },
    ],
  },
  {
    id: 'ACCOUNT_SETTINGS',
    name: 'Account Settings',
    permissions: [
      { id: 'locations/tags.write', label: 'View & manage tags' },
      { id: 'settings.write', label: 'View & manage settings' },
    ],
  },
  {
    id: 'ACCOUNT_TOOLS',
    name: 'Account Tools',
    permissions: [
      { id: 'contentAI.write', label: 'View & manage content AI' },
      { id: 'eliza.write', label: 'View & manage eliza' },
    ],
  },
  {
    id: 'AUTOMATION',
    name: 'Automation',
    permissions: [
      { id: 'campaigns.readonly', label: 'View campaigns' },
      { id: 'campaigns.write', label: 'View & manage campaigns' },
      { id: 'workflows.readonly', label: 'View workflows' },
      { id: 'workflows.write', label: 'View & manage workflows' },
      { id: 'triggers.readonly', label: 'View triggers' },
      { id: 'triggers.write', label: 'View & manage triggers' },
    ],
  },
  {
    id: 'BLOGS',
    name: 'Blogs',
    permissions: [
      { id: 'blogs.write', label: 'View & manage blogs' },
    ],
  },
  {
    id: 'CALENDAR',
    name: 'Calendars',
    permissions: [
      { id: 'calendars.readonly', label: 'View appointments, calendars & groups' },
      { id: 'calendars/events.write', label: 'Manage appointments' },
      { id: 'calendars/groups.write', label: 'Manage groups' },
      { id: 'calendars.write', label: 'Manage calendars' },
    ],
  },
  {
    id: 'CERTIFICATES',
    name: 'Certificates',
    permissions: [
      { id: 'certificates.write', label: 'View & manage certificates' },
    ],
  },
  {
    id: 'COMMUNITIES',
    name: 'Communities',
    permissions: [
      { id: 'communities.write', label: 'View & manage communities' },
    ],
  },
  {
    id: 'CONTACT',
    name: 'Contacts',
    permissions: [
      { id: 'contacts.write', label: 'View & manage contacts' },
      { id: 'contacts/bulkActions.write', label: 'View & manage bulk action' },
    ],
  },
  {
    id: 'CONVERSATIONS',
    name: 'Conversations',
    permissions: [
      { id: 'conversations/message.write', label: 'View & manage conversation' },
    ],
  },
  {
    id: 'FORM',
    name: 'Forms',
    permissions: [
      { id: 'forms.write', label: 'View & manage forms' },
    ],
  },
  {
    id: 'FUNNEL',
    name: 'Funnels',
    permissions: [
      { id: 'funnels.write', label: 'View & manage funnels' },
      { id: 'sites.write', label: 'View & manage websites' },
    ],
  },
  {
    id: 'GOKOLLAB',
    name: 'Gokollab',
    permissions: [
      { id: 'gokollab.write', label: 'View & manage Gokollab' },
    ],
  },
  {
    id: 'INTEGRATION',
    name: 'Integrations',
    permissions: [
      { id: 'privateIntegrations.write', label: 'View & manage private integration' },
    ],
  },
  {
    id: 'LAUNCHPAD',
    name: 'Launchpad',
    permissions: [
      { id: 'launchpad.write', label: 'View & Manage Sub-account Launchpad' },
      { id: 'socialPlanner.write', label: 'View & manage social planner' },
      { id: 'affiliateManager.write', label: 'View & manage affiliate manager' },
      { id: 'prospecting.write', label: 'View & manage prospecting' },
    ],
  },
  {
    id: 'MEDIAS',
    name: 'Medias',
    permissions: [
      { id: 'medias.write', label: 'View & manage media storage' },
    ],
  },
  {
    id: 'MEMBERSHIP',
    name: 'Memberships',
    permissions: [
      { id: 'membership.write', label: 'View & manage membership' },
    ],
  },
  {
    id: 'PAYMENT',
    name: 'Payments',
    permissions: [
      { id: 'payments.write', label: 'Record payments' },
      { id: 'invoices.write', label: 'View & manage payment invoices' },
    ],
  },
  {
    id: 'PAYMENT_SETTING',
    name: 'Payment Settings',
    permissions: [
      { id: 'paymentSettings.readonly', label: 'View Payment Settings' },
      { id: 'receiptSettings.write', label: 'Configure Receipt Settings' },
    ],
  },
  {
    id: 'PRODUCTS',
    name: 'Products',
    permissions: [
      { id: 'products.readonly', label: 'View Products List' },
      { id: 'products.write', label: 'Duplicate Products' },
    ],
  },
  {
    id: 'QR_CODE',
    name: 'QR Codes',
    permissions: [
      { id: 'qrCodes.write', label: 'View & manage QR codes' },
    ],
  },
  {
    id: 'QUIZ',
    name: 'Quizzes',
    permissions: [
      { id: 'quizzes.write', label: 'View & manage quizzes' },
    ],
  },
  {
    id: 'REPORTING',
    name: 'Reporting',
    permissions: [
      { id: 'phoneCallStats.readonly', label: 'View phone call stats' },
      { id: 'adwords.readonly', label: 'View adwords' },
      { id: 'facebookAds.readonly', label: 'View facebook ads' },
    ],
  },
  {
    id: 'REPUTATION',
    name: 'Reputations',
    permissions: [
      { id: 'onlineListings.write', label: 'View & manage online listing' },
      { id: 'reviewsAI.write', label: 'Manage Reviews AI Agents' },
    ],
  },
  {
    id: 'SUBSCRIPTION',
    name: 'Subscriptions',
    permissions: [
      { id: 'subscriptions.readonly', label: 'View Subscriptions List & Details' },
    ],
  },
  {
    id: 'SURVEY',
    name: 'Surveys',
    permissions: [
      { id: 'surveys.write', label: 'View & manage surveys' },
    ],
  },
  {
    id: 'TAXES',
    name: 'Taxes',
    permissions: [
      { id: 'taxes.write', label: 'View & manage taxes' },
    ],
  },
  {
    id: 'TRANSACTIONS',
    name: 'Transactions',
    permissions: [
      { id: 'transactions.readonly', label: 'View Transactions List & Details' },
      { id: 'transactions.export', label: 'Export Transactions' },
      { id: 'transactions.refund', label: 'Refund Transactions' },
    ],
  },
  {
    id: 'USER_MANAGEMENT',
    name: 'User Management',
    permissions: [
      { id: 'users.write', label: 'View & manage users' },
    ],
  },
];

/**
 * Helper function to get all permission IDs as a flat array
 */
export const getAllPermissionIds = (): string[] => {
  return GOHIGHLEVEL_PERMISSIONS.flatMap(category => 
    category.permissions.map(p => p.id)
  );
};

/**
 * Helper function to create initial permissions state (all false)
 */
export const getInitialPermissionsState = (): Record<string, boolean> => {
  const state: Record<string, boolean> = {};
  getAllPermissionIds().forEach(id => {
    state[id] = false;
  });
  return state;
};

/**
 * Helper function to get category by ID
 */
export const getCategoryById = (categoryId: string): GHLPermissionCategory | undefined => {
  return GOHIGHLEVEL_PERMISSIONS.find(cat => cat.id === categoryId);
};
