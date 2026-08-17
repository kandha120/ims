import { all_routes } from "../../routes/all_routes";

const route = all_routes;

export const SidebarData = [
  {
    label: "Main",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: "layout-grid",
        link: "/index",
        submenu: false,
        showSubRoute: false,
      },
    ],
  },
  {
    label: "Inventory",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Inventory",
    submenuItems: [
      { label: "Products", link: "/product-list", icon: "box", submenu: false },
      { label: "Create Product", link: "/add-product", icon: "table-plus", submenu: false },
      { label: "Expired Products", link: "/expired-products", icon: "progress-alert", submenu: false },
      { label: "Low Stocks", link: "/low-stocks", icon: "trending-up-2", submenu: false },
      { label: "Category", link: "/category-list", icon: "list-details", submenu: false },
      { label: "Units", link: "/units", icon: "ruler-2", submenu: false },
    ],
  },
  {
    label: "Stock",
    submenuOpen: true,
    submenuHdr: "Stock",
    submenu: true,
    showSubRoute: false,
    submenuItems: [
      { label: "Manage Stock", link: "/manage-stocks", icon: "stack-3", submenu: false },
      { label: "Stock Adjustment", link: "/stock-adjustment", icon: "stairs-up", submenu: false },
      { label: "Stock Transfer", link: "/stock-transfer", icon: "stack-pop", submenu: false },
    ],
  },
  {
    label: "Sales",
    submenuOpen: true,
    submenuHdr: "Sales",
    submenu: true,
    showSubRoute: false,
    submenuItems: [
      { label: "Sales Order", link: "/sales-list", icon: "layout-grid", submenu: false },
      { label: "Sales Return", link: "/sales-returns", icon: "receipt-refund", submenu: false },
      {
        label: "Credit Note",
        link: "/credit-note",
        icon: "credit-card",
        showSubRoute: false,
        submenu: false,
      },
    ],
  },

  {
    label: "Purchases",
    submenuOpen: true,
    submenuHdr: "Purchases",
    showSubRoute: false,
    submenuItems: [
      { label: "Purchases", link: "/purchase-list", icon: "shopping-bag", submenu: false },
      { label: "Purchase Order", link: "/purchase-order-report", icon: "file-unknown", submenu: false },
      { label: "Purchase Return", link: "/purchase-returns", icon: "file-upload", submenu: false },
      { label: "Debit Note", link: "/debit-note", icon: "file-download", submenu: false },
    ],
  },
  {
    label: "People",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "People",
    submenuItems: [
      { label: "Customers", link: route.customers, icon: "users-group", submenu: false },
      { label: "Suppliers", link: "/suppliers", icon: "user-dollar", submenu: false },
      { label: "Warehouses", link: "/warehouse", icon: "archive", submenu: false },
    ],
  },
  {
    label: "User Creation",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "User Creation",
    submenuItems: [
      { label: "User Creation", link: "/user-creation", icon: "user-plus", submenu: false },
      { label: "User List", link: "/users", icon: "users", submenu: false },
    ],
  },
  // {
  //   label: "HRM",
  //   submenuOpen: true,
  //   showSubRoute: false,
  //   submenuHdr: "HRM",
  //   submenuItems: [
  //     { label: "Employees", link: "/employees-grid", icon: "user", submenu: false },
  //     { label: "Departments", link: "/department-grid", icon: "compass", submenu: false },
  //     { label: "Designations", link: "/designation", icon: "git-merge", submenu: false },
  //     { label: "Shifts", link: "/shift", icon: "arrows-shuffle", submenu: false },
  //     {
  //       label: "Attendance",
  //       link: "#",
  //       icon: "user-cog",
  //       submenu: true,
  //       submenuItems: [
  //         { label: "Employee", link: "/attendance-employee" },
  //         { label: "Admin", link: "/attendance-admin" },
  //       ],
  //     },
  //     {
  //       label: "Leaves",
  //       link: "#",
  //       icon: "calendar",
  //       submenu: true,
  //       submenuItems: [
  //         { label: "Employee Leaves", link: "/leaves-employee" },
  //         { label: "Admin Leaves", link: "/leaves-admin" },
  //         { label: "Leave Types", link: "/leave-types" },
  //       ],
  //     },
  //     { label: "Holidays", link: "/holidays", icon: "calendar-share", submenu: false },
  //     {
  //       label: "Payroll",
  //       link: "#",
  //       icon: "file-dollar",
  //       submenu: true,
  //       submenuItems: [
  //         { label: "Employee Salary", link: route.payrollList },
  //         { label: "Payslip", link: "/payslip" },
  //       ],
  //     },
  //   ],
  // },
  {
    label: "Reports",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Reports",
    submenuItems: [
      {
        label: "Sales Report",
        icon: "chart-bar",
        submenu: true,
        submenuItems: [
          { label: "Sales Report", link: "/sales-report" },
          { label: "Best Seller", link: "/best-seller" },
        ],
      },
      { label: "Purchase Report", link: "/purchase-report", icon: "chart-pie-2", submenu: false },
      {
        label: "Inventory Report",
        icon: "triangle-inverted",
        submenu: true,
        submenuItems: [
          { label: "Inventory Report", link: "/inventory-report" },
          { label: "Stock History", link: "/stock-history" },
          { label: "Sold Stock", link: "/sold-stock" },
        ],
      },
      { label: "Invoice Report", link: route.invoicereportnew, icon: "businessplan", submenu: false },
    ],
  },
  {
    label: "Settings",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Settings",
    submenuItems: [
      { label: "General Settings", link: "/general-settings", icon: "settings", submenu: false },
      { label: "Taxes", link: "/taxes", icon: "percent", submenu: false },
    ],
  },
];
