"use client";

interface TeamMember {
  username: string;
  displayName: string;
  project: string;
  hasTarget: boolean;
}

interface TeamMemberCardProps {
  teamMembers: TeamMember[];
  date: string;
}

export default function TeamMemberCard({
  teamMembers,
  date,
}: TeamMemberCardProps) {
  if (!teamMembers || teamMembers.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-container p-6 rounded-lg border border-outline-variant">
      <h3 className="text-lg font-semibold text-on-surface mb-4">
        Aynı Projede Çalışan Takım Üyeleri
      </h3>
      <div className="space-y-2">
        {teamMembers.map((member) => (
          <div
            key={member.username}
            className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                <span className="text-primary text-sm">👤</span>
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {member.displayName}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {member.project}
                </p>
              </div>
            </div>
            {member.hasTarget ? (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                Hedef Var
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                Hedef Yok
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}







