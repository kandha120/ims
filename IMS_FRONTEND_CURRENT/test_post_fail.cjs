const http = require('http');

const dataFail = JSON.stringify({
    productSku: "IPHONE-789",
    quantity: 1,
    cost: 100,
    description: "Test",
    items: [{ productSku: "X", quantity: 1 }] // Uncommented items array
});

const options = {
    hostname: 'localhost',
    port: 8200,
    path: '/api/purchases',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataFail)
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

req.write(dataFail);
req.end();
