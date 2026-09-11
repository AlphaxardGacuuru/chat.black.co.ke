import { Download } from "lucide-react"
import { useEffect, useState } from "react"
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
import { useIsMobile } from "@/hooks/use-mobile"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import toast from "@/lib/toast"

let hasPromptedForPwaInstallThisVisit = false

export default function PwaInstallModal() {
	const isMobile = useIsMobile()
	const { canInstall, install, isInstalled } = usePwaInstall()

	const [open, setOpen] = useState(false)
	const [processing, setProcessing] = useState(false)

	useEffect(() => {
		if (hasPromptedForPwaInstallThisVisit || isInstalled || !isMobile || !canInstall) {
			return
		}

		hasPromptedForPwaInstallThisVisit = true
		setOpen(true)
	}, [isMobile, canInstall, isInstalled])

	async function handleInstall() {
		setProcessing(true)

		try {
			const accepted = await install()

			if (accepted) {
				toast.success("App installed", {
					description: "Black Chat is now available from your home screen.",
				})
			}
		} finally {
			setProcessing(false)
			setOpen(false)
		}
	}

	function handleSkip() {
		setOpen(false)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					handleSkip()
				}
			}}>
			<DialogContent className="sm:max-w-sm">
				<div className="flex flex-col items-center gap-4 pt-2 text-center">
					<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Download className="size-8 text-primary" />
					</div>
					<DialogHeader className="items-center gap-2">
						<DialogTitle>Get App</DialogTitle>
						<DialogDescription>
							Install the app for quick access from your home screen and a
							window of its own.
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
						Get App
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
