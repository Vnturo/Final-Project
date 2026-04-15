require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const app = express();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Make sure the uploads folder actually exists so the app doesn't crash
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Tell Express to make the 'uploads' folder public so React can see the images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer (Where to save, and what to name the file)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save to the uploads folder
    },
    filename: function (req, file, cb) {
        // Give the file a unique name using the current timestamp so files don't overwrite each other
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Backend: server.js
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,     
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('❌ FATAL: Could not connect to MySQL.');
        return;
    }
    console.log('✅ Connected to Real MySQL Database successfully!');
});

// ADMIN MANAGEMENT ENDPOINTS

// GET: Fetch All Products with Pricing Rules
app.get('/api/admin/products', (req, res) => {
    const sql = `
        SELECT p.*, 
               r.decay_rate_percent, 
               r.decay_interval_minutes, 
               r.minimum_floor_price,
               r.flash_duration_minutes
        FROM products p 
        LEFT JOIN pricing_rules r ON p.id = r.product_id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ SQL ERROR:", err.message); 
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// POST: Add a new product WITH an image upload
app.post('/api/admin/products', upload.single('image'), (req, res) => {
    // Grab the text fields from the request
    const { name, base_price, stock_quantity, decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes } = req.body;
    
    // Handle the image upload (if there is one) and get the URL to save in the database
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Insert into the Database
    const sqlProduct = "INSERT INTO products (name, base_price, stock_quantity, image_url) VALUES (?, ?, ?, ?)";
    
    // Insert the Product
    db.query(sqlProduct, [name, base_price, stock_quantity, image_url], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to add product" });
        
        const productId = result.insertId;

        // Insert the Pricing Rules for this new product
        const sqlInsertRules = "INSERT INTO pricing_rules (product_id, decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes) VALUES (?, ?, ?, ?, ?)";
        db.query(sqlInsertRules, [productId, decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes], (errRules) => {
            if (errRules) return res.status(500).json({ error: "Failed to insert rules" });
            res.json({ success: true, message: "Product created with image!" });
        });
    });
});

// POST: Generate a fresh token for New Product
app.post('/api/upsell/generate', (req, res) => {
    const { product_id } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4(); 
    
    // Give a standard 5 minute duration for the deals (Time can be changed in the admin panel if needed)
    const insertSql = `
        INSERT INTO active_tokens (token_uuid, product_id, expires_at, location_tag) 
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 'Post-Purchase Upsell')
    `;
             
    db.query(insertSql, [token, product_id], (insertErr) => {
        if (insertErr) {
            console.error("Token Insert Error:", insertErr);
            return res.status(500).json({ error: "Database Error" });
        }
        res.json({ success: true, token: token });
    });
});

// PUT: Update Product (including pricing rules) WITH optional image upload
app.put('/api/admin/products/:id', (req, res) => {
    // Grab the text fields from the request
    const { name, base_price, stock_quantity, image_url, decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes } = req.body;
    const id = req.params.id;

    // Update Product Info
    const sqlProduct = "UPDATE products SET name=?, base_price=?, stock_quantity=?, image_url=? WHERE id=?";
    
    db.query(sqlProduct, [name, base_price, stock_quantity, image_url, id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update product" });

        // Update Pricing Rules
        const checkRuleSql = "SELECT * FROM pricing_rules WHERE product_id = ?";
        db.query(checkRuleSql, [id], (errCheck, ruleResult) => {
            if (errCheck) return res.status(500).json({ error: "Rule check failed" });

            if (ruleResult.length > 0) {
                // UPDATE existing rule
                const sqlUpdateRules = "UPDATE pricing_rules SET decay_rate_percent=?, decay_interval_minutes=?, minimum_floor_price=?, flash_duration_minutes=? WHERE product_id=?";
                db.query(sqlUpdateRules, [decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes, id], (errRules) => {
                    if (errRules) return res.status(500).json({ error: "Failed to update rules" });
                    res.json({ success: true });
                });
            } else {
                // INSERT new rule
                const sqlInsertRules = "INSERT INTO pricing_rules (product_id, decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes) VALUES (?, ?, ?, ?, ?)";
                db.query(sqlInsertRules, [id, decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes], (errRules) => {
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

// Public Catalog (For Students)
// Only fetches products where is_public = 1
app.get('/api/catalog', (req, res) => {
    const sql = `
        SELECT p.id, p.name, p.base_price, p.image_url 
        FROM products p 
        WHERE p.is_public = 1 AND p.stock_quantity > 0
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        res.json(results);
    });
});

