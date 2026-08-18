'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { taxCategoriesService, TaxCategory, CreateTaxCategoryDto } from '../../../services/tax-categories.service';
import { ArrowLeft, Plus, Edit, Trash2, Percent, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TaxCategoriesPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaxCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateTaxCategoryDto>({
    name: '',
    code: '',
    description: '',
    taxRate: 0,
  });

  // Helper function to get role name safely
  const getRoleName = (role: string | any): string => {
    if (typeof role === 'string') return role;
    return role?.name || '';
  };

  const isAdmin = getRoleName(user?.role) === 'ADMIN' || getRoleName(user?.role) === 'SUPER_ADMIN';

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    loadTaxCategories();
  }, [isAuthenticated, router, _hasHydrated, isAdmin]);

  const loadTaxCategories = async () => {
    try {
      setIsLoading(true);
      const data = await taxCategoriesService.findAll();
      setTaxCategories(data);
    } catch (error: any) {
      console.error('Failed to load tax categories:', error);
      toast.error(error.response?.data?.message || 'Failed to load tax categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      const data = await taxCategoriesService.initializeDefaultTaxCategories();
      setTaxCategories(data);
      toast.success('Default tax categories initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize default tax categories:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize default tax categories');
    }
  };

  const handleOpenModal = (category?: TaxCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        code: category.code,
        description: category.description || '',
        taxRate: category.taxRate,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        taxRate: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      taxRate: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingCategory) {
        await taxCategoriesService.update(editingCategory.id, formData);
        toast.success('Tax category updated successfully');
      } else {
        await taxCategoriesService.create(formData);
        toast.success('Tax category created successfully');
      }
      handleCloseModal();
      loadTaxCategories();
    } catch (error: any) {
      console.error('Failed to save tax category:', error);
      toast.error(error.response?.data?.message || 'Failed to save tax category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tax category?')) {
      return;
    }

    try {
      await taxCategoriesService.delete(id);
      toast.success('Tax category deleted successfully');
      loadTaxCategories();
    } catch (error: any) {
      console.error('Failed to delete tax category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete tax category');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Tax Categories</h1>
                <p className="text-slate-600">Manage tax rates for different product types</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {taxCategories.length === 0 && (
                <button
                  onClick={handleInitializeDefaults}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <Percent className="w-4 h-4" />
                  Initialize Defaults
                </button>
              )}
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Tax Category
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {taxCategories.length === 0 ? (
          <div className="bg-white rounded-lg p-12 border border-slate-200 shadow-sm text-center">
            <Percent className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tax Categories Found</h3>
            <p className="text-slate-600 mb-6">Get started by initializing default tax categories or create custom ones.</p>
            <button
              onClick={handleInitializeDefaults}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors mx-auto"
            >
              <Percent className="w-5 h-5" />
              Initialize Default Tax Categories
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Tax Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {taxCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {category.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{category.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* <Percent className="w-4 h-4 text-slate-400" /> */}
                        <span className="font-medium text-slate-900">{category.taxRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingCategory ? 'Edit Tax Category' : 'Add Tax Category'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                  required
                  placeholder="e.g., Food, Grocery, Standard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                  required
                  placeholder="e.g., FOOD, GROCERY, STANDARD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}