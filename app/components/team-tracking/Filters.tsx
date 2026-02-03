"use client";

interface Project {
  id: string;
  name: string;
  category: string;
}

interface FiltersProps {
  folders: Array<{ id: string; name: string; projects: string[] }>;
  selectedFolder: string;
  onFolderSelect: (folderId: string) => void;
  selectedProjects: string[];
  onSelectAll: () => void;
  onClearAll: () => void;
  projects: Project[];
}

export default function Filters({
  folders,
  selectedFolder,
  onFolderSelect,
  selectedProjects,
  onSelectAll,
  onClearAll,
  projects,
}: FiltersProps) {
  return (
    <div className="bg-surface-container p-4 rounded-lg border border-outline-variant mb-4">
      <div className="flex items-center gap-4 mb-4">
        {folders.map((folder) => {
          const isSelected = selectedFolder === folder.id;
          const activeCount = projects.filter((p) =>
            folder.projects.includes(p.id)
          ).length;

          return (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                isSelected
                  ? "bg-selected-bg border-selected-border text-on-surface font-bold"
                  : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-medium">{folder.name}</div>
                <div className="text-xs px-2 py-1 bg-surface-container-high rounded mt-1">
                  {activeCount} projects
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onSelectAll}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity"
        >
          Select All
        </button>
        <button
          onClick={onClearAll}
          className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container transition-colors"
        >
          Clear
        </button>
        <span className="text-sm text-on-surface-variant ml-auto">
          {selectedProjects.length} proje seçildi
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {projects
          .filter((p) =>
            folders
              .find((f) => f.id === selectedFolder)
              ?.projects.includes(p.id)
          )
          .map((project) => {
            const isSelected = selectedProjects.includes(project.id);
            return (
              <button
                key={project.id}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container-high"
                }`}
              >
                {project.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}









