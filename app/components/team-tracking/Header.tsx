"use client";

export default function TeamTrackingHeader() {
  return (
    <div className="bg-surface-container p-5 rounded-xl border border-outline-variant mb-5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
          <span className="text-primary text-xl">👥</span>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-on-surface mb-1">
            Takım Takibi
          </h2>
          <p className="text-sm text-on-surface-variant">
            Klasör seçin ve proje kartlarından takım arkadaşlarınızı takip edin
          </p>
        </div>
      </div>
    </div>
  );
}







