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
    try {
        const response = await axios.get(inputUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];
        return { buffer: response.data, contentType: contentType };
    }
    catch (error) {
        console.error("Erro ao baixar imagem:", error.message);
        if (error.response) {
            console.error("inputUrl:", inputUrl);
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data.toString());
            console.error("Headers:", error.response.headers);
        }
        throw new Error("Falha ao baixar a imagem");
    }
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

    // Encontrando URLs em <img> tags fora de <noscript>
    $('img[src^="' + prefix + '"]').each((index, element) => {
        matchedUrls.push($(element).attr('src'));
    });

    // Encontrando URLs em <img> tags dentro de <noscript>
    $('noscript').each(function () {
        const noscriptContent = $(this).text();
        const $temp = cheerio.load(noscriptContent);

        $temp('img[src^="' + prefix + '"]').each((index, element) => {
            matchedUrls.push($temp(element).attr('src'));
        });
    });

    return matchedUrls;
}

async function findAndProcessSrcsetUrls(file, prefix) {
    const content = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(content);

    console.log("-- findAndProcessSrcsetUrls");

    const promises = [];

    $('img[srcset]').each((i, img) => {
        console.log({ img });
        const srcset = $(img).attr('srcset').split(',');
        const newSrcset = [];

        for (let item of srcset) {
            item = item.trim();
            const [url, descriptor] = item.split(' ');

            if (url.startsWith(prefix)) {
                const uniqueName = calculateMD5(url) + `-${descriptor}.webp`;
                let urlKey = `${uniqueName}-${descriptor}`;

                const promise = (async () => {
                    if (!urlMapping[urlKey]) {
                        console.log("srcProcessando URL:", url, "para descriptor", descriptor, "...");
                        const { buffer, contentType } = await downloadImage(url);

                        // Pular o processamento se a imagem for do tipo .ico
                        if (contentType === 'image/x-icon' || contentType === 'image/vnd.microsoft.icon') {
                            console.log("Pulando imagem do tipo .ico:", url);
                            return;
                        }

                        const webpBuffer = await convertToWebP(buffer, descriptor);  // Supondo que convertToWebP pode ajustar o tamanho da imagem com base no descriptor
                        const outputPath = path.join(__dirname, 'out', '_cdn', uniqueName);
                        fs.writeFileSync(outputPath, webpBuffer);
                        urlMapping[urlKey] = uniqueName;
                    } else {
                        console.log("Reutilizando URL:", url, "para descriptor", descriptor, "...");
                    }

                    newSrcset.push(`https://jardim.crisdias.com/_cdn/${urlMapping[urlKey]} ${descriptor}`);
                })();

                promises.push(promise);
            } else {
                newSrcset.push(item);  // Preserve the original srcset item if it doesn't match the prefix
            }
        }

        $(img).attr('srcset', newSrcset.join(', '));
    });

    await Promise.all(promises);
    fs.writeFileSync(file, $.html());
}

async function processSrcs(cheerio, urls) {
    for (const url of urls) {
        // Verificar se a URL já foi processada
        // Verificar se a URL já foi processada
        if (!urlMapping[url]) {
            console.log("Processando URL:", url, "...");

            // Baixar a imagem
            const { buffer, contentType } = await downloadImage(url);

            // Pular o processamento se a imagem for do tipo .ico
            if (contentType === 'image/x-icon' || contentType === 'image/vnd.microsoft.icon') {
                console.log("Processando imagem do tipo .ico:", url);
                uniqueName = calculateMD5(url) + '.ico';
                const outputPath = path.join(__dirname, 'out', '_cdn', uniqueName);
                fs.writeFileSync(outputPath, buffer);
            } else {
                // Para outros tipos de imagem, converta para webp e salve
                uniqueName = calculateMD5(url) + '.webp';
                const webpBuffer = await convertToWebP(buffer);
                const outputPath = path.join(__dirname, 'out', '_cdn', uniqueName);
                fs.writeFileSync(outputPath, webpBuffer);
            }

            // Adicionar à hash de correspondência
            urlMapping[url] = uniqueName;
        }

        // Substituir o src da imagem no HTML
        cheerio('img[src="' + url + '"]').attr('src', "https://jardim.crisdias.com/_cdn/" + urlMapping[url]);

        // Tratando imagens dentro de noscript
        cheerio('noscript').each(function () {
            const noscriptContent = cheerio(this).html();
            if (noscriptContent.includes(url)) {
                const newContent = noscriptContent.replace(url, "https://jardim.crisdias.com/_cdn/" + urlMapping[url]);
                cheerio(this).html(newContent);
            }
        });
    }
}


async function processFile(file, prefix) {
    console.log("\nProcessando arquivo:", file, "...\n");
    const content = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(content);

    const urls = findImgUrlsWithPrefix(file, prefix);
    // await processSrcs($, urls);
    console.log("\nSRCs processados.\n");

    await findAndProcessSrcsetUrls(file, prefix);  // This processes the <img srcset>
    console.log("\n---------------\n");

    // Salvar a nova versão do arquivo
    fs.writeFileSync(file, $.html());
}


let urlMapping = {}; // Guarda a correspondência entre a URL original e o novo nome webp

async function main() {
    // try {
    const prefix = "https://www.notion.so/image/"
    const files = findHtmlFiles(path.join(__dirname, 'out'));

    for (const file of files) {
        await processFile(file, prefix);
    }

        console.log("Pronto.");
    // } catch (error) {
    //     console.error("Erro ao processar os arquivos .html:", error);
    // }
}

main();
