const internal = process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${internal}/api/:path*` },
      { source: "/uploads/:path*", destination: `${internal}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
