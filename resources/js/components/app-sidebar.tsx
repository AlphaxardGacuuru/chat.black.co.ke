import { Link } from "@/components/ui/link"
import { Download, MessageSquare } from "lucide-react"
import { AdminNav } from "@/components/admin/AdminNav"
import AppLogo from "@/components/app-logo"
import AutoPushPrompt from "@/components/auto-push-prompt"
import { NavFooter } from "@/components/nav-footer"
import { NavNotifications } from "@/components/nav-notifications"
import { NavUser } from "@/components/nav-user"
import { useApp } from "@/contexts/AppContext"
import { useCurrentUrl } from "@/hooks/use-current-url"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { ADMIN_EMAIL } from "@/middleware/auth"
import { toUrl } from "@/lib/utils"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
const HOME_URL = "/chats"
import type { NavItem } from "@/types"

export const mainNavItems: NavItem[] = [
	{
		title: "Chats",
		href: "/chats",
		icon: MessageSquare,
	},
]

const footerNavItems: NavItem[] = [
	{
		title: "Get App",
		href: "/get-app",
		icon: Download,
	},
]

export function AppSidebar() {
	const { state } = useSidebar()
	const { isInstalled } = usePwaInstall()
	const { auth } = useApp()
	const { isCurrentUrl } = useCurrentUrl()
	const isAdmin = auth?.email === ADMIN_EMAIL

	return (
		<Sidebar
			side="left"
			collapsible="icon"
			variant="floating">
			<AutoPushPrompt />

			<SidebarHeader>
				<div className="flex items-center">
					<SidebarMenu className="min-w-0 flex-1">
						<SidebarMenuItem>
							<SidebarMenuButton
								size="xl"
								asChild>
								<Link href={HOME_URL}>
									{state === "collapsed" ? (
										<AppLogo variant="icon" className="h-8" />
									) : (
										<AppLogo />
									)}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup className="px-2 py-0">
					<SidebarMenu>
						{mainNavItems.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									isActive={isCurrentUrl(item.href)}
									tooltip={item.title}>
									<Link href={toUrl(item.href)}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
				{isAdmin && <AdminNav />}
			</SidebarContent>

			<SidebarFooter>
				{!isInstalled && (
					<NavFooter
						items={footerNavItems}
						className="mt-auto"
					/>
				)}
				<NavNotifications />
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	)
}
