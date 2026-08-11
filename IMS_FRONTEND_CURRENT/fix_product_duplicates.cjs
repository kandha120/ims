const http = require('http');

// Helper for HTTP requests
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8200,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            const body = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve(body);
                    }
                } else {
                    try {
                        const err = JSON.parse(body);
                        reject(new Error(`Status ${res.statusCode}: ${err.message || body}`));
                    } catch {
                        reject(new Error(`Status ${res.statusCode}: ${body}`));
                    }
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function fixProductDuplicates() {
    console.log('Fetching all products...');
    try {
        const response = await request('GET', '/api/products');
        // Response structure might be { results: [...] } or just [...]
        const products = Array.isArray(response) ? response : (response.results || []);

        console.log(`Fetched ${products.length} products.`);

        // Group by SKU
        const groups = {};
        for (const p of products) {
            // Normalize keys
            let key = p.sku || p.productSku; // Check both fields
            if (!key) continue;
            key = key.trim();

            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        }

        let fixedCount = 0;

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                console.log(`Found duplicate product SKU ${key}: ${group.length} entries.`);

                // Survivor is the first one
                const survivor = group[0];
                const others = group.slice(1);

                console.log(`Keeping ID ${survivor.id}. Deleting others...`);

                // Delete others
                for (const other of others) {
                    console.log(`Deleting duplicate product ID ${other.id}...`);
                    await request('DELETE', `/api/products/${other.id}`);
                }

                fixedCount++;
            }
        }

        if (fixedCount === 0) {
            console.log("No duplicate products found.");
        } else {
            console.log(`Fixed ${fixedCount} duplicate product groups.`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

fixProductDuplicates();
