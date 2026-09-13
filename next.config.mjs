/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enables instrumentation.ts, which pins DNS resolution to IPv4.
    experimental: { instrumentationHook: true },

    images: {
        // Cloudinary already resizes and format-negotiates; going through
        // /_next/image on top of that costs a second lossy encode.
        loader: "custom",
        loaderFile: "./lib/cloudinary-loader.ts",
    },
};

export default nextConfig;
