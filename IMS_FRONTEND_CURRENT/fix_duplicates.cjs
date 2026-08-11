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

async function fixDuplicates() {
    console.log('Fetching all stock...');
    try {
        const stocks = await request('GET', '/api/stock/all');
        console.log(`Fetched ${stocks.length} stock entries.`);

        // Group by warehouse + productName
        const groups = {};
        for (const s of stocks) {
            // Normalize keys
            const key = `${s.warehouse?.trim()}|${s.productName?.trim()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        }

        let fixedCount = 0;

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                console.log(`Found duplicate for ${key}: ${group.length} entries.`);

                // Calculate total quantity
                let totalQty = 0;
                group.forEach(g => totalQty += (g.quantity || 0));

                // Survivor is the first one
                const survivor = group[0];
                const others = group.slice(1);

                console.log(`Merging into ID ${survivor.id}. New Qty: ${totalQty}`);

                // 1. Update survivor
                // We must fetch fresh data or carry over fields. 
                // Use spread of survivor but update quantity.
                const updatePayload = {
                    ...survivor,
                    quantity: totalQty
                };

                await request('PUT', `/api/stock/update/update/${survivor.id}`, updatePayload)
                    .catch(e => {
                        // Try /api/stock/update/{id} if double 'update' was typo in my thought
                        // Controller says: @PutMapping("/update/{id}")
                        // So path is /api/stock/update/123
                        return request('PUT', `/api/stock/update/${survivor.id}`, updatePayload);
                    });

                console.log(`Updated survivor ${survivor.id}.`);

                // 2. Delete others
                for (const other of others) {
                    console.log(`Deleting duplicate ID ${other.id}...`);
                    await request('DELETE', `/api/stock/delete/${other.id}`);
                }

                fixedCount++;
            }
        }

        if (fixedCount === 0) {
            console.log("No duplicates found to fix.");
        } else {
            console.log(`Fixed ${fixedCount} duplicate groups.`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

fixDuplicates();
