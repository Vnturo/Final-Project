const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// ==========================================
// 1. REAL DATABASE CONNECTION
// ==========================================
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
// 2. AUTHENTICATION ENDPOINTS (New!)
// ==========================================

// POST: Register
app.post('/api/auth/register', (req, res) => {
    const { username, first_name, last_name, email, password } = req.body;
    // In a real app, hash the password here (e.g. bcrypt)
    // Using plain text 'password' as per your provided SQL usage
    const hashedPassword = password; 

    const sql = "INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [username, first_name, last_name, email, hashedPassword], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Username or Email already exists" });
            return res.status(500).json(err);
        }
        res.json({ success: true, userId: result.insertId });
    });
});

// POST: Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    // Check against the 'hashedPassword' column
    const sql = "SELECT * FROM users WHERE email = ? AND hashedPassword = ?";
    
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        
        const user = results[0];
        // Send back user info + isAdmin flag
        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                username: user.username, 
                firstName: user.first_name,
                isAdmin: user.is_admin === 1 
            } 
        });
    });
});

// GET: Order History
app.get('/api/orders/:userId', (req, res) => {
    const sql = `
        SELECT o.id, o.final_price_paid, o.created_at, p.name, p.image_url 
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ==========================================
// 3. CORE API ENDPOINTS
// ==========================================

// GET: All Products
app.get('/api/admin/products', (req, res) => {
    const sql = "SELECT * FROM products";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database Error" });
        res.json(results);
    });
});

// POST: Generate Test Token
app.post('/api/test/generate-token', (req, res) => {
    const { product_id } = req.body;
    const token = "test-" + Math.random().toString(36).substr(2, 9);
    const sql = "INSERT INTO active_tokens (token_uuid, product_id, generated_at, expires_at, location_tag) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'TEST_CATALOG')";
    db.query(sql, [token, product_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ token });
    });
});

// GET: Scan Logic
app.get('/api/scan/:token', (req, res) => {
    const { token } = req.params;
    const tokenSql = "SELECT * FROM active_tokens WHERE token_uuid = ?";
    
    db.query(tokenSql, [token], (err, tokenResults) => {
        if (err || tokenResults.length === 0) return res.status(404).json({ error: "Invalid QR Code" });
        const tokenData = tokenResults[0];

        const productSql = `SELECT p.*, r.decay_rate_percent, r.decay_interval_minutes, r.minimum_floor_price FROM products p LEFT JOIN pricing_rules r ON p.id = r.product_id WHERE p.id = ?`;

        db.query(productSql, [tokenData.product_id], (err, productResults) => {
            if (err) return res.status(500).json(err);
            const product = productResults[0];
            
            const basePrice = parseFloat(product.base_price);
            const decayRate = parseFloat(product.decay_rate_percent || 0);
            const intervalSec = parseFloat((product.decay_interval_minutes || 1) * 60); 
            const minPrice = parseFloat(product.minimum_floor_price || basePrice);

            const now = new Date();
            const deltaSeconds = Math.floor((now - new Date(tokenData.generated_at)) / 1000);
            const intervalsPassed = Math.floor(deltaSeconds / intervalSec);
            const decayAmount = (basePrice * decayRate * intervalsPassed) / 100;
            
            let currentPrice = basePrice - decayAmount;
            if (currentPrice < minPrice) currentPrice = minPrice;
            if (isNaN(currentPrice)) currentPrice = basePrice;

            res.json({
                product: { id: product.id, name: product.name, image_url: product.image_url, stock: product.stock_quantity },
                pricing: { original: basePrice, current: currentPrice.toFixed(2), next_drop_in: intervalSec - (deltaSeconds % intervalSec) },
                meta: { location: tokenData.location_tag }
            });
        });
    });
});

// POST: Checkout (Updated to save User ID)
app.post('/api/checkout', (req, res) => {
    const { product_id, price_paid, email, user_id } = req.body;

    // 1. Check Stock
    const checkStockSql = "SELECT stock_quantity FROM products WHERE id = ?";
    db.query(checkStockSql, [product_id], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ error: "Product not found" });
        if (results[0].stock_quantity <= 0) return res.status(400).json({ error: "Out of Stock" });

        // 2. Create Order (With User ID)
        const orderSql = "INSERT INTO orders (product_id, final_price_paid, customer_email, user_id) VALUES (?, ?, ?, ?)";
        db.query(orderSql, [product_id, price_paid, email, user_id || null], (err, result) => {
            if (err) return res.status(500).json(err);

            // 3. Update Stock
            const updateStockSql = "UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?";
            db.query(updateStockSql, [product_id], (err) => {
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