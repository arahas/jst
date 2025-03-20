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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="amazon-section-title">ZIP Code Lookup</div>
      {entries.map((entry, index) => (
        <div key={index} className="amazon-card flex gap-4 items-start">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Tag
            </label>
            <input
              type="text"
              value={entry.tag}
              onChange={(e) => handleChange(index, 'tag', e.target.value)}
              required
              className="amazon-input"
              placeholder="Enter tag"
            />
          </div>
          <div className="flex-2">
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Postal Codes
            </label>
            <input
              type="text"
              value={entry.postalCodes}
              onChange={(e) => handleChange(index, 'postalCodes', e.target.value)}
              required
              className="amazon-input"
              placeholder="Enter postal codes (space or comma separated)"
            />
          </div>
          {entries.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveEntry(index)}
              className="mt-6 p-2 text-[#c40000] hover:text-[#a00000]"
              aria-label="Remove entry"
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
          className="amazon-link text-sm font-medium flex items-center"
        >
          + Add Another Entry
        </button>
        
        <button
          type="submit"
          className="amazon-button"
        >
          Submit
        </button>
      </div>
    </form>
  );
} 