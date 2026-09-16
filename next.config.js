/** @type {import('next').NextConfig} */
const TENANT_SLUGS = ["cacorojo", "cueromacho", "ecofast", "jhosuaretro", "lagrasa", "urielfresh"];

const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/status-bar",
    "@capacitor/splash-screen",
    "@capacitor/haptics",
    "@capacitor/keyboard",
    "@capacitor/share",
    "@capacitor/filesystem",
    "@capacitor/camera",
    "@capacitor/local-notifications",
    "@capacitor-community/file-opener",
  ],
  outputFileTracingExcludes: {
    "*": ["./public/uploads/**", "./.env", "./.env.*"],
  },
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*", "./node_modules/@prisma/client/**/*"],
    "/api/**/*": ["./node_modules/.prisma/client/**/*", "./node_modules/@prisma/client/**/*"],
  },
  async redirects() {
    return TENANT_SLUGS.map((slug) => ({
      source: `/${slug}`,
      destination: `/forms/${slug}`,
      permanent: true,
    }));
  },
};
module.exports = nextConfig;
