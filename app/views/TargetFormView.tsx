"use client";

import { useState, useEffect } from "react";
import { projectsApi, Project } from "@/lib/api/projects";
import { targetsApi, CreateTargetDto, GoalStatus, Target } from "@/lib/api/targets";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useDialog } from "@/app/components/dialogs";
import { Dialog } from "@/app/components/dialogs";

const GOAL_STATUS_MAP: Record<string, GoalStatus> = {
  "Belirlenmedi": "NOT_SET",
  "Hedefime ulaştım": "REACHED",
  "Hedefime kısmen ulaştım": "PARTIAL",
  "Hedefime ulaşamadım": "FAILED",
};

const GOAL_STATUS_REVERSE_MAP: Record<GoalStatus, string> = {
  NOT_SET: "Belirlenmedi",
  REACHED: "Hedefime ulaştım",
  PARTIAL: "Hedefime kısmen ulaştım",
  FAILED: "Hedefime ulaşamadım",
};

export default function TargetFormView() {
  const [selectedProject, setSelectedProject] = useState("");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskContent, setTaskContent] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [goalStatus, setGoalStatus] = useState("Belirlenmedi");
  const [block, setBlock] = useState("");
  const [floors, setFloors] = useState("");
  const [description, setDescription] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();
  const dialog = useDialog();

  // Projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const data = await projectsApi.getMyProjects();
        setProjects(data);
      } catch (error: any) {
        showError("Projeler yüklenirken bir hata oluştu");
        console.error("Projects load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [showError]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      showError("Lütfen bir proje seçin");
      return;
    }

    if (!taskContent.trim()) {
      showError("Lütfen iş içeriğini girin");
      return;
    }

    setIsSubmitting(true);

    try {
      const targetData: CreateTargetDto = {
        date: targetDate,
        projectId: selectedProject,
        taskContent: taskContent.trim(),
        block: block.trim() || undefined,
        floors: floors.trim() || undefined,
        goalStatus: GOAL_STATUS_MAP[goalStatus] || "NOT_SET",
        description: description.trim() || undefined,
        workStart: workStart || undefined,
        workEnd: workEnd || undefined,
        meetingStart: meetingStart || undefined,
        meetingEnd: meetingEnd || undefined,
      };

      // Yeni target oluştur
      await targetsApi.createTarget(targetData);
      showSuccess("Hedef başarıyla kaydedildi!");

      // Formu temizle
      setTaskContent("");
      setBlock("");
      setFloors("");
      setDescription("");
      setGoalStatus("Belirlenmedi");
      setWorkStart("");
      setWorkEnd("");
      setMeetingStart("");
      setMeetingEnd("");
      setSelectedProject("");
      // Tarihi bugüne ayarla
      setTargetDate(new Date().toISOString().split("T")[0]);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Hedef kaydedilirken bir hata oluştu";
      showError(message);
      console.error("Target save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-on-surface mb-2">Yeni Hedef Ekle</h2>
        <p className="text-on-surface-variant">
          Günlük hedef bilgilerinizi girin ve kaydedin
        </p>
      </div>

      {isLoading ? (
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm text-center">
          <p className="text-on-surface-variant">Projeler yükleniyor...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Proje <span className="text-error">*</span>
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              disabled={isSubmitting}
            >
              <option value="">Proje seçin</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.code ? `(${project.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Tarih <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              İş İçeriği <span className="text-error">*</span>
            </label>
            <textarea
              value={taskContent}
              onChange={(e) => setTaskContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
              placeholder="İş içeriğini girin"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Blok</label>
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Blok bilgisi"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Kat/Katlar
              </label>
              <input
                type="text"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Kat bilgisi"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Hedef Durumu
            </label>
            <select
              value={goalStatus}
              onChange={(e) => setGoalStatus(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              disabled={isSubmitting}
            >
              <option value="Belirlenmedi">Belirlenmedi</option>
              <option value="Hedefime ulaştım">Hedefime ulaştım</option>
              <option value="Hedefime kısmen ulaştım">Hedefime kısmen ulaştım</option>
              <option value="Hedefime ulaşamadım">Hedefime ulaşamadım</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Çalışma Başlangıç
              </label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Çalışma Bitiş
              </label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Toplantı Başlangıç
              </label>
              <input
                type="time"
                value={meetingStart}
                onChange={(e) => setMeetingStart(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Toplantı Bitiş
              </label>
              <input
                type="time"
                value={meetingEnd}
                onChange={(e) => setMeetingEnd(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
              placeholder="Ek açıklamalar"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary py-4 rounded-lg font-semibold hover:opacity-90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      )}

      <Dialog dialog={dialog.dialog} onClose={dialog.close} />
    </div>
  );
}
