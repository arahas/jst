import Image from "next/image";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#111111] mb-4">ZipScape</h1>
        <p className="text-xl text-[#232F3F]">
          Find ZIP code information and analyze delivery station coverage
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="amazon-card hover:shadow-lg transition-shadow">
          <h2 className="amazon-section-title mb-4">ZIP Code Lookup</h2>
          <p className="text-[#232F3F] mb-4">
            • Search multiple ZIP codes at once<br />
            • Group ZIP codes with custom tags<br />
            • View population data and demographics<br />
            • Compare data between different areas
          </p>
          <a 
            href="/lookup" 
            className="amazon-button inline-block text-center"
          >
            Search ZIP Codes
          </a>
        </div>
        <div className="amazon-card hover:shadow-lg transition-shadow">
          <h2 className="amazon-section-title mb-4">Jurisdiction Viewer</h2>
          <p className="text-[#232F3F] mb-4">
            • Find delivery station coverage areas<br />
            • View Core and SSD program details<br />
            • Check population by jurisdiction<br />
            • Track changes across effective weeks
          </p>
          <a 
            href="/jurisdiction" 
            className="amazon-button inline-block text-center"
          >
            View Coverage
          </a>
        </div>
      </div>
    </div>
  );
}
