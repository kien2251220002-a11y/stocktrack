import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Database Initialization
  const db = new Database(process.env.DB_PATH || "inventory.db");
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      unit TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('import', 'export')) NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_stock_logs_item_id ON stock_logs(item_id);
  `);

  // Insert sample data if empty
  const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number };
  if (itemCount.count === 0) {
    const insertItem = db.prepare("INSERT INTO items (name, sku, unit) VALUES (?, ?, ?)");
    const insertLog = db.prepare("INSERT INTO stock_logs (item_id, type, quantity, note) VALUES (?, ?, ?, ?)");

    const sampleItems = [
      { name: 'Bút bi xanh Thiên Long', sku: 'BBX-TL-001', unit: 'cái' },
      { name: 'Giấy A4 Double A 70gsm', sku: 'GA4-DA-001', unit: 'ram' },
      { name: 'Hộp mực HP 85A', sku: 'HMX-HP-85A', unit: 'hộp' },
      { name: 'Thước kẻ 30cm', sku: 'TK-30-001', unit: 'cái' },
      { name: 'Balo văn phòng', sku: 'BVP-BK-001', unit: 'cái' }
    ];

    // Wrap in transaction for data integrity
    const transaction = db.transaction(() => {
      sampleItems.forEach(item => {
        const result = insertItem.run(item.name, item.sku, item.unit);
        const itemId = result.lastInsertRowid;

        // Add some sample logs
        if (item.sku === 'BBX-TL-001') {
          insertLog.run(itemId, 'import', 245, 'Nhập đầu kỳ');
          insertLog.run(itemId, 'import', 100, 'Nhập bổ sung');
        } else if (item.sku === 'GA4-DA-001') {
          insertLog.run(itemId, 'import', 8, 'Tồn kho cũ');
        } else if (item.sku === 'TK-30-001') {
          insertLog.run(itemId, 'import', 132, 'Nhập mới');
        } else if (item.sku === 'BVP-BK-001') {
          insertLog.run(itemId, 'import', 5, 'Nhập mẫu');
          insertLog.run(itemId, 'export', 2, 'Xuất cho nhân viên mới');
        }
      });
    });

    transaction();
    console.log("Sample data initialized.");
  }

  // API Routes

  // Health check
  app.get("/api/health", (req, res) => {
    try {
      db.prepare("SELECT 1").get();
      res.json({ status: "ok", timestamp: new Date().toISOString(), db: "connected" });
    } catch (err) {
      console.error("Health check error:", err);
      res.status(500).json({ status: "error", db: "disconnected" });
    }
  });

  // Get all items with current stock calculation
  app.get("/api/inventory", (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT 
          i.*,
          COALESCE(SUM(CASE WHEN sl.type = 'import' THEN sl.quantity ELSE 0 END), 0) as total_import,
          COALESCE(SUM(CASE WHEN sl.type = 'export' THEN sl.quantity ELSE 0 END), 0) as total_export,
          (COALESCE(SUM(CASE WHEN sl.type = 'import' THEN sl.quantity ELSE 0 END), 0) - 
           COALESCE(SUM(CASE WHEN sl.type = 'export' THEN sl.quantity ELSE 0 END), 0)) as current_stock
        FROM items i
        LEFT JOIN stock_logs sl ON i.id = sl.item_id
        GROUP BY i.id
      `).all();
      res.json(rows);
    } catch (err: any) {
      console.error("Inventory query error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get items (simple list)
  app.get("/api/items", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM items ORDER BY created_at DESC").all();
      res.json(rows);
    } catch (err: any) {
      console.error("Get items error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add new item
  app.post("/api/items", (req, res) => {
    const { name, sku, unit } = req.body;

    // Validate
    if (!name?.trim() || !sku?.trim() || !unit?.trim()) {
      return res.status(400).json({ error: "Tên sản phẩm, SKU và đơn vị không được để trống" });
    }

    try {
      const info = db.prepare("INSERT INTO items (name, sku, unit) VALUES (?, ?, ?)").run(
        name.trim(), sku.trim().toUpperCase(), unit.trim()
      );
      res.status(201).json({ id: info.lastInsertRowid, name, sku, unit });
    } catch (err: any) {
      console.error("Insert item error:", err);
      if (err.message.includes("UNIQUE")) {
        return res.status(409).json({ error: "Mã SKU đã tồn tại" });
      }
      res.status(400).json({ error: err.message });
    }
  });

  // Delete item
  app.delete("/api/items/:id", (req, res) => {
    try {
      const result = db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Sản phẩm không tồn tại" });
      }
      res.status(204).send();
    } catch (err: any) {
      console.error("Delete item error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Get stock logs
  app.get("/api/stock-logs", (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
      const offset = parseInt(req.query.offset as string) || 0;
      
      const rows = db.prepare(`
        SELECT sl.*, i.name as item_name
        FROM stock_logs sl
        JOIN items i ON sl.item_id = i.id
        ORDER BY sl.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);
      res.json(rows);
    } catch (err: any) {
      console.error("Get stock logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add stock log
  app.post("/api/stock-logs", (req, res) => {
    const { item_id, type, quantity, note } = req.body;

    // Validate input
    if (!item_id || !type || !quantity) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }
    if (!["import", "export"].includes(type)) {
      return res.status(400).json({ error: "type phải là 'import' hoặc 'export'" });
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Số lượng phải là số nguyên dương" });
    }

    // Kiểm tra tồn kho khi xuất
    if (type === "export") {
      const stock = db.prepare(`
        SELECT COALESCE(SUM(CASE WHEN type='import' THEN quantity ELSE -quantity END), 0) AS current_stock
        FROM stock_logs WHERE item_id = ?
      `).get(item_id) as { current_stock: number };

      if (stock.current_stock < qty) {
        return res.status(400).json({
          error: `Không đủ tồn kho. Hiện có: ${stock.current_stock}, yêu cầu xuất: ${qty}`
        });
      }
    }

    // Kiểm tra item tồn tại
    const item = db.prepare("SELECT id FROM items WHERE id = ?").get(item_id);
    if (!item) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }

    try {
      const info = db.prepare(
        "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES (?, ?, ?, ?)"
      ).run(item_id, type, qty, note?.trim() || null);
      res.status(201).json({ id: info.lastInsertRowid, item_id, type, quantity: qty, note });
    } catch (err: any) {
      console.error("Insert stock log error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    try {
      const totalItems = db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number };
      const todayImport = db.prepare("SELECT COALESCE(SUM(quantity), 0) as sum FROM stock_logs WHERE type = 'import' AND date(created_at) = date('now')").get() as { sum: number };
      const todayExport = db.prepare("SELECT COALESCE(SUM(quantity), 0) as sum FROM stock_logs WHERE type = 'export' AND date(created_at) = date('now')").get() as { sum: number };
      
      res.json({
        total_items: totalItems.count,
        today_import: todayImport.sum,
        today_export: todayExport.sum
      });
    } catch (err: any) {
      console.error("Stats query error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Lỗi server" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
