"use client";

import { useState, useEffect } from "react";
import { targetsApi, Target, GoalStatus } from "@/lib/api/targets";
import EditTargetDialog from "./EditTargetDialog";

interface FilteredTargetsDialogProps {
  isOpen: boolean;
  filter: "all" | "completed" | "inProgress" | "pending" | null;
  onClose: () => void;
}

export default function FilteredTargetsDialog({
  isOpen,
  filter,
  onClose,
}: FilteredTargetsDialogProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (isOpen && filter) {
      const loadTargets = async () => {
        try {
          setIsLoading(true);
          const allTargets = await targetsApi.getMyTargets();
          
          // Filtreleme
          let filtered: Target[] = [];
          switch (filter) {
            case "all":
              filtered = allTargets;
              break;
            case "completed":
              filtered = allTargets.filter((t) => t.goalStatus === "REACHED");
              break;
            case "inProgress":
              filtered = allTargets.filter((t) => t.goalStatus === "PARTIAL");
              break;
            case "pending":
              filtered = allTargets.filter(
                (t) => t.goalStatus === "FAILED" || t.goalStatus === "NOT_SET" || !t.goalStatus
              );
              break;
          }
          
          setTargets(filtered);
        } catch (error) {
          console.error("Failed to load targets:", error);
          setTargets([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadTargets();
    } else {
      setTargets([]);
    }
  }, [isOpen, filter]);

  if (!isOpen || !filter) return null;

  const filterLabels: Record<string, string> = {
    all: "Tüm Hedefler",
    completed: "Başarıyla Tamamlanan Hedefler",
    inProgress: "Kısmen Tamamlanan Hedefler",
    pending: "Ulaşılamayan Hedefler",
  };

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

  const handleTargetUpdated = (updatedTarget: Target) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === updatedTarget.id ? updatedTarget : t))
    );
    setShowEditDialog(false);
    setEditingTarget(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
        <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-4xl w-full border border-outline-variant max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-on-surface">
              {filterLabels[filter]}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-on-surface-variant">Yükleniyor...</p>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-on-surface-variant">
                Bu filtreye uygun hedef bulunamadı.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((target) => (
                <div
                  key={target.id}
                  className="p-4 bg-surface rounded-lg border border-outline-variant hover:border-primary transition-colors cursor-pointer"
                  onClick={() => {
                    setEditingTarget(target);
                    setShowEditDialog(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-on-surface mb-1">
                        {target.taskContent || "İş içeriği belirtilmemiş"}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {new Date(target.date).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {target.goalStatus && (
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          statusColors[target.goalStatus] || statusColors.NOT_SET
                        }`}
                      >
                        {statusLabels[target.goalStatus] || "Bilinmiyor"}
                      </span>
                    )}
                  </div>
                  {target.description && (
                    <p className="text-sm text-on-surface-variant mb-2">
                      {target.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-on-surface-variant">
                    {target.block && <span>Blok: {target.block}</span>}
                    {target.floors && <span>Katlar: {target.floors}</span>}
                    {target.workStart && target.workEnd && (
                      <span>
                        Çalışma: {target.workStart} - {target.workEnd}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6 pt-6 border-t border-outline-variant">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {editingTarget && (
        <EditTargetDialog
          isOpen={showEditDialog}
          target={editingTarget}
          onClose={() => {
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
          onTargetUpdated={handleTargetUpdated}
        />
      )}
    </>
  );
}





