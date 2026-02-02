"use client";

interface UserViewProps {
  userProjects: string[];
  targets: Array<{
    username: string;
    displayName: string;
    projectTargets: Array<{
      projectId: string;
      projectName: string;
      taskContent: string;
      goalStatus: string;
    }>;
  }>;
}

export function UserView({ userProjects, targets }: UserViewProps) {
  if (userProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-6xl mb-4">📋</span>
        <h3 className="text-lg font-semibold text-on-surface mb-2">
          Takım takibi için önce bir hedef girmelisiniz
        </h3>
        <p className="text-sm text-on-surface-variant text-center">
          Hedef girişi yaptıktan sonra burada takım arkadaşlarınızın hedeflerini
          görebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant">
        <h3 className="text-base font-bold text-on-surface mb-2">
          Çalıştığınız Projeler:
        </h3>
        <p className="text-sm text-primary font-medium">
          {userProjects.join(", ")}
        </p>
      </div>

      <div className="space-y-3">
        {targets.map((target, index) => (
          <div
            key={index}
            className="p-4 bg-surface-container rounded-lg border border-outline-variant"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">👤</span>
              <span className="text-sm font-bold text-on-surface">
                {target.displayName}
              </span>
            </div>
            {target.projectTargets.map((pt, ptIndex) => (
              <div
                key={ptIndex}
                className="ml-6 p-2 bg-surface-container-low rounded mb-2"
              >
                <div className="text-sm font-medium text-on-surface">
                  {pt.projectName}
                </div>
                <div className="text-sm text-on-surface-variant">
                  {pt.taskContent}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProjectViewProps {
  selectedProjects: string[];
  targets: Array<{
    username: string;
    displayName: string;
    projectTargets: Array<{
      projectId: string;
      projectName: string;
      taskContent: string;
      goalStatus: string;
    }>;
  }>;
}

export function ProjectView({ selectedProjects, targets }: ProjectViewProps) {
  if (selectedProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-6xl mb-4">📁</span>
        <h3 className="text-lg font-semibold text-on-surface mb-2">
          Proje Seçin
        </h3>
        <p className="text-sm text-on-surface-variant text-center">
          Takım hedeflerini görmek için bir proje seçin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedProjects.map((projectId) => {
        const projectTargets = targets.filter((t) =>
          t.projectTargets.some((pt) => pt.projectId === projectId)
        );

        return (
          <div
            key={projectId}
            className="p-4 bg-surface-container rounded-lg border border-outline-variant"
          >
            <h3 className="text-lg font-semibold text-on-surface mb-3">
              {projectTargets[0]?.projectTargets.find(
                (pt) => pt.projectId === projectId
              )?.projectName || projectId}
            </h3>
            <div className="space-y-2">
              {projectTargets.map((target, index) => (
                <div
                  key={index}
                  className="p-3 bg-surface-container-low rounded border border-outline-variant"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">👤</span>
                    <span className="text-sm font-medium text-on-surface">
                      {target.displayName}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {target.projectTargets.find(
                      (pt) => pt.projectId === projectId
                    )?.taskContent}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}







