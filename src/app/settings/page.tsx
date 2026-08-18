'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { usersService, UpdateUserDto } from '../../services/users.service';
import { settingsService, BusinessSettings } from '../../services/settings.service';
import { ArrowLeft, Save, User, Mail, Phone, Lock, Camera, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [businessData, setBusinessData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    taxType: 'GST',
    currency: 'USD',
  });

  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

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

    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: (user as any).phoneNumber || '',
        avatar: (user as any).avatar || '',
      });
      setIsLoading(false);
    }

    if (isAdmin) {
      loadBusinessSettings();
    }
  }, [isAuthenticated, router, _hasHydrated, user, isAdmin]);

  const loadBusinessSettings = async () => {
    try {
      const data = await settingsService.getBusinessSettings();
      setBusinessData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        zipCode: data.zipCode || '',
        taxType: data.taxType || 'GST',
        currency: data.currency || 'USD',
      });
    } catch (error: any) {
      console.error('Failed to load business settings:', error);
      toast.error(error.message || 'Failed to load business settings');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updateData: UpdateUserDto = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        avatar: formData.avatar,
      };

      await usersService.updateProfile(user?.id?.toString() || '', updateData);
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('Current password and new password does not same');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password adn confirm password do not match');
      return;
    }


    setIsSaving(true);

    try {
      await usersService.updatePassword(user?.id?.toString() || '', passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBusiness(true);

    try {
      await settingsService.updateBusinessSettings(businessData);
      toast.success('Business settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update business settings');
    } finally {
      setIsSavingBusiness(false);
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
              <p className="text-slate-600">Manage your personal information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl">
          {/* Profile Information */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
              <User className="w-5 h-5 text-slate-600" />
              Personal Information
            </h2>
            
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Change Avatar
                  </button>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG or GIF (max 2MB)</p>
                </div>
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 focus:outline-none cursor-not-allowed"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900">
                <Lock className="w-5 h-5 text-slate-600" />
                Change Password
              </h2>
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            
            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Business Information - Admin Only */}
          {isAdmin && (
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900">
                  <Building2 className="w-5 h-5 text-slate-600" />
                  Business Information
                </h2>
                <button
                  onClick={() => router.push('/settings/tax-categories')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
                >
                  Manage Tax Categories
                </button>
              </div>
              
              <form onSubmit={handleBusinessSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessData.name}
                    onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Email</label>
                    <input
                      type="email"
                      value={businessData.email}
                      onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Phone</label>
                    <input
                      type="tel"
                      value={businessData.phone}
                      onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={businessData.address}
                    onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                    <input
                      type="text"
                      value={businessData.city}
                      onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                    <input
                      type="text"
                      value={businessData.state}
                      onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={businessData.country}
                      onChange={(e) => setBusinessData({ ...businessData, country: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code</label>
                    <input
                      type="text"
                      value={businessData.zipCode}
                      onChange={(e) => setBusinessData({ ...businessData, zipCode: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tax Type</label>
                    <select
                      value={businessData.taxType}
                      onChange={(e) => setBusinessData({ ...businessData, taxType: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    >
                      <option value="GST">GST (Goods and Services Tax)</option>
                      <option value="VAT">VAT (Value Added Tax)</option>
                      <option value="SALES_TAX">Sales Tax</option>
                      <option value="HST">HST (Harmonized Sales Tax)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                    <select
                      value={businessData.currency}
                      onChange={(e) => setBusinessData({ ...businessData, currency: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSavingBusiness}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Save className="w-5 h-5" />
                    {isSavingBusiness ? 'Saving...' : 'Save Business Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
