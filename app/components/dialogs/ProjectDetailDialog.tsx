"use client";

import { useState, useEffect } from "react";
import { targetsApi, Target } from "@/lib/api/targets";
import { useAuth } from "@/app/contexts/AuthContext";
import EditTargetDialog from "./EditTargetDialog";

interface Project {
  id: string;
  name: string;
  category: string;
  description?: string;
  code?: string | null;
  isActive?: boolean;
  archived?: boolean;
  userCount?: number;
  targetCount?: number;
  users?: Array<{
    id: string;
    username: string;
    email: string;
    displayName?: string;
    userTitle?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectDetailDialogProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
}

export default function ProjectDetailDialog({
  isOpen,
  project,
  onClose,
}: ProjectDetailDialogProps) {
  const { user } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isOpen && project?.id) {
      const loadTargets = async () => {
        try {
          setIsLoadingTargets(true);
          const projectTargets = await targetsApi.getProjectTargets(project.id, 20);
          setTargets(projectTargets);
        } catch (error) {
          console.error("Failed to load project targets:", error);
          setTargets([]);
        } finally {
          setIsLoadingTargets(false);
        }
      };
      loadTargets();
    } else {
      setTargets([]);
    }
  }, [isOpen, project?.id]);

  if (!isOpen || !project) return null;

  const categoryLabels: Record<string, string> = {
    turkiye: "🇹🇷 Türkiye Projeleri",
    international: "🌍 Uluslararası Projeler",
    special: "⭐ Özel Projeler",
    visualization: "🎨 Görselleştirme Projeleri",
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-3xl w-full border border-outline-variant max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-on-surface">Proje Detayları</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="bg-surface-container-high rounded-lg p-4 border border-outline-variant">
            <h4 className="text-lg font-semibold text-on-surface mb-4">Temel Bilgiler</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Proje Adı
                </label>
                <p className="text-sm text-on-surface font-medium">{project.name}</p>
              </div>
              {project.code && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Proje Kodu
                  </label>
                  <p className="text-sm text-on-surface font-medium">{project.code}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Kategori
                </label>
                <p className="text-sm text-on-surface">
                  {categoryLabels[project.category] || project.category}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Durum
                </label>
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                    project.isActive && !project.archived
                      ? "bg-success/20 text-success"
                      : "bg-error/20 text-error"
                  }`}
                >
                  {project.isActive && !project.archived ? "Aktif" : "Arşivlendi"}
                </span>
              </div>
            </div>
            {project.description && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Açıklama
                </label>
                <p className="text-sm text-on-surface whitespace-pre-wrap">{project.description}</p>
              </div>
            )}
          </div>

          {/* İstatistikler */}
          <div className="bg-surface-container-high rounded-lg p-4 border border-outline-variant">
            <h4 className="text-lg font-semibold text-on-surface mb-4">İstatistikler</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-surface rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {project.userCount || 0}
                </div>
                <div className="text-xs text-on-surface-variant">Kullanıcı</div>
              </div>
              <div className="text-center p-4 bg-surface rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {project.targetCount || 0}
                </div>
                <div className="text-xs text-on-surface-variant">Hedef</div>
              </div>
              <div className="text-center p-4 bg-surface rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {project.users?.length || 0}
                </div>
                <div className="text-xs text-on-surface-variant">Takım Üyesi</div>
              </div>
            </div>
          </div>

          {/* Kullanıcılar */}
          {project.users && project.users.length > 0 && (
            <div className="bg-surface-container-high rounded-lg p-4 border border-outline-variant">
              <h4 className="text-lg font-semibold text-on-surface mb-4">Takım Üyeleri</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {project.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-surface rounded-lg border border-outline-variant"
                  >
                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        {`${user.displayName || user.username}${user.userTitle ? ` - ${user.userTitle}` : ""}`}
                      </p>
                      <p className="text-xs text-on-surface-variant">{user.email}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant">{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proje Hedefleri */}
          <div className="bg-surface-container-high rounded-lg p-4 border border-outline-variant">
            <h4 className="text-lg font-semibold text-on-surface mb-4">Proje Hedefleri</h4>
            {isLoadingTargets ? (
              <div className="text-center py-4">
                <p className="text-sm text-on-surface-variant">Yükleniyor...</p>
              </div>
            ) : targets.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-on-surface-variant">Bu projeye ait hedef bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {targets.map((target) => {
                  const statusLabels: Record<string, string> = {
                    REACHED: "Tamamlandı",
                    PARTIAL: "Kısmen",
                    FAILED: "Başarısız",
                    NOT_SET: "Belirlenmedi",
                  };
                  const statusColors: Record<string, string> = {
                    REACHED: "bg-success/20 text-success",
                    PARTIAL: "bg-warning/20 text-warning",
                    FAILED: "bg-error/20 text-error",
                    NOT_SET: "bg-surface-container-high text-on-surface-variant",
                  };

                  return (
                    <div
                      key={target.id}
                      className={`p-3 bg-surface rounded-lg border border-outline-variant ${
                        isAdmin ? "cursor-pointer hover:border-(--primary) transition-colors" : ""
                      }`}
                      onClick={() => {
                        if (isAdmin) {
                          setEditingTarget(target);
                          setShowEditDialog(true);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-on-surface">
                              {target.taskContent || "Hedef içeriği belirtilmemiş"}
                            </p>
                            {target.user && (
                              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded font-medium">
                                {`${target.user.displayName || target.user.username}${target.user.userTitle ? ` - ${target.user.userTitle}` : ""}`}
                              </span>
                            )}
                            {isAdmin && (
                              <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded font-medium">
                                Düzenlemek için tıklayın
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            {new Date(target.date).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        {target.goalStatus && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              statusColors[target.goalStatus] || statusColors.NOT_SET
                            }`}
                          >
                            {statusLabels[target.goalStatus] || "Bilinmiyor"}
                          </span>
                        )}
                      </div>
                      {target.description && (
                        <p className="text-xs text-on-surface-variant mb-2">{target.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-on-surface-variant">
                        {target.workStart && target.workEnd && (
                          <span>
                            Çalışma: {target.workStart} - {target.workEnd}
                          </span>
                        )}
                        {target.block && <span>Blok: {target.block}</span>}
                        {target.floors && <span>Katlar: {target.floors}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tarih Bilgileri */}
          <div className="bg-surface-container-high rounded-lg p-4 border border-outline-variant">
            <h4 className="text-lg font-semibold text-on-surface mb-4">Tarih Bilgileri</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Oluşturulma Tarihi
                </label>
                <p className="text-sm text-on-surface">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Son Güncelleme
                </label>
                <p className="text-sm text-on-surface">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Kapat
          </button>
        </div>
      </div>

      {isAdmin && editingTarget && (
        <EditTargetDialog
          isOpen={showEditDialog}
          target={editingTarget}
          onClose={() => {
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
          onTargetUpdated={async (updatedTarget) => {
            // Hedefleri yeniden yükle
            try {
              const projectTargets = await targetsApi.getProjectTargets(project.id, 20);
              setTargets(projectTargets);
            } catch (error) {
              console.error("Failed to reload project targets:", error);
            }
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
        />
      )}
    </div>
  );
}

