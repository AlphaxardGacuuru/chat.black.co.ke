import { useEffect, useState } from "react"
import type { FC } from "react"
import AppLogo from "@/components/app-logo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard, GlassInner } from "@/components/ui/glass-card"
import ChatStatusIcon from "@/components/chat/ChatStatusIcon"
import { Link } from "@/components/ui/link"
import {
	ArrowRight,
	CheckCircle2,
	Globe,
	Image as ImageIcon,
	MessageCircle,
	MessagesSquare,
	Mic,
	Paperclip,
	Reply,
	Send,
	ShieldCheck,
	Smile,
	Sparkles,
	Zap,
} from "lucide-react"

type WelcomeProps = {
	canRegister?: boolean
}

type StatusLegendEntry = {
	isRead: boolean
	label: string
	description: string
}

const heroStatusLegend: StatusLegendEntry[] = [
	{ isRead: false, label: "Sent", description: "left your device" },
	{ isRead: true, label: "Read", description: "they've seen it" },
]

const fullStatusLegend: StatusLegendEntry[] = [
	{ isRead: false, label: "Sent", description: "Delivered the instant you hit send." },
	{ isRead: true, label: "Read", description: "Turns blue the moment they open it." },
]

const featureHighlights = [
	{
		icon: Zap,
		title: "Real-time, always",
		description:
			"Messages arrive over a live connection the instant they're sent — no refresh, no delay.",
	},
	{
		icon: ShieldCheck,
		title: "Know when they've read it",
		description:
			"A single gray tick means sent, a blue double tick means read — no guessing.",
	},
	{
		icon: MessageCircle,
		title: "See who's around",
		description:
			"Typing indicators and last-seen status keep you in sync with the other person.",
	},
	{
		icon: Globe,
		title: "Start any conversation",
		description:
			"Search for anyone on your team and start chatting in one tap — no setup required.",
	},
]

const workflowBenefits = [
	{ text: "Real-time delivery over a live websocket connection." },
	{ text: "Read receipts, so you always know when a message landed." },
	{ text: "Typing indicators and last-seen presence." },
	{ text: "Share photos and files right inside the conversation." },
]

const mockInbox = [
	{
		from: "Acme Corp",
		subject: "Can you review the Q3 proposal?",
		time: "9:41 AM",
		isRead: true,
	},
	{
		from: "Jordan Lee",
		subject: "Following up on yesterday's call",
		time: "8:15 AM",
		isRead: false,
	},
	{
		from: "Sam Rivera",
		subject: "Sent the files over 📎",
		time: "Yesterday",
		isRead: true,
	},
]

