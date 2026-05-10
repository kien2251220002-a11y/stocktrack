import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { pool, initDB } from "./src/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
  app.use(express.json());
  await initDB();

  // API Routes

  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", timestamp: new Date().toISOString(), db: "connected" });
    } catch (err) {
      console.error("Health check error:", err);
      res.status(500).json({ status: "error", db: "disconnected" });
    }
  });

  // Get all items with current stock calculation
  app.get("/api/inventory", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          i.*,
          COALESCE(SUM(CASE WHEN sl.type = 'import' THEN sl.quantity ELSE 0 END), 0) as total_import,
          COALESCE(SUM(CASE WHEN sl.type = 'export' THEN sl.quantity ELSE 0 END), 0) as total_export,
          (COALESCE(SUM(CASE WHEN sl.type = 'import' THEN sl.quantity ELSE 0 END), 0) - 
           COALESCE(SUM(CASE WHEN sl.type = 'export' THEN sl.quantity ELSE 0 END), 0)) as current_stock
        FROM items i
        LEFT JOIN stock_logs sl ON i.id = sl.item_id
        GROUP BY i.id
      `);
      res.json(result.rows);
    } catch (err: any) {
      console.error("Inventory query error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get items (simple list)
  app.get("/api/items", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM items ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err: any) {
      console.error("Get items error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add new item
  app.post("/api/items", async (req, res) => {
    const { name, sku, unit } = req.body;

    // Validate
    if (!name?.trim() || !sku?.trim() || !unit?.trim()) {
      return res.status(400).json({ error: "Tên sản phẩm, SKU và đơn vị không được để trống" });
    }

    try {
      const result = await pool.query(
        "INSERT INTO items (name, sku, unit) VALUES ($1, $2, $3) RETURNING id",
        [name.trim(), sku.trim().toUpperCase(), unit.trim()]
      );
      res.status(201).json({ id: result.rows[0].id, name, sku, unit });
    } catch (err: any) {
      console.error("Insert item error:", err);
      if (err.message.includes("duplicate key value")) {
        return res.status(409).json({ error: "Mã SKU đã tồn tại" });
      }
      res.status(400).json({ error: err.message });
    }
  });

  // Delete item
  app.delete("/api/items/:id", async (req, res) => {
    try {
      const result = await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Sản phẩm không tồn tại" });
      }
      res.status(204).send();
    } catch (err: any) {
      console.error("Delete item error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Get stock logs
  app.get("/api/stock-logs", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await pool.query(
        `
        SELECT sl.*, i.name as item_name
        FROM stock_logs sl
        JOIN items i ON sl.item_id = i.id
        ORDER BY sl.created_at DESC
        LIMIT $1 OFFSET $2
      `,
        [limit, offset]
      );
      res.json(result.rows);
    } catch (err: any) {
      console.error("Get stock logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add stock log
  app.post("/api/stock-logs", async (req, res) => {
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

    try {
      if (type === "export") {
        const stockResult = await pool.query(
          `SELECT COALESCE(SUM(CASE WHEN type='import' THEN quantity ELSE -quantity END), 0) AS current_stock FROM stock_logs WHERE item_id = $1`,
          [item_id]
        );
        const stock = stockResult.rows[0] as { current_stock: number };

        if (stock.current_stock < qty) {
          return res.status(400).json({
            error: `Không đủ tồn kho. Hiện có: ${stock.current_stock}, yêu cầu xuất: ${qty}`
          });
        }
      }

      const itemResult = await pool.query("SELECT id FROM items WHERE id = $1", [item_id]);
      if (itemResult.rowCount === 0) {
        return res.status(404).json({ error: "Sản phẩm không tồn tại" });
      }

      const insertResult = await pool.query(
        "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES ($1, $2, $3, $4) RETURNING id",
        [item_id, type, qty, note?.trim() || null]
      );
      res.status(201).json({ id: insertResult.rows[0].id, item_id, type, quantity: qty, note });
    } catch (err: any) {
      console.error("Insert stock log error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const totalItemsResult = await pool.query("SELECT COUNT(*)::int as count FROM items");
      const todayImportResult = await pool.query(
        "SELECT COALESCE(SUM(quantity), 0)::int as sum FROM stock_logs WHERE type = 'import' AND date(created_at) = CURRENT_DATE"
      );
      const todayExportResult = await pool.query(
        "SELECT COALESCE(SUM(quantity), 0)::int as sum FROM stock_logs WHERE type = 'export' AND date(created_at) = CURRENT_DATE"
      );

      res.json({
        total_items: totalItemsResult.rows[0].count,
        today_import: todayImportResult.rows[0].sum,
        today_export: todayExportResult.rows[0].sum,
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
