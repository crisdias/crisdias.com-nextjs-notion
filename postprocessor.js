const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');
const crypto = require('crypto');
const sharp = require('sharp');
const { URL } = require('url');

function calculateMD5(input) {
    return crypto.createHash('md5').update(input).digest('hex');
}

async function downloadImage(inputUrl) {
    // Parse a URL string
    const parsedUrl = new URL(inputUrl);

    // Decode the 'url' parameter from the query string
    const imageUrl = decodeURIComponent(parsedUrl.searchParams.get('url'));
    const additionalParams = decodeURIComponent(imageUrl.replace('https://www.notion.so/image/', ''));
    const [awsImage, query] = additionalParams.split('?');
    const finalUrl = 'https://www.notion.so/image/' + encodeURIComponent(awsImage) + '?' + query;

    const response = await axios.get(finalUrl, { responseType: 'arraybuffer' });
    return response.data;
}

async function convertToWebP(imageBuffer) {
    return await sharp(imageBuffer).toFormat('webp').toBuffer();
}

function findHtmlFiles(startPath) {
    let htmlFiles = [];

    function walkDir(dir) {
        const files = fs.readdirSync(dir);
        for (let file of files) {
            const filepath = path.join(dir, file);
            const stat = fs.statSync(filepath);

            if (stat.isDirectory()) {
                walkDir(filepath);
            } else if (path.extname(filepath) === '.html') {
                htmlFiles.push(filepath);
            }
        }
    }

    walkDir(startPath);
    return htmlFiles;
}

function findImgUrlsWithPrefix(htmlFilePath, prefix) {
    const content = fs.readFileSync(htmlFilePath, 'utf8');
    const $ = cheerio.load(content);

    const matchedUrls = [];

    $('img[src^="' + prefix + '"]').each((index, element) => {
        matchedUrls.push($(element).attr('src'));
    });

    return matchedUrls;
}

async function findAndProcessSrcsetUrls(file, prefix) {
    const content = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(content);

    $('img[srcset]').each(async (i, img) => {
        const srcset = $(img).attr('srcset').split(',');
        const newSrcset = [];

        for (let item of srcset) {
            item = item.trim();
            const [url, descriptor] = item.split(' ');

            if (url.startsWith(prefix)) {
                const realImageUrl = decodeURIComponent(new URL(url).searchParams.get('url'));
                const uniqueName = calculateMD5(realImageUrl) + `-${descriptor}.webp`;

                let urlKey = `${realImageUrl}-${descriptor}`;
                if (!urlMapping[urlKey]) {
                    console.log("Processando URL:", realImageUrl, "para descriptor", descriptor, "...");
                    const imageBuffer = await downloadImage(url);
                    const webpBuffer = await convertToWebP(imageBuffer, descriptor);  // Supondo que convertToWebP pode ajustar o tamanho da imagem com base no descriptor
                    const outputPath = path.join(__dirname, 'out', '_cdn', uniqueName);
                    fs.writeFileSync(outputPath, webpBuffer);
                    urlMapping[urlKey] = uniqueName;
                } else {
                    console.log("Reutilizando URL:", realImageUrl, "para descriptor", descriptor, "...");
                }

                newSrcset.push(`https://jardim.crisdias.com/_cdn/${urlMapping[urlKey]} ${descriptor}`);
            } else {
                newSrcset.push(item);  // Preserve the original srcset item if it doesn't match the prefix
            }
        }

        $(img).attr('srcset', newSrcset.join(', '));
    });

    fs.writeFileSync(file, $.html());
}



async function processFile(file, prefix) {
    console.log("\nProcessando arquivo:", file, "...");
    const content = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(content);

    const urls = findImgUrlsWithPrefix(file, prefix);
    for (const url of urls) {
        // Verificar se a URL já foi processada
        if (!urlMapping[url]) {
            console.log("Processando URL:", url, "...");
            const uniqueName = calculateMD5(url) + '.webp';

            // Baixar a imagem
            const imageBuffer = await downloadImage(url);

            // Converter para webp
            const webpBuffer = await convertToWebP(imageBuffer);

            // Salvar a imagem webp no diretório out/_cdn
            const outputPath = path.join(__dirname, 'out', '_cdn', uniqueName);
            fs.writeFileSync(outputPath, webpBuffer);

            // Adicionar à hash de correspondência
            urlMapping[url] = uniqueName;
        }

        // Substituir o src da imagem no HTML
        $('img[src="' + url + '"]').attr('src', "https://jardim.crisdias.com/_cdn/" + urlMapping[url]);
    }

    // Salvar a nova versão do arquivo
    fs.writeFileSync(file, $.html());
}


let urlMapping = {}; // Guarda a correspondência entre a URL original e o novo nome webp

async function main() {
    // try {
        const prefix = "https://jardim.crisdias.com/_cdn/"
        const files = findHtmlFiles(path.join(__dirname, 'out'));

        for (const file of files) {
            await processFile(file, prefix);
            await findAndProcessSrcsetUrls(file, prefix);  // This processes the <img srcset>
        }

        console.log("Pronto.");
    // } catch (error) {
    //     console.error("Erro ao processar os arquivos .html:", error);
    // }
}

main();
