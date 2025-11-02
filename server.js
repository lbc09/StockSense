// server.js - Express Server
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'stocksense-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  };
};

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { id_number, password } = req.body;
  
  db.get("SELECT * FROM users WHERE id_number = ?", [id_number], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = {
      id: user.id,
      id_number: user.id_number,
      role: user.role,
      full_name: user.full_name
    };
    
    res.json({ 
      success: true, 
      user: req.session.user
    });
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
app.get('/api/user', requireAuth, (req, res) => {
  res.json(req.session.user);
});

// Get all users (Admin only)
app.get('/api/users', requireAuth, requireRole('Admin'), (req, res) => {
  db.all("SELECT id, id_number, role, full_name, created_at FROM users", (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Create user (Admin only)
app.post('/api/users', requireAuth, requireRole('Admin'), (req, res) => {
  const { id_number, password, role, full_name } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run("INSERT INTO users (id_number, password, role, full_name) VALUES (?, ?, ?, ?)",
    [id_number, hashedPassword, role, full_name],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Update user role (Admin only)
app.put('/api/users/:id/role', requireAuth, requireRole('Admin'), (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;
  
  db.run("UPDATE users SET role = ? WHERE id = ?", [role, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update role' });
    }
    res.json({ success: true });
  });
});

// Update user password (Admin only)
app.put('/api/users/:id/password', requireAuth, requireRole('Admin'), (req, res) => {
  const { password } = req.body;
  const userId = req.params.id;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update password' });
    }
    res.json({ success: true });
  });
});

// Delete user (Admin only)
app.delete('/api/users/:id', requireAuth, requireRole('Admin'), (req, res) => {
  const userId = req.params.id;
  
  // Prevent deleting the default admin
  db.get("SELECT id_number FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (user && user.id_number === 'ADMIN001') {
      return res.status(403).json({ error: 'Cannot delete default admin' });
    }
    
    db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user' });
      }
      res.json({ success: true });
    });
  });
});

// Get all products
app.get('/api/products', requireAuth, (req, res) => {
  db.all("SELECT * FROM products ORDER BY name", (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(products);
  });
});

// Get single product
app.get('/api/products/:id', requireAuth, (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(product);
  });
});

// Add product (Manager only)
app.post('/api/products', requireAuth, requireRole('Manager'), (req, res) => {
  const { sku, name, category, quantity, price, reorder_point, supplier } = req.body;
  
  db.run(
    "INSERT INTO products (sku, name, category, quantity, price, reorder_point, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [sku, name, category, quantity, price, reorder_point, supplier],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add product' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Update product (Manager only)
app.put('/api/products/:id', requireAuth, requireRole('Manager'), (req, res) => {
  const { name, category, quantity, price, reorder_point, supplier } = req.body;
  
  db.run(
    "UPDATE products SET name = ?, category = ?, quantity = ?, price = ?, reorder_point = ?, supplier = ? WHERE id = ?",
    [name, category, quantity, price, reorder_point, supplier, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update product' });
      }
      res.json({ success: true });
    }
  );
});

// Delete product (Manager only)
app.delete('/api/products/:id', requireAuth, requireRole('Manager'), (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    res.json({ success: true });
  });
});

// Get low stock products
app.get('/api/products/alerts/low-stock', requireAuth, requireRole('Manager'), (req, res) => {
  db.all("SELECT * FROM products WHERE quantity < reorder_point ORDER BY quantity", (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(products);
  });
});

// Get out of stock products
app.get('/api/products/alerts/out-of-stock', requireAuth, requireRole('Manager'), (req, res) => {
  db.all("SELECT * FROM products WHERE quantity = 0", (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(products);
  });
});

// Record sale
app.post('/api/sales', requireAuth, (req, res) => {
  // Added sale_date to destructuring from req.body
  const { items, sale_date } = req.body; // items: [{ product_id, quantity, price }]
  const userId = req.session.user.id;
  
  // Use provided sale_date, otherwise default to current system time
  const saleDateValue = sale_date || new Date().toISOString(); 

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    // Modified SQL to explicitly include sale_date
    const stmt = db.prepare("INSERT INTO sales (product_id, quantity, total_price, sale_date, user_id) VALUES (?, ?, ?, ?, ?)");
    const updateStmt = db.prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?");
    
    items.forEach(item => {
      const totalPrice = item.quantity * item.price;
      // Passed saleDateValue to the statement
      stmt.run(item.product_id, item.quantity, totalPrice, saleDateValue, userId);
      updateStmt.run(item.quantity, item.product_id);
    });
    
    stmt.finalize();
    updateStmt.finalize();
    
    db.run("COMMIT", (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: 'Failed to record sale' });
      }
      res.json({ success: true });
    });
  });
});

// Get all sales
app.get('/api/sales', requireAuth, (req, res) => {
  const query = `
    SELECT s.*, p.name as product_name, p.sku, u.full_name as user_name
    FROM sales s
    JOIN products p ON s.product_id = p.id
    JOIN users u ON s.user_id = u.id
    ORDER BY s.sale_date DESC
  `;
  
  db.all(query, (err, sales) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(sales);
  });
});

