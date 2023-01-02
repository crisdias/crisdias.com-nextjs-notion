import { CldImage } from 'next-cloudinary';

export function myCloudinaryLoader({ src }) {
  // url encode the src
  // return `https://jardim.crisdias.com/image.php?url=${encodeURIComponent(src)}`
  console.log('--------------------');
  console.log(`https://res.cloudinary.com/netcris/image/fetch/${src}`)
  console.log('--------------------');
  return `https://res.cloudinary.com/netcris/image/fetch/${src}`
}

const MyImage = (props) => {
  const newProps = { ...props }
  newProps.src = myCloudinaryLoader({ src: props.src })

  return (
    <CldImage
      loader={myCloudinaryLoader}
      {...newProps}
    />
  )
}

export default MyImage