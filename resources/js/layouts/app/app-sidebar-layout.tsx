import { useLocation } from "@tanstack/react-router"
import { AppBottomNav } from "@/components/app-bottom-nav"
import { AppContent } from "@/components/app-content"
import { AppShell } from "@/components/app-shell"
import { AppSidebar } from "@/components/app-sidebar"
import { AppSidebarHeader } from "@/components/app-sidebar-header"
import { shouldHideBottomNav } from "@/lib/bottom-nav"
import { cn } from "@/lib/utils"
import type { AppLayoutProps } from "@/types"

export default function AppSidebarLayout({
	children,
	breadcrumbs = [],
}: AppLayoutProps) {
	const { pathname } = useLocation()
	const hideBottomNav = shouldHideBottomNav(pathname)

	return (
		<AppShell variant="sidebar">
			<AppSidebar />
			<AppContent
				variant="sidebar"
				className={cn("bg-transparent md:pb-0", hideBottomNav ? "pb-0" : "pb-24")}>
				<AppSidebarHeader breadcrumbs={breadcrumbs} variant="floating" />
				<div className="flex flex-1 flex-col gap-4 overflow-x-hidden p-4">{children}</div>
			</AppContent>
			<AppBottomNav />
		</AppShell>
	)
}
