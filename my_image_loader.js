import Image from 'next/image'

export function myImageLoader({ src }) {
  // url encode the src
  return `https://jardim.crisdias.com/image.php?url=${encodeURIComponent(src)}`
  // return `http://127.0.0.1:8080/image.php?url=${encodeURIComponent(src)}`
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