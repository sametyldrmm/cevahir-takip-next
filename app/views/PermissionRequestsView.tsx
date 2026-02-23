"use client";

import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { permissionRequestsApi, PermissionRequest, CreatePermissionRequestDto, PermissionRequestType, PermissionRequestStatus } from "@/lib/api/permission-requests";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { formatDate, formatDateTime } from "@/lib/date-time";

export default function PermissionRequestsView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRequest, setNewRequest] = useState<CreatePermissionRequestDto>({
    type: PermissionRequestType.LEAVE,
    title: "",
    description: "",
  });
  const getApiErrorMessage = (error: unknown) => {
    if (isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return undefined;
  };

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await permissionRequestsApi.getAll();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load permission requests:", error);
      showError("İzin istekleri yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!newRequest.title.trim()) {
        showError("Başlık gereklidir");
        return;
      }

      await permissionRequestsApi.create(newRequest);
      showSuccess("İzin isteği başarıyla oluşturuldu");
      setShowCreateDialog(false);
      setNewRequest({
        type: PermissionRequestType.LEAVE,
        title: "",
        description: "",
      });
      loadRequests();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "İzin isteği oluşturulamadı");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await permissionRequestsApi.update(id, {
        status: PermissionRequestStatus.APPROVED,
      });
      showSuccess("İzin isteği onaylandı");
      loadRequests();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "İzin isteği onaylanamadı");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      if (!reason.trim()) {
        showError("Red nedeni gereklidir");
        return;
      }

      await permissionRequestsApi.update(id, {
        status: PermissionRequestStatus.REJECTED,
        rejectionReason: reason,
      });
      showSuccess("İzin isteği reddedildi");
      loadRequests();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "İzin isteği reddedilemedi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu izin isteğini silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      await permissionRequestsApi.delete(id);
      showSuccess("İzin isteği silindi");
      loadRequests();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "İzin isteği silinemedi");
    }
  };

  const getStatusColor = (status: PermissionRequestStatus) => {
    switch (status) {
      case PermissionRequestStatus.APPROVED:
        return "bg-success/20 text-success";
      case PermissionRequestStatus.REJECTED:
        return "bg-error/20 text-error";
      default:
        return "bg-warning/20 text-warning";
    }
  };

  const getStatusLabel = (status: PermissionRequestStatus) => {
    switch (status) {
      case PermissionRequestStatus.APPROVED:
        return "Onaylandı";
      case PermissionRequestStatus.REJECTED:
        return "Reddedildi";
      default:
        return "Beklemede";
    }
  };

  const getTypeLabel = (type: PermissionRequestType) => {
    switch (type) {
      case PermissionRequestType.LEAVE:
        return "İzin";
      case PermissionRequestType.ACCESS:
        return "Erişim";
      default:
        return "Diğer";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">İzin İstekleri</h1>
          <p className="text-base text-on-surface-variant">
            İzin isteklerinizi görüntüleyin ve yönetin
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-(--primary)/90 transition-colors"
          >
            Yeni İzin İsteği
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-on-surface-variant">Yükleniyor...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-surface-container p-8 rounded-xl border border-outline-variant text-center">
          <p className="text-on-surface-variant">Henüz izin isteği bulunmamaktadır</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-on-surface">{request.title}</h3>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-medium bg-primary-container text-primary">
                      {getTypeLabel(request.type)}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-2">
                    <span className="font-medium">Kullanıcı:</span> {request.user.displayName || request.user.username}
                  </p>
                  {request.description && (
                    <p className="text-sm text-on-surface-variant mb-2">{request.description}</p>
                  )}
                  {request.startDate && request.endDate && (
                    <p className="text-sm text-on-surface-variant">
                      <span className="font-medium">Tarih:</span>{" "}
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                  )}
                  {request.rejectionReason && (
                    <p className="text-sm text-error mt-2">
                      <span className="font-medium">Red Nedeni:</span> {request.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isAdmin && request.status === PermissionRequestStatus.PENDING && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="px-4 py-2 bg-success text-on-success rounded-lg text-sm font-medium hover:bg-(--success)/90 transition-colors"
                      >
                        Onayla
                      </button>
                      <RejectDialog
                        onReject={(reason) => handleReject(request.id, reason)}
                      />
                    </>
                  )}
                  {!isAdmin && request.status === PermissionRequestStatus.PENDING && (
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="px-4 py-2 bg-error text-on-error rounded-lg text-sm font-medium hover:bg-(--error)/90 transition-colors"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs text-on-surface-variant">
                Oluşturulma: {formatDateTime(request.createdAt)}
                {request.reviewedBy && (
                  <> | İnceleyen: {request.reviewedBy.displayName || request.reviewedBy.username}</>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreatePermissionRequestDialog
          request={newRequest}
          onRequestChange={setNewRequest}
          onSave={handleCreate}
          onCancel={() => {
            setShowCreateDialog(false);
            setNewRequest({
              type: PermissionRequestType.LEAVE,
              title: "",
              description: "",
            });
          }}
        />
      )}
    </div>
  );
}

function RejectDialog({ onReject }: { onReject: (reason: string) => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="px-4 py-2 bg-error text-on-error rounded-lg text-sm font-medium hover:bg-(--error)/90 transition-colors"
      >
        Reddet
      </button>
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-on-surface mb-4">İzin İsteğini Reddet</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Red nedeni..."
              className="w-full p-3 border border-outline-variant rounded-lg bg-surface text-on-surface mb-4"
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setReason("");
                }}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm font-medium hover:bg-(--surface-container-highest) transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  onReject(reason);
                  setShowDialog(false);
                  setReason("");
                }}
                className="px-4 py-2 bg-error text-on-error rounded-lg text-sm font-medium hover:bg-(--error)/90 transition-colors"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreatePermissionRequestDialog({
  request,
  onRequestChange,
  onSave,
  onCancel,
}: {
  request: CreatePermissionRequestDto;
  onRequestChange: (request: CreatePermissionRequestDto) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Yeni İzin İsteği</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Tür</label>
            <select
              value={request.type}
              onChange={(e) => onRequestChange({ ...request, type: e.target.value as PermissionRequestType })}
              className="w-full p-3 border border-outline-variant rounded-lg bg-surface text-on-surface"
            >
              <option value={PermissionRequestType.LEAVE}>İzin</option>
              <option value={PermissionRequestType.ACCESS}>Erişim</option>
              <option value={PermissionRequestType.OTHER}>Diğer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Başlık *</label>
            <input
              type="text"
              value={request.title}
              onChange={(e) => onRequestChange({ ...request, title: e.target.value })}
              placeholder="İzin isteği başlığı"
              className="w-full p-3 border border-outline-variant rounded-lg bg-surface text-on-surface"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Açıklama</label>
            <textarea
              value={request.description || ""}
              onChange={(e) => onRequestChange({ ...request, description: e.target.value })}
              placeholder="İzin isteği açıklaması"
              className="w-full p-3 border border-outline-variant rounded-lg bg-surface text-on-surface"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                value={request.startDate || ""}
                onChange={(e) => onRequestChange({ ...request, startDate: e.target.value })}
                className="w-full p-3 border border-outline-variant rounded-lg bg-surface text-on-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                value={request.endDate || ""}
                onChange={(e) => onRequestChange({ ...request, endDate: e.target.value })}
                className="w-full p-3 border border-outline-variant rounded-lg bg-surface text-on-surface"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm font-medium hover:bg-(--surface-container-highest) transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-(--primary)/90 transition-colors"
          >
            Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}


