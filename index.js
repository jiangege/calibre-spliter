const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const cheerio = require('cheerio');

fse.emptyDirSync('./dest');
//fse.copySync('./sources', './dest');

const sourceDir = fs.readdirSync('./sources');

sourceDir.forEach(bookName => {
  if (!fs.lstatSync(`${__dirname}/sources/${bookName}`).isDirectory()) return;
  const srcFiles = fs.readdirSync(`${__dirname}/sources/${bookName}`);
  const indexFileName = srcFiles.find(file => path.extname(file) === '.html');
  const indexBaseName = path.basename(indexFileName, '.html');
  const $ = cheerio.load(fs.readFileSync(`${__dirname}/sources/${bookName}/${indexFileName}`));
  const chapterIdList = [...new Set($('ul li a').map((i, el) => $(el).attr('href').split('#')[1]).get())];
  const $$ = cheerio.load(fs.readFileSync(`${__dirname}/sources/${bookName}/${indexBaseName}_files/index.html`));


  chapterIdList.forEach(id => {
    const chapterTitle$ = $$(`#${id}`)
    $$(`<p>$chapter</p><h1>${chapterTitle$.parent().text()}</h1>`).insertBefore(chapterTitle$.parent());
  });

  const chapterHtmlList = $$('body .calibreEbookContent').html().split('<p>$chapter</p>');

  let chapterLinks = [];

  chapterHtmlList.forEach((chapterHtml, i) => {
    const new$ = cheerio.load(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style type="text/css">
            img {
              display: block;
            }
          </style>
        </head>
        <body>
          ${chapterHtml}
        </body>
      </html>
    `);

    const chapterName = new$('h1').text();
    fse.ensureFileSync(`${__dirname}/dest/${bookName}/${chapterName}.html`);
    fs.writeFileSync(`${__dirname}/dest/${bookName}/${chapterName}.html`, new$.html());
    const resources = fs.readdirSync(`${__dirname}/sources/${bookName}/${indexBaseName}_files/`);
    const imgFiles = resources.filter(filename => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(filename))
    imgFiles.forEach(filename => {
      fse.copy(`${__dirname}/sources/${bookName}/${indexBaseName}_files/${filename}`, `${__dirname}/dest/${bookName}/${filename}`)
    })
    chapterLinks.push(`<a href="${chapterName}.html">${chapterName}</a>`);
  });
  fs.writeFileSync(`${__dirname}/dest/${bookName}/index.html`, `
    <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          ${chapterLinks.join('<br>')}
        </body>
    </html>
  `)
});

console.log('done');
