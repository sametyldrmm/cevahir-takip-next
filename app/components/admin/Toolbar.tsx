"use client";

interface ToolbarProps {
  editMode: boolean;
  selectionCount: number;
  isProjectsTab: boolean;
  canEditSingle: boolean;
  onToggleEditMode: () => void;
  onClearSelection: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  onEditRole?: () => void;
}

export default function Toolbar({
  editMode,
  selectionCount,
  isProjectsTab,
  canEditSingle,
  onToggleEditMode,
  onClearSelection,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onEditRole,
}: ToolbarProps) {
  if (!editMode || selectionCount === 0) {
    return null;
  }

  return (
    <div className="bg-surface-container-low border-b border-outline-variant px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-on-surface-variant">
            {selectionCount} {isProjectsTab ? "proje" : "kullanıcı"} seçildi
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Temizle
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isProjectsTab ? (
            <>
              {canEditSingle && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 border border-outline rounded-lg text-sm text-primary hover:bg-surface-container-high transition-colors"
                >
                  Düzenle
                </button>
              )}
              <button
                onClick={onArchive || onRestore}
                className="px-3 py-1.5 border border-outline rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                {onRestore ? "Geri Al" : "Arşivle"}
              </button>
            </>
          ) : (
            <>
              {selectionCount === 1 && (
                <button
                  onClick={onEditRole}
                  className="px-3 py-1.5 border border-primary rounded-lg text-sm text-primary hover:bg-primary-container transition-colors"
                >
                  Rol Değiştir
                </button>
              )}
              <button
                onClick={onArchive}
                className="px-3 py-1.5 border border-outline rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Arşivle
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 border border-red-500 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Tüm Verileri Sil
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}









