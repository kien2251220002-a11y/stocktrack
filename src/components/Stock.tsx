import React, { useState, useEffect } from 'react';
import { Item, StockLog } from '@/src/types';
import { formatDate, cn } from '@/src/lib/utils';
import { ArrowDownLeft, ArrowUpRight, History, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function Stock() {
  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    item_id: '',
    type: 'import' as 'import' | 'export',
    quantity: 1,
    note: ''
  });

  const fetchData = () => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/items`).then(res => res.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/stock-logs`).then(res => res.json())
    ]).then(([itemsData, logsData]) => {
      setItems(itemsData);
      setLogs(logsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id) {
      alert('Vui lòng chọn sản phẩm');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          item_id: parseInt(formData.item_id),
          quantity: parseInt(formData.quantity.toString())
        })
      });

      if (res.ok) {
        setFormData({ item_id: '', type: 'import', quantity: 1, note: '' });
        fetchData();
      } else {
        const error = await res.json();
        alert('Lỗi: ' + error.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Section */}
      <div className="lg:col-span-5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">Phiếu nhập / xuất kho</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Sản phẩm *</label>
              <select
                required
                className="input-field appearance-none bg-no-repeat"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                value={formData.item_id}
                onChange={e => setFormData({ ...formData, item_id: e.target.value })}
              >
                <option value="">Chọn sản phẩm</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Loại giao dịch *</label>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'import' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all",
                    formData.type === 'import' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Nhập kho
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'export' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all",
                    formData.type === 'export' ? "bg-white shadow-sm text-red-600" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Xuất kho
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="input-label">Số lượng *</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="input-field"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="input-label">Ghi chú</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Lý do nhập/xuất, người nhận..."
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary h-12 text-lg mt-2">Xác nhận</button>
          </form>
        </motion.div>
      </div>

      {/* History Section */}
      <div className="lg:col-span-7">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card !p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-lg text-primary">Lịch sử giao dịch gần đây</h3>
          </div>
          <div className="flex flex-col">
            {logs.map((log) => (
              <div key={log.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  log.type === 'import' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {log.type === 'import' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 truncate">{log.item_name}</p>
                    <span className={cn(
                      "text-sm font-bold",
                      log.type === 'import' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {log.type === 'import' ? '+' : '-'}{log.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                    <span className="truncate max-w-[200px]">{log.note || 'Không có ghi chú'}</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && !loading && (
              <div className="p-10 text-center text-gray-500">Chưa có giao dịch kho nào.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
