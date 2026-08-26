import { requireUser } from "@/lib/auth";
import { levelFromXp } from "@/lib/metrics";
import { MobileNav } from "@/components/shell/MobileNav";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const level = levelFromXp(user.lifetime_points);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={{
          name: user.name,
          username: user.username,
          avatarUrl: user.avatar_url,
          level: level.level,
          title: level.title,
          xpIntoLevel: level.xpIntoLevel,
          xpForNext: level.xpForNext,
          progress: level.progress,
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={user.name} avatarUrl={user.avatar_url} />
        <main className="flex-1 px-4 pb-28 lg:px-8 lg:pb-10 lg:pt-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
