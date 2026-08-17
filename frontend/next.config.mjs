/** @type {import('next').NextConfig} */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "";

const nextConfig = {
  // Emergent's frontend deploy pipeline expects a static build folder.
  output: "export",
  // Expose the backend URL to the client. Emergent injects REACT_APP_BACKEND_URL
  // at build time (both preview and production), so we map it to the
  // NEXT_PUBLIC_ name the app code reads.
  env: {
    NEXT_PUBLIC_BACKEND_URL: BACKEND_URL,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
