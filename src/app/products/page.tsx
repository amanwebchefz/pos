'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { productsService, Product } from '../../services/products.service';
import { settingsService, BusinessSettings } from '../../services/settings.service';
import { Plus, Search, Edit, Trash2, Package, ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, hasPermission } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

  const loadProducts = async () => {
    try {
      const data = await productsService.findAll();
      setProducts(data);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      const data = await settingsService.getBusinessSettings();
      setBusinessSettings(data);
    } catch (error: any) {
      console.error('Failed to load business settings:', error);
      // Don't show error - tax type is optional
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProducts();
    loadBusinessSettings();
  }, [isAuthenticated, router, _hasHydrated]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productsService.remove(id);
        toast.success('Product deleted successfully');
        loadProducts();
      } catch (error: any) {
        console.error('Failed to delete product:', error);
        toast.error(error.message || 'Failed to delete product');
      }
    }
  };

  const handleEdit = (product: Product) => {
    const totalStock = product.inventory && product.inventory.length > 0
      ? product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
      : 0;
    
    setEditForm({
      name: product.name,
      description: product.description || '',
      sellingPrice: product.sellingPrice.toString(),
      costPrice: product.costPrice.toString(),
      stock: totalStock.toString(),
      sku: product.sku || '',
      barcode: product.barcode || '',
      taxRate: product.taxRate?.toString() || '0',
    });
    setEditingId(product.id);
  };

  const handleSave = async (id: string) => {
    try {
      const productData = {
        ...editForm,
        sellingPrice: parseFloat(editForm.sellingPrice),
        costPrice: parseFloat(editForm.costPrice),
        stock: parseInt(editForm.stock) || 0,
        taxRate: parseFloat(editForm.taxRate) || 0,
      };

      await productsService.update(id, productData);
      toast.success('Product updated successfully');
      setEditingId(null);
      setEditForm({});
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {/* Back to Dashboard */}
              </button>
              <div className="border-l border-gray-700 pl-4">
                <h1 className="text-2xl font-bold">Products</h1>
                <p className="text-gray-400">Manage your product inventory</p>
              </div>
            </div>
            {hasPermission('products.create') && (
              <button
                onClick={() => router.push('/products/new')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, code, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product id</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sell Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cost Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tax</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredProducts.map((product) => {
                const totalStock = product.inventory && product.inventory.length > 0
                  ? product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
                  : 0;
                const isEditing = editingId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-gray-750">
                    {isEditing ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.sku}
                            onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.barcode}
                            onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-300">{product.category?.name || '-'}</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.sellingPrice}
                            onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.costPrice}
                            onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.taxRate}
                            onChange={(e) => setEditForm({ ...editForm, taxRate: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="0"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.stock}
                            onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleSave(product.id)}
                              className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                        <td className="px-6 py-4 text-gray-300">{product.sku || '-'}</td>
                        <td className="px-6 py-4 text-gray-300">{product.barcode || '-'}</td>
                        <td className="px-6 py-4 text-gray-300">{product.category?.name || '-'}</td>
                        <td className="px-6 py-4 text-green-400 font-semibold">${Number(product.sellingPrice).toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-300">${Number(product.costPrice).toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {/* {businessSettings?.taxType} */}
                           {product.taxRate}%
                        </td>
                        <td className="px-6 py-4 text-gray-300">{totalStock}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission('products.update') && (
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission('products.delete') && (
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-24 h-24 mx-auto mb-4 text-gray-600" />
              <p className="text-xl text-gray-400">No products found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
