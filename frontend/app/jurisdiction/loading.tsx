export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-amazon-blue">Jurisdiction Viewer</h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-6 h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </section>
    </div>
  )
} 