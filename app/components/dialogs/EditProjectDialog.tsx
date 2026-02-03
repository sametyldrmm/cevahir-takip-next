"use client";

import { useState, useEffect, useMemo } from "react";
import { usersApi, User as ApiUser } from "@/lib/api/users";
import { projectsApi, Project as ApiProject } from "@/lib/api/projects";
// MOCK DATA - Test modu için yorum satırında tutuluyor
// import { mockUsers, User } from "@/app/data/mockData";
// import type { User } from "@/app/data/mockData";

interface EditableProject {
  id: string;
  name: string;
  category: string;
  location?: string;
  description?: string;
  teamMembers?: string[];
}

interface EditProjectDialogProps {
  isOpen: boolean;
  project: EditableProject;
  onClose: () => void;
  onProjectUpdated: (project: EditableProject) => void;
}

export default function EditProjectDialog({
  isOpen,
  project,
  onClose,
  onProjectUpdated,
}: EditProjectDialogProps) {
  const [formData, setFormData] = useState<EditableProject>(project);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(project.teamMembers || [])
  );
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [allProjects, setAllProjects] = useState<ApiProject[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    setFormData(project);
    setSelectedMembers(new Set(project.teamMembers || []));
  }, [project]);

  // Kullanıcıları ve projeleri yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingUsers(true);
        const [users, projects] = await Promise.all([
          usersApi.getAllUsers(),
          projectsApi.getAllProjects(),
        ]);
        setAllUsers(users);
        setAllProjects(projects);
      } catch (error) {
        console.error("Data load error:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Unique kategorileri hesapla (backend'den gelen projelerden)
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    allProjects.forEach((p) => {
      const category = p.category || "special";
      if (category) {
        categories.add(category);
      }
    });
    return Array.from(categories).sort();
  }, [allProjects]);

  // Unique proje isimlerini hesapla
  const uniqueProjectNames = useMemo(() => {
    const names = new Set<string>();
    allProjects.forEach((p) => {
      if (p.name) {
        names.add(p.name);
      }
    });
    return Array.from(names).sort();
  }, [allProjects]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newErrors: { name?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Proje adı gerekli";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Proje adı en az 3 karakter olmalı";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Mock: Gerçek implementasyonda API çağrısı yapılacak
    const updatedProject: EditableProject = {
      ...formData,
      teamMembers: Array.from(selectedMembers),
    };
    onProjectUpdated(updatedProject);
    handleClose();
  };

  const handleClose = () => {
    setFormData(project);
    setSelectedMembers(new Set(project.teamMembers || []));
    setErrors({});
    onClose();
  };

  const toggleMember = (username: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(username)) {
      newSet.delete(username);
    } else {
      newSet.add(username);
    }
    setSelectedMembers(newSet);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-2xl w-full border border-outline-variant">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface">Proje Düzenle</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Project ID (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              Project ID
            </label>
            <input
              type="text"
              value={formData.id}
              readOnly
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface-variant text-sm cursor-not-allowed"
            />
          </div>

          {/* Project Name and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Enter project name"
                list="project-names-edit"
                className={`w-full px-4 py-3 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                  errors.name ? "border-error" : "border-outline"
                }`}
              />
              <datalist id="project-names-edit">
                {uniqueProjectNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {errors.name && (
                <p className="mt-1 text-xs text-error">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="Kategori seçin veya yeni kategori girin"
                list="category-list-edit"
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <datalist id="category-list-edit">
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Project location"
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Project description"
              rows={3}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
            />
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              Takım Üyeleri
            </label>
            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg max-h-64 overflow-y-auto">
              {allUsers.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">
                  Kullanıcı bulunamadı
                </p>
              ) : (
                <div className="space-y-2">
                  {allUsers
                    .filter((user) => user.username) // null username'leri filtrele
                    .map((user: ApiUser) => {
                      const isSelected = selectedMembers.has(user.username);
                      return (
                        <div
                          key={user.id} // id kullan (her zaman unique)
                          onClick={() => toggleMember(user.username)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary-container border-2 border-primary"
                            : "bg-surface hover:bg-(--surface-container-high) border-2 border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMember(user.username)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isSelected ? "text-on-primary-container" : "text-on-surface"
                            }`}
                          >
                            {user.displayName || user.username}
                          </p>
                          <p
                            className={`text-xs ${
                              isSelected
                                ? "text-on-primary-container/70"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {user.username}
                          </p>
                        </div>
                        {user.role === "ADMIN" && (
                          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-lg font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              {selectedMembers.size} kullanıcı seçildi
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            Güncelle
          </button>
        </div>
      </div>
    </div>
  );
}
