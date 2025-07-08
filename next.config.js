/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'tu-dominio.com', // Si usas imágenes externas
    ],
    unoptimized: true, // Desactiva la optimización si hay problemas
  },
  // Opcional: si usas un path base
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

module.exports = nextConfig