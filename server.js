const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// 1. REAL DATABASE CONNECTION
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '1234',  // Your password
    database: 'unideals_db',
    port: 3306         
});

db.connect((err) => {
    if (err) {
        console.error('❌ FATAL: Could not connect to MySQL.');
        return;
    }
    console.log('✅ Connected to Real MySQL Database successfully!');
});

// ==========================================
// 2. ADMIN MANAGEMENT ENDPOINTS
// ==========================================

// GET: Fetch All Products WITH Pricing Rules
app.get('/api/admin/products', (req, res) => {
    const sql = `
        SELECT p.*, 
               r.decay_rate_percent, 
               r.decay_interval_minutes, 
               r.minimum_floor_price 
        FROM products p 
        LEFT JOIN pricing_rules r ON p.id = r.product_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database Error" });
        res.json(results);
    });
});

// POST: Add New Product AND Rules
app.post('/api/admin/products', (req, res) => {
    const { name, base_price, stock_quantity, image_url, decay_rate_percent, decay_interval_minutes, minimum_floor_price } = req.body;
    
    if (!image_url || image_url.trim() === "") {
        return res.status(400).json({ error: "Product image is required." });
    }

    const sqlProduct = "INSERT INTO products (name, base_price, stock_quantity, image_url) VALUES (?, ?, ?, ?)";
    
    db.query(sqlProduct, [name, base_price, stock_quantity, image_url], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to add product" });
        
        const productId = result.insertId;
        
        // Add Default Pricing Rules if not provided
        const sqlRules = "INSERT INTO pricing_rules (product_id, decay_rate_percent, decay_interval_minutes, minimum_floor_price) VALUES (?, ?, ?, ?)";
        const rate = decay_rate_percent || 5.00; 
        const interval = decay_interval_minutes || 5.00; 
        const min = minimum_floor_price || (base_price * 0.5);

        db.query(sqlRules, [productId, rate, interval, min], (errRules) => {
            if (errRules) console.error("Rule Error:", errRules);
            res.json({ success: true, id: productId });
        });
    });
});

// PUT: Update Product AND Rules (CRITICAL FIX)
app.put('/api/admin/products/:id', (req, res) => {
    const { name, base_price, stock_quantity, image_url, decay_rate_percent, decay_interval_minutes, minimum_floor_price } = req.body;
    const id = req.params.id;

    // 1. Update Product Info
    const sqlProduct = "UPDATE products SET name=?, base_price=?, stock_quantity=?, image_url=? WHERE id=?";
    
    db.query(sqlProduct, [name, base_price, stock_quantity, image_url, id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update product" });

        // 2. Update Pricing Rules
        // Check if rule exists first to decide UPDATE vs INSERT
        const checkRuleSql = "SELECT * FROM pricing_rules WHERE product_id = ?";
        db.query(checkRuleSql, [id], (errCheck, ruleResult) => {
            if (errCheck) return res.status(500).json({ error: "Rule check failed" });

            if (ruleResult.length > 0) {
                // UPDATE existing rule
                const sqlUpdateRules = "UPDATE pricing_rules SET decay_rate_percent=?, decay_interval_minutes=?, minimum_floor_price=? WHERE product_id=?";
                db.query(sqlUpdateRules, [decay_rate_percent, decay_interval_minutes, minimum_floor_price, id], (errRules) => {
                    if (errRules) return res.status(500).json({ error: "Failed to update rules" });
                    res.json({ success: true });
                });
            } else {
                // INSERT new rule
                const sqlInsertRules = "INSERT INTO pricing_rules (product_id, decay_rate_percent, decay_interval_minutes, minimum_floor_price) VALUES (?, ?, ?, ?)";
                db.query(sqlInsertRules, [id, decay_rate_percent, decay_interval_minutes, minimum_floor_price], (errRules) => {
                    if (errRules) return res.status(500).json({ error: "Failed to insert rules" });
                    res.json({ success: true });
                });
            }
        });
    });
});

// DELETE: Remove Product
app.delete('/api/admin/products/:id', (req, res) => {
    const sql = "DELETE FROM products WHERE id = ?";
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete" });
        res.json({ success: true });
    });
});

const { v4: uuidv4 } = require('uuid'); // You might need to install this: npm install uuid

// 1. ADMIN: Generate a unique QR Token
app.post('/api/admin/generate-qr', (req, res) => {
    const { product_id, location_tag } = req.body;
    const token = uuidv4(); // Creates a unique string like "a1b2-c3d4..."
    
    // Set expiry (e.g., 24 hours from now)
    const sql = `INSERT INTO active_tokens (token_uuid, product_id, expires_at, location_tag) 
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?)`;
                 
    db.query(sql, [token, product_id, location_tag || 'General'], (err, result) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        
        // Return the full URL for the QR code
        res.json({ 
            success: true, 
            token: token,
            scanUrl: `http://localhost:5173/scan/${token}` 
        });
    });
});

