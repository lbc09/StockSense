// database.js - SQLite Database Setup
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./stocksense.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_number TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products/Inventory table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      reorder_point INTEGER NOT NULL,
      supplier TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Sales table
    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Check if default users exist
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        console.error('Error checking users:', err);
      } else if (row.count === 0) {
        insertDefaultUsers();
        insertDefaultProducts();
        // New step: Insert sample sales data
        insertSampleSales();
      }
    });
  });
}

function insertDefaultUsers() {
  const defaultUsers = [
    { id_number: 'ADMIN001', password: 'admin123', role: 'Admin', full_name: 'System Administrator' },
    { id_number: 'MGR001', password: 'manager123', role: 'Manager', full_name: 'Store Manager' },
    { id_number: 'STAFF001', password: 'staff123', role: 'Staff', full_name: 'Sales Staff' }
  ];

  const stmt = db.prepare("INSERT INTO users (id_number, password, role, full_name) VALUES (?, ?, ?, ?)");
  
  defaultUsers.forEach(user => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    stmt.run(user.id_number, hashedPassword, user.role, user.full_name);
  });
  
  stmt.finalize();
  console.log('Default users created');
}

function insertDefaultProducts() {
  const products = [
    // Beverages (ID 1-9)
    { sku: 'BEV-001', name: 'Bottled Water 500ml', category: 'Beverages', quantity: 150, price: 15.00, reorder_point: 50, supplier: 'Philippine Bottling Co.' },
    { sku: 'BEV-002', name: 'Coca-Cola 1.5L', category: 'Beverages', quantity: 80, price: 65.00, reorder_point: 30, supplier: 'Coca-Cola Beverages' },
    { sku: 'BEV-003', name: 'Royal Tru-Orange 1L', category: 'Beverages', quantity: 60, price: 45.00, reorder_point: 25, supplier: 'Coca-Cola Beverages' },
    { sku: 'BEV-004', name: 'Red Horse Beer 1L', category: 'Beverages', quantity: 40, price: 85.00, reorder_point: 20, supplier: 'San Miguel Brewery' },
    { sku: 'BEV-005', name: 'Kopiko Coffee 30g', category: 'Beverages', quantity: 100, price: 8.00, reorder_point: 40, supplier: 'Mayora Indah' },
    { sku: 'BEV-006', name: 'Alaska Evaporated Milk 370ml', category: 'Beverages', quantity: 35, price: 55.00, reorder_point: 15, supplier: 'Philippine Dairy Co.' },
    { sku: 'BEV-007', name: 'C2 Green Tea 1L', category: 'Beverages', quantity: 70, price: 38.00, reorder_point: 30, supplier: 'URC Refreshments' },
    { sku: 'BEV-008', name: 'Minute Maid Orange 1L', category: 'Beverages', quantity: 45, price: 75.00, reorder_point: 20, supplier: 'Coca-Cola Beverages' },
    { sku: 'BEV-009', name: 'Red Bull Energy Drink 250ml', category: 'Beverages', quantity: 55, price: 65.00, reorder_point: 25, supplier: 'TC Pharma' },

    // Snacks (ID 10-17)
    { sku: 'SNK-001', name: 'Piattos Cheese 85g', category: 'Snacks', quantity: 90, price: 35.00, reorder_point: 40, supplier: 'Jack n Jill' },
    { sku: 'SNK-002', name: 'Nova Barbecue 78g', category: 'Snacks', quantity: 85, price: 30.00, reorder_point: 35, supplier: 'Oishi' },
    { sku: 'SNK-003', name: 'SkyFlakes Crackers 250g', category: 'Snacks', quantity: 70, price: 42.00, reorder_point: 30, supplier: 'Monde Nissin' },
    { sku: 'SNK-004', name: 'Chippy Barbecue 110g', category: 'Snacks', quantity: 65, price: 28.00, reorder_point: 30, supplier: 'Jack n Jill' },
    { sku: 'SNK-005', name: 'Cream-O Cookies 133g', category: 'Snacks', quantity: 75, price: 25.00, reorder_point: 35, supplier: 'Rebisco' },
    { sku: 'SNK-006', name: 'Flat Tops Chocolate 100pcs', category: 'Snacks', quantity: 50, price: 120.00, reorder_point: 20, supplier: 'Ricoa' },
    { sku: 'SNK-007', name: 'Gardenia White Bread', category: 'Snacks', quantity: 30, price: 58.00, reorder_point: 15, supplier: 'Gardenia Bakeries' },
    { sku: 'SNK-008', name: 'Lady\'s Choice Mayonnaise 220ml', category: 'Snacks', quantity: 40, price: 68.00, reorder_point: 20, supplier: 'Unilever Philippines' },

    // Canned Goods (ID 18-26)
    { sku: 'CAN-001', name: 'Ligo Sardines 155g', category: 'Canned Goods', quantity: 120, price: 25.00, reorder_point: 50, supplier: 'Ligo Sardines' },
    { sku: 'CAN-002', name: 'Argentina Corned Beef 175g', category: 'Canned Goods', quantity: 80, price: 48.00, reorder_point: 35, supplier: 'CDO Foodsphere' },
    { sku: 'CAN-003', name: 'Century Tuna Flakes 180g', category: 'Canned Goods', quantity: 95, price: 42.00, reorder_point: 40, supplier: 'Century Pacific' },
    { sku: 'CAN-004', name: 'Spam Luncheon Meat 340g', category: 'Canned Goods', quantity: 45, price: 185.00, reorder_point: 20, supplier: 'Hormel Foods' },
    { sku: 'CAN-005', name: 'CDO Liver Spread 85g', category: 'Canned Goods', quantity: 70, price: 32.00, reorder_point: 30, supplier: 'CDO Foodsphere' },
    { sku: 'CAN-006', name: 'Hunt\'s Pork & Beans 230g', category: 'Canned Goods', quantity: 65, price: 38.00, reorder_point: 28, supplier: 'CDO Foodsphere' },
    { sku: 'CAN-007', name: 'Del Monte Fruit Cocktail 432g', category: 'Canned Goods', quantity: 55, price: 95.00, reorder_point: 25, supplier: 'Del Monte Philippines' },
    { sku: 'CAN-008', name: 'Purefoods Vienna Sausage 130g', category: 'Canned Goods', quantity: 75, price: 35.00, reorder_point: 32, supplier: 'San Miguel Purefoods' },
    { sku: 'CAN-009', name: 'Tender Juicy Hotdog 1kg', category: 'Canned Goods', quantity: 25, price: 220.00, reorder_point: 12, supplier: 'San Miguel Purefoods' },

    // Pantry Staples (ID 27-38)
    { sku: 'PAN-001', name: 'Sinandomeng Rice 5kg', category: 'Pantry', quantity: 40, price: 280.00, reorder_point: 18, supplier: 'NFA Rice Traders' },
    { sku: 'PAN-002', name: 'Lucky Me Pancit Canton 60g', category: 'Pantry', quantity: 200, price: 12.00, reorder_point: 80, supplier: 'Monde Nissin' },
    { sku: 'PAN-003', name: 'UFC Banana Ketchup 320g', category: 'Pantry', quantity: 60, price: 45.00, reorder_point: 25, supplier: 'NutriAsia' },
    { sku: 'PAN-004', name: 'Silver Swan Soy Sauce 385ml', category: 'Pantry', quantity: 70, price: 28.00, reorder_point: 30, supplier: 'NutriAsia' },
    { sku: 'PAN-005', name: 'Datu Puti Vinegar 385ml', category: 'Pantry', quantity: 65, price: 22.00, reorder_point: 28, supplier: 'NutriAsia' },
    { sku: 'PAN-006', name: 'Cooking Oil 1L', category: 'Pantry', quantity: 50, price: 85.00, reorder_point: 22, supplier: 'Golden Fiesta' },
    { sku: 'PAN-007', name: 'Knorr Chicken Cube 60g', category: 'Pantry', quantity: 80, price: 32.00, reorder_point: 35, supplier: 'Unilever Philippines' },
    { sku: 'PAN-008', name: 'White Sugar 1kg', category: 'Pantry', quantity: 55, price: 65.00, reorder_point: 25, supplier: 'Central Azucarera' },
    { sku: 'PAN-009', name: 'Iodized Salt 1kg', category: 'Pantry', quantity: 60, price: 28.00, reorder_point: 28, supplier: 'Patis Salt' },
    { sku: 'PAN-010', name: 'All-Purpose Flour 1kg', category: 'Pantry', quantity: 45, price: 55.00, reorder_point: 20, supplier: 'Pilmico Foods' },
    { sku: 'PAN-011', name: 'Royal Pasta Spaghetti 900g', category: 'Pantry', quantity: 50, price: 68.00, reorder_point: 22, supplier: 'Monde Nissin' },
    { sku: 'PAN-012', name: 'Magic Sarap 50g', category: 'Pantry', quantity: 90, price: 28.00, reorder_point: 38, supplier: 'Ajinomoto Philippines' },

    // Personal Care (ID 39-42)
    { sku: 'PER-001', name: 'Safeguard Soap 135g', category: 'Personal Care', quantity: 100, price: 42.00, reorder_point: 45, supplier: 'Procter & Gamble' },
    { sku: 'PER-002', name: 'Palmolive Shampoo 340ml', category: 'Personal Care', quantity: 60, price: 125.00, reorder_point: 28, supplier: 'Colgate-Palmolive' },
    { sku: 'PER-003', name: 'Colgate Toothpaste 175g', category: 'Personal Care', quantity: 75, price: 95.00, reorder_point: 32, supplier: 'Colgate-Palmolive' },
    { sku: 'PER-004', name: 'Systema Toothbrush', category: 'Personal Care', quantity: 85, price: 45.00, reorder_point: 38, supplier: 'Lion Corporation' },

    // Health (ID 43-44)
    { sku: 'HEA-001', name: 'Biogesic Paracetamol 10 tabs', category: 'Health', quantity: 120, price: 32.00, reorder_point: 50, supplier: 'Unilab' },
    { sku: 'HEA-002', name: 'Alcohol 70% 500ml', category: 'Health', quantity: 80, price: 65.00, reorder_point: 35, supplier: 'Green Cross' },

    // Household (ID 45-49)
    { sku: 'HOU-001', name: 'Modess Sanitary Napkin 8s', category: 'Household', quantity: 70, price: 48.00, reorder_point: 30, supplier: 'Johnson & Johnson' },
    { sku: 'HOU-002', name: 'Joy Dishwashing Liquid 250ml', category: 'Household', quantity: 55, price: 42.00, reorder_point: 25, supplier: 'Procter & Gamble' },
    { sku: 'HOU-003', name: 'Tide Detergent Powder 120g', category: 'Household', quantity: 60, price: 28.00, reorder_point: 28, supplier: 'Procter & Gamble' },
    { sku: 'HOU-004', name: 'Eveready Battery AA 2pcs', category: 'Household', quantity: 90, price: 55.00, reorder_point: 40, supplier: 'Eveready Philippines' },
    { sku: 'HOU-005', name: 'Champion Lighter', category: 'Household', quantity: 150, price: 8.00, reorder_point: 60, supplier: 'Champion Plastics' }
  ];

  const stmt = db.prepare("INSERT INTO products (sku, name, category, quantity, price, reorder_point, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)");
  
  products.forEach(product => {
    stmt.run(product.sku, product.name, product.category, product.quantity, product.price, product.reorder_point, product.supplier);
  });
  
  stmt.finalize();
  console.log('Default products created');
}

