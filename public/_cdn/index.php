<?php

// Desativar exibição de erros
ini_set('display_errors', 0);

// require_once __DIR__ . '/cors.php';
// cors();


// max execution time in seconds
ini_set('max_execution_time', 60);

// echo $_GET['u'];
// exit;

// Verificar se REQUEST_URI está definido
if (!isset($_SERVER['REQUEST_URI'])) {
    http_response_code(400);
    echo 'URL inválida. (REQUEST_URI não definido)';
    exit;
}

// Caminho para a pasta de imagens
$imagesDir = __DIR__ . '/images/';

// Verifique se a pasta "images" existe e crie-a se não existir
if (!file_exists($imagesDir)) {
    if (!mkdir($imagesDir, 0755) && !is_dir($imagesDir)) {
        throw new \RuntimeException(sprintf('Directory "%s" was not created', $imagesDir));
    }
}

$parts = explode('/', $_SERVER['REQUEST_URI']);

if ($parts[1] == '_cdn') {
    // Remover o primeiro elemento (vazio) e o segundo elemento (_cdn)
    array_shift($parts);
    array_shift($parts);
} else {
    // Remover o primeiro elemento (vazio)
    array_shift($parts);
}

// Verificar se todos os componentes necessários estão presentes na URL
if (count($parts) != 3) {
    http_response_code(400);
    echo 'URL inválida: componentes insuficientes: ' . count($parts);
    exit;
}

$width = $parts[0];
$quality = $parts[1];
$src = $parts[2];

// Validar e limpar entrada
$width = filter_var($width, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1, 'max_range' => 50000] // Ajuste conforme necessário
]);

$quality = filter_var($quality, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1, 'max_range' => 100]
]);

if ($width === false || $quality === false) {
    http_response_code(400);
    echo 'Parâmetros inválidos.';
    exit;
}

// Decodificar o SRC de Base64 para texto normal
// $src = base64_decode(str_replace('%7C', '|', $src));
// $src = base64_decode(urldecode($src));

# remove first char of $src "?"
$src = substr($src, 1);
$src = urldecode($src);


if ($src === false) {
    // http_response_code(400);
    echo 'URL inválida. (SRC)';
    exit;
}

// Gere um ID único usando md5 de $_SERVER['REQUEST_URI']
$uniqueID = md5("$width/$quality/$src");
$imagePath = __DIR__ . '/images/' . $uniqueID;

// Verifique se a imagem já existe
if (file_exists($imagePath . '.webp')) {
    // Se a imagem já existe, basta enviá-la para o navegador
    header('Content-Type: image/webp');
    readfile($imagePath . '.webp');
    exit;
} elseif (file_exists($imagePath)) {
    // Se a imagem já existe em seu formato original, envie-a com o tipo MIME correto
    $originalMime = file_get_contents($imagePath . '.mime');
    header('Content-Type: ' . $originalMime);
    readfile($imagePath);
    exit;
}

// Tente baixar a imagem
$imageData = file_get_contents($src);
if ($imageData === false) {
    http_response_code(500);
    echo "Não foi possível baixar a imagem:\n" . $src;
    exit;
}

// Salve a imagem temporariamente
$tempImagePath = tempnam(sys_get_temp_dir(), 'img');
file_put_contents($tempImagePath, $imageData);

// Obtenha o tamanho e o tipo da imagem
$size = getimagesize($tempImagePath);
if ($size === false) {
    http_response_code(500);
    echo 'Não foi possível obter as informações da imagem:' . $src . "\n" . $parts[2];
    unlink($tempImagePath);
    exit;
}

// Crie um objeto GdImage a partir da imagem temporária
switch ($size['mime']) {
    case 'image/jpeg':
        $image = imagecreatefromjpeg($tempImagePath);
        break;
    case 'image/png':
        $image = imagecreatefrompng($tempImagePath);
        break;
    // Adicione mais casos para outros formatos de imagem se necessário
    default:
        // Se o formato não for suportado, salve o arquivo localmente sem converter
        file_put_contents($imagePath, $imageData);
        file_put_contents($imagePath . '.mime', $size['mime']);
        header('Content-Type: ' . $size['mime']);
        echo $imageData;
        unlink($tempImagePath);
        exit;
}

// Redimensionar a imagem para a largura especificada, mas somente se a largura for maior que a largura original
if ($size[0] <= $width) {
    $height = ($size[1] / $size[0]) * $width;
    $imageResized = imagescale($image, $width, $height);
} else {
    $imageResized = $image;
}


// Converter a imagem para WebP e salvar
imagewebp($imageResized, $imagePath . '.webp', $quality);
imagedestroy($image);
imagedestroy($imageResized);

// Devolva a imagem WebP na requisição
header('Content-Type: image/webp');
readfile($imagePath . '.webp');
unlink($tempImagePath);
?>
