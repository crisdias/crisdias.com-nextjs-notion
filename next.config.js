// eslint-disable-next-line @typescript-eslint/no-var-requires
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true'
// })



module.exports = {
  images: {
    loader: 'custom',
  },
}

// const { PHASE_PRODUCTION_BUILD } = require('next/constants')

// module.exports = (phase, { defaultConfig }) => {
//   if (phase === PHASE_PRODUCTION_BUILD) {
//     return {
//         images: {
//           unoptimized: true,
//           loader: 'custom',
//           loaderFile: './my_image_loader.js'
//         },
//       }
//     } else {
//       return {}
//     }
//   }
