import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/src/components/Sidebar';
import Dashboard from '@/src/components/Dashboard';
import Items from '@/src/components/Items';
import Stock from '@/src/components/Stock';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 lg:p-8 p-6 overflow-y-auto">
          <header className="mb-8">
            <Routes>
              <Route path="/" element={<div>
                <h1 className="text-2xl font-bold text-primary">Tổng quan hệ thống</h1>
                <p className="text-gray-500 text-sm mt-1">Chào mừng bạn trở lại, đây là trạng thái kho hàng của bạn hôm nay.</p>
              </div>} />
              <Route path="/items" element={<div>
                <h1 className="text-2xl font-bold text-primary">Danh mục sản phẩm</h1>
                <p className="text-gray-500 text-sm mt-1">Quản lý và cập nhật thông tin các mặt hàng trong kho.</p>
              </div>} />
              <Route path="/stock" element={<div>
                <h1 className="text-2xl font-bold text-primary">Giao dịch kho</h1>
                <p className="text-gray-500 text-sm mt-1">Thực hiện nhập và xuất kho hàng hóa.</p>
              </div>} />
            </Routes>
          </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<Items />} />
            <Route path="/stock" element={<Stock />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
