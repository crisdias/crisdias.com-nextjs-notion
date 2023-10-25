// eslint-disable-next-line @typescript-eslint/no-var-requires
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true'
// })



module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './my_image_loader.js',
  },
}
