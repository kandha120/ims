import { Link } from "react-router-dom";
import "bootstrap-daterangepicker/daterangepicker.css";
import Chart from "react-apexcharts";
import ReactApexChart from "react-apexcharts";
import { Doughnut } from "react-chartjs-2";
import ApexCharts from "react-apexcharts";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { all_routes } from "../../routes/all_routes";
import {
  customer11,
  customer12,
  customer13,
  customer14,
  customer15,
  customer16,
  customer17,
  customer18,
  product1,
  product10,
  product11,
  product12,
  product13,
  product14,
  product15,
  product16,
  product3,
  product4,
  product5,
  product6,
  product7,
  product8,
  product9,
} from "../../utils/imagepath";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import baseapi from "../../env/baseapi";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
const NewDashboard = () => {
  const route = all_routes;
  // Sales order and Purchase order
  const [salesByDay, setSalesByDay] = useState([]);
  const [purchaseByDay, setPurchaseByDay] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [salesFilter, setSalesFilter] = useState("last12days");
  // Customers Count Only - Super Clean
  const [customerCount, setCustomerCount] = useState(0); // number mattum
  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        setTopCustLoading(true);
        const res = await fetch(`${baseapi}/api/customers/top?limit=5`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        // Count fetch all for total
        const allRes = await fetch(`${baseapi}/api/customers`, { credentials: "include" });
        if (allRes.ok) {
          const allData = await allRes.json();
          setCustomerCount(Array.isArray(allData) ? allData.length : 0);
        }

        const formatted = data.map((c, index) => ({
          code: c.code || `CUST-${index}`,
          customer: c.customer || "Unknown",
          country: c.country || "India",
          total_orders: c.total_orders || 0,
          total_spent: c.total_spent || 0,
        }));
        setTopCustomers(formatted);
      } catch (err) {
        console.error("Top customers fetch failed:", err);
        setTopCustomers([]);
      } finally {
        setTopCustLoading(false);
      }
    };
    fetchTopCustomers();
  }, []);
  // WIDGET DATA STATE
  const [widgetStats, setWidgetStats] = useState({
    totalSales: 0,
    totalSalesReturn: 0,
    totalPurchase: 0,
    totalPurchaseReturn: 0,
    loading: true
  });

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        const [salesRes, salesRetRes, purchRes, purchRetRes] = await Promise.all([
          fetch(`${baseapi}/api/sales-order/all`, { credentials: "include" }),
          fetch(`${baseapi}/api/sales-return/all`, { credentials: "include" }),
          fetch(`${baseapi}/api/purchase-order/all`, { credentials: "include" }),
          fetch(`${baseapi}/api/purchase-returns`, { credentials: "include" })
        ]);

        const salesData = await salesRes.json();
        const salesRetData = await salesRetRes.json();
        const purchData = await purchRes.json();
        const purchRetData = await purchRetRes.json();

        // 1. Total Sales
        const salesTotal = (Array.isArray(salesData) ? salesData : []).reduce((sum, order) => {
          return sum + (Number(order.grand_total) || Number(order.grandTotal) || 0);
        }, 0);

        // 2. Total Sales Return
        const salesRetTotal = (Array.isArray(salesRetData) ? salesRetData : []).reduce((sum, ret) => {
          return sum + (Number(ret.grandTotal) || Number(ret.grand_total) || 0);
        }, 0);

        // 3. Total Purchase
        const purchTotal = (Array.isArray(purchData) ? purchData : []).reduce((sum, order) => {
          return sum + (Number(order.grandTotal) || Number(order.total) || 0);
        }, 0);

        // 4. Total Purchase Return (Calc: qty * cost)
        const purchRetTotal = (Array.isArray(purchRetData) ? purchRetData : []).reduce((sum, ret) => {
          const qty = Number(ret.quantity) || 0;
          const cost = Number(ret.cost) || 0;
          const tax = Number(ret.orderTax) || 0;
          const disc = Number(ret.discount) || 0;
          return sum + ((qty * cost) + tax - disc);
        }, 0);

        setWidgetStats({
          totalSales: salesTotal,
          totalSalesReturn: salesRetTotal,
          totalPurchase: purchTotal,
          totalPurchaseReturn: purchRetTotal,
          loading: false
        });

      } catch (err) {
        console.error("Widget data fetch failed:", err);
        setWidgetStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchWidgetData();
  }, []);

  // ADD THESE STATES
  const [dashboardStats, setDashboardStats] = useState({
    totalPurchases: 0,
    totalSuppliers: 0,
    totalSales: 0,
    loading: true
  });




  // CLEAN STATES — ONE FOR EACH
  const [supplierCount, setSupplierCount] = useState(0);
  const [supplierLoading, setSupplierLoading] = useState(true);

  const [purchaseCount, setPurchaseCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);


  // SUPPLIERS — 100% INDEPENDENT & REAL
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setSupplierLoading(true);
        const res = await fetch(`${baseapi}/api/suppliers`, {
          credentials: "include",
          headers: {}
        });
        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        const suppliers = Array.isArray(data)
          ? data
          : data?.data || data?.results || data?.suppliers || [];

        const count = suppliers.length;
        console.log("REAL SUPPLIERS COUNT:", count); // Check this in console
        setSupplierCount(count);
      } catch (err) {
        console.error("Supplier fetch failed:", err);
        setSupplierCount(0);
      } finally {
        setSupplierLoading(false);
      }
    };

    fetchSuppliers();
  }, []);
  // ADD THIS useEffect — 100% WORKING (exact same as your PurchasesList page)
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setDashboardStats(prev => ({ ...prev, loading: true }));
        const [purchaseRes, supplierRes, salesRes] = await Promise.all([
          fetch(`${baseapi}/api/purchases`, { credentials: "include", headers: {} }),
          fetch(`${baseapi}/api/suppliers`, { credentials: "include", headers: {} }),   // ← REAL API
          fetch(`${baseapi}/api/sales`, { credentials: "include", headers: {} })
        ]);

        if (!purchaseRes.ok || !supplierRes.ok || !salesRes.ok) throw new Error("API failed");

        const purchases = await purchaseRes.json();
        const suppliers = await supplierRes.json();   // ← idhu important
        const sales = await salesRes.json();

        // IDHU DHAAN MAIN FIX DA — CORRECT COUNT
        const supplierRealCount = Array.isArray(suppliers)
          ? suppliers.length
          : suppliers?.data?.length || suppliers?.results?.length || suppliers?.length || 0;

        console.log("REAL SUPPLIERS COUNT DA:", supplierRealCount); // ← console-la check pannu

        setDashboardStats({
          totalPurchases: Array.isArray(purchases) ? purchases.length : (purchases?.data || purchases?.results || []).length,
          totalSuppliers: supplierRealCount,    // ← IDHU IPPO 15 VARUM!
          totalSales: Array.isArray(sales) ? sales.length : (sales?.data || sales?.results || []).length,
          loading: false
        });

      } catch (err) {
        console.error("Dashboard fetch failed da:", err);
        setDashboardStats({ totalPurchases: 0, totalSuppliers: 0, totalSales: 0, loading: false });
      }
    };

    fetchDashboardStats();
  }, []); // ← empty = one time load

  useEffect(() => {
    const fetchSalesPurchaseData = async () => {
      try {
        const [salesRes, purchaseRes] = await Promise.all([
          fetch(`${baseapi}/api/sales-order/all`, { credentials: "include" }),
          fetch(`${baseapi}/api/purchase-order/all`, { credentials: "include" }),
        ]);
        const salesData = await salesRes.json();
        const purchaseData = await purchaseRes.json();
        // Extract orders
        const salesOrders = Array.isArray(salesData) ? salesData : salesData.data || [];
        const purchaseOrders = Array.isArray(purchaseData) ? purchaseData : purchaseData.data || [];
        // Group by date (only date part)
        const groupByDate = (orders) => {
          const map = {};
          orders.forEach((order) => {
            const date = order.date?.split("T")[0];
            if (date) {
              map[date] = (map[date] || 0) + 1;
            }
          });
          return map;
        };
        const salesMap = groupByDate(salesOrders);
        const purchaseMap = groupByDate(purchaseOrders);
        // Last 12 days for chart
        const last12Days = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          last12Days.push(dateStr);
        }
        // Format for chart
        const salesCounts = last12Days.map((date) => salesMap[date] || 0);
        const purchaseCounts = last12Days.map((date) => purchaseMap[date] || 0);
        const labels = last12Days.map((date) => {
          const [y, m, d] = date.split("-");
          return `${d}/${m}`;
        });
        setSalesByDay(salesCounts);
        setPurchaseByDay(purchaseCounts);
        // Update chart config
        setSalesDayChart((prev) => ({
          ...prev,
          series: [
            { name: "Sales", data: salesCounts },
            { name: "Purchase", data: purchaseCounts },
          ],
          xaxis: { ...prev.xaxis, categories: labels },
        }));
        setChartLoading(false);
      } catch (err) {
        console.error("Error loading sales/purchase:", err);
        setChartLoading(false);
      }
    };
    fetchSalesPurchaseData();
  }, [salesFilter]);

  const [newCustomers, setNewCustomers] = useState(0);
  const [returningCustomers, setReturningCustomers] = useState(0);
  // Customer Overview - First Time vs Returning (REAL CALCULATION)
  useEffect(() => {
    const calculateCustomerType = async () => {
      try {
        const res = await fetch(`${baseapi}/api/customers`, {
          credentials: "include",
          headers: {}
        });
        if (!res.ok) return;
        const data = await res.json();
        const customers = Array.isArray(data) ? data : data.customers || data.data || [];

        let newCust = 0;
        let returning = 0;

        customers.forEach(c => {
          const orders = c.total_orders || c.order_count || 0;
          if (orders <= 1) newCust++;
          else returning++;
        });

        setNewCustomers(newCust);
        setReturningCustomers(returning);
      } catch (err) {
        console.error("Customer type calc error:", err);
      }
    };

    if (customerCount > 0) {
      calculateCustomerType();
    }
  }, [customerCount]);
  // Suppliers API, Coutomer API and Order API
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [customerCount, setCustomerCount] = useState(null);
  const [orderCount, setOrderCount] = useState(null);
  useEffect(() => {


    // Fetch Sales Orders for count
    fetch(`${baseapi}/api/sales-order/all`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const count = Array.isArray(data) ? data.length : (data.total_count || 0);
        setOrderCount(count);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setOrderCount("Error");
      });
    setLoading(false);
  }, []);



  // products fetch method
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  // Nee already irukura lowStockProducts useEffect-oda inside change pannu da:

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        setLowStockLoading(true);
        const res = await fetch(`${baseapi}/api/products/low-stock`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const lowStock = (Array.isArray(data) ? data : []).map(p => ({
          id: p.id,
          productName: p.productName || "Unknown Product",
          sku: p.sku || "N/A",
          quantity: Number(p.quantity) || 0,
        }));

        setLowStockProducts(lowStock);
      } catch (err) {
        console.error("Low stock error:", err);
        setLowStockProducts([]);
      } finally {
        setLowStockLoading(false);
      }
    };
    fetchLowStock();
  }, []);
  // Recent Sales Order API
  const [recentSales, setRecentSales] = useState([]);
  useEffect(() => {
    fetch(`${baseapi}/api/sales/recent?limit=5`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setRecentSales(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Recent sales fetch failed:", err));
  }, []);
  // Top Customers
  const [topCustomers, setTopCustomers] = useState([]);
  const [topCustLoading, setTopCustLoading] = useState(true);
  useEffect(() => {


    // Sales Orders
    fetch(`${baseapi}/api/sales-order/all`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setOrderCount(Array.isArray(data) ? data.length : (data.total_count || 0));
      })
      .catch(() => setOrderCount("Error"));
    setLoading(false);
  }, []);
  //Top Categories
  /// ADD THIS — 100% SAME AS YOUR WORKING CategoryList.js
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(`${baseapi}/api/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed");

        const result = await res.json();
        console.log("Categories Raw:", result);

        let categoryList = [];
        if (Array.isArray(result)) categoryList = result;
        else if (result.data && Array.isArray(result.data)) categoryList = result.data;
        else if (result.categories && Array.isArray(result.categories)) categoryList = result.categories;
        else if (result.data?.categories) categoryList = result.data.categories;

        const formatted = categoryList.map(item => ({
          id: item._id || item.id,
          category: item.name || item.category_name || item.category || "Unnamed"
        }));

        // Only update if component still mounted
        if (isMounted) {
          console.log("Final Categories Count:", formatted.length);
          setCategories(formatted);
        }

      } catch (err) {
        if (isMounted) {
          console.error("Categories fetch failed:", err);
          setCategories([]);
        }
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();

    // Cleanup function — prevents state update on unmounted component
    return () => {
      isMounted = false;
    };

  }, []); // Empty dependency = correct
  // Top Selling Products
  const [topProducts, setTopProducts] = useState([]);
  const [topProductsLoading, setTopProductsLoading] = useState(true);
  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setTopProductsLoading(true);
        const res = await fetch(`${baseapi}/api/products/top-selling?limit=5`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setTopProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching top products:", err);
        setTopProducts([]);
      } finally {
        setTopProductsLoading(false);
      }
    };
    fetchTopProducts();
  }, []);
  const [salesDayChart, setSalesDayChart] = useState({
    chart: {
      height: 245,
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    colors: ["#FE9F43", "#FFE3CB"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusWhenStacked: "all",
        horizontal: false,
        endingShape: "rounded",
      },
    },
    series: [
      {
        name: "Sales",
        data: [18, 20, 10, 18, 25, 18, 10, 20, 40, 8, 30, 20],
      },
      {
        name: "Purchase",
        data: [40, 30, 30, 50, 40, 50, 30, 30, 50, 30, 40, 30],
      },
    ],
    xaxis: {
      categories: [
        "2 am",
        "4 am",
        "6 am",
        "8 am",
        "10 am",
        "12 am",
        "14 pm",
        "16 pm",
        "18 pm",
        "20 pm",
        "22 pm",
        "24 pm",
      ],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `${val}K`,
        offsetX: -15,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: {
        left: -16,
        top: 0,
        bottom: 0,
        right: 0,
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 1,
    },
  });
  const customerChart = {
    chart: {
      type: "radialBar",
      height: 130,
      width: "100%",
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 10,
          size: "30%",
        },
        track: {
          background: "#E6EAED",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            offsetY: -5,
          },
          value: {
            offsetY: 5,
          },
        },
      },
    },
    grid: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    stroke: {
      lineCap: "round",
    },
    colors: ["#E04F16", "#0E9384"],
    labels: ["First Time", "Return"],
  };
  const series = [70, 70];
  const options = {
    series: [
      {
        name: "Revenue",
        data: [9, 25, 25, 20, 20, 18, 25, 15, 20, 12, 8, 20],
      },
      {
        name: "Expenses",
        data: [-10, -18, -9, -20, -20, -10, -20, -20, -8, -15, -18, -20],
      },
    ],
    grid: {
      padding: {
        top: 5,
        right: 5,
      },
    },
    colors: ["#0E9384", "#E04F16"],
    chart: {
      type: "bar",
      height: 290,
      stacked: true,
      zoom: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 280,
        options: {
          legend: {
            position: "bottom",
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        borderRadiusApplication: "around",
        borderRadiusWhenStacked: "all",
        columnWidth: "20%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      labels: {
        offsetX: -15,
        formatter: (val) => {
          return val / 1 + "K";
        },
      },
      min: -30,
      max: 30,
      tickAmount: 6,
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
    },
    legend: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
  };
  const data = {
    datasets: [
      {
        label: ["Lifestyles", "Sports", "Electronics"],
        data: [16, 24, 50],
        backgroundColor: ["#092C4C", "#E04F16", "#FE9F43"],
        borderWidth: 5,
        borderRadius: 10,
        hoverBorderWidth: 0,
        cutout: "50%",
      },
    ],
  };
  const option = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: -20,
        bottom: -20,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };
  const heat_chart = {
    chart: {
      type: "heatmap",
      height: 370,
    },
    plotOptions: {
      heatmap: {
        radius: 4,
        enableShades: false,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 99,
              color: "#FFE3CB",
            },
            {
              from: 100,
              to: 200,
              color: "#FE9F43",
            },
          ],
        },
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      padding: {
        top: -20,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    yaxis: {
      labels: {
        offsetX: -15,
      },
    },
    series: [
      {
        name: "2 Am",
        data: [
          { x: "Mon", y: 100 },
          { x: "Tue", y: 100 },
          { x: "Wed", y: 100 },
          { x: "Thu", y: 32 },
          { x: "Fri", y: 32 },
          { x: "Sat", y: 32 },
          { x: "Sun", y: 32 },
        ],
      },
      {
        name: "4 Am",
        data: [
          { x: "Mon", y: 100, color: "#ff5722" },
          { x: "Tue", y: 100 },
          { x: "Wed", y: 100 },
          { x: "Thu", y: 120 },
          { x: "Fri", y: 32 },
          { x: "Sat", y: 50 },
          { x: "Sun", y: 40 },
        ],
      },
      {
        name: "6 Am",
        data: [
          { x: "Mon", y: 22 },
          { x: "Tue", y: 29 },
          { x: "Wed", y: 13 },
          { x: "Thu", y: 32 },
          { x: "Fri", y: 32 },
          { x: "Sat", y: 32 },
          { x: "Sun", y: 32 },
        ],
      },
      {
        name: "8 Am",
        data: [
          { x: "Mon", y: 0 },
          { x: "Tue", y: 29 },
          { x: "Wed", y: 13 },
          { x: "Thu", y: 32 },
          { x: "Fri", y: 30 },
          { x: "Sat", y: 100 },
          { x: "Sun", y: 100 },
        ],
      },
      {
        name: "10 Am",
        data: [
          { x: "Mon", y: 200 },
          { x: "Tue", y: 200 },
          { x: "Wed", y: 200 },
          { x: "Thu", y: 32 },
          { x: "Fri", y: 0 },
          { x: "Sat", y: 0 },
          { x: "Sun", y: 32 },
        ],
      },
      {
        name: "12 Am",
        data: [
          { x: "Mon", y: 0 },
          { x: "Tue", y: 0 },
          { x: "Wed", y: 75 },
          { x: "Thu", y: 0 },
          { x: "Fri", y: 0 },
          { x: "Sat", y: 0 },
          { x: "Sun", y: 0 },
        ],
      },
      {
        name: "14 Pm",
        data: [
          { x: "Mon", y: 0 },
          { x: "Tue", y: 20 },
          { x: "Wed", y: 13 },
          { x: "Thu", y: 32 },
          { x: "Fri", y: 0 },
          { x: "Sat", y: 0 },
          { x: "Sun", y: 32 },
        ],
      },
      {
        name: "16 Pm",
        data: [
          { x: "Mon", y: 13 },
          { x: "Tue", y: 20 },
          { x: "Wed", y: 13 },
          { x: "Thu", y: 32 },
          { x: "Fri", y: 200 },
          { x: "Sat", y: 13 },
          { x: "Sun", y: 32 },
        ],
      },
      {
        name: "18 Am",
        data: [
          { x: "Mon", y: 0 },
          { x: "Tue", y: 20 },
          { x: "Wed", y: 13 },
          { x: "Thu", y: 32 },
          { x: "Fri", y: 0 },
          { x: "Sat", y: 200 },
          { x: "Sun", y: 200 },
        ],
      },
    ],
  };

  // NEW: Recent Purchases for Transactions Tab
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentPurchasesLoading, setRecentPurchasesLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPurchases = async () => {
      try {
        setRecentPurchasesLoading(true);
        const res = await fetch(`${baseapi}/api/purchases`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch purchases");
        const data = await res.json();
        const purchaseList = Array.isArray(data) ? data : data.data || data.results || [];

        // Sort by date descending and take top 5
        const sortedPurchases = purchaseList
          .sort((a, b) => new Date(b.date || b.po_date) - new Date(a.date || a.po_date))
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            supplierName: item.supplierName || item.supplier?.name || "Unknown Supplier",
            date: item.date || item.po_date || new Date().toISOString().split('T')[0],
            status: item.shippingStatus || item.status || "Completed",
            total: item.cost || item.grand_total || item.total || 0,
            reference: item.reference || "#N/A"
          }));

        setRecentPurchases(sortedPurchases);
      } catch (err) {
        console.error("Purchase Fetch Error:", err);
        setRecentPurchases([]);
      } finally {
        setRecentPurchasesLoading(false);
      }
    };
    fetchRecentPurchases();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
          <div className="mb-3">
            <h1 className="mb-1">Welcome, Admin</h1>
            <p className="fw-medium">
              You have <span className="text-primary fw-bold">200+</span>{" "}
              Orders, Today
            </p>
          </div>
          <div className="input-icon-start position-relative mb-3">
            <span className="input-icon-addon fs-16 text-gray-9">
              <i className="ti ti-calendar" />
            </span>
            <CommonDateRangePicker />
          </div>
        </div>
        {/* <div className="alert bg-orange-transparent alert-dismissible fade show mb-4">
          <div>
            <span>
              {" "}
              <i className="ti ti-info-circle fs-14 text-orange me-2" /> Your
              Product{" "}
            </span>
            <span className="text-orange fw-semibold">
              {" "}
              Apple Iphone 15 is running Low,{" "}
            </span>{" "}
            already below 5 Pcs.,
            <Link
              to="#"
              className="link-orange text-decoration-underline fw-semibold"
              data-bs-toggle="modal"
              data-bs-target="#add-stock"
            >
              Add Stock
            </Link>
          </div>
          <button
            type="button"
            className="btn-close text-gray-9 fs-14"
            data-bs-dismiss="alert"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div> */}

        <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-primary sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-primary">
                  <i className="ti ti-file-text fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Total Sales</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white">
                      ₹{widgetStats.loading ? "..." : widgetStats.totalSales.toLocaleString("en-IN")}
                    </h4>
                    <span className="badge badge-soft-primary">
                      <i className="ti ti-arrow-up me-1" />
                      +22%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-secondary sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-secondary">
                  <i className="ti ti-repeat fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Total Sales Return</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white">
                      ₹{widgetStats.loading ? "..." : widgetStats.totalSalesReturn.toLocaleString("en-IN")}
                    </h4>
                    <span className="badge badge-soft-danger">
                      <i className="ti ti-arrow-down me-1" />
                      -22%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-teal sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-teal">
                  <i className="ti ti-gift fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Total Purchase</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white">
                      ₹{widgetStats.loading ? "..." : widgetStats.totalPurchase.toLocaleString("en-IN")}
                    </h4>
                    <span className="badge badge-soft-success">
                      <i className="ti ti-arrow-up me-1" />
                      +22%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-info sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-info">
                  <i className="ti ti-brand-pocket fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Total Purchase Return</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white">
                      ₹{widgetStats.loading ? "..." : widgetStats.totalPurchaseReturn.toLocaleString("en-IN")}
                    </h4>
                    <span className="badge badge-soft-success">
                      <i className="ti ti-arrow-up me-1" />
                      +22%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          {/* Profit */}
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card revenue-widget flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1">₹8,458,798</h4>
                    <p>Profit</p>
                  </div>
                  <span className="revenue-icon bg-cyan-transparent text-cyan">
                    <i className="fa-solid fa-layer-group fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">
                    <span className="fs-13 fw-bold text-success">+35%</span> vs
                    Last Month
                  </p>
                  <Link
                    to="profit-and-loss.html"
                    className="text-decoration-underline fs-13 fw-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* /Profit */}
          {/* Invoice */}
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card revenue-widget flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1">₹48,988,78</h4>
                    <p>Invoice Due</p>
                  </div>
                  <span className="revenue-icon bg-teal-transparent text-teal">
                    <i className="ti ti-chart-pie fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">
                    <span className="fs-13 fw-bold text-success">+35%</span> vs
                    Last Month
                  </p>
                  <Link
                    to={route.invoicereport}
                    className="text-decoration-underline fs-13 fw-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* /Invoice */}
          {/* Expenses */}
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card revenue-widget flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1">₹8,980,097</h4>
                    <p>Total Expenses</p>
                  </div>
                  <span className="revenue-icon bg-orange-transparent text-orange">
                    <i className="ti ti-lifebuoy fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">
                    <span className="fs-13 fw-bold text-success">+41%</span> vs
                    Last Month
                  </p>
                  <Link
                    to={route.expenselist}
                    className="text-decoration-underline fs-13 fw-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* /Expenses */}
          {/* Returns */}
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card revenue-widget flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1">₹78,458,798</h4>
                    <p>Total Payment Returns</p>
                  </div>
                  <span className="revenue-icon bg-indigo-transparent text-indigo">
                    <i className="ti ti-hash fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">
                    <span className="fs-13 fw-bold text-danger">-20%</span> vs
                    Last Month
                  </p>
                  <Link
                    to={route.salesreport}
                    className="text-decoration-underline fs-13 fw-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* /Returns */}
        </div>
        <div className="row g-3">
          {/* Sales & Purchase*/}
          <div className="col-xxl-8 col-xl-7 col-sm-12 d-flex">
            <div id="sales-daychart" className="card flex-fill">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0">Sales & Purchase</h5>
                {/* FILTER BUTTON + DROPDOWN */}
                <div className="dropdown text-black">
                  <button
                    className="btn btn-sm btn-outline-primary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    {salesFilter === "yesterday" && "Previous Day"}
                    {salesFilter === "lastWeek" && "Last Week"}
                    {salesFilter === "lastMonth" && "One Month"}
                    {salesFilter === "last6Months" && "6 Months"}
                    {salesFilter === "lastYear" && "1 Year"}
                    {salesFilter === "last12days" && "Last 12 Days"}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setSalesFilter("yesterday")}
                      >
                        Previous Day
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setSalesFilter("lastWeek")}
                      >
                        Last Week
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setSalesFilter("lastMonth")}
                      >
                        One Month
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setSalesFilter("last6Months")}
                      >
                        6 Months
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setSalesFilter("lastYear")}
                      >
                        1 Year
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body" style={{ minHeight: "280px" }}>
                {chartLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 text-muted">Loading...</p>
                  </div>
                ) : salesByDay.length === 0 ? (
                  <p className="text-center text-muted py-5">
                    No data for selected period
                  </p>
                ) : (
                  <Chart
                    options={salesDayChart}
                    series={salesDayChart.series}
                    type="bar"
                    height={230}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Overall Information*/}
          {/* Overall Information - FULLY FIXED & PREMIUM */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="col-xxl-4 col-xl-5 d-flex"
          >
            <div className="card flex-fill bg-white rounded-3xl shadow-lg border border-gray-100">
              <div className="card-header">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-emerald-100 fs-16 p-2 rounded-lg">
                    <i className="ti ti-info-circle text-emerald-600" />
                  </span>
                  <h5 className="card-title mb-0 text-xl font-bold text-gray-800 ms-2">
                    Overall Information
                  </h5>
                </div>
              </div>
              <div className="card-body pb-2">
                <div className="row g-3">
                  {/* Suppliers - CLEAN & GUARANTEED WORKING */}
                  <div className="col-md-4 col-4">
                    <div className="info-item bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center hover:shadow-md transition">
                      <div className="mb-2 text-emerald-600 fs-28">
                        <i className="ti ti-truck" />
                      </div>
                      <p className="mb-1 text-gray-600">Suppliers</p>
                      <h5 className="text-2xl font-bold text-emerald-700 m-0">
                        {supplierLoading ? "..." : supplierCount}
                      </h5>
                    </div>
                  </div>

                  {/* Customers - REAL COUNT */}
                  <div className="col-md-4 col-4">
                    <div className="info-item bg-orange-50 border border-orange-200 p-3 rounded-2xl text-center hover:shadow-md transition">
                      <div className="mb-2 text-orange-600 fs-28">
                        <i className="ti ti-users" />
                      </div>
                      <p className="mb-1 text-gray-600">Customers</p>
                      <h5 className="text-2xl font-bold text-orange-700 m-0">
                        {dashboardStats.loading ? (
                          <span className="text-gray-400">...</span>
                        ) : (
                          customerCount || 0
                        )}
                      </h5>
                    </div>
                  </div>

                  {/* Orders - REAL COUNT */}
                  <div className="col-md-4 col-4">
                    <div className="info-item bg-teal-50 border border-teal-200 p-3 rounded-2xl text-center hover:shadow-md transition">
                      <div className="mb-2 text-teal-600 fs-28">
                        <i className="ti ti-shopping-cart" />
                      </div>
                      <p className="mb-1 text-gray-600">Orders</p>
                      <h5 className="text-2xl font-bold text-teal-700 m-0">
                        {dashboardStats.loading ? (
                          <span className="text-gray-400">...</span>
                        ) : (
                          dashboardStats.totalSales
                        )}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Overview */}
              {/* Customer Overview - FULLY DYNAMIC & REAL DATA */}
              <div className="card-footer bg-gray-50 border-t">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="font-semibold">Customers Overview</h6>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm btn-light text-decoration-underline"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-calendar me-1" /> Today
                    </Link>
                    <ul className="dropdown-menu p-3">
                      <li><Link to="#" className="dropdown-item">Today</Link></li>
                      <li><Link to="#" className="dropdown-item">Weekly</Link></li>
                      <li><Link to="#" className="dropdown-item">Monthly</Link></li>
                    </ul>
                  </div>
                </div>

                <div className="row align-items-center">
                  {/* Radial Chart */}
                  <div className="col-sm-5">
                    <Chart
                      options={customerChart}
                      series={[
                        parseInt(((newCustomers / customerCount) * 100) || 0),
                        parseInt(((returningCustomers / customerCount) * 100) || 0)
                      ]}
                      type="radialBar"
                      height={130}
                    />
                  </div>

                  {/* Numbers & Labels */}
                  <div className="col-sm-7">
                    <div className="row gx-0 text-center">
                      <div className="col-sm-6 border-end">
                        <h2 className="mb-1 text-orange">{newCustomers || 0}</h2>
                        <p className="text-orange mb-2 text-sm">First Time</p>
                        <span className="badge bg-success badge-xs">
                          {customerCount > 0 ? Math.round((newCustomers / customerCount) * 100) : 0}%
                        </span>
                      </div>
                      <div className="col-sm-6">
                        <h2 className="mb-1 text-teal">{returningCustomers || 0}</h2>
                        <p className="text-teal mb-2 text-sm">Returning</p>
                        <span className="badge bg-success badge-xs">
                          {customerCount > 0 ? Math.round((returningCustomers / customerCount) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="row">
          {/* Top Selling Products */}
          <div className="col-xxl-4 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-pink fs-16 me-2">
                    <i className="ti ti-box" />
                  </span>
                  <h5 className="card-title mb-0">Top Selling Products</h5>
                </div>
              </div>
              <div className="card-body sell-product">
                {topProductsLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : topProducts.length === 0 ? (
                  <p className="text-center text-muted py-5">No products</p>
                ) : (
                  topProducts.map((p, i) => (
                    <div
                      key={p.id}
                      className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3"
                    >
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-lg bg-light me-3 d-flex align-items-center justify-content-center">
                          <i className="ti ti-package text-gray-600 fs-24" />
                        </div>
                        <div>
                          <h6
                            className="fw-bold mb-1 text-truncate"
                            style={{ maxWidth: "160px" }}
                          >
                            <Link
                              to={`/product-details/${p.slug}`}
                              className="text-dark hover:text-primary"
                            >
                              {p.product_name}
                            </Link>
                          </h6>
                          <div className="text-muted fs-12">
                            <span>
                              ₹{Number(p.price).toLocaleString("en-IN")}
                            </span>
                            <span className="mx-1">•</span>
                            <span>{p.estimated_sold} sold</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <h6 className="fw-bold">
                          ₹{Number(p.total_value).toLocaleString("en-IN")}
                        </h6>
                        <span className="badge bg-success badge-xs">
                          #{i + 1}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="card-footer bg-transparent border-0 text-center">
                <Link
                  to={route.productlist}
                  className="fs-13 fw-bold text-decoration-underline"
                >
                  View All
                </Link>
              </div>
            </div>
          </div>
          {/* /Top Selling Products */}
          {/* Low Stock Products - 100% REAL DATA - DYNAMIC & CLEAN */}
          <div className="col-xxl-4 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-danger fs-16 me-2">
                    <i className="ti ti-alert-triangle" />
                  </span>
                  <h5 className="card-title mb-0">Low Stock Products</h5>
                </div>
                <Link to={route.lowstock} className="fs-13 fw-bold text-decoration-underline text-primary">
                  View All →
                </Link>
              </div>
              <div className="card-body">
                {lowStockLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger"></div>
                  </div>
                ) : lowStockProducts.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-mood-happy fs-50 text-success d-block mb-3"></i>
                    <p className="text-success fw-bold">All products well stocked!</p>
                    <small className="text-muted">No low stock items</small>
                  </div>
                ) : (
                  <>
                    {lowStockProducts.slice(0, 5).map((item, index) => (
                      <div
                        key={item.id}
                        className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom last:border-0 last:pb-0 last:mb-0"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar avatar-lg bg-soft-danger rounded d-flex align-items-center justify-content-center">
                            <i className="ti ti-package fs-24 text-danger"></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: "160px" }}>
                              {item.productName}
                            </h6>
                            <p className="text-muted small mb-0">SKU: {item.sku}</p>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${item.quantity === 0
                            ? "bg-dark"
                            : item.quantity <= 50
                              ? "bg-danger"
                              : item.quantity <= 100
                                ? "bg-warning text-dark"
                                : "bg-info text-white"
                            } fs-12`}>
                            {item.quantity} left
                          </span>
                        </div>
                      </div>
                    ))}
                    {/* Critical Count Badge */}
                    <div className="mt-4 pt-3 border-top text-center">
                      <span className="badge bg-danger fs-13 px-3 py-2">
                        {lowStockProducts.length} Low Stock Item{lowStockProducts.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Recent Sales */}
          <div className="col-xxl-4 col-md-12 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-pink fs-16 me-2">
                    <i className="ti ti-box" />
                  </span>
                  <h5 className="card-title mb-0">Recent Sales</h5>
                </div>
                <Link
                  to={route.saleslist}
                  className="fs-13 fw-bold text-decoration-underline"
                >
                  View All
                </Link>
              </div>
              <div className="card-body">
                {recentSales.length === 0 ? (
                  <p className="text-center text-muted">Loading...</p>
                ) : (
                  recentSales.map((order) => {
                    const item = order.items[0];
                    const date = new Date(order.date).toLocaleDateString(
                      "en-IN"
                    );
                    return (
                      <div
                        key={order.id}
                        className="d-flex align-items-center justify-content-between py-3 border-bottom"
                      >
                        <div>
                          <h6 className="fw-bold mb-1">
                            {order.customer_name}
                          </h6>
                          <p className="text-muted small mb-0">
                            {item?.description || "Product"}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="fw-bold">
                            ₹{order.grand_total?.toFixed(0)}
                          </p>
                          <small className="text-muted">{date}</small>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          {/* /Recent Sales */}
        </div>
        <div className="row">
          {/* Sales Statics */}
          <div className="col-xl-6 col-sm-12 col-12 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-danger fs-16 me-2">
                    <i className="ti ti-alert-triangle" />
                  </span>
                  <h5 className="card-title mb-0">Sales Statics</h5>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-sm btn-white"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="ti ti-calendar me-1" />
                    2025
                  </Link>
                  <ul className="dropdown-menu p-3">
                    <li>
                      <Link to="#" className="dropdown-item">
                        2025
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item">
                        2022
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item">
                        2021
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body pb-0">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="border p-2 br-8">
                    <h5 className="d-inline-flex align-items-center text-teal">
                      ₹12,189
                      <span className="badge badge-success badge-xs d-inline-flex align-items-center ms-2">
                        <i className="ti ti-arrow-up-left me-1" />
                        25%
                      </span>
                    </h5>
                    <p>Revenue</p>
                  </div>
                  <div className="border p-2 br-8">
                    <h5 className="d-inline-flex align-items-center text-orange">
                      ₹48,988,078
                      <span className="badge badge-danger badge-xs d-inline-flex align-items-center ms-2">
                        <i className="ti ti-arrow-down-right me-1" />
                        25%
                      </span>
                    </h5>
                    <p>Expense</p>
                  </div>
                </div>
                <div id="sales-statistics">
                  <ReactApexChart
                    options={options}
                    series={options.series}
                    type="bar"
                    height={290}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* /Sales Statics */}
          {/* Recent Transactions */}
          <div className="col-xl-6 col-sm-12 col-12 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-orange fs-16 me-2">
                    <i className="ti ti-flag" />
                  </span>
                  <h5 className="card-title mb-0">Recent Transactions</h5>
                </div>
                <Link
                  to={route.onlineorder}
                  className="fs-13 fw-bold text-decoration-underline"
                >
                  View All
                </Link>
              </div>
              <div className="card-body p-0">
                <ul className="nav nav-tabs nav-justified transaction-tab">
                  <li className="nav-item">
                    <Link
                      className="nav-link active"
                      to="#sale"
                      data-bs-toggle="tab"
                    >
                      Sale
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="#purchase-transaction"
                      data-bs-toggle="tab"
                    >
                      Purchase
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="#quotation"
                      data-bs-toggle="tab"
                    >
                      Quotation
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="#expenses"
                      data-bs-toggle="tab"
                    >
                      Expenses
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="#invoices"
                      data-bs-toggle="tab"
                    >
                      Invoices
                    </Link>
                  </li>
                </ul>
                <div className="tab-content">
                  <div className="tab-pane show active" id="sale">
                    <div className="table-responsive">
                      <table className="table table-borderless custom-table">
                        <thead className="thead-light">
                          <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>24 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer16}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Andrea Willer</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Completed
                              </span>
                            </td>
                            <td className="fs-16 fw-bold text-gray-9">
                              ₹4,560
                            </td>
                          </tr>
                          <tr>
                            <td>23 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer17}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Timothy Sandsr</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Completed
                              </span>
                            </td>
                            <td className="fs-16 fw-bold text-gray-9">
                              ₹3,569
                            </td>
                          </tr>
                          <tr>
                            <td>22 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer18}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Bonnie Rodrigues</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-pink badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Draft
                              </span>
                            </td>
                            <td className="fs-16 fw-bold text-gray-9">
                              ₹4,560
                            </td>
                          </tr>
                          <tr>
                            <td>21 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer15}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Randy McCree</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Completed
                              </span>
                            </td>
                            <td className="fs-16 fw-bold text-gray-9">
                              ₹2,155
                            </td>
                          </tr>
                          <tr>
                            <td>21 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer13}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Dennis Anderson</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Completed
                              </span>
                            </td>
                            <td className="fs-16 fw-bold text-gray-9">
                              ₹5,123
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="purchase-transaction">
                    <div className="table-responsive">
                      <table className="table table-borderless custom-table">
                        <thead className="thead-light">
                          <tr>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th>Status</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPurchasesLoading ? (
                            <tr>
                              <td colSpan={4} className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                                <p className="mt-2 text-muted">Loading purchases...</p>
                              </td>
                            </tr>
                          ) : recentPurchases.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-5 text-muted">
                                No recent purchases
                              </td>
                            </tr>
                          ) : (
                            recentPurchases.map((purchase) => (
                              <tr key={purchase.id}>
                                <td>{new Date(purchase.date).toLocaleDateString("en-IN")}</td>
                                <td>
                                  <Link to="#" className="fw-semibold">
                                    {purchase.supplierName}
                                  </Link>
                                </td>
                                <td>
                                  <span className={`badge badge-${purchase.status === "Completed" ? "success" : "cyan"} badge-xs d-inline-flex align-items-center`}>
                                    <i className="ti ti-circle-filled fs-5 me-1" />
                                    {purchase.status}
                                  </span>
                                </td>
                                <td className="text-gray-9">₹{purchase.total.toLocaleString("en-IN")}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="tab-pane" id="quotation">
                    <div className="table-responsive">
                      <table className="table table-borderless custom-table">
                        <thead className="thead-light">
                          <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>24 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer16}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Andrea Willer</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Sent
                              </span>
                            </td>
                            <td className="text-gray-9">₹4,560</td>
                          </tr>
                          <tr>
                            <td>23 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer17}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Timothy Sandsr</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-warning badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Ordered
                              </span>
                            </td>
                            <td className="text-gray-9">₹3,569</td>
                          </tr>
                          <tr>
                            <td>22 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer18}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Bonnie Rodrigues</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-cyan badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Pending
                              </span>
                            </td>
                            <td className="text-gray-9">₹4,560</td>
                          </tr>
                          <tr>
                            <td>21 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer15}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Randy McCree</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-warning badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Ordered
                              </span>
                            </td>
                            <td className="text-gray-9">₹2,155</td>
                          </tr>
                          <tr>
                            <td>21 May 2025</td>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer13}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Dennis Anderson</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #114589
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Sent
                              </span>
                            </td>
                            <td className="text-gray-9">₹5,123</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="expenses">
                    <div className="table-responsive">
                      <table className="table table-borderless custom-table">
                        <thead className="thead-light">
                          <tr>
                            <th>Date</th>
                            <th>Expenses</th>
                            <th>Status</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>24 May 2025</td>
                            <td>
                              <h6 className="fw-medium">
                                <Link to="#">Electricity Payment</Link>
                              </h6>
                              <span className="fs-13 text-orange">#EX849</span>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Approved
                              </span>
                            </td>
                            <td className="text-gray-9">₹200</td>
                          </tr>
                          <tr>
                            <td>23 May 2025</td>
                            <td>
                              <h6 className="fw-medium">
                                <Link to="#">Electricity Payment</Link>
                              </h6>
                              <span className="fs-13 text-orange">#EX849</span>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Approved
                              </span>
                            </td>
                            <td className="text-gray-9">₹200</td>
                          </tr>
                          <tr>
                            <td>22 May 2025</td>
                            <td>
                              <h6 className="fw-medium">
                                <Link to="#">Stationery Purchase</Link>
                              </h6>
                              <span className="fs-13 text-orange">#EX848</span>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Approved
                              </span>
                            </td>
                            <td className="text-gray-9">₹50</td>
                          </tr>
                          <tr>
                            <td>21 May 2025</td>
                            <td>
                              <h6 className="fw-medium">
                                <Link to="#">AC Repair Service</Link>
                              </h6>
                              <span className="fs-13 text-orange">#EX847</span>
                            </td>
                            <td>
                              <span className="badge badge-cyan badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Pending
                              </span>
                            </td>
                            <td className="text-gray-9">₹800</td>
                          </tr>
                          <tr>
                            <td>21 May 2025</td>
                            <td>
                              <h6 className="fw-medium">
                                <Link to="#">Client Meeting</Link>
                              </h6>
                              <span className="fs-13 text-orange">#EX846</span>
                            </td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Approved
                              </span>
                            </td>
                            <td className="text-gray-9">₹100</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="tab-pane" id="invoices">
                    <div className="table-responsive">
                      <table className="table table-borderless custom-table">
                        <thead className="thead-light">
                          <tr>
                            <th>Customer</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer16}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Andrea Willer</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #INV005
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>24 May 2025</td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Paid
                              </span>
                            </td>
                            <td className="text-gray-9">₹1300</td>
                          </tr>
                          <tr>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer17}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Timothy Sandsr</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #INV004
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>23 May 2025</td>
                            <td>
                              <span className="badge badge-warning badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Overdue
                              </span>
                            </td>
                            <td className="text-gray-9">₹1250</td>
                          </tr>
                          <tr>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer18}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Bonnie Rodrigues</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #INV003
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>22 May 2025</td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Paid
                              </span>
                            </td>
                            <td className="text-gray-9">₹1700</td>
                          </tr>
                          <tr>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer15}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Randy McCree</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #INV002
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>21 May 2025</td>
                            <td>
                              <span className="badge badge-danger badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Unpaid
                              </span>
                            </td>
                            <td className="text-gray-9">₹1500</td>
                          </tr>
                          <tr>
                            <td>
                              <div className="d-flex align-items-center file-name-icon">
                                <Link to="#" className="avatar avatar-md">
                                  <img
                                    src={customer13}
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-medium">
                                    <Link to="#">Dennis Anderson</Link>
                                  </h6>
                                  <span className="fs-13 text-orange">
                                    #INV001
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>21 May 2025</td>
                            <td>
                              <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                                <i className="ti ti-circle-filled fs-5 me-1" />
                                Paid
                              </span>
                            </td>
                            <td className="text-gray-9">₹1000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Recent Transactions */}
        </div>
        <div className="row">
          {/* Top Customers */}
          <div className="col-xxl-4 col-md-6 d-flex">
            <div className="card flex-fill">
              {/* Header – same as old */}
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-orange fs-16 me-2">
                    <i className="ti ti-users" />
                  </span>
                  <h5 className="card-title mb-0">Top Customers : {customerCount}</h5>
                </div>
              </div>
              {/* Body – exact old height & padding */}
              <div className="card-body">
                {topCustLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" />
                  </div>
                ) : topCustomers.length === 0 ? (
                  <p className="text-center text-muted py-4">No customers</p>
                ) : (
                  topCustomers.map((c, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3 flex-wrap gap-2"
                    >
                      <div className="d-flex align-items-center">
                        {/* Avatar initials */}
                        <div className="avatar avatar-lg bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold">
                          {c.customer
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="ms-2">
                          {/* Click name → details */}
                          <h6 className="fs-14 fw-bold mb-1">
                            <Link
                              to={route.customers}
                              className="text-dark hover:text-primary hover:underline transition"
                            >
                              {c.customer}
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center item-list text-muted fs-12">
                            <span className="d-inline-flex align-items-center">
                              <i className="ti ti-map-pin me-1" />
                              {c.country || "N/A"}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{c.total_orders || 0} Orders</span>
                          </div>
                        </div>
                      </div>
                      {/* Amount */}
                      <div className="text-end">
                        <h5 className="text-primary fw-bold mb-0">
                          ₹{Number(c.total_spent || 0).toLocaleString("en-IN")}
                        </h5>
                      </div>
                    </div>
                  ))
                )}
                <div className="card-footer bg-transparent border-0 text-center">
                  <Link
                    to={route.customers}
                    className="fs-13 fw-bold text-decoration-underline "
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* /Top Customers */}

          {/* Top Categories - FULL 7 CATEGORIES + NO INFINITE STRETCH */}
          <div className="col-xxl-4 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  All Categories ({categories.length})
                </h5>
              </div>

              {/* MAIN FIX DA — FIXED HEIGHT + SCROLL IF NEEDED */}
              <div className="card-body" style={{ minHeight: "510px", maxHeight: "480px", overflow: "hidden" }}>
                <div className="h-100 d-flex flex-column">

                  {categoriesLoading ? (
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                      <div className="text-center">
                        <div className="spinner-border text-primary mb-3"></div>
                        <p className="text-muted">Loading categories...</p>
                      </div>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                      <div className="text-center text-muted">
                        <i className="ti ti-package fs-50 d-block mb-3"></i>
                        <p>No categories found</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Doughnut Chart - Fixed Size */}
                      <div className="text-center mb-4 flex-shrink-0">
                        <div style={{ height: "220px", width: "220px" }} className="mx-auto">
                          <Doughnut
                            data={{
                              labels: categories.map(c => c.category),
                              datasets: [{
                                data: categories.map(() => 1),
                                backgroundColor: ["#092C4C", "#E04F16", "#FE9F43", "#0E9384", "#6366F1", "#EC4899", "#F59E0B"],
                                borderWidth: 5,
                                borderRadius: 10,
                                cutout: "68%",
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } }
                            }}
                          />
                          <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
                            <h4 className="mb-0 fw-bold text-primary">{categories.length}</h4>
                            <small className="text-muted">Total</small>
                          </div>
                        </div>
                      </div>

                      {/* Category List - Scrollable if too many */}
                      <div className="flex-grow-1 overflow-auto px-2">
                        <div className="border-top pt-3">
                          {categories.map((cat, i) => (
                            <div key={cat.id} className="d-flex align-items-center justify-content-between py-2">
                              <div className="d-flex align-items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: ["#092C4C", "#E04F16", "#FE9F43", "#0E9384", "#6366F1", "#EC4899", "#F59E0B"][i] }}
                                />
                                <span className="fw-medium text-gray-800">{cat.category}</span>
                              </div>
                              <span className="badge bg-success badge-xs">Active</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card-footer text-center bg-transparent border-0">
                <Link to={route.categorylist} className="btn btn-outline-primary btn-sm">
                  Manage Categories
                </Link>
              </div>
            </div>
          </div>
          {/* Order Statistics */}
          <div className="col-xxl-4 col-md-12 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-indigo fs-16 me-2">
                    <i className="ti ti-package" />
                  </span>
                  <h5 className="card-title mb-0">Order Statistics</h5>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-sm btn-white"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="ti ti-calendar me-1" />
                    Weekly
                  </Link>
                  <ul className="dropdown-menu p-3">
                    <li>
                      <Link to="#" className="dropdown-item">
                        Today
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item">
                        Weekly
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item">
                        Monthly
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body pb-0">
                <div id="heat_chart">
                  <ApexCharts
                    options={heat_chart}
                    series={heat_chart.series}
                    type="heatmap"
                    height={420}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* /Order Statistics */}
        </div>
      </div>
      <div className="copyright-footer d-flex align-items-center justify-content-between border-top bg-white gap-3 flex-wrap">
        <p className="fs-13 text-gray-9 mb-0">
          2025 © iatsolutionsPOS. All Right Reserved
        </p>
        <p>
          Designed &amp; Developed By iatsolutions{" "}
          <Link to="#" className="link-primary">
            iatsolutions
          </Link>
        </p>
      </div>
    </div>
  );
};
export default NewDashboard;