import Image from 'next/image'

const myImageLoader = ({ src, width: w, quality }) => {
  // CHECK if next is in development mode
  let baseURL = 'https://jardim.crisdias.com/_cdn';
  if (process.env.NODE_ENV === 'development') {
    baseURL = 'http://localhost:8000/_cdn';
  }

  const q = quality || 75;
  // const base64URL = Buffer.from(src).toString('base64');
  const urlencodedURL = encodeURIComponent(src);
  // const slashToPipe = base64URL.replace(/\//g, '|');

  const newURL = baseURL + '/' + w + '/' + q + '/?' + urlencodedURL;
  // const newURL = baseURL + '/index.php?u=' + urlencodedURL;
  return newURL;

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
