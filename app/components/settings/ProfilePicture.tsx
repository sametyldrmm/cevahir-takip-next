"use client";

interface ProfilePictureProps {
  imageUrl?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProfilePicture({
  imageUrl,
  onEdit,
  onDelete,
}: ProfilePictureProps) {
  return (
    <div className="bg-surface-container p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-bold text-on-surface mb-1">
            Profil Resmi
          </label>
          <p className="text-xs text-on-surface-variant">
            Profil resminizi güncelleyin
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-container border-2 border-outline flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary text-3xl">👤</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2"
            >
              <span>✏️</span>
              <span>Düzenle</span>
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Sil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}