function insertSampleSales() {
  // Sales data array format: { product_id, quantity, price, sale_date, user_id }
  // Note: Product IDs start from 1. User IDs are 2 (Manager) and 3 (Staff).
  const salesData = [
    // August Sales
    { id: 2, qty: 5, price: 65.00, date: '2025-08-10 10:30:00', user: 3 }, // Coke 1.5L
    { id: 11, qty: 20, price: 12.00, date: '2025-08-10 11:00:00', user: 3 }, // Lucky Me Pancit Canton
    { id: 31, qty: 3, price: 42.00, date: '2025-08-15 15:00:00', user: 2 }, // Joy Dishwashing Liquid
    { id: 10, qty: 10, price: 35.00, date: '2025-08-20 09:15:00', user: 3 }, // Piattos Cheese 85g
    { id: 21, qty: 1, price: 185.00, date: '2025-08-25 12:45:00', user: 3 }, // Spam Luncheon Meat 340g

    // September Sales
    { id: 2, qty: 8, price: 65.00, date: '2025-09-05 13:00:00', user: 3 },
    { id: 11, qty: 30, price: 12.00, date: '2025-09-15 17:00:00', user: 3 },
    { id: 10, qty: 15, price: 35.00, date: '2025-09-25 11:10:00', user: 2 },
    { id: 19, qty: 5, price: 48.00, date: '2025-09-26 14:00:00', user: 3 }, // Argentina Corned Beef 175g
    { id: 20, qty: 12, price: 42.00, date: '2025-09-27 19:30:00', user: 3 }, // Century Tuna Flakes 180g

    // October Sales
    { id: 2, qty: 10, price: 65.00, date: '2025-10-01 08:30:00', user: 3 },
    { id: 31, qty: 5, price: 42.00, date: '2025-10-10 14:00:00', user: 3 },
    { id: 11, qty: 40, price: 12.00, date: '2025-10-20 19:00:00', user: 3 },
    { id: 21, qty: 2, price: 185.00, date: '2025-10-25 12:00:00', user: 2 },
    { id: 10, qty: 15, price: 35.00, date: '2025-10-28 15:00:00', user: 3 },
    
    // November Sales (for current month display)
    { id: 2, qty: 3, price: 65.00, date: '2025-11-01 09:00:00', user: 3 },
    { id: 10, qty: 8, price: 35.00, date: '2025-11-01 16:00:00', user: 3 },
    { id: 1, qty: 10, price: 15.00, date: '2025-11-02 10:00:00', user: 3 }, // Bottled Water 500ml
  ];

  const stmt = db.prepare("INSERT INTO sales (product_id, quantity, total_price, sale_date, user_id) VALUES (?, ?, ?, ?, ?)");
  const updateStmt = db.prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?");

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    salesData.forEach(sale => {
      const totalPrice = sale.qty * sale.price;
      stmt.run(sale.id, sale.qty, totalPrice, sale.date, sale.user);
      updateStmt.run(sale.qty, sale.id);
    });
    stmt.finalize();
    updateStmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) {
        console.error('Error committing sample sales transaction:', err);
        db.run("ROLLBACK");
      } else {
        console.log('Sample sales data created and stock updated.');
      }
    });
  });
}

module.exports = db;