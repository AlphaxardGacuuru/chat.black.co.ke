import { Archive, Inbox, Send, Star, Tag, Trash2 } from "lucide-react"
import { Link } from "@/components/ui/link"
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
import { useCurrentUrl } from "@/hooks/use-current-url"
import { useLabels } from "@/queries/chat"

const FOLDERS = [
	{ href: "/chat", label: "Inbox", icon: Inbox },
	{ href: "/chat/starred", label: "Starred", icon: Star },
	{ href: "/chat/sent", label: "Sent", icon: Send },
	{ href: "/chat/archive", label: "Archive", icon: Archive },
	{ href: "/chat/trash", label: "Trash", icon: Trash2 },
]

export function ChatNav() {
	const { isCurrentUrl } = useCurrentUrl()
	const { data: labels } = useLabels()
	const { isMobile, setOpen, setOpenMobile } = useSidebar()

	function closeSidebar(): void {
		if (isMobile) {
			setOpenMobile(false)
			return
		}

		setOpen(false)
	}

	return (
		<SidebarGroup className="px-2 py-0">
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{FOLDERS.map((folder) => (
					<SidebarMenuItem key={folder.href}>
						<SidebarMenuButton
							asChild
							isActive={isCurrentUrl(folder.href)}
							tooltip={folder.label}>
							<Link
								href={folder.href}
								onClick={closeSidebar}>
								<folder.icon />
								<span>{folder.label}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}

				{labels?.map((label) => (
					<SidebarMenuItem key={label.id}>
						<SidebarMenuButton
							asChild
							isActive={isCurrentUrl(`/chat/labels/${label.id}`)}
							tooltip={label.name}>
							<Link
								href={`/chat/labels/${label.id}`}
								onClick={closeSidebar}>
								<Tag style={label.color ? { color: label.color } : undefined} />
								<span>{label.name}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
