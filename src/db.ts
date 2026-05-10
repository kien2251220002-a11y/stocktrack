import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      unit TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stock_logs (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      type TEXT CHECK(type IN ('import', 'export')) NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_stock_logs_item_id ON stock_logs(item_id);
  `);

  const countResult = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM items`
  );
  const itemCount = countResult.rows[0]?.count ?? 0;

  if (itemCount === 0) {
    const sampleItems = [
      { name: 'Bút bi xanh Thiên Long', sku: 'BBX-TL-001', unit: 'cái' },
      { name: 'Giấy A4 Double A 70gsm', sku: 'GA4-DA-001', unit: 'ram' },
      { name: 'Hộp mực HP 85A', sku: 'HMX-HP-85A', unit: 'hộp' },
      { name: 'Thước kẻ 30cm', sku: 'TK-30-001', unit: 'cái' },
      { name: 'Balo văn phòng', sku: 'BVP-BK-001', unit: 'cái' }
    ];

    for (const item of sampleItems) {
      const result = await pool.query(
        "INSERT INTO items (name, sku, unit) VALUES ($1, $2, $3) RETURNING id",
        [item.name, item.sku, item.unit]
      );
      const itemId = result.rows[0].id;

      if (item.sku === 'BBX-TL-001') {
        await pool.query(
          "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES ($1, $2, $3, $4)",
          [itemId, 'import', 245, 'Nhập đầu kỳ']
        );
        await pool.query(
          "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES ($1, $2, $3, $4)",
          [itemId, 'import', 100, 'Nhập bổ sung']
        );
      } else if (item.sku === 'GA4-DA-001') {
        await pool.query(
          "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES ($1, $2, $3, $4)",
          [itemId, 'import', 8, 'Tồn kho cũ']
        );
      } else if (item.sku === 'TK-30-001') {
        await pool.query(
          "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES ($1, $2, $3, $4)",
          [itemId, 'import', 132, 'Nhập mới']
        );
      } else if (item.sku === 'BVP-BK-001') {
        await pool.query(
          "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES ($1, $2, $3, $4)",
          [itemId, 'import', 5, 'Nhập mẫu']
        );
        await pool.query(
          "INSERT INTO stock_logs (item_id, type, quantity, note) VALUES ($1, $2, $3, $4)",
          [itemId, 'export', 2, 'Xuất cho nhân viên mới']
        );
      }
    }

    console.log("Sample data initialized.");
  }
}

export { pool };