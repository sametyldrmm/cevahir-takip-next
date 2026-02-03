"use client";

import { useState } from "react";

interface Project {
  id: string;
  name: string;
}

interface FormComponentsProps {
  projects: Project[];
  selectedProjects: string[];
  onProjectToggle: (projectId: string) => void;
  customProject: string;
  onCustomProjectChange: (value: string) => void;
}

export default function FormComponents({
  projects,
  selectedProjects,
  onProjectToggle,
  customProject,
  onCustomProjectChange,
}: FormComponentsProps) {
  const showCustomProject = selectedProjects.includes("other");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-on-surface mb-2">
          Proje Seçimi
        </label>
        <div className="space-y-2 p-4 bg-surface-container-low rounded-lg border border-outline-variant">
          {projects.map((project) => (
            <label
              key={project.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-(--surface-container-high) p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedProjects.includes(project.id)}
                onChange={() => onProjectToggle(project.id)}
                className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-primary"
              />
              <span className="text-sm text-on-surface">{project.name}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer hover:bg-(--surface-container-high) p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={selectedProjects.includes("other")}
              onChange={() => onProjectToggle("other")}
              className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-primary"
            />
            <span className="text-sm text-on-surface">Diğer</span>
          </label>
        </div>
      </div>

      {showCustomProject && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-on-surface">
              Özel Proje Adı
            </label>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-2">
            <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
              ⚠️ Bu alan yalnızca tek günlük / kısa süreli işler için kullanılmalıdır.
              Uzun süreli projeleri buraya yazmayınız; ilgili birime bildirerek projeyi
              listeye ekletiniz.
            </p>
          </div>
          <input
            type="text"
            value={customProject}
            onChange={(e) => onCustomProjectChange(e.target.value)}
            placeholder="Özel proje adını girin"
            className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}