// 2. STUDENT: Scan the Token (FIXED VERSION)
app.get('/api/scan/:token', (req, res) => {
    const { token } = req.params;
    
    // Check if token exists and is not expired
    const sql = `
        SELECT t.*, p.name, p.base_price, p.image_url, p.stock_quantity, 
               r.decay_rate_percent, r.decay_interval_minutes, r.minimum_floor_price
        FROM active_tokens t
        JOIN products p ON t.product_id = p.id
        LEFT JOIN pricing_rules r ON p.id = r.product_id
        WHERE t.token_uuid = ? AND t.expires_at > NOW()
    `;

    db.query(sql, [token], (err, results) => {
        if (err) return res.status(500).json({ error: "Server Error" });
        if (results.length === 0) return res.status(404).json({ error: "Invalid or Expired QR Code" });

        const data = results[0];

        // --- SAFE MATH LOGIC ---
        // 1. Force all database values to be Numbers (parseFloat)
        const basePrice = parseFloat(data.base_price);
        const decayRate = parseFloat(data.decay_rate_percent || 0);
        const intervalMins = parseFloat(data.decay_interval_minutes || 1);
        const minPrice = parseFloat(data.minimum_floor_price || basePrice);
        
        // 2. Calculate time passed
        const now = new Date();
        const generatedAt = new Date(data.generated_at);
        const diffInMilliseconds = now - generatedAt;
        const minutesPassed = diffInMilliseconds / 1000 / 60;
        
        // 3. Calculate Price Drop
        const intervals = Math.floor(minutesPassed / intervalMins);
        
        // Use the compound decay formula: Price = Base * (1 - rate)^intervals
        let currentPrice = basePrice * Math.pow((1 - (decayRate / 100)), intervals);
        
        // 4. Safety Checks
        if (currentPrice < minPrice) currentPrice = minPrice;
        if (isNaN(currentPrice)) currentPrice = basePrice; // Fallback if math fails

        // 5. Calculate "Next Drop In" (Seconds)
        // (Total intervals + 1) * interval_ms - time_passed_ms
        const nextDropInSeconds = ((intervals + 1) * intervalMins * 60) - (diffInMilliseconds / 1000);

        res.json({
            product: {
                id: data.product_id,
                name: data.name,
                image_url: data.image_url,
                stock: data.stock_quantity
            },
            pricing: {
                original: basePrice.toFixed(2),
                current: currentPrice.toFixed(2), // Now safe because we used parseFloat above
                next_drop_in: nextDropInSeconds,
                discount_applied: currentPrice < basePrice
            },
            meta: {
                location: data.location_tag,
                expires_in_minutes: Math.floor((new Date(data.expires_at) - now) / 1000 / 60)
            }
        });
    });
});

// ==========================================
// 3. AUTHENTICATION & CLIENT ENDPOINTS
// ==========================================
// (Keeping these the same as before)

app.post('/api/auth/register', (req, res) => {
    const { username, first_name, last_name, email, password } = req.body;
    const sql = "INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [username, first_name, last_name, email, password], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, userId: result.insertId });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ? AND hashedPassword = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        const user = results[0];
        res.json({ success: true, user: { id: user.id, username: user.username, firstName: user.first_name, isAdmin: user.is_admin === 1 } });
    });
});

app.get('/api/orders/:userId', (req, res) => {
    const sql = `SELECT o.id, o.final_price_paid, o.created_at, p.name, p.image_url FROM orders o JOIN products p ON o.product_id = p.id WHERE o.user_id = ? ORDER BY o.created_at DESC`;
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/test/generate-token', (req, res) => {
    const { product_id } = req.body;
    const token = "test-" + Math.random().toString(36).substr(2, 9);
    const sql = "INSERT INTO active_tokens (token_uuid, product_id, generated_at, expires_at, location_tag) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'TEST_CATALOG')";
    db.query(sql, [token, product_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ token });
    });
});


app.post('/api/checkout', (req, res) => {
    const { product_id, price_paid, email, user_id } = req.body;
    const checkStockSql = "SELECT stock_quantity FROM products WHERE id = ?";
    db.query(checkStockSql, [product_id], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ error: "Product not found" });
        const currentStock = results[0].stock_quantity;
        if (currentStock <= 0) return res.status(400).json({ error: "Out of Stock" });
        const orderSql = "INSERT INTO orders (product_id, final_price_paid, customer_email, user_id) VALUES (?, ?, ?, ?)";
        db.query(orderSql, [product_id, price_paid, email, user_id || null], (err, result) => {
            if (err) return res.status(500).json(err);
            const updateStockSql = "UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?";
            db.query(updateStockSql, [product_id], (err) => {
                 console.log(`[SALE] Sold Product ${product_id} for £${price_paid} (Stock: ${currentStock} -> ${currentStock - 1})`);
                 res.json({ success: true });
            });
        });
    });
});

app.get('/api/analytics', (req, res) => {
    res.json({ total_sales: 142, active_hotspots: ["Library", "Gym"] });
});

app.listen(PORT, () => {
    console.log(`UniDeals Server running on http://localhost:${PORT}`);
});