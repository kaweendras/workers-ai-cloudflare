import React, { useState, useEffect } from "react";
import { getAllUsers, createUser, deleteUser } from "../services/apiService";
import type { User, CreateUserRequest } from "../types";
import { isAdmin } from "../utils/auth";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null); // Track which user is being deleted
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // Track confirm dialog
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  // Check if user is admin
  const isUserAdmin = isAdmin();

  useEffect(() => {
    if (!isUserAdmin) {
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [isUserAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers();

      if (response.success === "true" && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching users"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email || !newUser.password) {
      setError("All fields are required");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await createUser(newUser);

      if (response.success === "true") {
        // Reset form
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "user",
        });
        setShowCreateForm(false);

        // Refresh users list
        await fetchUsers();
      } else {
        throw new Error(response.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while creating user"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteUser = async (email: string) => {
    try {
      setDeleting(email);
      setError(null);

      const response = await deleteUser(email);

      if (response.success === "true") {
        // Refresh users list
        await fetchUsers();
        setDeleteConfirm(null);
      } else {
        throw new Error(response.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting user"
      );
    } finally {
      setDeleting(null);
    }
  };

  const confirmDelete = (email: string) => {
    setDeleteConfirm(email);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center max-w-md mx-4">
          <div className="text-red-400 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-300">
            You need admin privileges to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🛠️ Admin Dashboard
          </h1>
          <p className="text-gray-300">
            Manage users and system administration
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-400 text-xl mr-2">⚠️</span>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete the user with email:{" "}
                  <span className="font-bold text-red-400">
                    {deleteConfirm}
                  </span>
                  ?
                  <br />
                  <span className="text-red-400 text-sm">
                    This action cannot be undone.
                  </span>
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={cancelDelete}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                  >
                    ✖️ Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(deleteConfirm)}
                    disabled={deleting === deleteConfirm}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed"
                  >
                    {deleting === deleteConfirm
                      ? "⏳ Deleting..."
                      : "🗑️ Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Section */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">👥 User Management</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
            >
              {showCreateForm ? "✖️ Cancel" : "➕ Create User"}
            </button>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateUser}
              className="bg-gray-900/30 rounded-xl p-6 border border-gray-700/30"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed"
                >
                  {creating ? "⏳ Creating..." : "✅ Create User"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Users List */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">📋 All Users</h2>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed"
            >
              {loading ? "⏳ Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-gray-300 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <p className="text-gray-300">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Created
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors duration-200"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{user.email}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-900/30 text-red-400 border border-red-500/30"
                              : "bg-blue-900/30 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {user.role === "admin" ? "🛡️ Admin" : "👤 User"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => confirmDelete(user.email)}
                          disabled={deleting === user.email}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 font-medium text-sm disabled:cursor-not-allowed"
                        >
                          {deleting === user.email
                            ? "🗑️ Deleting..."
                            : "🗑️ Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
