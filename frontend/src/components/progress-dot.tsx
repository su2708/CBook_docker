interface ProgressDotProps {
    status: 'completed' | 'current' | 'upcoming'
}

export function ProgressDot({ status }: ProgressDotProps) {
    return (
        <div
            className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${status === 'completed' ? 'bg-chart-1' : ''}
          ${status === 'current' ? 'bg-chart-1' : ''}
          ${status === 'upcoming' ? 'border-2 border-chart-1' : ''}
        `}
        >
            {status === 'completed' && (
                <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
            {status === 'current' && (
                <div className="flex gap-[3px]">
                    <div className="w-1 h-1 rounded-full bg-white" />
                    <div className="w-1 h-1 rounded-full bg-white" />
                    <div className="w-1 h-1 rounded-full bg-white" />
                </div>
            )}
        </div>
    )
}
