/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // uploads van por volumen Docker — no empaquetar 3000+ archivos en standalone
  outputFileTracingExcludes: {
    "*": ["./public/uploads/**"],
  },
};
module.exports = nextConfig;
