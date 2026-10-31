export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  member: string;
  branch: string;
  description: string;
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    iconName: "LayoutDashboard",
    member: "Member 4",
    branch: "feature/dashboard-ai",
    description: "Executive analytics, KPI tracking, and revenue overview.",
  },
  {
    name: "Products",
    href: "/products",
    iconName: "Package",
    member: "Member 1",
    branch: "feature/admin-backend",
    description: "Product catalog management, tiers, and service definitions.",
  },
  {
    name: "Plans",
    href: "/plans",
    iconName: "Layers",
    member: "Member 1",
    branch: "feature/admin-backend",
    description: "Subscription pricing plans, billing cycles, and feature gates.",
  },
  {
    name: "Customers",
    href: "/customers",
    iconName: "Users",
    member: "Member 1",
    branch: "feature/admin-backend",
    description: "Customer accounts, organization profiles, and contacts.",
  },
  {
    name: "Staff",
    href: "/staff",
    iconName: "UserCheck",
    member: "Member 1",
    branch: "feature/admin-backend",
    description: "Team member roles, access permissions, and staff directory.",
  },
  {
    name: "Quotations",
    href: "/quotations",
    iconName: "FileSpreadsheet",
    member: "Member 2",
    branch: "feature/subscriptions",
    description: "Sales quotes, custom pricing proposals, and quote approvals.",
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    iconName: "Repeat",
    member: "Member 2",
    branch: "feature/subscriptions",
    description: "Active subscriber agreements, upgrades, downgrades, and renewals.",
  },
  {
    name: "Invoices",
    href: "/invoices",
    iconName: "Receipt",
    member: "Member 3",
    branch: "feature/billing-payments",
    description: "Billing invoices, automated payment receipts, and tax items.",
  },
  {
    name: "Payments",
    href: "/payments",
    iconName: "CreditCard",
    member: "Member 3",
    branch: "feature/billing-payments",
    description: "Payment transaction logs, payment methods, and reconciliations.",
  },
  {
    name: "Settings",
    href: "/settings",
    iconName: "Settings",
    member: "Member 1",
    branch: "feature/admin-backend",
    description: "System preferences, API credentials, and organization setup.",
  },
];

export const PORTAL_NAV_ITEMS: NavItem[] = [
  {
    name: "Customer Portal",
    href: "/portal",
    iconName: "User",
    member: "Member 4",
    branch: "feature/dashboard-ai",
    description: "Self-service customer portal for subscriptions and billing history.",
  },
];
