export function CircularProgress({ value }: { value: number }) {
  const radius = 44;
  const fullCircumference = 2 * Math.PI * radius;
  const circumference = fullCircumference * 0.75;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center h-28 w-28 sm:h-40 sm:w-40 md:h-40 md:w-40">
      <svg
        className="w-full h-full transform rotate-[135deg]"
        viewBox="0 0 100 100"
      >
        <circle
          className="text-chart-2"
          strokeWidth="7.9"
          stroke="currentColor"
          fill="transparent"
          r="44"
          cx="50"
          cy="50"
          strokeDasharray={`${circumference} ${fullCircumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          pathLength={fullCircumference}
        />
        <circle
          className="text-primary"
          strokeWidth="8"
          strokeDasharray={`${strokeDasharray} ${fullCircumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="44"
          cx="50"
          cy="50"
          pathLength={fullCircumference}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm sm:text-base md:text-base">진도율</span>
        <span className="text-2xl sm:text-4xl md:text-4xl font-semibold">
          {value}%
        </span>
      </div>
    </div>
  );
}
