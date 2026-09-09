import { Bell, Download } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useApp } from "@/contexts/AppContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import Axios from "@/lib/axios"
import toast from "@/lib/toast"

type PromptStage = "install" | "notifications"

export default function PermissionsOnboardingModal() {
	const { auth } = useApp()
	const queryClient = useQueryClient()
	const isMobile = useIsMobile()
	const { canInstall, install, isInstalled } = usePwaInstall()
	const { isSupported, permission, subscribe } = usePushNotifications()

	const [stage, setStage] = useState<PromptStage | null>(null)
	const [processing, setProcessing] = useState(false)
	const markedRef = useRef(false)

	const onboardedAt = auth?.settings?.permissionsOnboardedAt

	function markComplete() {
		if (markedRef.current) {
			return
		}
		markedRef.current = true

		Axios.post("api/onboarding/permissions").then(() => {
			queryClient.invalidateQueries({ queryKey: ["auth"] })
		})
	}

	useEffect(() => {
		if (!auth) {
			return
		}

		if (onboardedAt) {
			return
		}

		if (isMobile && !isInstalled && canInstall) {
			setStage("install")
			return
		}

		if (!isSupported || permission === "granted") {
			markComplete()
			setStage(null)
			return
		}

		setStage("notifications")
	}, [auth, onboardedAt, isInstalled, isMobile, canInstall, isSupported, permission])

	async function handleInstall() {
		setProcessing(true)

		try {
			const installed = await install()

			if (installed) {
				toast.success("Black Chat installed", {
					description: "You can launch it from your home screen anytime.",
				})
			}
		} finally {
			setProcessing(false)
			setStage(permission === "granted" ? null : "notifications")
		}
	}

	async function handleEnable() {
		setProcessing(true)

		try {
			const enabled = await subscribe()

			if (enabled) {
				toast.success("Notifications enabled", {
					description: "You'll get a native alert when new messages arrive.",
				})
				markComplete()
			} else if (permission === "denied") {
				toast.error("Notifications blocked", {
					description: "Allow notifications for this site in your browser settings.",
				})
			}
		} finally {
			setProcessing(false)
			setStage(null)
		}
	}

	function handleSkip() {
		if (stage === "install") {
			setStage(permission === "granted" ? null : "notifications")
			return
		}

		setStage(null)
	}

	const open = stage !== null

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					handleSkip()
				}
			}}>
			<DialogContent className="sm:max-w-sm">
				{stage === "install" ? (
					<div className="space-y-5">
						<div className="flex flex-col items-center gap-4 pt-2 text-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
								<Download className="size-8 text-primary" />
							</div>
							<DialogHeader className="items-center gap-2">
								<DialogTitle>Install Black Chat</DialogTitle>
								<DialogDescription>
									Add the app to your home screen for faster access, and then
									we&apos;ll ask about notifications.
								</DialogDescription>
							</DialogHeader>
						</div>
						<DialogFooter className="sm:justify-center">
							<Button
								type="button"
								variant="outline"
								disabled={processing}
								onClick={handleSkip}>
									Not now
								</Button>
							<Button
								type="button"
								disabled={processing}
								onClick={() => void handleInstall()}>
									{processing && <Spinner className="size-4" />}
									Install app
								</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="space-y-5">
						<div className="flex flex-col items-center gap-4 pt-2 text-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
								<Bell className="size-8 text-primary" />
							</div>
							<DialogHeader className="items-center gap-2">
								<DialogTitle>Enable notifications</DialogTitle>
								<DialogDescription>
									Enable notifications to get messages the moment they arrive,
									even when the app isn&apos;t open.
								</DialogDescription>
							</DialogHeader>
						</div>
						<DialogFooter className="sm:justify-center">
							<Button
								type="button"
								variant="outline"
								disabled={processing}
								onClick={handleSkip}>
									Not now
								</Button>
							<Button
								type="button"
								disabled={processing}
								onClick={() => void handleEnable()}>
									{processing && <Spinner className="size-4" />}
									Enable notifications
								</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
