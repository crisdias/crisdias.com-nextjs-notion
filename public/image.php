<?php
  // display errors on
  // ini_set('display_errors', 1);
  // header('Content-Type: text/plain');

  // get the image from querystring, then redirect to the image
  $image = $_GET['url'];
    if (empty($image)) {
    return;
  }

  // print the value of $image;
  // echo "-->";
  // print_r( $image );
  // return;

 // check if _cdn folder exists in the app root, if not create it
  if (!file_exists(__DIR__ . '/' . '_cdn')) {
    mkdir(__DIR__ . '/' . '_cdn', 0777, true);
  }

  // md5 the url
  $md5 = md5($image);
  $ext = explode('?',pathinfo($image, PATHINFO_EXTENSION))[0];
  $filename = $md5 . '.' . $ext;
  $path = '_cdn/' . $filename;

  // download url as $path if file does not exist
  if (!file_exists($path)) {
    file_put_contents(__DIR__ . '/' . $path, file_get_contents($image));
  }

  // redirect to path
  // echo("Location: /$path");
  header("Location: $path");

 


?>