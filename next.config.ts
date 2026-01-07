import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co", // Libera imagens de teste
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // Libera imagens do seu Banco de Dados
      },
    ],
  },
};

export default nextConfig;