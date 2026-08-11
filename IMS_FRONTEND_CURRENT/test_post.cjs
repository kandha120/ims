const http = require('http');

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
    grandTotal: 100,
    items: [] // Intentionally adding items array to see if backend rejects it
});

const options = {
    hostname: 'localhost',
    port: 8200,
    path: '/api/purchases',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataClean)
    }
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', chunk => {
        body += chunk;
    });
    res.on('end', () => {
        console.log(`BODY: ${body}`);
    });
});

req.on('error', e => {
    console.error(`problem with request: ${e.message}`);
});

req.write(dataClean);
req.end();
