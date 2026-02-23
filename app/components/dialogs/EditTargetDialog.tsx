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
    if (isOpen && isAdmin) {
      const loadProjects = async () => {
        try {
          const projs = await projectsApi.getAllProjects();
          setProjects(projs);
        } catch (error) {
          console.error("Failed to load projects:", error);
        }
      };
      loadProjects();
      return;
    }
    if (isOpen) setProjects([]);
  }, [isAdmin, isOpen]);

  if (!isOpen || !target) return null;

  const pad2 = (value: number) => String(value).padStart(2, "0");
  const getLocalDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const normalizeDateKey = (value: string | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const candidate = trimmed.split("T")[0]?.split(" ")[0];
    if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) return getLocalDateKey(parsed);
      return candidate;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return getLocalDateKey(parsed);

    return null;
  };

  const todayKey = getLocalDateKey(new Date());
  const yesterdayKey = (() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return getLocalDateKey(date);
  })();
  const targetDateKey = normalizeDateKey(target.date);

  const isOwner = !!user?.id && target.userId === user.id;
  const statusNotSet = !target.goalStatus || target.goalStatus === "NOT_SET";
  const canEditStatus =
    isAdmin ||
    (isOwner &&
      !!targetDateKey &&
      (targetDateKey === todayKey ||
        (targetDateKey === yesterdayKey && statusNotSet)));

  const handleSubmit = async () => {
    if (!canEditStatus) {
      showError("Bu hedefin durumunu güncelleyemezsiniz");
      return;
    }

    try {
      setIsLoading(true);
      const payload: UpdateTargetDto = isAdmin
        ? formData
        : { goalStatus: formData.goalStatus ?? "NOT_SET" };
      const updated = await targetsApi.updateTarget(target.id, payload);
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

  const statusValue = formData.goalStatus ?? "NOT_SET";
  const statusRadioName = `goal-status-${target.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-2xl w-full border border-outline-variant max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6 flex-none">
          <h3 className="text-xl font-bold text-on-surface">
            {isAdmin ? "Hedefi Güncelle" : "Hedef Durumunu Güncelle"}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 flex-1 min-h-0 overflow-y-auto pr-1">
          {!isAdmin && (
            <div className="rounded-lg border border-outline bg-surface px-4 py-3">
              <p className="text-sm text-on-surface-variant">
                {canEditStatus
                  ? "Sadece hedef durumu güncellenebilir."
                  : "Bu hedef için durum güncelleme izniniz yok."}
              </p>
            </div>
          )}
          {/* Proje Seçimi */}
          {isAdmin && projects.length > 0 && (
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
              disabled={!isAdmin}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
            />
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Durum
            </label>
            <div
              className="grid gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-disabled={!canEditStatus}
            >
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface ${
                  !canEditStatus ? "opacity-60" : ""
                }`}
              >
                <input
                  id={`${statusRadioName}-not-set`}
                  type="radio"
                  name={statusRadioName}
                  value="NOT_SET"
                  checked={statusValue === "NOT_SET"}
                  onChange={() =>
                    setFormData({ ...formData, goalStatus: "NOT_SET" })
                  }
                  className="h-5 w-5 accent-primary"
                  disabled={!canEditStatus}
                />
                <label
                  htmlFor={`${statusRadioName}-not-set`}
                  className="text-sm font-medium text-on-surface cursor-pointer"
                >
                  Belirlenmedi
                </label>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface ${
                  !canEditStatus ? "opacity-60" : ""
                }`}
              >
                <input
                  id={`${statusRadioName}-reached`}
                  type="radio"
                  name={statusRadioName}
                  value="REACHED"
                  checked={statusValue === "REACHED"}
                  onChange={() =>
                    setFormData({ ...formData, goalStatus: "REACHED" })
                  }
                  className="h-5 w-5 accent-success"
                  disabled={!canEditStatus}
                />
                <label
                  htmlFor={`${statusRadioName}-reached`}
                  className="text-sm font-medium text-success cursor-pointer"
                >
                  Tamamlandı
                </label>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface ${
                  !canEditStatus ? "opacity-60" : ""
                }`}
              >
                <input
                  id={`${statusRadioName}-partial`}
                  type="radio"
                  name={statusRadioName}
                  value="PARTIAL"
                  checked={statusValue === "PARTIAL"}
                  onChange={() =>
                    setFormData({ ...formData, goalStatus: "PARTIAL" })
                  }
                  className="h-5 w-5 accent-warning"
                  disabled={!canEditStatus}
                />
                <label
                  htmlFor={`${statusRadioName}-partial`}
                  className="text-sm font-medium text-warning cursor-pointer"
                >
                  Kısmen
                </label>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface ${
                  !canEditStatus ? "opacity-60" : ""
                }`}
              >
                <input
                  id={`${statusRadioName}-failed`}
                  type="radio"
                  name={statusRadioName}
                  value="FAILED"
                  checked={statusValue === "FAILED"}
                  onChange={() =>
                    setFormData({ ...formData, goalStatus: "FAILED" })
                  }
                  className="h-5 w-5 accent-error"
                  disabled={!canEditStatus}
                />
                <label
                  htmlFor={`${statusRadioName}-failed`}
                  className="text-sm font-medium text-error cursor-pointer"
                >
                  Başarısız
                </label>
              </div>
            </div>
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
              disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 mt-6 border-t border-outline-variant flex-none">
          <button
            onClick={handleClose}
            disabled={isLoading || isDeleting}
            className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-(--surface-container-highest)! transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          {isAdmin && onTargetDeleted && (
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
            disabled={
              isLoading ||
              isDeleting ||
              !canEditStatus ||
              (isAdmin && !formData.taskContent?.trim())
            }
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







