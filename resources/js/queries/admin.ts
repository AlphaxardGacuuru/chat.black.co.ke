import { useQuery } from "@tanstack/react-query"
import Axios from "@/lib/axios"

export type AdminDashboardData = {
	totals: {
		totalConversations: number
		totalMessages: number
		totalUsers: number
	}
	dailyVolume: { date: string; sent: number }[]
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
