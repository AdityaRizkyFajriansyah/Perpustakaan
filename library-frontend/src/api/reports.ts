import { http } from "./http";
import type { ApiResponse, ReportOverview } from "../types";

export async function getOverviewReportApi() {
  const res = await http.get<ApiResponse<ReportOverview>>("/reports/overview");
  return res.data;
}
