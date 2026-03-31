declare module "google-trends-api" {
  const api: {
    dailyTrends(args: { trendDate: Date; geo?: string }): Promise<string>;
    realTimeTrends(args: { geo?: string; category?: string }): Promise<string>;
  };
  export default api;
}
