# UniDeals - Hyperlocal Algorithmic Commerce

A Full-Stack prototype investigating "Time-Decay Pricing" to solve student indifference to discounts using algorithmic scarcity and hyperlocal digital poster walls.

---

## Project Overview
UniDeals is a platform that generates dynamic, time-decaying discounts for university students. Unlike static coupon codes, UniDeals uses algorithmic pricing—where a product's price actively drops over time until it hits a floor price or sells out. This creates genuine urgency, clears out physical inventory, and increases engagement.

### Technology Stack
* **Frontend:** React.js, Tailwind CSS, React Router, Lucide Icons
* **Backend:** Node.js, Express.js
* **Database:** MySQL (using `mysql2` driver)
* **Payments:** Stripe API (Stripe Elements & Payment Intents)
* **File Handling:** Multer (Local File System Storage)

---

## Core Engineering Features 

* **Algorithmic Pricing Engine:** Prices drop dynamically based on an exponential decay formula `Current Price = Base Price * (1 - Decay Rate)^Intervals`. Prices are strictly capped at an admin-defined `minimum_floor_price`.
* **Concurrency & Race Condition Prevention:** The checkout flow utilizes strict MySQL Transactions with a `FOR UPDATE` row-level lock. This guarantees that if two students attempt to buy the final item at the exact same millisecond, the database prevents overselling.
* **Server-Side Price Validation:** The React frontend never dictates the price to Stripe. The Node backend independently calculates the decay math at the exact moment of checkout to prevent client-side manipulation.
* **Local Image Management:** Uses `multer` to intercept frontend file uploads, rename them with timestamps to prevent collisions, and serve them publicly via Express static routing across ports.
* **Dynamic Session Management:** QR codes generate unique UUID tokens. Admins can pause or resume active sessions in real-time, instantly blurring the QR code on the digital poster wall.
* **Post-Purchase Upsells (Flash Deals):** Upon successful payment, students are presented with related products featuring aggressive, hardcoded 5-minute timers locked at the floor price.

---

## Setup & Run Instructions

### Prerequisites
* Node.js installed (v16+)
* MySQL Server installed and running

### 1. Database Setup
1. Open your preferred MySQL client (e.g. MySQL Workbench).
2. Locate the `Database.sql` file in the root folder.
3. Copy the contents and execute the script. This will automatically create the `unideals_db` database, all necessary relational tables, and a default Admin account.

### 2. Environment Variables & Stripe Setup
To make evaluation as frictionless as possible, **you do not need to create a Stripe developer account**. You can use my active Test Keys to evaluate the checkout flow safely. 

Please follow the instructions in the provided `.env.example` file to create your local environment variables. You will need to insert the following keys:
* **Backend Secret Key:** `sk_test_51SlcYWCLODUQYR2As4FSVU1LPjuhABAaUuuaPHbvp1K0IVDO4Df6aedszvHXFZWTGcbSot6nFWKOhHc8iA4va2ha00MRRpPLUP`
* **Frontend Public Key:** `pk_test_51SlcYWCLODUQYR2AfmodBYwR5mUrYsszLmC2zW93TY03UmrGXCqu0kBHQMyUYMECiyebO3RQke4j367RFxPn84ki004gDt1Lr8`

### 3. Backend Setup
1. Open a terminal in the **root directory** (where `server.js` is located).
2. Install all dependencies: `npm install`
3. Ensure your `.env` file is created (as per the `.env.example` instructions) with your local MySQL password and the Stripe Secret Key.
4. Start the server: `node server.js` 
   *(Note: The server will run on `http://localhost:5000` and will automatically generate an `/uploads` folder for images).*

### 4. Frontend Setup
1. Open a **new, second terminal** and navigate to the client directory: `cd client`
2. Install all dependencies: `npm install`
3. Ensure your `.env` file is created here with the Stripe Public Key.
4. Start the Vite React development server: `npm run dev`
5. Open the provided `localhost` link (usually `http://localhost:5173`) in your browser.

---

## Testing Guide (How to evaluate)

To see the core loop in action, follow this "Happy Path":
1.  **Log in to Admin:** Use the credentials below to log into the dashboard.
2.  **Add Inventory:** Create a new product. Upload an image, set a Base Price (£50), a Minimum Floor Price (£20), and a fast decay rate (e.g., 10% every 1 minute).
3.  **Generate QR:** Click the QR code icon next to your new product to launch the Digital Poster Wall.
4.  **Simulate Student:** Click the "Test Link" under the QR code. Watch the timer count down and the price drop in real-time.
5.  **Checkout:** Purchase the item using the test credit card below. Check the admin dashboard to verify stock was successfully decremented by 1.

**Test Credentials:**
* **Admin Login:** `admin@unideals.com` / `1234`
* **Student Login:** `john@uni.edu` / `1234`
* **Stripe Test Card:** `4242 4242 4242 4242` (Any future expiration date, any CVC)

---

## Known Limitations (Prototype Scope)
* **Password Security:** For the sake of this prototype and ease of marking, user passwords are saved as plaintext in the database. In a production environment, this must be handled securely using a hashing library like `bcrypt`.
* **Image Hosting:** Images are stored locally on the server via Multer. For cloud deployment (e.g., Heroku/Vercel), this would need to be migrated to an AWS S3 or Cloudinary bucket.
* **Machine Learning:** Post-purchase "Students also bought" recommendations are currently simulated by querying randomized, in-stock products rather than utilizing a trained ML association model.