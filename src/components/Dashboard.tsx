import React, { useEffect, useState } from 'react';
import { Package, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Item, Stats } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(res => res.json()),
      fetch('/api/inventory').then(res => res.json())
    ]).then(([statsData, inventoryData]) => {
      setStats(statsData);
      setInventory(inventoryData);
      setLoading(false);
    });
  }, []);

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Hết hàng</span>;
    if (stock < 10) return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Sắp hết</span>;
    return <span className="text-emerald-600 font-medium">{stock}</span>;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng sản phẩm</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.total_items}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Nhập kho hôm nay</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">+{stats?.today_import}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Xuất kho hôm nay</p>
              <h3 className="text-2xl font-bold mt-1 text-red-600">-{stats?.today_export}</h3>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-primary">Bảng tồn kho</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Sản phẩm</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold">Đơn vị</th>
                <th className="px-6 py-4 font-semibold">Tổng nhập</th>
                <th className="px-6 py-4 font-semibold">Tổng xuất</th>
                <th className="px-6 py-4 font-semibold">Tồn kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                  <td className="px-6 py-4 text-sm text-emerald-600">+{item.total_import}</td>
                  <td className="px-6 py-4 text-sm text-red-600">-{item.total_export}</td>
                  <td className="px-6 py-4">
                    {getStockBadge(item.current_stock || 0)}
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Chưa có sản phẩm nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
