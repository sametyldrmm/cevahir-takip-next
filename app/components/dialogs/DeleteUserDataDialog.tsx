"use client";

interface DeleteUserDataDialogProps {
  isOpen: boolean;
  userIds: string[];
  usernames: string[];
  recordCounts?: Record<string, number>;
  onClose: () => void;
  onUserDataDeleted: (deletedUserIds: string[]) => void;
}

export default function DeleteUserDataDialog({
  isOpen,
  userIds,
  usernames,
  recordCounts = {},
  onClose,
  onUserDataDeleted,
}: DeleteUserDataDialogProps) {
  if (!isOpen) return null;

  const isMultiple = userIds.length > 1;
  const totalRecords = usernames.reduce(
    (sum, username) => sum + (recordCounts[username] || 0),
    0
  );

  const handleDelete = () => {
    onUserDataDeleted(userIds);
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
            {isMultiple ? "Kullanıcı Verilerini Sil" : "Kullanıcı Verisini Sil"}
          </h3>
        </div>

        <p className="text-sm text-on-surface-variant mb-4">
          {isMultiple
            ? "⚠️ TEHLİKELİ İŞLEM! Bu işlem geri alınamaz. Seçilen kullanıcıların tüm verileri kalıcı olarak silinecek."
            : "⚠️ TEHLİKELİ İŞLEM! Bu işlem geri alınamaz. Seçilen kullanıcının tüm verileri kalıcı olarak silinecek."}
        </p>

        <div className="mb-4">
          <p className="text-sm font-medium text-on-surface mb-2">
            {isMultiple ? "Silinecek Kullanıcılar:" : "Silinecek Kullanıcı:"}
          </p>
          <div className="space-y-2">
            {usernames.map((username) => (
              <div
                key={username}
                className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <span className="text-sm font-medium text-on-surface">
                    {username}
                  </span>
                </div>
                {recordCounts[username] !== undefined && (
                  <span className="text-xs px-2 py-1 bg-surface-container rounded text-on-surface-variant">
                    {recordCounts[username]} kayıt
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {totalRecords > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Toplam {totalRecords} kayıt</strong> silinecek
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 bg-error text-on-error rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            {isMultiple ? "Kullanıcıları Sil" : "Kullanıcıyı Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

