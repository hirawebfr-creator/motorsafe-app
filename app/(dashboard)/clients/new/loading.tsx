export default function Loading() {
  return (
    <div className="w-full">
      <div className="h-7 w-52 rounded bg-black/10" />
      <div className="mt-2 h-4 w-72 rounded bg-black/5" />

      <div className="mt-5 rounded-[15px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="h-12 rounded bg-black/5" />
          <div className="h-12 rounded bg-black/5" />
          <div className="h-12 rounded bg-black/5" />
          <div className="h-12 rounded bg-black/5" />
        </div>
        <div className="mt-5 h-12 rounded bg-black/5" />
        <div className="mt-5 h-28 rounded bg-black/5" />
        <div className="mt-5 h-12 rounded bg-black/10" />
      </div>
    </div>
  );
}
