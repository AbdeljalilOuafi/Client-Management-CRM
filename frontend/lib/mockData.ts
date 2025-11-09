// Mock data for dashboard charts and tables

export const chartDatasets = {
  revenue: [
    { month: 'Jan', value: 4200, target: 4000 },
    { month: 'Feb', value: 3800, target: 4200 },
    { month: 'Mar', value: 5100, target: 4500 },
    { month: 'Apr', value: 4600, target: 4800 },
    { month: 'May', value: 5400, target: 5000 },
    { month: 'Jun', value: 6200, target: 5500 },
  ],
  clients: [
    { month: 'Jan', active: 45, inactive: 5 },
    { month: 'Feb', active: 52, inactive: 8 },
    { month: 'Mar', active: 61, inactive: 6 },
    { month: 'Apr', active: 68, inactive: 7 },
    { month: 'May', active: 75, inactive: 5 },
    { month: 'Jun', active: 82, inactive: 4 },
  ],
  payments: [
    { name: 'Completed', value: 245, color: 'hsl(var(--primary))' },
    { name: 'Pending', value: 32, color: 'hsl(var(--secondary))' },
    { name: 'Failed', value: 8, color: 'hsl(var(--destructive))' },
    { name: 'Refunded', value: 5, color: 'hsl(var(--muted))' },
  ],
  performance: [
    { metric: 'Jan', coach1: 85, coach2: 78, coach3: 92 },
    { metric: 'Feb', coach1: 88, coach2: 82, coach3: 89 },
    { metric: 'Mar', coach1: 92, coach2: 85, coach3: 94 },
    { metric: 'Apr', coach1: 87, coach2: 88, coach3: 91 },
    { metric: 'May', coach1: 94, coach2: 90, coach3: 96 },
    { metric: 'Jun', coach1: 96, coach2: 93, coach3: 98 },
  ],
  retention: [
    { quarter: 'Q1', rate: 92 },
    { quarter: 'Q2', rate: 94 },
    { quarter: 'Q3', rate: 91 },
    { quarter: 'Q4', rate: 95 },
  ],
};

export const tableDatasets = {
  topClients: [
    { id: 'CL001', name: 'John Smith', ltv: 5400, status: 'Active', payments: 18 },
    { id: 'CL002', name: 'Sarah Johnson', ltv: 4800, status: 'Active', payments: 16 },
    { id: 'CL003', name: 'Mike Wilson', ltv: 4200, status: 'Active', payments: 14 },
    { id: 'CL004', name: 'Emily Brown', ltv: 3900, status: 'Active', payments: 13 },
    { id: 'CL005', name: 'David Lee', ltv: 3600, status: 'Active', payments: 12 },
  ],
  recentPayments: [
    { id: 'PAY001', client: 'John Smith', amount: 299, date: '2024-06-15', status: 'Completed' },
    { id: 'PAY002', client: 'Sarah Johnson', amount: 299, date: '2024-06-14', status: 'Completed' },
    { id: 'PAY003', client: 'Mike Wilson', amount: 299, date: '2024-06-13', status: 'Pending' },
    { id: 'PAY004', client: 'Emily Brown', amount: 299, date: '2024-06-12', status: 'Completed' },
    { id: 'PAY005', client: 'David Lee', amount: 299, date: '2024-06-11', status: 'Completed' },
  ],
  upcomingInstalments: [
    { id: 'INS001', client: 'John Smith', amount: 299, dueDate: '2024-07-15', status: 'Scheduled' },
    { id: 'INS002', client: 'Sarah Johnson', amount: 299, dueDate: '2024-07-14', status: 'Scheduled' },
    { id: 'INS003', client: 'Mike Wilson', amount: 299, dueDate: '2024-07-13', status: 'Scheduled' },
    { id: 'INS004', client: 'Emily Brown', amount: 299, dueDate: '2024-07-12', status: 'Scheduled' },
    { id: 'INS005', client: 'David Lee', amount: 299, dueDate: '2024-07-11', status: 'Scheduled' },
  ],
  coachPerformance: [
    { coach: 'Alex Martinez', clients: 28, revenue: 8372, satisfaction: 4.8 },
    { coach: 'Jamie Chen', clients: 24, revenue: 7176, satisfaction: 4.9 },
    { coach: 'Taylor Swift', clients: 22, revenue: 6578, satisfaction: 4.7 },
    { coach: 'Morgan Blake', clients: 18, revenue: 5382, satisfaction: 4.6 },
  ],
  packageDistribution: [
    { package: '3 Month Plan', clients: 45, revenue: 13455 },
    { package: '6 Month Plan', clients: 32, revenue: 15360 },
    { package: '12 Month Plan', clients: 18, revenue: 12960 },
    { package: 'Custom Plan', clients: 12, revenue: 7200 },
  ],
};

export const chartOptions = [
  { value: 'revenue', label: 'Revenue Trend', type: 'line' as const },
  { value: 'clients', label: 'Client Growth', type: 'bar' as const },
  { value: 'payments', label: 'Payment Status', type: 'pie' as const },
  { value: 'performance', label: 'Coach Performance', type: 'line' as const },
  { value: 'retention', label: 'Retention Rate', type: 'bar' as const },
];

export const tableOptions = [
  { value: 'topClients', label: 'Top Clients by LTV' },
  { value: 'recentPayments', label: 'Recent Payments' },
  { value: 'upcomingInstalments', label: 'Upcoming Instalments' },
  { value: 'coachPerformance', label: 'Coach Performance' },
  { value: 'packageDistribution', label: 'Package Distribution' },
];
