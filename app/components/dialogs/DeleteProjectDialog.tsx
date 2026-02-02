"use client";

interface Project {
  id: string;
  name: string;
  category?: string;
}

interface DeleteProjectDialogProps {
  isOpen: boolean;
  projects: Project[];
  onClose: () => void;
  onProjectsDeleted: (deletedIds: string[]) => void;
}

export default function DeleteProjectDialog({
  isOpen,
  projects,
  onClose,
  onProjectsDeleted,
}: DeleteProjectDialogProps) {
  if (!isOpen) return null;

  const isMultiple = projects.length > 1;
  const categoryLabels: Record<string, string> = {
    turkiye: "🇹🇷",
    international: "🌍",
    special: "⭐",
    visualization: "🎨",
  };

  const handleDelete = () => {
    // Mock: Gerçek implementasyonda API çağrısı yapılacak
    const deletedIds = projects.map((p) => p.id);
    onProjectsDeleted(deletedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-error/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-error">
            {isMultiple ? "Projeleri Sil" : "Projeyi Sil"}
          </h3>
        </div>

        <p className="text-sm text-on-surface-variant mb-4">
          {isMultiple
            ? "⚠️ TEHLİKELİ İŞLEM! Bu işlem geri alınamaz. Seçilen projeler ve tüm verileri kalıcı olarak silinecek."
            : "⚠️ TEHLİKELİ İŞLEM! Bu işlem geri alınamaz. Seçilen proje ve tüm verileri kalıcı olarak silinecek."}
        </p>

        <div className="mb-4">
          <p className="text-sm font-medium text-on-surface mb-2">
            {isMultiple ? "Silinecek Projeler:" : "Silinecek Proje:"}
          </p>
          <div
            className={`space-y-2 ${
              projects.length > 3 ? "max-h-48 overflow-y-auto" : ""
            }`}
          >
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-2 p-2 bg-surface-container-low border border-outline-variant rounded"
              >
                <span className="text-sm">📁</span>
                <span className="text-sm font-medium text-on-surface flex-1">
                  {project.name}
                </span>
                {project.category && (
                  <span className="text-xs px-2 py-1 bg-surface-container rounded text-on-surface-variant">
                    {categoryLabels[project.category] || project.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-all font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 bg-error text-on-error rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            {isMultiple ? "Projeleri Sil" : "Projeyi Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

