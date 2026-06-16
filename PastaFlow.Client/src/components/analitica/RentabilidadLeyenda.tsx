export default function RentabilidadLeyenda() {
  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Alerta de pérdida &lt;30%
      </span>
      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
        Rentabilidad media 30–50%
      </span>
      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        Alta rentabilidad &gt;50%
      </span>
    </div>
  );
}
