export interface Item {
  id: number;
  name: string;
  sku: string;
  unit: string;
  created_at: string;
  total_import?: number;
  total_export?: number;
  current_stock?: number;
}

export interface StockLog {
  id: number;
  item_id: number;
  item_name?: string;
  type: 'import' | 'export';
  quantity: number;
  note: string;
  created_at: string;
}

export interface Stats {
  total_items: number;
  today_import: number;
  today_export: number;
}
