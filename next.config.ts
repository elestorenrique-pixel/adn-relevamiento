import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // ═══════════════════════════════════════════════════════════
  // TYPESCRIPT: NO ignorar errores - mejor encontrar bugs
  // ═══════════════════════════════════════════════════════════
  typescript: {
    tsconfigPath: "./tsconfig.json",
    // Cambiar a false para detectar errores en build
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS === 'true',
  },

  // ═══════════════════════════════════════════════════════════
  // REACT
  // ═══════════════════════════════════════════════════════════
  reactStrictMode: true, // Habilitar para detectar problemas
  
  // ═══════════════════════════════════════════════════════════
  // HEADERS DE SEGURIDAD
  // ═══════════════════════════════════════════════════════════
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // OPTIMIZACIONES
  // ═══════════════════════════════════════════════════════════
  // (Leave compression to hosting platform; avoid deprecated/invalid keys)

  // ═══════════════════════════════════════════════════════════
  // MIDDLEWARE
  // ═══════════════════════════════════════════════════════════
  // Registrar middleware si existen
  // middleware: ['./middleware.ts'],

  // Logging is handled by the platform (Vercel) or external logger
};

export default nextConfig;
