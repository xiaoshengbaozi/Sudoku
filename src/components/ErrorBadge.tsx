export function ErrorBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="error-badge relative flex h-12 min-w-[3.6rem] flex-col items-center justify-center rounded-2xl px-3 text-center">
      <span className="text-[0.65rem] font-semibold leading-none">错误</span>
      <span className="text-base font-black leading-tight text-red-400">{count}</span>
    </div>
  );
}
