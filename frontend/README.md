# ZIP Code Explorer Frontend

A Next.js application for exploring ZIP code boundaries and demographics data.

## Features

- **Lookup View**: Search for ZIP codes by tag and visualize them on a map
- **Population Charts**: View historical population data for ZIP codes
- **Jurisdiction Viewer**: (Coming soon)

## Technologies Used

- **Next.js**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Leaflet**: Interactive maps
- **Chart.js**: Data visualization
- **Axios**: API requests

## Getting Started

### Prerequisites

- Node.js 16.8.0 or later
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

- `/app`: Next.js App Router pages and layouts
- `/components`: Reusable React components
- `/lib`: Utility functions and API services
- `/styles`: Global styles and Tailwind configuration

## API Integration

The frontend communicates with the FastAPI backend through the API endpoints documented in the backend's README.md. The Next.js configuration includes API route proxying to simplify development. 