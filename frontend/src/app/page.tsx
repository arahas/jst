import Image from "next/image";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Welcome to ZipScape</h1>
      <p className="text-xl text-gray-600">
        Explore ZIP code boundaries and demographics data with our powerful visualization tools.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">ZIP Code Lookup</h2>
          <p className="text-gray-600">
            Search and analyze specific ZIP codes with detailed demographic information.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Jurisdiction Viewer</h2>
          <p className="text-gray-600">
            Explore delivery station coverage and program types across different jurisdictions.
          </p>
        </div>
      </div>
    </div>
  );
}
