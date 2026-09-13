/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { NetworkFirst, NetworkOnly } from "workbox-strategies"
import { ExpirationPlugin } from "workbox-expiration"
import { BackgroundSyncPlugin } from "workbox-background-sync"

// Every runtime-cached route below always tries the network first and only
// falls back to the cache when there's no connectivity — a slow-but-live
// response always wins over a fast-but-stale one. `networkTimeoutSeconds`
// keeps a flaky connection from hanging indefinitely before falling back.
const NETWORK_TIMEOUT_SECONDS = 4

declare const self: ServiceWorkerGlobalScope

// ─── Precache Vite build assets ───────────────────────────────────────────────
// The build manifest is injected here by vite-plugin-pwa at build time.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.skipWaiting()
self.addEventListener("activate", () => self.clients.claim())

// ─── Caching strategies ───────────────────────────────────────────────────────

// Static assets from the Vite build: network-first, falling back to the
// 30-day cache only when offline.
registerRoute(
	({ url }) =>
		url.origin === self.location.origin && url.pathname.startsWith("/build/"),
	new NetworkFirst({
		cacheName: "build-assets",
		networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
		plugins: [
			new ExpirationPlugin({
				maxEntries: 120,
				maxAgeSeconds: 30 * 24 * 60 * 60,
			}),
		],
	})
)

// Favicons and PWA icons: network-first, falling back to the 30-day cache
// only when offline.
registerRoute(
	({ url }) =>
		url.origin === self.location.origin &&
		/\.(png|ico|svg)$/.test(url.pathname),
	new NetworkFirst({
		cacheName: "static-icons",
		networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
		plugins: [
			new ExpirationPlugin({
				maxEntries: 20,
				maxAgeSeconds: 30 * 24 * 60 * 60,
			}),
		],
	})
)

// Web app manifest: network-first. A long-lived cache here would pin the
// app name/icons shown in the install prompt to whatever they were on the
// first visit, surviving rebrands for up to the cache's expiry.
registerRoute(
	({ url }) =>
		url.origin === self.location.origin &&
		url.pathname.endsWith(".webmanifest"),
	new NetworkFirst({
		cacheName: "webmanifest",
		networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
		plugins: [
			new ExpirationPlugin({
				maxEntries: 1,
				maxAgeSeconds: 24 * 60 * 60,
			}),
		],
	})
)

// Read API routes: network-first, falling back to the last-fetched response
// only when offline.
const NETWORK_FIRST_APIS = ["/api/notifications", "/api/chat/conversations"]

registerRoute(
	({ url }) =>
		url.origin === self.location.origin &&
		NETWORK_FIRST_APIS.some((prefix) => url.pathname.startsWith(prefix)),
	new NetworkFirst({
		cacheName: "api-network-first",
		networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
		plugins: [
			new ExpirationPlugin({
				maxEntries: 60,
				maxAgeSeconds: 5 * 60, // 5 minutes max staleness of the offline fallback
			}),
		],
	})
)

// Auth routes: always network-first, never serve stale data.
const NETWORK_ONLY_APIS = ["/api/auth", "/api/broadcasting"]

registerRoute(
	({ url }) =>
		url.origin === self.location.origin &&
		NETWORK_ONLY_APIS.some((prefix) => url.pathname.startsWith(prefix)),
	new NetworkFirst({
		cacheName: "api-auth",
		networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
	})
)

// ─── Background sync for mutation requests ────────────────────────────────────
// Queues PUT/DELETE/POST requests that fail due to lost connectivity and
// replays them automatically once the connection is restored.
const bgSyncPlugin = new BackgroundSyncPlugin("mutation-queue", {
	maxRetentionTime: 24 * 60, // Retry for up to 24 hours
})

registerRoute(
	({ url, request }) =>
		url.origin === self.location.origin &&
		url.pathname.startsWith("/api/") &&
		["PUT", "DELETE", "POST", "PATCH"].includes(request.method),
	new NetworkOnly({ plugins: [bgSyncPlugin] }),
	"PUT"
)

registerRoute(
	({ url, request }) =>
		url.origin === self.location.origin &&
		url.pathname.startsWith("/api/") &&
		["PUT", "DELETE", "POST", "PATCH"].includes(request.method),
	new NetworkOnly({ plugins: [bgSyncPlugin] }),
	"DELETE"
)

registerRoute(
	({ url, request }) =>
		url.origin === self.location.origin &&
		url.pathname.startsWith("/api/") &&
		["PUT", "DELETE", "POST", "PATCH"].includes(request.method),
	new NetworkOnly({ plugins: [bgSyncPlugin] }),
	"POST"
)

