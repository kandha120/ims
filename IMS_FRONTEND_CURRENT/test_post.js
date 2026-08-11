const http = require('http');

const data = JSON.stringify({
    supplierName: "Test Supplier",
    reference: "REF123",
    date: "2026-02-09",
    productSku: "SKU123",
    quantity: 1,
    cost: 100,
    discount: 0,
    tax: 0,
    orderTax: 0,
    orderDiscount: 0,
    shippingStatus: "PENDING",
    description: "Test",
    paid: 0,
    due: 100,
    grandTotal: 100,
    items: [] // Intentionally empty array to see if backend rejects it or ignores it (wait, I removed items from frontend, so I should omit it here)
});

// Omit items field as per my fix
const dataClean = JSON.stringify({
    supplierName: "Test Supplier",
    reference: "REF123",
    date: "2026-02-09",
    productSku: "SKU123",
    quantity: 1,
    cost: 100,
    discount: 0,
    tax: 0,
    orderTax: 0,
    orderDiscount: 0,
    shippingStatus: "PENDING",
    description: "Test",
    paid: 0,
    due: 100,
    grandTotal: 100
});


const options = {
    hostname: 'localhost',
    port: 8200,
    path: '/api/purchases',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataClean.length
    }
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', chunk => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', e => {
    console.error(`problem with request: ${e.message}`);
});

req.write(dataClean);
req.end();
