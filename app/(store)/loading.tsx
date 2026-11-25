export default function Loading() {
  return (
    <div className="container-lux py-12" aria-busy="true" aria-label="Cargando">
      <div className="mx-auto mb-10 h-10 w-64 animate-pulse rounded-full bg-maleja-pastel/30" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-white">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-maleja-canvas to-transparent" />
            </div>
            <div className="mt-3 h-3 w-1/3 rounded bg-maleja-pastel/30" />
            <div className="mt-2 h-4 w-3/4 rounded bg-maleja-pastel/30" />
          </div>
        ))}
      </div>
    </div>
  );
}
