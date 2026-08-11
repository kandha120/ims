export const purchaseSummaryData = [
  { period: "2026-07", supplier: "Supplier A", totalAmount: 12000, totalQty: 100 },
  { period: "2026-06", supplier: "Supplier B", totalAmount: 8500, totalQty: 70 }
];

export const purchaseDetailData = [
  { invoiceNo: "P-1001", date: "2026-07-01", supplier: "Supplier A", product: "Widget","qty": 10, unitPrice: 50, total: 500 },
  { invoiceNo: "P-1002", date: "2026-07-03", supplier: "Supplier A", product: "Gadget","qty": 20, unitPrice: 100, total: 2000 }
];

export const supplierWiseData = [
  { supplier: "Supplier A", totalPurchases: 12500, outstanding: 1500 },
  { supplier: "Supplier B", totalPurchases: 8500, outstanding: 0 }
];

export const productWiseData = [
  { product: "Widget", sku: "W-01", purchasedQty: 200, purchasedValue: 5000 },
  { product: "Gadget", sku: "G-02", purchasedQty: 150, purchasedValue: 7500 }
];

export const purchaseReturnData = [
  { returnNo: "R-2001", date: "2026-07-10", supplier: "Supplier A", product: "Widget", qty: 2, value: 100 }
];

export const supplierOutstandingData = [
  { supplier: "Supplier A", invoiceNo: "P-1003", dueDate: "2026-08-01", dueAmount: 1500 }
];

export const gstPurchaseData = [
  { invoiceNo: "P-1001", date: "2026-07-01", supplier: "Supplier A", taxableValue: 450, gst: 50, total: 500 }
];
import {
  expireProduct01,
  expireProduct02,
  expireProduct03,
  expireProduct04,
  stockImg01,
  stockImg02,
  stockImg04,
  stockImg05,
  stockImg06 } from
"../../utils/imagepath";

export const purchasereportdata = [
{
  id: 1,
  img: stockImg01,
  productName: "Lenovo 3rd Generation",
  productAmount: "$5000",
  productQty: "500",
  instockQty: "100"
},
{
  id: 2,
  img: stockImg06,
  productName: "Bold V3.2",
  productAmount: "$1000",
  productQty: "200",
  instockQty: "150"
},
{
  id: 3,
  img: stockImg02,
  productName: "Nike Jordan",
  productAmount: "$2000",
  productQty: "350",
  instockQty: "200"
},
{
  id: 4,
  img: stockImg04,
  productName: "Apple Series 5 Watch",
  productAmount: "$500",
  productQty: "120",
  instockQty: "50"
},
{
  id: 5,
  img: stockImg04,
  productName: "Amazon Echo Dot",
  productAmount: "$100",
  productQty: "400",
  instockQty: "320"
},
{
  id: 6,
  img: stockImg05,
  productName: "Lobar Handy",
  productAmount: "$1500",
  productQty: "170",
  instockQty: "80"
},
{
  id: 7,
  img: expireProduct01,
  productName: "Red Premium Handy",
  productAmount: "$800",
  productQty: "320",
  instockQty: "180"
},
{
  id: 8,
  img: expireProduct02,
  productName: "Iphone 14 Pro",
  productAmount: "$1200",
  productQty: "270",
  instockQty: "120"
},
{
  id: 9,
  img: expireProduct03,
  productName: "Black Slim 200",
  productAmount: "$600",
  productQty: "180",
  instockQty: "70"
},
{
  id: 10,
  img: expireProduct04,
  productName: "Woodcraft Sandal",
  productAmount: "$300",
  productQty: "450",
  instockQty: "300"
}];