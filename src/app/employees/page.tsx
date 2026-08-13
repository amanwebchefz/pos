'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { employeesService, Employee } from '../../services/employees.service';
import { Search, Eye, Users, Mail, Phone, Building2, Shield, Plus, ArrowLeft, Trash2 } from 'lucide-react';

export default function EmployesPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN';

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadEmployees();
  }, [isAuthenticated, router, _hasHydrated]);

  const loadEmployees = async () => {
    try {
      const data = await employeesService.findAll();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, firstName: string, lastName: string) => {
    if (!confirm(`Are you sure you want to delete ${firstName} ${lastName}?`)) {
      return;
    }

    try {
      await employeesService.remove(id);
      loadEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phoneNumber?.includes(searchTerm)
  );

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
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {/* Back to Dashboard */}
              </button>
              <div className="border-l border-slate-200 pl-4">
                <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
                <p className="text-slate-600">Manage your team members</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => router.push('/employees/new')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add Employee
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <EmployeCard
              key={employee.id}
              employee={employee}
              isAdmin={isAdmin}
              onView={() => router.push(`/employees/${employee.id}`)}
              onDelete={() => handleDelete(employee.id, employee.firstName, employee.lastName)}
            />
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-24 h-24 mx-auto mb-4 text-slate-300" />
            <p className="text-xl text-slate-500">No employees found</p>
          </div>
        )}
      </main>
    </div>
  );
}

function EmployeCard({
  employee,
  isAdmin,
  onView,
  onDelete,
}: {
  employee: Employee;
  isAdmin: boolean;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        {employee.avatar ? (
          <img
            src={employee.avatar}
            alt={employee.firstName}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-500" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {employee.firstName} {employee.lastName}
          </h3>
          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
            employee.isActive 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Shield className="w-4 h-4 text-slate-400" />
          {employee.role.name}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Mail className="w-4 h-4 text-slate-400" />
          {employee.email}
        </div>
        {employee.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            {employee.phoneNumber}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        {isAdmin && (
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
