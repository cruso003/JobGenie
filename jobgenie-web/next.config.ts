import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    domains: [
      "images.unsplash.com",
      "cdn.discordapp.com",
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "res.cloudinary.com",
      "cdn.pixabay.com",
      "www.gravatar.com",
      "encrypted-tbn0.gstatic.com"
    ],
  },
  /* config options here */
  // Temporarily disable ESLint during development
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
