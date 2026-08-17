/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emergent's frontend deploy pipeline expects a static build folder.
  // NOTE: We intentionally do NOT inject the backend URL at build time.
  // Baking env values into the client bundle makes chunk hashes depend on the
  // build environment; when the platform builds the frontend in more than one
  // step with differing env, the hashes diverge and JS chunks 404 (served as
  // HTML), breaking hydration. The app resolves the API base at runtime from
  // window.location.origin instead, so the build is fully deterministic.
  output: "export",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
