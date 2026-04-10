'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import { formatBulgarianDate } from '@/lib/date-utils';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locale, setLocale] = useState('bg');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    params.then(p => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    if (!session) return;
    fetchUsers();
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <LoadingScreen locale={locale} />;
  }

  const userRole = (session.user as any)?.role;
  
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return <div>Access denied</div>;
  }

  const canCreateAdmin = userRole === 'SUPER_ADMIN';

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
        setShowDeleteConfirm(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Грешка при изтриване');
      }
    } catch (error) {
      alert('Грешка при изтриване на потребител');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">👥 Потребители</h1>
        {canCreateAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 sm:px-6 py-3 malts-btn-primary rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            + Добави потребител
          </button>
        )}
      </div>

      {loading ? (
        <LoadingScreen locale={locale} />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <div key={user.id} className="malts-card p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{user.name}</h3>
                      <p className="malts-muted text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'SUPER_ADMIN' 
                        ? 'bg-red-500/20 text-red-300'
                        : user.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-[rgba(22,101,52,0.12)] text-[var(--malts-success)] border border-[rgba(22,101,52,0.25)]'
                        : 'bg-[var(--malts-card)] text-[var(--malts-subtle)] border border-[var(--malts-hairline)]'
                    }`}>
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <p className="malts-muted text-sm">
                    Създаден: {formatBulgarianDate(user.createdAt)}
                  </p>
                  <div className="flex gap-2 pt-2 border-t border-[var(--malts-hairline)]">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-[var(--malts-info)] text-sm"
                    >
                      Редактирай
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-[var(--malts-danger)] text-sm"
                    >
                      Изтрий
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block malts-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--malts-inset)] border-b border-[var(--malts-hairline)]">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold malts-subtle uppercase">Име</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold malts-subtle uppercase">Email</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold malts-subtle uppercase">Роля</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold malts-subtle uppercase">Статус</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold malts-subtle uppercase">Създаден</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold malts-subtle uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--malts-hairline)] hover:bg-[var(--malts-accent-tint)]">
                      <td className="px-4 py-4 text-sm">{user.name}</td>
                      <td className="px-4 py-4 malts-muted text-sm">{user.email}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'SUPER_ADMIN' 
                            ? 'bg-red-500/20 text-red-300'
                            : user.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-[rgba(22,101,52,0.12)] text-[var(--malts-success)] border border-[rgba(22,101,52,0.25)]'
                            : 'bg-[var(--malts-card)] text-[var(--malts-subtle)] border border-[var(--malts-hairline)]'
                        }`}>
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-4 py-4 malts-muted text-sm">
                        {formatBulgarianDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-[var(--malts-info)] text-sm"
                        >
                          Редактирай
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-[var(--malts-danger)] text-sm"
                        >
                          Изтрий
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showAddForm && canCreateAdmin && (
        <AddUserForm
          locale={locale}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchUsers();
          }}
        />
      )}

      {showEditForm && selectedUser && (
        <EditUserForm
          user={selectedUser}
          locale={locale}
          onClose={() => {
            setShowEditForm(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}

      {showDeleteConfirm && selectedUser && (
        <DeleteConfirmModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function EditUserForm({ user, locale, onClose, onSuccess }: { user: User; locale: string; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'STAFF'>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: any = { email, name, role, isActive };
      if (password) body.password = password;

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Грешка при редактиране');
      }
    } catch (error) {
      alert('Грешка при редактиране на потребител');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--malts-paper)]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="malts-card p-6 md:p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-[var(--malts-ink)] mb-6">Редактирай потребител</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="malts-label">Име</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="malts-field"
            />
          </div>

          <div>
            <label className="malts-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="malts-field"
            />
          </div>

          <div>
            <label className="malts-label">Нова парола (остави празно за запазване)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="malts-field"
            />
          </div>

          <div>
            <label className="malts-label">Роля</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF')}
              className="malts-field"
            >
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--malts-ink)]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              Активен
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 malts-btn-secondary rounded-lg font-semibold transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 malts-btn-primary rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Запазване...' : 'Запази'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-[var(--malts-paper)]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="malts-card p-6 md:p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-[var(--malts-ink)] mb-2">Потвърди изтриване</h2>
        <p className="malts-muted mb-6">
          Сигурни ли сте, че искате да изтриете потребителя <strong>{user.name}</strong> ({user.email})?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 malts-btn-secondary rounded-lg font-semibold transition-colors"
          >
            Отказ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 malts-btn-danger rounded-lg font-semibold transition-colors"
          >
            Изтрий
          </button>
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ locale, onClose, onSuccess }: { locale: string; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        console.error('Error creating user:', error);
        
        // Show validation errors properly
        let errorMessage = 'Грешка при създаване на потребител';
        if (error.details && Array.isArray(error.details)) {
          errorMessage = error.details.join('\n');
        } else if (error.error) {
          errorMessage = error.error;
        } else if (error.details) {
          errorMessage = error.details;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      alert('Грешка при създаване на потребител');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--malts-paper)]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="malts-card p-6 md:p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-[var(--malts-ink)] mb-6">Добави потребител</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="malts-label">Име</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="malts-field"
            />
          </div>

          <div>
            <label className="malts-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="malts-field"
            />
          </div>

          <div>
            <label className="malts-label">Парола</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="malts-field"
            />
          </div>

          <div>
            <label className="malts-label">Роля</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'STAFF')}
              className="malts-field"
            >
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 malts-btn-secondary rounded-lg font-semibold transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 malts-btn-primary rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Създаване...' : 'Създай'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