registerRoute(
	({ url, request }) =>
		url.origin === self.location.origin &&
		url.pathname.startsWith("/api/") &&
		["PUT", "DELETE", "POST", "PATCH"].includes(request.method),
	new NetworkOnly({ plugins: [bgSyncPlugin] }),
	"PATCH"
)

// ─── Web push notifications ───────────────────────────────────────────────────

type PushAction = { action: string; title: string }

type PushNotificationData = { url?: string; conversationId?: string }

type PushPayload = {
	title?: string
	body?: string
	icon?: string
	badge?: string
	tag?: string
	renotify?: boolean
	actions?: PushAction[]
	data?: PushNotificationData
}

self.addEventListener("push", (event) => {
	if (!event.data) {
		return
	}

	const payload: PushPayload = event.data.json()

	// `renotify` and `actions` are real, supported NotificationOptions
	// fields missing from TypeScript's bundled DOM lib — widen the type
	// locally instead of casting away the rest of the options' checking.
	const options: NotificationOptions & {
		renotify?: boolean
		actions?: PushAction[]
	} = {
		body: payload.body,
		icon: payload.icon ?? "/notification-badge-192x192.png",
		badge: payload.badge ?? "/notification-badge-192x192.png",
		tag: payload.tag,
		renotify: payload.renotify,
		actions: payload.actions,
		data: payload.data,
	}

	event.waitUntil(
		self.registration.showNotification(
			payload.title ?? "New notification",
			options
		)
	)
})

// Opens the conversation (or focuses it if already open in some tab) —
// the fallback for a plain click, or a reply that couldn't be sent directly
// from the service worker. `draft` prefills the message composer so a typed
// reply is never silently lost.
function openConversation(url: string, draft?: string) {
	const targetUrl = draft ? `${url}?draft=${encodeURIComponent(draft)}` : url

	return self.clients
		.matchAll({ type: "window", includeUncontrolled: true })
		.then((clients) => {
			const targetPath = new URL(url, self.location.origin).pathname
			const existing = clients.find(
				(client) => new URL(client.url).pathname === targetPath
			)

			if (existing) {
				return existing.focus()
			}

			return self.clients.openWindow(
				new URL(targetUrl, self.location.origin).href
			)
		})
}

// A same-origin request carrying whatever session cookie the browser has —
// there's no way for a service worker to reach the bearer token an already
// open tab keeps in localStorage, so this only actually authenticates for
// users signed in via the session-cookie login path. It fails silently for
// everyone else, same as if the action wasn't offered at all.
function apiFetch(path: string, method: string, body?: unknown) {
	return fetch(path, {
		method,
		credentials: "include",
		headers: {
			Accept: "application/json",
			"X-Requested-With": "XMLHttpRequest",
			...(body ? { "Content-Type": "application/json" } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	}).then((response) => {
		if (!response.ok) {
			throw new Error(`Request to ${path} failed with ${response.status}`)
		}
	})
}

self.addEventListener("notificationclick", (event) => {
	event.notification.close()

	const data = event.notification.data as PushNotificationData | undefined
	const conversationId = data?.conversationId

	if (!data?.url || !conversationId) {
		return
	}

	const action = event.action
	// Inline reply text, typed straight into the notification — only
	// supported by a handful of browsers (mainly desktop Chrome/Edge) and
	// not yet part of TypeScript's NotificationEvent type.
	const reply = (event as unknown as { reply?: string }).reply

	if (action === "mark-read") {
		event.waitUntil(
			apiFetch(`/api/chat/conversations/${conversationId}/read`, "POST").catch(
				() => {}
			)
		)
		return
	}

	if (action === "delete") {
		event.waitUntil(
			apiFetch(`/api/chat/conversations/${conversationId}`, "DELETE").catch(
				() => {}
			)
		)
		return
	}

	if (action === "reply" && reply) {
		event.waitUntil(
			apiFetch(`/api/chat/conversations/${conversationId}/messages`, "POST", {
				body: reply,
			}).catch(() => openConversation(data.url!, reply))
		)
		return
	}

	event.waitUntil(openConversation(data.url))
})

// ─── SPA navigation fallback ──────────────────────────────────────────────────
// All navigate requests that don't match a precached URL fall back to /index.php
// so TanStack Router handles routing on the client side.
registerRoute(
	({ request }) => request.mode === "navigate",
	new NetworkFirst({
		cacheName: "navigation",
		networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
		plugins: [new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 60 })],
	})
)