// Admin Toggle Radar Visibility (This allows the admin to hide products from the student catalog without deleting them, useful for flash deal management)
app.post('/api/admin/products/:id/toggle-visibility', (req, res) => {
    const { is_public } = req.body;
    const sql = "UPDATE products SET is_public = ? WHERE id = ?";
    db.query(sql, [is_public ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to toggle visibility" });
        res.json({ success: true });
    });
});

const { v4: uuidv4 } = require('uuid');

// ADMIN: Generate a unique QR Token
app.post('/api/admin/generate-qr', (req, res) => {
    const { product_id, location_tag } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4(); 
    
    // Select the flash duration from the pricing rules for this product
    const ruleSql = "SELECT flash_duration_minutes FROM pricing_rules WHERE product_id = ?";
    
    // We get the flash_duration_minutes for this product (if it exists)
    db.query(ruleSql, [product_id], (err, rules) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        
        // Grab the duration (default to 60 minutes if not set in admin)
        const sessionDuration = rules.length > 0 && rules[0].flash_duration_minutes 
            ? parseInt(rules[0].flash_duration_minutes, 10) 
            : 60;

        // Inject the dynamic duration into the SQL query
        const sql = `
            INSERT INTO active_tokens (token_uuid, product_id, expires_at, location_tag) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ${sessionDuration} MINUTE), ?)
        `;
                 
        db.query(sql, [token, product_id, location_tag || 'General'], (insertErr, result) => {
            if (insertErr) return res.status(500).json({ error: "DB Error" });
            
            // Return the full URL for the QR code
            res.json({ 
                success: true, 
                token: token,
                scanUrl: `http://localhost:5173/scan/${token}` 
            });
        });
    });
});

// STUDENT: Scan the Token
app.get('/api/scan/:token', (req, res) => {
    const { token } = req.params;
    
    // Updated SQL to fetch 'is_active'
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

        // NEW SESSION CHECK
        if (data.is_active === 0) {
            return res.status(403).json({ error: "Session Paused by Admin" });
        }


        const basePrice = parseFloat(data.base_price);
        const decayRate = parseFloat(data.decay_rate_percent || 0);
        const intervalMins = parseFloat(data.decay_interval_minutes || 1);
        const minPrice = parseFloat(data.minimum_floor_price || basePrice);
        
        const now = new Date();
        const generatedAt = new Date(data.generated_at);
        const diffInMilliseconds = now - generatedAt;
        const minutesPassed = diffInMilliseconds / 1000 / 60;
        
        const intervals = Math.floor(minutesPassed / intervalMins);
        
        // ALGORITHMIC PRICING LOGIC WITH SCARCITY OVERRIDE
        let currentPrice;
        let nextDropTimestamp;
        const isUpsell = data.location_tag === 'Post-Purchase Upsell';
        let isFloorPrice = false; // We will use this flag to tell React to lock the UI

        if (isUpsell) {
            currentPrice = basePrice * 0.60; 
            isFloorPrice = true; 
        } else {
            let appliedDecayRate = decayRate;
            
            // Check for Scarcity Freeze
            if (data.stock_quantity < 2) {
                appliedDecayRate = 0; 
                isFloorPrice = true; // Trigger the UI lock because it's the last item!
            }
            
            currentPrice = basePrice * Math.pow((1 - (appliedDecayRate / 100)), intervals);
            
            // Check for Floor Price Hit
            if (currentPrice <= minPrice) {
                currentPrice = minPrice;
                isFloorPrice = true; // Trigger the UI lock because it hit the bottom!
            }
        }
        
        // SET THE TIMER CORRECTLY
        // If the price is locked (either by low stock OR hitting the floor), point the timer to the session end.
        if (isFloorPrice) {
            nextDropTimestamp = new Date(data.expires_at);
        } else {
            // Otherwise, point it to the next normal drop interval.
            nextDropTimestamp = new Date(generatedAt.getTime() + ((intervals + 1) * intervalMins * 60 * 1000));
        }

        if (isNaN(currentPrice)) currentPrice = basePrice;

        res.json({
            product: {
                id: data.product_id,
                name: data.name,
                image_url: data.image_url,
                stock: data.stock_quantity
            },
            pricing: {
                original: basePrice.toFixed(2),
                current: currentPrice.toFixed(2),
                next_drop_at: nextDropTimestamp.toISOString(), 
                discount_applied: currentPrice < basePrice,
                is_floor: isFloorPrice // Send the flag to React!
            },
            meta: {
                location: data.location_tag
            }
        });
    });
});

