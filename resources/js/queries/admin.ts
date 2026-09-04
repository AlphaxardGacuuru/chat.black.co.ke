import { useQuery } from "@tanstack/react-query"
import Axios from "@/lib/axios"

export type AdminDashboardData = {
	totals: {
		chatsSent: number
		chatsFailed: number
		chatsQueued: number
		totalUsers: number
	}
	statusBreakdown: { status: string; count: number }[]
	dailyVolume: { date: string; sent: number; failed: number }[]
	recentFailures: {
		id: string
		subject: string | null
		to: string
		status: string
		errorMessage: string | null
		createdAt: string
	}[]
}

export function useAdminDashboard() {
	return useQuery({
		queryKey: ["admin", "dashboard"],
		queryFn: () =>
			Axios.get<{ data: AdminDashboardData }>("api/admin/dashboard").then(
				(res) => res.data.data
			),
	})
}
