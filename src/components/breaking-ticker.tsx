const breaking = [
  "Breaking: Global markets react to new inflation data",
  "India: AI startups attract fresh growth capital",
  "Sports: Championship race tightens this week",
];

export function BreakingTicker() {
  return (
    <div className="overflow-hidden border-b bg-red-600 py-2 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 text-sm md:px-6">
        <span className="font-semibold">Breaking</span>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-[ticker_30s_linear_infinite] whitespace-nowrap">{breaking.join(" • ")}</div>
        </div>
      </div>
    </div>
  );
}
