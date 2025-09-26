import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 图片服务器
  images: {
    remotePatterns: [
      {
        hostname: "*.hdslb.com",
      },
    ],
  },
   async redirects() {
    return [
      {
        source: '/',
        destination: '/h5/index.html',
        permanent: false, // 临时重定向
      },
    ];
  },
  //  async headers() {
  //   return [
  //     {
  //       source: '/h5-api/:path*',
  //       headers: [
  //         { key: 'Access-Control-Allow-Origin', value: '*' },
  //         { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
  //         { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
  //       ],
  //     },
  //   ];
  // },
  // async rewrites() {
  //   return [
      
  //     {
  //       source: '/h5-api/:path*',  // 匹配 /h5-api/ 开头的所有路径
  //       destination: 'https://artsharing.vhost.chengzhanheng.cn/:path*',  // 转发时去掉 /h5-api
  //     },
  //     // 如果需要处理根路径
  //     {
  //       source: '/h5-api',  // 匹配 /h5-api（没有后续路径）
  //       destination: 'https://artsharing.vhost.chengzhanheng.cn',  // 转发到根路径
  //     },
  //   ];
  // },
};

export default nextConfig;
