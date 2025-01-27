interface ProgressDotProps {
  status: "completed" | "current" | "upcoming";
  isCurrent: boolean;
}

export function ProgressDot({ status, isCurrent }: ProgressDotProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
            w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center
            ${status === "completed" ? "bg-chart-1" : ""}
            ${status === "current" ? "bg-chart-1" : ""}
            ${status === "upcoming" ? "border-2 border-chart-1" : ""}
            `}
      >
        {status === "completed" && (
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      {isCurrent ? (
        <div className="w-4 h-0.5 bg-chart-1 mt-2" />
      ) : (
        <div className="w-4 h-0.5 bg-chart-2 mt-2" />
      )}
    </div>
  );
}
