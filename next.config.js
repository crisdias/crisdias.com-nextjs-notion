// eslint-disable-next-line @typescript-eslint/no-var-requires
// https://nextjs.org/docs/messages/export-image-api
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  staticPageGenerationTimeout: 300,
  // images: {
  //   domains: ['www.notion.so', 'notion.so', 's3-us-west-2.amazonaws.com'],
  //   // unoptimized: true
  // }
  images: {
    loader: 'custom',
    loaderFile: './my_image_loader.js',
  },
})
