import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Package2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Sidebar() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/items', icon: Package, label: 'Sản phẩm' },
    { to: '/stock', icon: ArrowLeftRight, label: 'Nhập/Xuất kho' },
  ];

  return (
    <aside className="w-[220px] h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Package2 className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl tracking-tight text-primary">StockTrack</span>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive 
                  ? "bg-primary/5 text-primary" 
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-full" />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          Hệ thống Quản lý Kho v1.0
        </div>
      </div>
    </aside>
  );
}
