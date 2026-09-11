import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NoInternet() {
	return (
		<div className="relative isolate flex min-h-[calc(100vh-8rem)] flex-1 items-center justify-center overflow-hidden rounded-2xl border bg-secondary px-6 py-16 text-secondary-foreground shadow-sm sm:px-10">
			<div className="absolute inset-0 -z-10 opacity-20 bg-[linear-gradient(135deg,transparent_25%,currentColor_25%,currentColor_26%,transparent_26%,transparent_50%,currentColor_50%,currentColor_51%,transparent_51%)] bg-size-[2rem_2rem]" />
			<div className="relative z-10 max-w-xl text-center">
				<div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10 shadow-lg shadow-black/20">
					<WifiOff className="size-10 text-primary" />
				</div>
				<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
					No internet connection
				</h1>
				<p className="mx-auto mt-5 max-w-lg text-base leading-7 text-secondary-foreground/75">
					Check your Wi-Fi or mobile data and try again.
				</p>
				<Button
					size="lg"
					className="mt-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
					onClick={() => window.location.reload()}>
					Retry
				</Button>
			</div>
		</div>
	)
}