// AUTHENTICATION & CLIENT ENDPOINTS
// Registration Endpoint
app.post('/api/auth/register', (req, res) => {
    const { username, first_name, last_name, email, password } = req.body;

    // NOTE ON PASSWORDS: For this prototype, passwords are saved as plaintext to easily test admin/student logins.
    // In a production environment, this must be hashed using a library like bcrypt before insertion for security reasons. I would never store plaintext passwords in a real application.

    const sql = "INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [username, first_name, last_name, email, password], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, userId: result.insertId });
    });
});

// Login Endpoint
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

// Get Orders for a User
app.get('/api/orders/:userId', (req, res) => {
    const sql = `SELECT o.id, o.final_price_paid, o.created_at, p.name, p.image_url FROM orders o JOIN products p ON o.product_id = p.id WHERE o.user_id = ? ORDER BY o.created_at DESC`;
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Handle Token Validation and Fetch Recommendations
app.post('/api/test/generate-token', (req, res) => {
    const { product_id } = req.body;
    const token = "test-" + Math.random().toString(36).substr(2, 9);
    const sql = "INSERT INTO active_tokens (token_uuid, product_id, generated_at, expires_at, location_tag) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'TEST_CATALOG')";
    db.query(sql, [token, product_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ token });
    });
});

// STRIPE PAYMENT INTENT ROUTE
app.post('/api/create-payment-intent', (req, res) => {
    const { product_id, token } = req.body;

    // Validate Token and Get Start Time
    const tokenSql = "SELECT * FROM active_tokens WHERE token_uuid = ?";
    db.query(tokenSql, [token], (err, tokenResults) => {
        if (err || tokenResults.length === 0) return res.status(400).json({ error: "Invalid Token" });
        if (tokenResults[0].is_active === 0) return res.status(403).json({ error: "Session Paused" });

        const tokenData = tokenResults[0];

        // Get Product & Rules
        const productSql = `
            SELECT p.stock_quantity, p.base_price, 
                   r.decay_rate_percent, r.decay_interval_minutes, r.minimum_floor_price 
            FROM products p 
            LEFT JOIN pricing_rules r ON p.id = r.product_id 
            WHERE p.id = ?
        `;
        
        db.query(productSql, [product_id], async (err, productResults) => {
            if (err || productResults.length === 0) return res.status(404).json({ error: "Product not found" });
            const product = productResults[0];

            if (product.stock_quantity <= 0) return res.status(400).json({ error: "Out of Stock" });

            // SERVER-SIDE MATH: Calculate Exact Price right now
            const basePrice = parseFloat(product.base_price);
            const decayRate = parseFloat(product.decay_rate_percent || 0);
            const intervalMins = parseFloat(product.decay_interval_minutes || 1);
            const minPrice = parseFloat(product.minimum_floor_price || basePrice);

            const now = new Date();
            const generatedAt = new Date(tokenData.generated_at);
            const intervalsPassed = Math.floor(((now - generatedAt) / 1000 / 60) / intervalMins);

            // ALGORITHMIC PRICING LOGIC
            let finalPrice;
            const isUpsell = tokenData.location_tag === 'Post-Purchase Upsell';

            if (isUpsell) {
                // Flash Deal: Post-Purchase Upsells instantly get the lowest floor price
                finalPrice = basePrice * 0.60; 
            } else {
                // Normal behavior: Scarcity Override & Time-Decay Math
                let appliedDecayRate = decayRate;
                if (product.stock_quantity < 2) {
                    appliedDecayRate = 0; // Freeze the price if 1 item left!
                }
                finalPrice = basePrice * Math.pow((1 - (appliedDecayRate / 100)), intervalsPassed);
            }

            // Safety Caps
            if (finalPrice < minPrice) finalPrice = minPrice;
            if (isNaN(finalPrice)) finalPrice = basePrice;

            finalPrice = parseFloat(finalPrice.toFixed(2));

            // Create Stripe Payment Intent (Stripe uses pence, so multiply by 100)
            const amountInPence = Math.round(finalPrice * 100);

            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amountInPence,
                    currency: 'gbp',
                    automatic_payment_methods: { enabled: true },
                    metadata: { product_id, finalPrice } // Store this to verify later
                });

                res.json({ 
                    clientSecret: paymentIntent.client_secret, 
                    lockedPrice: finalPrice 
                });
            } catch (stripeErr) {
                res.status(500).json({ error: stripeErr.message });
            }
        });
    });
});