const Welcome: FC<WelcomeProps> = () => {
	const magnifyHoverClass =
		"transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.08]"

	const [isCoarsePointer, setIsCoarsePointer] = useState(false)
	const [cursor, setCursor] = useState({
		x: 0,
		y: 0,
		visible: false,
	})

	useEffect(() => {
		const media = window.matchMedia("(pointer: coarse)")

		const updatePointerMode = () => {
			setIsCoarsePointer(media.matches)
		}

		updatePointerMode()
		media.addEventListener("change", updatePointerMode)

		return () => {
			media.removeEventListener("change", updatePointerMode)
		}
	}, [])

	useEffect(() => {
		if (isCoarsePointer) {
			return
		}

		const handleMouseMove = (event: MouseEvent) => {
			setCursor({
				x: event.clientX,
				y: event.clientY,
				visible: true,
			})
		}

		const handleMouseLeave = () => {
			setCursor((previous) => ({ ...previous, visible: false }))
		}

		window.addEventListener("mousemove", handleMouseMove)
		document.addEventListener("mouseleave", handleMouseLeave)

		return () => {
			window.removeEventListener("mousemove", handleMouseMove)
			document.removeEventListener("mouseleave", handleMouseLeave)
		}
	}, [isCoarsePointer])

	return (
		<div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
			{!isCoarsePointer && (
				<div
					aria-hidden="true"
					className="pointer-events-none fixed z-50 hidden md:block border-white/80"
					style={{
						left: cursor.x,
						top: cursor.y,
						transform: "translate(-50%, -50%)",
						opacity: cursor.visible ? 0.8 : 0,
						transition:
							"left 420ms cubic-bezier(0.16,1,0.3,1), top 420ms cubic-bezier(0.16,1,0.3,1), opacity 320ms ease",
					}}>
					<div className="relative flex items-center justify-center">
						<div className="relative size-36 rounded-full border-2 border-white/70 bg-white/18 shadow-[0_30px_60px_-24px_rgba(15,23,42,0.75)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/35 dark:bg-slate-900/22">
							<div className="absolute -inset-3 rounded-full bg-white/22 blur-2xl dark:bg-white/12" />
							<div className="relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/26 text-center backdrop-blur-xl backdrop-saturate-200 dark:border-white/30 dark:bg-slate-900/20">
								<div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.78),transparent_42%),radial-gradient(circle_at_72%_72%,rgba(255,255,255,0.22),transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.35),transparent_55%)] dark:bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.34),transparent_42%),radial-gradient(circle_at_72%_72%,rgba(255,255,255,0.14),transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.18),transparent_55%)]" />
							</div>
							<div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white/24 backdrop-blur-sm dark:border-white/35 dark:bg-white/10" />
						</div>
					</div>
				</div>
			)}

			{/* START: Page Backdrop Elements */}
			<div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
				<div className="absolute -left-40 -top-28 h-80 w-80 rounded-full bg-primary/36 blur-3xl dark:bg-primary/28" />
				<div className="absolute -right-24 top-36 h-96 w-96 rounded-full bg-secondary/70 blur-3xl dark:bg-secondary/35" />
				<div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-foreground/18 blur-3xl dark:bg-foreground/12" />
				<div className="bg-motion-drift bg-motion-delay-1 absolute left-[43%] top-[7%] flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-[2.5rem] border border-white/60 bg-white/58 text-primary shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-white/10">
					<MessageCircle
						className="size-10"
						strokeWidth={1.5}
					/>
				</div>
				<div className="bg-motion-rotate bg-motion-delay-2 absolute right-[3%] top-[15%] flex h-20 w-20 rotate-12 items-center justify-center rounded-3xl border border-white/60 bg-secondary/85 text-secondary-foreground shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-secondary/40">
					<Send
						className="size-8 -rotate-12"
						strokeWidth={1.5}
					/>
				</div>
				<div className="bg-motion-float bg-motion-delay-3 absolute bottom-[38%] left-[36%] flex h-28 w-28 -rotate-12 items-center justify-center rounded-full border border-white/60 bg-primary/46 text-primary-foreground shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-primary/34">
					<MessagesSquare
						className="size-11 rotate-12"
						strokeWidth={1.5}
					/>
				</div>
				<div className="bg-motion-drift absolute bottom-[12%] right-[20%] flex h-32 w-32 items-center justify-center rounded-[3rem] border border-white/60 bg-secondary/60 text-secondary-foreground shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-secondary/25">
					<Paperclip
						className="size-12"
						strokeWidth={1.5}
					/>
				</div>
				{/* Brand Background Gradient Start */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,0,102,0.18),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(255,239,184,0.55),transparent_40%),linear-gradient(to_bottom,transparent,rgba(255,0,102,0.08),transparent)] dark:bg-[radial-gradient(circle_at_12%_10%,rgba(255,0,102,0.22),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(255,239,184,0.22),transparent_40%),linear-gradient(to_bottom,transparent,rgba(255,0,102,0.12),transparent)]" />
				{/* Brand Background Gradient End */}
				<div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.75)_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.12] dark:opacity-[0.05]" />
				<div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.32)_0%,transparent_30%,rgba(148,163,184,0.2)_50%,transparent_70%,rgba(255,255,255,0.22)_100%)] opacity-[0.26] dark:opacity-[0.12]" />
				<div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(15,23,42,0.1)_0_1px,transparent_1px_12px)] opacity-[0.5] dark:opacity-[0.12]" />
				<div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(15,23,42,0.1)_0_1px,transparent_1px_12px)] opacity-[0.5] dark:opacity-[0.12]" />
			</div>
			{/* END: Page Backdrop Elements */}

			{/* START: Header */}
			<header className="relative z-10 mx-auto flex max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
				<Link
					href="/"
					variant="unstyled"
					size="none">
					<AppLogo className="h-20 w-auto" />
				</Link>
			</header>
			{/* END: Header */}

			{/* START: Hero Section */}
			<section
				data-cursor-label="Chat overview"
				className="relative z-10 mx-auto max-w-7xl px-4 pb-18 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
				<div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
					<div className="space-y-8">
						<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary shadow-sm backdrop-blur-sm">
							<Sparkles className="size-4" />
							<span>Chat that tells you what happened</span>
						</div>

						<div className="space-y-5">
							<h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
								<span className="bg-linear-to-r from-primary via-foreground to-primary bg-clip-text text-transparent dark:via-white">
									Message instantly. Know when they've read it.
								</span>
							</h1>
							<p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
								Real-time chat built around one status icon that tells you
								exactly where every message stands, from your device to
								theirs.
							</p>
							<p className="max-w-xl text-base leading-7 text-muted-foreground/90">
								Every message arrives instantly and turns blue the moment
								they've opened it — no refreshing, no guessing.
							</p>
						</div>

						<div className="flex flex-wrap gap-3">
							<Link
								href="/register"
								variant="solid"
								size="lg"
								className={`capitalize shadow-lg shadow-primary/20 ${magnifyHoverClass}`}>
								start now
								<ArrowRight className="size-4" />
							</Link>
							<Link
								href="#platform"
								variant="outline"
								size="lg"
								className={`border-border/70 bg-background/70 backdrop-blur-sm ${magnifyHoverClass}`}>
								see how it works
							</Link>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							{heroStatusLegend.map((entry) => (
								<GlassCard
									key={entry.label}
									className={`p-4 ${magnifyHoverClass}`}>
									<div className="flex items-center gap-2">
										<ChatStatusIcon
											isRead={entry.isRead}
											className="size-4"
										/>
										<p className="text-sm font-semibold">{entry.label}</p>
									</div>
									<p className="mt-2 text-sm text-muted-foreground">
										{entry.description}
									</p>
								</GlassCard>
							))}
						</div>
					</div>

					<div
						className="relative"
						data-cursor-label="Live chat preview">
						{/* START: First Card Local Backdrop Elements */}
						<div className="pointer-events-none absolute -inset-x-8 -inset-y-10 z-0 overflow-visible">
							<div className="bg-motion-float bg-motion-delay-1 absolute left-[2%] top-[8%] flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-white/60 bg-white/62 text-foreground/70 shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-white/24">
								<Smile
									className="size-8"
									strokeWidth={1.5}
								/>
							</div>
							<div className="bg-motion-rotate bg-motion-delay-2 absolute -right-[2%] top-[14%] flex h-16 w-16 rotate-12 items-center justify-center rounded-2xl border border-white/60 bg-sky-200/66 text-sky-700 shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-sky-400/32 dark:text-sky-200">
								<Mic
									className="size-7 -rotate-12"
									strokeWidth={1.5}
								/>
							</div>
							<div className="bg-motion-drift bg-motion-delay-3 absolute bottom-[14%] left-[14%] flex h-24 w-24 -rotate-12 items-center justify-center rounded-full border border-white/60 bg-primary/48 text-primary-foreground shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-primary/36">
								<ImageIcon
									className="size-9 rotate-12"
									strokeWidth={1.5}
								/>
							</div>
							<div className="bg-motion-float absolute -bottom-[2%] right-[4%] flex h-24 w-24 items-center justify-center rounded-4xl border border-white/60 bg-slate-200/58 text-slate-700 shadow-lg backdrop-blur-sm dark:border-white/20 dark:bg-slate-300/26 dark:text-slate-800">
								<Reply
									className="size-9"
									strokeWidth={1.5}
								/>
							</div>
						</div>
						{/* END: First Card Local Backdrop Elements */}

						<Card
							className={`relative z-10 overflow-hidden ${magnifyHoverClass}`}>
							<CardHeader className="relative z-10 space-y-5 pb-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
											Live chats
										</p>
										<CardTitle className="mt-2 text-2xl">Chats</CardTitle>
									</div>
									<div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
										<MessagesSquare className="size-6" />
									</div>
								</div>
							</CardHeader>
							<CardContent className="relative z-10 space-y-3 pb-20">
								{mockInbox.map((message) => (
									<GlassInner
										key={message.subject}
										className="flex items-center gap-3 p-3">
										<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
											{message.from.slice(0, 2).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-2">
												<span className="truncate text-sm font-medium">
													{message.from}
												</span>
												<span className="shrink-0 text-xs text-muted-foreground">
													{message.time}
												</span>
											</div>
											<div className="flex items-center gap-1.5">
												<ChatStatusIcon
													isRead={message.isRead}
													className="size-3.5 shrink-0"
												/>
												<p className="truncate text-sm text-muted-foreground">
													{message.subject}
												</p>
											</div>
										</div>
									</GlassInner>
								))}
							</CardContent>
						</Card>

						<GlassCard
							className={`absolute -bottom-6 -left-6 z-20 hidden w-56 p-4 lg:block ${magnifyHoverClass}`}>
							<div className="flex items-start gap-3">
								<div className="rounded-2xl bg-primary/10 p-2 text-primary">
									<ShieldCheck className="size-5" />
								</div>
								<div>
									<p className="text-sm font-medium">Read receipt clarity</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Every status icon stays legible in both light and dark mode.
									</p>
								</div>
							</div>
						</GlassCard>
					</div>
				</div>
			</section>
			{/* END: Hero Section */}

			{/* START: Feature Highlights Section */}
			<section
				data-cursor-label="Read receipt intelligence"
				className="relative z-10 border-y border-white/25 bg-white/38 py-16 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/28">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						<p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">
							Everything Chat. One Conversation
						</p>
						<h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
							Designed around one question: did they see it?
						</h2>
						<p className="mt-4 text-lg leading-8 text-muted-foreground">
							Every message carries a status icon that answers that question at
							a glance, before you ever have to ask.
						</p>
					</div>

					<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
						<GlassCard className="group p-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.08] hover:shadow-lg">
							<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<Paperclip className="size-5" />
							</div>
							<h3 className="mt-5 text-lg font-semibold">
								Share on the go
							</h3>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">
								Drop in photos and files right inside the conversation, no
								separate upload flow.
							</p>
						</GlassCard>
						{featureHighlights.map(({ icon: Icon, title, description }) => (
							<GlassCard
								key={title}
								className="group p-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.08] hover:shadow-lg">
								<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<Icon className="size-5" />
								</div>
								<h3 className="mt-5 text-lg font-semibold">{title}</h3>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">
									{description}
								</p>
							</GlassCard>
						))}
					</div>
				</div>
			</section>
			{/* END: Feature Highlights Section */}

			{/* START: Platform Walkthrough Section */}
			<section
				data-cursor-label="Message status walkthrough"
				id="platform"
				className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
				<div className="mb-10 max-w-3xl">
					<p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">
						Platform walkthrough
					</p>
					<h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
						Every stage of a message, one status icon at a time.
					</h2>
					<p className="mt-4 text-lg leading-8 text-muted-foreground">
						No dashboards to dig through. The icon at the bottom-left of every
						message already tells the story.
					</p>
				</div>

				<Card className={`overflow-hidden ${magnifyHoverClass}`}>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="rounded-2xl bg-primary/10 p-3 text-primary">
								<ChatStatusIcon
									isRead={true}
									className="size-5"
								/>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
									Status legend
								</p>
								<CardTitle className="mt-1">From sent to read</CardTitle>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-2">
							{fullStatusLegend.map((entry) => (
								<GlassInner
									key={entry.label}
									className="p-4">
									<div className="flex items-center gap-2">
										<ChatStatusIcon
											isRead={entry.isRead}
											className="size-4"
										/>
										<p className="text-sm font-semibold">{entry.label}</p>
									</div>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">
										{entry.description}
									</p>
								</GlassInner>
							))}
						</div>
					</CardContent>
				</Card>

				<div className="mt-6 grid gap-6 lg:grid-cols-3">
					<Card className={`overflow-hidden ${magnifyHoverClass}`}>
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="rounded-2xl bg-primary/10 p-3 text-primary">
									<Zap className="size-5" />
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Realtime
									</p>
									<CardTitle className="mt-1">Instant delivery</CardTitle>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-6 text-muted-foreground">
								Messages travel over a live connection the moment you hit
								send — the other person sees it appear without refreshing.
							</p>
						</CardContent>
					</Card>

					<Card className={`overflow-hidden ${magnifyHoverClass}`}>
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="rounded-2xl bg-primary/10 p-3 text-primary">
									<ShieldCheck className="size-5" />
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Clarity
									</p>
									<CardTitle className="mt-1">Read receipts</CardTitle>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-6 text-muted-foreground">
								The tick turns blue the instant they open the conversation —
								no more wondering if they've seen it.
							</p>
						</CardContent>
					</Card>

					<Card className={`overflow-hidden ${magnifyHoverClass}`}>
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="rounded-2xl bg-primary/10 p-3 text-primary">
									<Globe className="size-5" />
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Presence
									</p>
									<CardTitle className="mt-1">Online &amp; typing</CardTitle>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-6 text-muted-foreground">
								See when someone's typing, and check their last-seen status
								when they're not around.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>
			{/* END: Platform Walkthrough Section */}

			{/* START: Closing CTA Section */}
			<section
				data-cursor-label="Get started"
				className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
				<Card
					className={`overflow-hidden bg-linear-to-br from-primary/18 via-white/52 to-white/36 shadow-xl dark:from-primary/20 dark:via-slate-950/40 dark:to-slate-950/28 ${magnifyHoverClass}`}>
					<CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
						<div>
							<p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">
								Everything in one inbox
							</p>
							<h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
								Chat instantly, and know exactly what happened next.
							</h2>
							<p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
								Whether it's a quick one-on-one or an ongoing back-and-forth,
								Black Chat gives you the status clarity to stop guessing and
								start knowing.
							</p>
							<div className="mt-6 grid gap-3 sm:grid-cols-2">
								{workflowBenefits.map((benefit) => (
									<GlassInner
										key={benefit.text}
										className={`flex items-start gap-3 p-4 ${magnifyHoverClass}`}>
										<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
										<p className="text-sm leading-6 text-foreground/90">
											{benefit.text}
										</p>
									</GlassInner>
								))}
							</div>
						</div>

						<div className="flex flex-col gap-3 lg:min-w-64">
							<Link
								href="/chat"
								variant="solid"
								size="lg"
								className={`w-full justify-center capitalize ${magnifyHoverClass}`}>
								open chats
								<ArrowRight className="size-4" />
							</Link>
							<Link
								href="#platform"
								variant="outline"
								size="lg"
								className={`w-full justify-center capitalize ${magnifyHoverClass}`}>
								review status icons
							</Link>
						</div>
					</CardContent>
				</Card>
			</section>
			{/* END: Closing CTA Section */}
		</div>
	)
}

export default Welcome
