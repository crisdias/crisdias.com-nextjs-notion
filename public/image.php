<?php
  // display errors on
  // ini_set('display_errors', 1);
  // header('Content-Type: text/plain');
  // header("Access-Control-Allow-Origin: *");

  function getExt($src) {
    $substring = '%3F';
    $index = strpos($src, $substring);
    if ($index === false) {
        return $src;
    }
    return substr($src, 0, $index);
}


  // get the image from querystring, then redirect to the image
  $image = $_GET['url'];
    if (empty($image)) {
    return;
  }

  // print the value of $image;
  // echo "-->";
  // print_r( $_GET );
  // return;

 // check if _cdn folder exists in the app root, if not create it
  if (!file_exists(__DIR__ . '/' . '_cdn')) {
    mkdir(__DIR__ . '/' . '_cdn', 0777, true);
  }

  // md5 the url
  $md5 = md5($image);
  $ext = getExt(explode('?',pathinfo($image, PATHINFO_EXTENSION))[0]);
  $filename = $md5 . '.' . $ext;
  $path = '_cdn/' . $filename;
  // echo "<pre>path --> ";
  // print_r( $path );
  // echo "</pre>";
  // return;

  // download url as $path if file does not exist
  if (!file_exists($path)) {
    file_put_contents(__DIR__ . '/' . $path, file_get_contents($image));
  }

  // redirect to path
  // echo("Location: /$path");

  // if request url contains "_cdn" then redirect to the image
  if (strpos($_SERVER['REQUEST_URI'], '_cdn') !== false) {
    header("Location: $filename");
  } else {
    header("Location: /$path");
  }


?>