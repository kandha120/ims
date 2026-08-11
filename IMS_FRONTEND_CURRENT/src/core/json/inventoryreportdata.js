import {
  expireProduct01,
  expireProduct02,
  expireProduct03,
  expireProduct04,
  stockImg01,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
  stockImg06
} from "../../utils/imagepath";

export const currentStockData = [
  { warehouse: 'Main', product: 'Widget', sku: 'W-01', qtyOnHand: 120, unitCost: 5, value: 600 },
  { warehouse: 'Secondary', product: 'Gadget', sku: 'G-02', qtyOnHand: 40, unitCost: 50, value: 2000 }
];

export const stockMovementData = [
  { date: '2026-07-01', product: 'Widget', type: 'IN', qty: 50, reference: 'P-1001' },
  { date: '2026-07-05', product: 'Widget', type: 'OUT', qty: 20, reference: 'S-5001' }
];

export const stockLedgerData = [
  { product: 'Widget', date: '2026-07-01', balance: 100, in: 50, out: 10 },
  { product: 'Gadget', date: '2026-07-03', balance: 40, in: 20, out: 0 }
];

export const stockValuationData = [
  { product: 'Widget', method: 'FIFO', qty: 120, value: 600 },
  { product: 'Gadget', method: 'WAVG', qty: 40, value: 2000 }
];

export const lowStockData = [
  { product: 'Widget', sku: 'W-01', qtyOnHand: 5, reorderLevel: 10 }
];

export const outOfStockData = [
  { product: 'Accessory X', sku: 'AX-01', qtyOnHand: 0 }
];

export const expiryData = [
  { product: 'Perishable A', sku: 'PA-01', expireDate: '2026-08-01', qty: 10 }
];

export const movementSpeedData = [
  { product: 'Widget', sku: 'W-01', avgMonthlySales: 200, daysCover: 15 },
  { product: 'Gadget', sku: 'G-02', avgMonthlySales: 20, daysCover: 60 }
];

export const deadStockData = [
  { product: 'Old Model', sku: 'OM-01', qty: 500, lastSoldDate: '2024-01-01' }
];

export const warehouseWiseData = [
  { warehouse: 'Main', product: 'Widget', qtyOnHand: 120 },
  { warehouse: 'Secondary', product: 'Gadget', qtyOnHand: 40 }
];

export const inventoryAdjustmentData = [
  { adjustNo: 'A-3001', date: '2026-07-15', product: 'Widget', qtyBefore: 120, qtyAfter: 118, reason: 'Damage' }
];

export const inventoryreportdata = [
  {
    id: 1,
    img: stockImg01,
    productName: "Lenovo 3rd Generation",
    sku: "PT001",
    category: "Computers",
    brand: "N/D",
    unit: "pc",
    instockQty: "100"
  },
  {
    id: 2,
    productName: "Bold V3.2",
    img: stockImg06,
    sku: "PT002",
    category: "Accessories",
    brand: "N/D",
    unit: "pc",
    instockQty: "150"
  },
  {
    id: 3,
    img: stockImg02,
    productName: "Nike Jordan",
    sku: "PT003",
    category: "Shoe",
    brand: "N/D",
    unit: "pc",
    instockQty: "170"
  },
  {
    id: 4,
    img: stockImg03,
    productName: "Apple Series 5 Watch",
    sku: "PT004",
    category: "Accessories",
    brand: "N/D",
    unit: "pc",
    instockQty: "120"
  },
  {
    id: 5,
    img: stockImg04,
    productName: "Amazon Echo Dot",
    sku: "PT005",
    category: "Accessories",
    brand: "N/D",
    unit: "pc",
    instockQty: "80"
  },
  {
    id: 6,
    img: stockImg05,
    productName: "Lobar Handy",
    sku: "PT006",
    category: "Furnitures",
    brand: "N/D",
    unit: "pc",
    instockQty: "200"
  },
  {
    id: 7,
    img: expireProduct01,
    productName: "Red Premium Handy",
    sku: "PT007",
    category: "Accessories",
    brand: "N/D",
    unit: "pc",
    instockQty: "230"
  },
  {
    id: 8,
    img: expireProduct02,
    productName: "Iphone 14 Pro",
    sku: "PT008",
    category: "Phone",
    brand: "N/D",
    unit: "pc",
    instockQty: "370"
  },
  {
    id: 9,
    img: expireProduct03,
    productName: "Black Slim 200",
    sku: "PT009",
    category: "Furnitures",
    brand: "N/D",
    unit: "pc",
    instockQty: "260"
  },
  {
    id: 10,
    img: expireProduct04,
    productName: "Woodcraft Sandal",
    sku: "PT010",
    category: "Bags",
    brand: "N/D",
    unit: "pc",
    instockQty: "340"
  }
];
