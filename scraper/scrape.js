const request = require('request');
const cheerio = require('cheerio');
const download = require('download-file');

const baseURL = 'https://bijao.uninorte.edu.co';
const mainURL = '/AFS/ServiceDesk/Services/';

let interval;
let filesRequested = 0;
let intervalStarted = false;

let pending = [];

mainRequest = function(url, dir) {
    directoryRequest(url,dir);

    setTimeout(startInterval,120000);
};

startInterval = function() {
    intervalStarted = true;
    interval = setInterval(doPending,60000);
};

directoryRequest = function(url,dir) {
    console.log('Requesting directory');
    request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);
            $('a').each((i, el) => {
                const item = $(el).text();
                const link = $(el).attr('href');
                console.log('Found an item');
                if (link.endsWith('/')) {
                    console.log('Found directory: ' + item);
                    console.log('Located in url: ' + baseURL + link);
                    directoryRequest(baseURL+link,dir+item+'/')
                } else {
                    filesRequested ++;
                    console.log('Found document: ' + item);
                    console.log('Located in url: ' + baseURL + link);
                    fileRequest(baseURL+link,{directory : dir, filename : item});
                }
            });
        } else {
            console.log('Error fetching directory')
        }
    });

};

fileRequest = function(file, options) {
    console.log('Downloading file at url '+file);
    download(file, options,function(e){
        if (e) {
            console.log('Error fetching file. Adding to pending');
            pending[pending.length] = {
                file, options
            };
        }
    });
};

doPending = function() {
    console.log('Pending files: ' + pending.length);
    if (pending.length > 0) {
        const firstFile = pending.shift();
        const currentFile = firstFile.file;
        const currentOptions = firstFile.options;
        fileRequest(currentFile,currentOptions);
    }
    if (filesRequested > 0 && pending.length === 0) {
        clearInterval(interval);
        console.log('Downloaded '+filesRequested+' files');
    }
};




/*
mainRequest(baseURL + mainURL, './scraped-files/');
*/
/*
Cheerio tutorial: [DONE]
https://www.youtube.com/watch?v=LoziivfAAjE
 */