// Delete sale
app.delete('/api/sales/:id', requireAuth, (req, res) => {
  // Get sale info first to restore stock
  db.get("SELECT product_id, quantity FROM sales WHERE id = ?", [req.params.id], (err, sale) => {
    if (err || !sale) {
      return res.status(500).json({ error: 'Sale not found' });
    }
    
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      // Restore stock
      db.run("UPDATE products SET quantity = quantity + ? WHERE id = ?", [sale.quantity, sale.product_id]);
      
      // Delete sale
      db.run("DELETE FROM sales WHERE id = ?", [req.params.id], (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: 'Failed to delete sale' });
        }
        
        db.run("COMMIT");
        res.json({ success: true });
      });
    });
  });
});

// Analytics - Home stats (for Manager and Staff)
app.get('/api/analytics/home', requireAuth, requireRole('Manager', 'Staff'), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.serialize(() => {
    // Today's sales
    db.get(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as revenue FROM sales WHERE DATE(sale_date) = ?",
      [today],
      (err, todayData) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        // Total inventory value
        db.get(
          "SELECT COALESCE(SUM(quantity * price), 0) as value, COUNT(*) as count FROM products",
          (err, inventoryData) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            // Low stock count
            db.get(
              "SELECT COUNT(*) as count FROM products WHERE quantity < reorder_point",
              (err, lowStockData) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                res.json({
                  todaySales: todayData.count,
                  todayRevenue: todayData.revenue,
                  inventoryValue: inventoryData.value,
                  inventoryCount: inventoryData.count,
                  lowStockItems: lowStockData.count
                });
              }
            );
          }
        );
      }
    );
  });
});

// Analytics - Sales trend (Manager only)
app.get('/api/analytics/sales-trend', requireAuth, requireRole('Manager'), (req, res) => {
  const query = `
    SELECT DATE(sale_date) as date, 
           COUNT(*) as sales_count,
           SUM(total_price) as revenue
    FROM sales
    WHERE sale_date >= DATE('now', '-30 days')
    GROUP BY DATE(sale_date)
    ORDER BY date
  `;
  
  db.all(query, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(data);
  });
});

// Analytics - Category breakdown (Manager only)
app.get('/api/analytics/category-breakdown', requireAuth, requireRole('Manager'), (req, res) => {
  const query = `
    SELECT p.category, 
           COUNT(s.id) as sales_count,
           SUM(s.total_price) as revenue
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.category
    ORDER BY revenue DESC
  `;
  
  db.all(query, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(data);
  });
});

// Analytics - Top products (Manager only)
app.get('/api/analytics/top-products', requireAuth, requireRole('Manager'), (req, res) => {
  const query = `
    SELECT p.name, p.sku,
           SUM(s.quantity) as total_sold,
           SUM(s.total_price) as revenue
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY s.product_id
    ORDER BY total_sold DESC
    LIMIT 10
  `;
  
  db.all(query, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(data);
  });
});

// Analytics - Predictions (AI recommendations) (Manager only)
app.get('/api/analytics/predictions', requireAuth, requireRole('Manager'), (req, res) => {
  // Get sales data for the last 30 days
  const query = `
    SELECT p.id, p.name, p.sku, p.quantity, p.reorder_point,
           COUNT(s.id) as sales_count,
           SUM(s.quantity) as total_sold,
           AVG(s.quantity) as avg_quantity_per_sale
    FROM products p
    LEFT JOIN sales s ON p.id = s.product_id 
      AND s.sale_date >= DATE('now', '-30 days')
    GROUP BY p.id
    ORDER BY total_sold DESC
  `;
  
  db.all(query, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // AI logic for predictions
    const predictions = data.map(product => {
      const soldPerDay = (product.total_sold || 0) / 30;
      const daysUntilStockout = product.quantity > 0 ? product.quantity / (soldPerDay || 1) : 0;
      const recommendedOrder = Math.max(0, Math.ceil((product.reorder_point * 2) - product.quantity));
      
      let priority = 'low';
      let action = 'Monitor';
      
      if (product.quantity === 0) {
        priority = 'critical';
        action = 'Order immediately - Out of stock';
      } else if (daysUntilStockout < 7) {
        priority = 'high';
        action = `Order soon - ${Math.floor(daysUntilStockout)} days until stockout`;
      } else if (product.quantity < product.reorder_point) {
        priority = 'medium';
        action = 'Reorder recommended';
      }
      
      return {
        ...product,
        soldPerDay: soldPerDay.toFixed(2),
        daysUntilStockout: Math.floor(daysUntilStockout),
        recommendedOrder,
        priority,
        action
      };
    });
    
    res.json(predictions);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 StockSense server running on http://localhost:${PORT}`);
  console.log(`\n📊 Login Credentials:`);
  console.log(`   Admin:   ADMIN001 / admin123`);
  console.log(`   Manager: MGR001 / manager123`);
  console.log(`   Staff:   STAFF001 / staff123\n`);
});