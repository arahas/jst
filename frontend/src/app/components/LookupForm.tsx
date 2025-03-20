import { useState, useEffect } from 'react';

interface PostalCodeEntry {
  tag: string;
  postalCodes: string;
}

interface LookupFormProps {
  onSubmit: (entries: PostalCodeEntry[]) => void;
}

export default function LookupForm({ onSubmit }: LookupFormProps) {
  const [entries, setEntries] = useState<PostalCodeEntry[]>([
    { tag: '', postalCodes: '' }
  ]);

  const handleAddEntry = () => {
    setEntries([...entries, { tag: '', postalCodes: '' }]);
  };

  const handleRemoveEntry = (index: number) => {
    if (entries.length > 1) {
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);
    }
  };

  const handleChange = (index: number, field: keyof PostalCodeEntry, value: string) => {
    const newEntries = entries.map((entry, i) => {
      if (i === index) {
        return { ...entry, [field]: value };
      }
      return entry;
    });
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process entries to clean up postal codes
    const processedEntries = entries.map(entry => ({
      tag: entry.tag,
      postalCodes: entry.postalCodes
        .split(/[\s,]+/) // Split by whitespace or commas
        .filter(Boolean) // Remove empty strings
        .join(',') // Join with commas for API
    }));

    onSubmit(processedEntries);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {entries.map((entry, index) => (
        <div key={index} className="flex gap-4 items-start">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag
            </label>
            <input
              type="text"
              value={entry.tag}
              onChange={(e) => handleChange(index, 'tag', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tag"
            />
          </div>
          <div className="flex-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Codes
            </label>
            <input
              type="text"
              value={entry.postalCodes}
              onChange={(e) => handleChange(index, 'postalCodes', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter postal codes (space or comma separated)"
            />
          </div>
          {entries.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveEntry(index)}
              className="mt-6 p-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleAddEntry}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          + Add Another Entry
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </div>
    </form>
  );
} 