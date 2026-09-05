import { requireUser } from "@/lib/auth";
import { levelFromXp } from "@/lib/metrics";
import { Dock } from "@/components/shell/Dock";
import { Topbar } from "@/components/shell/Topbar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const level = levelFromXp(user.lifetime_points);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        name={user.name}
        avatarUrl={user.avatar_url}
        level={level.level}
        title={level.title}
      />
      <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pb-32 lg:px-8 lg:pb-32 lg:pt-6">
        {children}
      </main>
      <Dock />
    </div>
  );
}
