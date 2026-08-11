const http = require('http');

const options = {
    hostname: 'localhost',
    port: 8200,
    path: '/api/sales-return/all',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Status Code:", res.statusCode);
            console.log("Is Array:", Array.isArray(json));
            if (Array.isArray(json) && json.length > 0) {
                console.log("Number of items:", json.length);
                console.log("Keys of first item:", Object.keys(json[0]));
                console.log("First item sample:", JSON.stringify(json[0], null, 2));

                // Check our specific test item (id 26 or similar via customerName)
                const testItem = json.find(i => i.customerName === "Test Customer" || i.customerName === "Test");
                if (testItem) {
                    console.log("Found Test Item:", JSON.stringify(testItem, null, 2));
                } else {
                    console.log("Test Item NOT found.");
                }

            } else {
                console.log("JSON is empty array or not array:", json);
            }
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw Data:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
