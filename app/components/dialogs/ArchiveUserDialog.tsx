"use client";

interface ArchiveUserDialogUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
}

interface ArchiveUserDialogProps {
  isOpen: boolean;
  users: ArchiveUserDialogUser[];
  onClose: () => void;
  onUsersArchived: (archivedIds: string[]) => void;
}

export default function ArchiveUserDialog({
  isOpen,
  users,
  onClose,
  onUsersArchived,
}: ArchiveUserDialogProps) {
  if (!isOpen) return null;

  const isMultiple = users.length > 1;

  const handleArchive = () => {
    const archivedIds = users.map((u) => u.id);
    onUsersArchived(archivedIds);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6 flex-none">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">
            {isMultiple ? "Kullanıcıları Arşivle" : "Kullanıcıyı Arşivle"}
          </h3>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <p className="text-sm text-on-surface-variant mb-4">
            {isMultiple
              ? "Seçilen kullanıcılar arşivlenecek. Kullanıcılar giriş yapamaz, ancak geçmiş veriler korunur."
              : "Seçilen kullanıcı arşivlenecek. Kullanıcı giriş yapamaz, ancak geçmiş veriler korunur."}
          </p>

          <div className="mb-4">
            <p className="text-sm font-medium text-on-surface mb-2">
              {isMultiple ? "Arşivlenecek Kullanıcılar:" : "Arşivlenecek Kullanıcı:"}
            </p>
            <div className={`space-y-2 ${users.length > 5 ? "max-h-48 overflow-y-auto" : ""}`}>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant rounded-lg"
                >
                  <span className="text-base">🧑‍💼</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {user.displayName?.trim() ? user.displayName : user.username}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {user.email?.trim() ? user.email : user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant flex-none">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleArchive}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            {isMultiple ? "Kullanıcıları Arşivle" : "Kullanıcıyı Arşivle"}
          </button>
        </div>
      </div>
    </div>
  );
}

