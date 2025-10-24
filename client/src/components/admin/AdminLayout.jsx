import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Package, 
  FileText, 
  ShoppingBag, 
  Cog,
  BarChart3
} from 'lucide-react';
import Navbar from '../layout/Navbar';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  const adminNavItems = [
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Blog Posts', path: '/admin/blog', icon: FileText },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Inventory Insights', path: '/admin/inventory-insights', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Cog },
  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-[82px]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Admin Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <ul className="space-y-2">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive(item.path)
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-0">
              {children}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;