'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { productsService, Product } from '../../services/products.service';
import { settingsService, BusinessSettings } from '../../services/settings.service';
import { taxCategoriesService, TaxCategory } from '../../services/tax-categories.service';
import { Plus, Search, Edit, Trash2, Package, ArrowLeft, Save, X, EyeIcon, Box, DollarSign, TrendingUp } from 'lucide-react';
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
  const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);

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
    }
  };

  const loadTaxCategories = async () => {
    try {
      const data = await taxCategoriesService.findAll();
      setTaxCategories(data);
    } catch (error: any) {
      console.error('Failed to load tax categories:', error);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProducts();
    loadBusinessSettings();
    loadTaxCategories();
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
      taxCategoryId: (product as any).taxCategoryId || '',
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
        taxCategoryId: editForm.taxCategoryId,
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

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'bg-red-50 text-red-600 border-red-200', label: 'Out of Stock' };
    if (stock < 10) return { color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Low Stock' };
    return { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'In Stock' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <div className="border-l border-gray-200 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your product inventory</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg">
                <span className="font-semibold">{filteredProducts.length}</span>
                <span className="ml-1 text-gray-500">Products</span>
              </div>
              {hasPermission('products.create') && (
                <button
                  onClick={() => router.push('/products/new')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Product</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${products.reduce((sum, p) => sum + Number(p.sellingPrice), 0).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {products.filter(p => {
                    const stock = p.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
                    return stock < 10;
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div> */}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, code, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const totalStock = product.inventory && product.inventory.length > 0
                    ? product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
                    : 0;
                  const stockStatus = getStockStatus(totalStock);
                  const isEditing = editingId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      {isEditing ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.sku}
                              onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4 text-gray-500">{product.category?.name || '-'}</td>
                          <td className="px-6 py-4">
                            {taxCategories.length === 0 ? (
                              <span className="text-gray-400 text-sm">No tax categories</span>
                            ) : (
                              <select
                                value={editForm.taxCategoryId}
                                onChange={(e) => setEditForm({ ...editForm, taxCategoryId: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select type</option>
                                {taxCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editForm.sellingPrice}
                              onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editForm.stock}
                              onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSave(product.id)}
                                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.barcode || product.sku || 'No barcode'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium">{product.sku || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {product.category?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {(product as any).taxCategory?.name || 'No Type'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">${Number(product.sellingPrice).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Cost: ${Number(product.costPrice).toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                              {totalStock} {stockStatus.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {hasPermission('products.view') && (
                                <button
                                  onClick={() => router.push(`/products/${product.id}`)}
                                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                  title="View"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                              )}
                              {hasPermission('products.update') && (
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {hasPermission('products.delete') && (
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="p-2.5 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 rounded-lg transition-colors"
                                  title="Delete"
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
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl text-gray-500 font-medium">No products found</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or add a new product</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
