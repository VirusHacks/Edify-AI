/** @type {import('next').NextConfig} */
import dotenv from "dotenv";
dotenv.config();
const nextConfig = {
    output: "standalone",
    reactStrictMode: true,
    // Ensure we're using App Router only - disable Pages Router completely
    experimental: {
        missingSuspenseWithCSRBailout: false,
        // Add server actions with timeout to prevent hanging requests
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    // Add fetch timeout to prevent JWKS and other external requests from hanging
    serverRuntimeConfig: {
        fetchTimeout: 5000, // 5 second timeout for server-side fetches
    },
    // Suppress Pages Router fallback - this error can be safely ignored as we use App Router
    onDemandEntries: {
        // Keep pages in memory for better performance
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 5,
    },
    webpack: (config, { isServer }) => {
        // Fix webpack issues with drizzle-orm vendor chunks
        if (isServer) {
            // Handle existing externals (could be array or function)
            const originalExternals = config.externals || [];
            config.externals = [
                ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
                ({ request }, callback) => {
                    // Externalize drizzle-orm and related packages to avoid webpack bundling issues
                    if (
                        request === 'drizzle-orm' ||
                        request?.includes('drizzle-orm') ||
                        request === '@neondatabase/serverless' ||
                        request === '@vercel/postgres'
                    ) {
                        return callback(null, `commonjs ${request}`);
                    }
                    callback();
                },
            ];
        }

        // Fix face-api.js / tensorflow issues - these are Node.js modules not available in browser
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            encoding: false,
            path: false,
            crypto: false,
        };

        return config;
    },
    images: {
        remotePatterns: [
            { protocol: 'http', hostname: '127.0.0.1' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'unsplash.com' },
            { protocol: 'https', hostname: 'plus.unsplash.com' },
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
            { protocol: 'https', hostname: 'img.clerk.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com' },
            { protocol: 'https', hostname: 'gravatar.com' },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
