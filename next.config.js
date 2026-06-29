/** @type {import('next').NextConfig} */
const TENANT_SLUGS = ["cacorojo", "cueromacho", "ecofast", "jhosuaretro", "lagrasa", "urielfresh"];

const nextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "*": ["./public/uploads/**"],
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
