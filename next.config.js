/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['be.sollinked.com', 'api.sollinked.com', 'localhost', 'v2.sollinked.com', 'app.sollinked.com'],
    },
    eslint: {
      dirs: ["src"],
    },
}

module.exports = nextConfig
