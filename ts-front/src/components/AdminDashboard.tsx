import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  createUser,
  deleteUser,
  getImagesByUserEmail,
  deleteImage,
} from "../services/apiService";
import type {
  User,
  CreateUserRequest,
  ImageItem,
  IAllImageResponse,
} from "../types";
import { isAdmin } from "../utils/auth";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null); // Track which user is being deleted
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // Track confirm dialog

  // User images modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userImages, setUserImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

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

  const handleViewUserImages = async (user: User) => {
    try {
      setSelectedUser(user);
      setLoadingImages(true);
      setError(null);

      const response = await getImagesByUserEmail(user.email);

      if (response.success === "true" && Array.isArray(response.data)) {
        setUserImages(response.data);
      } else {
        setUserImages([]);
      }
    } catch (err) {
      console.error("Error fetching user images:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching user images"
      );
      setUserImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleCloseImageModal = () => {
    setSelectedUser(null);
    setUserImages([]);
    setSelectedImage(null);
    setError(null);
  };

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image);
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      setDeletingImage(imageId);
      setError(null);

      const response = await deleteImage(imageId);

      if (response.success === "true") {
        // Refresh user images
        if (selectedUser) {
          await handleViewUserImages(selectedUser);
        }
      } else {
        throw new Error(response.message || "Failed to delete image");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting image"
      );
    } finally {
      setDeletingImage(null);
    }
  };

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 sm:p-8 text-center max-w-md w-full mx-4">
          <div className="text-red-400 text-4xl sm:text-6xl mb-4">🚫</div>
          <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-300 text-sm sm:text-base">
            You need admin privileges to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            🛠️ Admin Dashboard
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Manage users and system administration
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <span className="text-red-400 text-lg sm:text-xl mr-2">⚠️</span>
              <p className="text-red-400 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 sm:p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-red-400 text-4xl sm:text-6xl mb-4">⚠️</div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-gray-300 mb-6 text-sm sm:text-base">
                  Are you sure you want to delete the user with email:{" "}
                  <span className="font-bold text-red-400 break-words">
                    {deleteConfirm}
                  </span>
                  ?
                  <br />
                  <span className="text-red-400 text-xs sm:text-sm">
                    This action cannot be undone.
                  </span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={cancelDelete}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    ✖️ Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(deleteConfirm)}
                    disabled={deleting === deleteConfirm}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed text-sm sm:text-base"
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
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              👥 User Management
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base"
            >
              {showCreateForm ? "✖️ Cancel" : "➕ Create User"}
            </button>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateUser}
              className="bg-gray-900/30 rounded-xl p-4 sm:p-6 border border-gray-700/30"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter password"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-sm sm:text-base"
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
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {creating ? "⏳ Creating..." : "✅ Create User"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Users List */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              📋 All Users
            </h2>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? "⏳ Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-gray-300 mt-4 text-sm sm:text-base">
                Loading users...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl sm:text-6xl mb-4">👥</div>
              <p className="text-gray-300 text-sm sm:text-base">
                No users found
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
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
                            <button
                              onClick={() => handleViewUserImages(user)}
                              className="text-white font-medium hover:text-purple-400 transition-colors duration-200 cursor-pointer"
                            >
                              {user.name}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          {user.email}
                        </td>
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => handleViewUserImages(user)}
                            className="text-white font-medium text-sm hover:text-purple-400 transition-colors duration-200 cursor-pointer truncate block w-full text-left"
                          >
                            {user.name}
                          </button>
                          <p className="text-gray-400 text-xs truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                          user.role === "admin"
                            ? "bg-red-900/30 text-red-400 border border-red-500/30"
                            : "bg-blue-900/30 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {user.role === "admin" ? "🛡️ Admin" : "👤 User"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-xs">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => confirmDelete(user.email)}
                        disabled={deleting === user.email}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 font-medium text-xs disabled:cursor-not-allowed"
                      >
                        {deleting === user.email
                          ? "🗑️ Deleting..."
                          : "🗑️ Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Images Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedUser.name}'s Images
                  </h2>
                  <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleCloseImageModal}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingImages ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  <p className="text-gray-300 mt-4">Loading images...</p>
                </div>
              ) : userImages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                  <p className="text-gray-300">No images found for this user</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userImages.map((image) => (
                    <div
                      key={image._id}
                      className="relative group bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700/30 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleImageClick(image)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image._id);
                          }}
                          disabled={deletingImage === image._id}
                          className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700 disabled:bg-red-800 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:cursor-not-allowed"
                        >
                          {deletingImage === image._id ? (
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Image info */}
                      <div className="p-4">
                        <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                          {image.prompt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {new Date(image.createdAt).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                            Generated
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors duration-200 p-2 bg-black/50 rounded-full z-10"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-xl overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.prompt}
                className="w-full max-h-[60vh] object-contain"
              />
              <div className="p-6 border-t border-gray-700/50">
                <h3 className="text-white font-semibold mb-2">Prompt</h3>
                <p className="text-gray-300 mb-4">{selectedImage.prompt}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span>Generated Image</span>
                  <span>
                    Created:{" "}
                    {new Date(selectedImage.createdAt).toLocaleString()}
                  </span>
                  {selectedImage.width && selectedImage.height && (
                    <span>
                      Dimensions: {selectedImage.width}x{selectedImage.height}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
