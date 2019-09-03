const request = require('request');
const cheerio = require('cheerio');

const baseURL = 'https://bijao.uninorte.edu.co';
const mainURL = 'https://bijao.uninorte.edu.co/AFS/ServiceDesk/Services/';

mainRequest = function(url) {

    request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);
            $('a').each((i, el) => {
                const item = $(el).text();
                const link = $(el).attr('href');
                console.log('scraping item: ' + item);
                console.log('scraped link: ' + baseURL + link);
                subRequest(baseURL+link,item);
            });


        }
    });

};

subRequest = function(url, dir) {

    request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);
            $('a').each((i, el) => {
                const item = $(el).text();
                const link = $(el).attr('href');
                console.log('scraping item: ' + item);
                console.log('scraped link: ' + baseURL + link);
            });


        }
    });

};

mainRequest(mainURL);

/*
TODO:
https://www.npmjs.com/package/download-file

Cheerio tutorial: [DONE]
https://www.youtube.com/watch?v=LoziivfAAjE
 */