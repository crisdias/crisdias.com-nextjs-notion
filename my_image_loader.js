import Image from 'next/image'
const crypto = require('crypto');

// export function myPrefetchedImageLoader({ src }) {
//   const filename = MD5(src)
//   const ext = src.split('.').pop().split('?')[0]

//   fetch(`https://jardim.crisdias.com/image.php?url=${encodeURIComponent(src)}`, { mode: 'cors' })
//   return `https://jardim.crisdias.com/_cdn/${filename}.${ext}`
// }

const myImageLoader = ({ src, width: w, quality }) => {
  // CHECK if next is in development mode
  let baseURL = 'https://jardim.crisdias.com/_cdn';
  if (process.env.NODE_ENV === 'development') {
    baseURL = 'http://localhost:8000';
  }

  const q = quality || 75;
  const base64URL = Buffer.from(src).toString('base64');
  const slashToPipe = base64URL.replace(/\//g, '|');

  const newURL = baseURL + '/' + w + '/' + q + '/' + slashToPipe;
  return newURL;

  const ext = getSrcBeforeQuestionMark(src.split('.').pop().split('?')[0]);
  const filename = md5 + '.' + ext;

  // console.log({src});

  const ret = `https://jardim.crisdias.com/_cdn/${filename}?url=${encodeURIComponent(src)}`;
  // console.log({ ext });
  // console.log({ filename });
  // console.log({ret});

  return ret;
  // return `https://jardim.crisdias.com/image.php?url=${encodeURIComponent(src)}`
  // return `http://127.0.0.1:8080/image.php?url=${encodeURIComponent(src)}`
}

function getSrcBeforeQuestionMark(src) {
  const index = src.indexOf('%3F');
  if (index === -1) {
    return src;
  } else {
    return src.substring(0, index);
  }
}

const MyImage = (props) => {
  return (
    <Image
      loader={myImageLoader}
      {...props}
    />
  )
}



export default MyImage
