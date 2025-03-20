# ZipScape Frontend

This is the frontend application for ZipScape, a ZIP code analysis and visualization platform.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Leaflet (for maps)
- Chart.js (for data visualization)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:
   ```
   NEXT_PUBLIC_API_URL=http://0.0.0.0:8000
   NEXT_PUBLIC_APP_NAME=ZipScape
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/` - Main application code using Next.js App Router
  - `page.tsx` - Home page
  - `lookup/page.tsx` - ZIP code lookup page
  - `jurisdiction/page.tsx` - Jurisdiction viewer page
  - `layout.tsx` - Root layout with navigation

## Features

- Modern, responsive design with Tailwind CSS
- Interactive maps powered by Leaflet
- Data visualization using Chart.js
- Integration with FastAPI backend

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
