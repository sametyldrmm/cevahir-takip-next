"use client";

interface Project {
  id: string;
  name: string;
  category?: string;
}

interface ArchiveProjectDialogProps {
  isOpen: boolean;
  projects: Project[];
  onClose: () => void;
  onProjectsArchived: (archivedIds: string[]) => void;
}

export default function ArchiveProjectDialog({
  isOpen,
  projects,
  onClose,
  onProjectsArchived,
}: ArchiveProjectDialogProps) {
  if (!isOpen) return null;

  const isMultiple = projects.length > 1;
  const categoryLabels: Record<string, string> = {
    turkiye: "🇹🇷",
    international: "🌍",
    special: "⭐",
    visualization: "🎨",
  };

  const handleArchive = () => {
    // Mock: Gerçek implementasyonda API çağrısı yapılacak
    const archivedIds = projects.map((p) => p.id);
    onProjectsArchived(archivedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">
            {isMultiple ? "Projeleri Arşivle" : "Projeyi Arşivle"}
          </h3>
        </div>

        <p className="text-sm text-on-surface-variant mb-4">
          {isMultiple
            ? "Seçilen projeler arşivlenecek. Tüm veriler dashboard, takım takibi, hedef girişi ve Excel export'larında korunacak."
            : "Seçilen proje arşivlenecek. Tüm veriler dashboard, takım takibi, hedef girişi ve Excel export'larında korunacak."}
        </p>

        <div className="mb-4">
          <p className="text-sm font-medium text-on-surface mb-2">
            {isMultiple ? "Arşivlenecek Projeler:" : "Arşivlenecek Proje:"}
          </p>
          <div
            className={`space-y-2 ${
              projects.length > 5 ? "max-h-48 overflow-y-auto" : ""
            }`}
          >
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant rounded-lg"
              >
                <span className="text-base">📁</span>
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
            onClick={handleArchive}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            {isMultiple ? "Projeleri Arşivle" : "Projeyi Arşivle"}
          </button>
        </div>
      </div>
    </div>
  );
}

