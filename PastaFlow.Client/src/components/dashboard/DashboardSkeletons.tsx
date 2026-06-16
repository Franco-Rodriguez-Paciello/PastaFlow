export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-40" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
}

export function SkeletonPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
        </div>
      ))}
    </div>
  );
}