// CHECKOUT ENDPOINT WITH SERVER-SIDE PRICE VALIDATION
app.post('/api/checkout', (req, res) => {
    // We receive the product_id, token, email, and user_id from the client after payment confirmation
    const { product_id, token, email, user_id } = req.body; 
    
    // Validate the token and also check if the session is active before allowing checkout to proceed
    const tokenSql = "SELECT * FROM active_tokens WHERE token_uuid = ?";
    db.query(tokenSql, [token], (err, tokenResults) => {
        if (err || tokenResults.length === 0) {
            return res.status(400).json({ error: "Invalid or Expired Deal Token" });
        }
        
        // Check if the session is paused by admin
        const tokenData = tokenResults[0];
        if (tokenData.is_active === 0) {
             return res.status(403).json({ error: "This session has been paused. Checkout unavailable." });
        }

        // START TRANSACTION
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: "Transaction Error" });

            // We re-fetch the product details here to ensure we have the most up-to-date stock and pricing info before finalizing the order.
            const productSql = `
                SELECT p.stock_quantity, p.base_price, 
                       r.decay_rate_percent, r.decay_interval_minutes, r.minimum_floor_price 
                FROM products p 
                LEFT JOIN pricing_rules r ON p.id = r.product_id 
                WHERE p.id = ? FOR UPDATE
            `;

            // The 'FOR UPDATE' clause locks this row until the transaction is complete, preventing race conditions on stock quantity and ensuring accurate pricing.
            db.query(productSql, [product_id], (err, productResults) => {
                if (err) return db.rollback(() => res.status(500).json({ error: "Database Error" }));
                if (productResults.length === 0) return db.rollback(() => res.status(404).json({ error: "Product not found" }));

                const product = productResults[0];

                // Stock Check: If the product is out of stock at this moment, we cannot proceed with the order.
                if (product.stock_quantity <= 0) {
                    return db.rollback(() => res.status(400).json({ error: "Out of Stock" }));
                }

                // Server Calculates Price (Same logic as before to ensure the price is correct at the moment of purchase)
                const basePrice = parseFloat(product.base_price);
                const decayRate = parseFloat(product.decay_rate_percent || 0);
                const intervalMins = parseFloat(product.decay_interval_minutes || 1);
                const minPrice = parseFloat(product.minimum_floor_price || basePrice);

                const now = new Date();
                const generatedAt = new Date(tokenData.generated_at);
                const diffMs = now - generatedAt;
                const intervalsPassed = Math.floor((diffMs / 1000 / 60) / intervalMins);

                // Algorithmic Pricing Logic with Scarcity Override
                let finalPrice;
                const isUpsell = tokenData.location_tag === 'Post-Purchase Upsell';

                if (isUpsell) {
                    // Flash Deal: Post-Purchase Upsells instantly get the lowest floor price (40% off for 5 Mins Countdown) without any decay
                    finalPrice = basePrice * 0.60; 
                } else {
                    // Normal behavior: Scarcity Override & Time-Decay Math
                    let appliedDecayRate = decayRate;
                    if (product.stock_quantity < 2) {
                        appliedDecayRate = 0; 
                    }
                    finalPrice = basePrice * Math.pow((1 - (appliedDecayRate / 100)), intervalsPassed);
                }
                
                // Safety Caps
                if (finalPrice < minPrice) finalPrice = minPrice;
                if (isNaN(finalPrice)) finalPrice = basePrice;
                
                // Format to 2 decimals
                finalPrice = parseFloat(finalPrice.toFixed(2));

                // Record the order in the database with all relevant details (product, price paid, customer email, user ID if available)
                const orderSql = "INSERT INTO orders (product_id, final_price_paid, customer_email, user_id) VALUES (?, ?, ?, ?)";
                db.query(orderSql, [product_id, finalPrice, email, user_id || null], (errOrder) => {
                    if (errOrder) return db.rollback(() => res.status(500).json({ error: "Order Failed" }));

                    // UPDATE STOCK
                    const updateStockSql = "UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?";
                    db.query(updateStockSql, [product_id], (errUpdate) => {
                        if (errUpdate) return db.rollback(() => res.status(500).json({ error: "Stock Update Failed" }));

                        // COMMIT TRANSACTION (Save changes & unlock the row)
                        db.commit((errCommit) => {
                            if (errCommit) return db.rollback(() => res.status(500).json({ error: "Commit Failed" }));
                            
                            console.log(`[SALE] Sold (ID: ${product_id}) for £${finalPrice}. Stock left: ${product.stock_quantity - 1}`);
                            res.json({ success: true, price_paid: finalPrice });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/analytics', (req, res) => {
    res.json({ total_sales: 142, active_hotspots: ["Library", "Gym"] });
});

// USER MANAGEMENT (ADMIN)

// GET: Fetch All Users (Admin Only)
app.get('/api/admin/users', (req, res) => {
    const sql = "SELECT id, username, first_name, last_name, email, is_admin, created_at FROM users ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        res.json(results);
    });
});

// DELETE: Remove User (Admin Only)
app.delete('/api/admin/users/:id', (req, res) => {
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete user" });
        res.json({ success: true });
    });
});

// PUT: Update User Details (Admin Only) - Optional Password for User Management
app.put('/api/admin/users/:id', (req, res) => {
    const { username, first_name, last_name, email, new_password, is_admin } = req.body;
    const id = req.params.id;

    // Logic: If 'new_password' is provided, we update it. If empty, we keep the old one.
    if (new_password && new_password.trim() !== "") {
        // UPDATE EVERYTHING + PASSWORD
        const sql = "UPDATE users SET username=?, first_name=?, last_name=?, email=?, is_admin=?, hashedPassword=? WHERE id=?";
        db.query(sql, [username, first_name, last_name, email, is_admin, new_password, id], (err) => {
            if (err) return res.status(500).json({ error: "Update failed" });
            res.json({ success: true });
        });
    } else {
        // UPDATE EVERYTHING EXCEPT PASSWORD
        const sql = "UPDATE users SET username=?, first_name=?, last_name=?, email=?, is_admin=? WHERE id=?";
        db.query(sql, [username, first_name, last_name, email, is_admin, id], (err) => {
            if (err) return res.status(500).json({ error: "Update failed" });
            res.json({ success: true });
        });
    }
});

// Machine Learning Recommendations
app.get('/api/recommendations/:product_id', (req, res) => {
    const purchasedProductId = req.params.product_id;

    // Returns 2 random products that are in stock and not the one just purchased.
    const sql = `
        SELECT id, name, image_url, base_price, stock_quantity 
        FROM products 
        WHERE id != ? AND stock_quantity > 0 
        ORDER BY RAND() 
        LIMIT 2
    `;

    db.query(sql, [purchasedProductId], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch recommendations" });
        res.json(results);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`UniDeals Server running on http://localhost:${PORT}`);
});