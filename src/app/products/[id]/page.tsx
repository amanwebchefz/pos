'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productsService, Product } from '@/services/products.service';
import { ArrowLeft, Edit, Trash2, Package, DollarSign, Box, Barcode, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import BarcodeComponent from 'react-barcode';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated, hasPermission } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [barcodeCount, setBarcodeCount] = useState(1);
  const { id } = use(params);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProduct();
  }, [isAuthenticated, router, _hasHydrated, id]);

  const loadProduct = async () => {
    try {
      const data = await productsService.findOne(id);
      setProduct(data);
    } catch (error: any) {
      console.error('Failed to load product:', error);
      toast.error(error.message || 'Failed to load product');
      router.push('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await productsService.remove(id);
      toast.success('Product deleted successfully');
      router.push('/products');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintBarcodes = () => {
    if (!product?.barcode) {
      toast.error('No barcode available for this product');
      return;
    }

    if (barcodeCount < 1 || barcodeCount > 100) {
      toast.error('Please enter a number between 1 and 100');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print barcodes');
      return;
    }

    const barcodeHTML = Array.from({ length: barcodeCount }, () => `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px; text-align: center; display: inline-block; width: 200px;">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${product.name}</div>
        <div id="barcode-${product.barcode}"></div>
        <div style="font-size: 12px; margin-top: 5px;">${product.barcode}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcodes - ${product.name}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${barcodeHTML}
        <script>
          ${Array.from({ length: barcodeCount }, (_, i) => `
            JsBarcode("#barcode-${product.barcode}", "${product.barcode}", {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: false
            });
          `).join('')}
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Products
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            {/* <div className="flex gap-3">
              {hasPermission('products.update') && (
                <button
                  onClick={() => router.push(`/products/${product.id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {hasPermission('products.delete') && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div> */}
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Name</label>
                  <p className="text-gray-900 dark:text-white">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p className="text-gray-900 dark:text-white">{product.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</label>
                    <p className="text-gray-900 dark:text-white">{product.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</label>
                    <p className="text-gray-900 dark:text-white">{product.barcode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{product.category?.name || 'General'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.category?.description || ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Selling Price</label>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${Number(product.sellingPrice).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost Price</label>
                  <p className="text-gray-900 dark:text-white">
                    ${Number(product.costPrice).toFixed(2)}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit Margin</label>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {((Number(product.sellingPrice) - Number(product.costPrice)) / Number(product.sellingPrice) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Box className="w-5 h-5" />
                Inventory
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Track Inventory</label>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${product.trackInventory ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                    {product.trackInventory ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Alert</label>
                  <p className="text-gray-900 dark:text-white">{product.lowStockAlert} units</p>
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div> */}

            {/* Unit */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Barcode className="w-5 h-5" />
                Unit
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Barcode className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{product.unit?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.unit?.abbreviation || ''}</p>
                </div>
              </div>
            </div>

            {/* Barcode */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Barcode className="w-5 h-5" />
                Barcode
              </h2>
              {product.barcode ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex justify-center">
                    <BarcodeComponent 
                      value={product.barcode} 
                      format="CODE128"
                      width={2}
                      height={50}
                      displayValue={true}
                      fontSize={14}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Barcode Number</p>
                    <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{product.barcode}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Number of barcodes to print</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={barcodeCount}
                      onChange={(e) => setBarcodeCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handlePrintBarcodes}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print Barcodes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No barcode assigned to this product</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
