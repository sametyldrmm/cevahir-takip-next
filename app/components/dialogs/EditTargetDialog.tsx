"use client";

import { useState, useEffect } from "react";
import { targetsApi, Target, UpdateTargetDto, GoalStatus } from "@/lib/api/targets";
import { projectsApi } from "@/lib/api/projects";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useAuth } from "@/app/contexts/AuthContext";

interface EditTargetDialogProps {
  isOpen: boolean;
  target: Target | null;
  onClose: () => void;
  onTargetUpdated: (target: Target) => void;
  onTargetDeleted?: (targetId: string) => void;
}

export default function EditTargetDialog({
  isOpen,
  target,
  onClose,
  onTargetUpdated,
  onTargetDeleted,
}: EditTargetDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [formData, setFormData] = useState<UpdateTargetDto>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen && target) {
      setFormData({
        taskContent: target.taskContent || "",
        description: target.description || "",
        block: target.block || "",
        floors: target.floors || "",
        goalStatus: target.goalStatus,
        workStart: target.workStart || "",
        workEnd: target.workEnd || "",
        meetingStart: target.meetingStart || "",
        meetingEnd: target.meetingEnd || "",
        projectId: target.projectId || undefined,
      });
    }
  }, [isOpen, target]);

  useEffect(() => {
    if (isOpen) {
      const loadProjects = async () => {
        try {
          const projs = isAdmin
            ? await projectsApi.getAllProjects()
            : await projectsApi.getMyProjects();
          setProjects(projs);
        } catch (error) {
          console.error("Failed to load projects:", error);
        }
      };
      loadProjects();
    }
  }, [isAdmin, isOpen]);

  if (!isOpen || !target) return null;

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const updated = await targetsApi.updateTarget(target.id, formData);
      onTargetUpdated(updated);
      showSuccess("Hedef başarıyla güncellendi");
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || "Hedef güncellenirken bir hata oluştu";
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!target || !onTargetDeleted) return;

    try {
      setIsDeleting(true);
      await targetsApi.deleteTarget(target.id);
      showSuccess("Hedef başarıyla silindi");
      onTargetDeleted(target.id);
      handleClose();
    } catch (error: any) {
      const message = error.response?.data?.message || "Hedef silinirken bir hata oluştu";
      showError(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const statusOptions: { value: GoalStatus; label: string }[] = [
    { value: "NOT_SET", label: "Belirlenmedi" },
    { value: "REACHED", label: "Tamamlandı" },
    { value: "PARTIAL", label: "Kısmen" },
    { value: "FAILED", label: "Başarısız" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-2xl w-full border border-outline-variant max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface">Hedefi Güncelle</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Proje Seçimi */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Proje
              </label>
              <select
                value={formData.projectId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value || undefined })
                }
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Proje seçiniz</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* İş İçeriği */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              İş İçeriği <span className="text-error">*</span>
            </label>
            <textarea
              value={formData.taskContent || ""}
              onChange={(e) => setFormData({ ...formData, taskContent: e.target.value })}
              placeholder="Yapılacak işin içeriğini giriniz"
              rows={3}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
            />
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Durum
            </label>
            <select
              value={formData.goalStatus || "NOT_SET"}
              onChange={(e) =>
                setFormData({ ...formData, goalStatus: e.target.value as GoalStatus })
              }
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ek açıklamalar"
              rows={3}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
            />
          </div>

          {/* Blok ve Katlar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Blok</label>
              <input
                type="text"
                value={formData.block || ""}
                onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                placeholder="A Blok"
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Katlar</label>
              <input
                type="text"
                value={formData.floors || ""}
                onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                placeholder="1-5 Katlar"
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Çalışma Saatleri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Çalışma Başlangıç
              </label>
              <input
                type="time"
                value={formData.workStart || ""}
                onChange={(e) => setFormData({ ...formData, workStart: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Çalışma Bitiş
              </label>
              <input
                type="time"
                value={formData.workEnd || ""}
                onChange={(e) => setFormData({ ...formData, workEnd: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Toplantı Saatleri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Toplantı Başlangıç
              </label>
              <input
                type="time"
                value={formData.meetingStart || ""}
                onChange={(e) => setFormData({ ...formData, meetingStart: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Toplantı Bitiş
              </label>
              <input
                type="time"
                value={formData.meetingEnd || ""}
                onChange={(e) => setFormData({ ...formData, meetingEnd: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 mt-6 border-t border-outline-variant">
          <button
            onClick={handleClose}
            disabled={isLoading || isDeleting}
            className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-(--surface-container-highest)! transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          {onTargetDeleted && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading || isDeleting}
              className="px-4 py-3 bg-error text-on-error rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Sil
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLoading || isDeleting || !formData.taskContent?.trim()}
            className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Güncelleniyor..." : "Güncelle"}
          </button>
        </div>

        {/* Silme Onay Dialog'u */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant mx-4">
              <h3 className="text-lg font-bold text-on-surface mb-2">
                Hedefi Sil
              </h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Bu hedefi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-(--surface-container-highest)! transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-error text-on-error rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isDeleting ? "Siliniyor..." : "Sil"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}







