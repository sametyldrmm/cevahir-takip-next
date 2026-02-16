"use client";

import { useState } from "react";

interface Project {
  id: string;
  name: string;
  category: string;
  description?: string;
  userCount?: number;
  targetCount?: number;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
  updatedAt?: string;
  archived?: boolean;
}

interface ProjectsTableProps {
  projects: Project[];
  editMode: boolean;
  selectedProjects: Set<string>;
  onProjectSelect: (projectId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onProjectClick?: (project: Project) => void;
}

export default function ProjectsTable({
  projects,
  editMode,
  selectedProjects,
  onProjectSelect,
  onSelectAll,
  onProjectClick,
}: ProjectsTableProps) {
  const allSelected = projects.length > 0 && projects.every((p) => selectedProjects.has(p.id));
  const someSelected = projects.some((p) => selectedProjects.has(p.id));

  const categoryLabels: Record<string, string> = {
    turkiye: "🇹🇷 Türkiye",
    international: "🌍 Uluslararası",
    special: "⭐ Özel",
    visualization: "🎨 Görselleştirme",
  };

  return (
    <div className="border border-outline-variant rounded-xl m-5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container-low px-5 py-3.5 border-b border-outline-variant">
        <div className="flex items-center gap-0">
          {editMode && (
            <div className="w-12 flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div className="w-[300px] text-xs font-semibold text-on-surface-variant">
            Project name
          </div>
          <div className="w-32 text-xs font-semibold text-on-surface-variant">
            Category
          </div>
          <div className="w-[250px] text-xs font-semibold text-on-surface-variant">
            Description
          </div>
          <div className="w-24 text-xs font-semibold text-on-surface-variant text-center">
            Users
          </div>
          <div className="w-24 text-xs font-semibold text-on-surface-variant text-center">
            Targets
          </div>
          <div className="w-32 text-xs font-semibold text-on-surface-variant">
            Status
          </div>
          <div className="w-40 text-xs font-semibold text-on-surface-variant">
            Updated
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="max-h-[600px] overflow-y-auto bg-surface">
        {projects.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            Proje bulunamadı
          </div>
        ) : (
          projects.map((project, index) => {
            const isSelected = selectedProjects.has(project.id);
            return (
              <div
                key={project.id}
                onClick={() => {
                  if (editMode) {
                    onProjectSelect(project.id, !isSelected);
                    return;
                  }
                  onProjectClick?.(project);
                }}
                className={`flex items-center gap-0 px-5 py-3.5 border-b border-outline-variant transition-all ${
                  isSelected
                    ? "bg-selected-bg border-l-4 border-l-primary"
                    : "hover:bg-(--surface-container-high)"
                } ${index === projects.length - 1 ? "border-b-0" : ""}`}
              >
                {editMode && (
                  <div className="w-12 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onProjectSelect(project.id, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                <div className="w-[300px] text-sm text-on-surface font-medium truncate">
                  {project.name}
                </div>
                <div className="w-32">
                  <span className="text-xs px-2 py-1 bg-surface-container-high rounded-lg text-on-surface-variant">
                    {categoryLabels[project.category] || project.category}
                  </span>
                </div>
                <div className="w-[250px] text-sm text-on-surface-variant truncate">
                  {project.description || "-"}
                </div>
                <div className="w-24 text-sm text-on-surface text-center font-medium">
                  {project.userCount !== undefined ? project.userCount : "-"}
                </div>
                <div className="w-24 text-sm text-on-surface text-center font-medium">
                  {project.targetCount !== undefined ? project.targetCount : "-"}
                </div>
                <div className="w-32">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      project.isActive && !project.archived
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}
                  >
                    {project.isActive && !project.archived ? "Aktif" : "Arşiv"}
                  </span>
                </div>
                <div className="w-40 text-sm text-on-surface-variant">
                  {project.updatedAt
                    ? new Date(project.updatedAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "-"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
