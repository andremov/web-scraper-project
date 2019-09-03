const request = require('request');
const cheerio = require('cheerio');
const download = require('download-file');

const baseURL = 'https://bijao.uninorte.edu.co';
const mainURL = '/AFS/ServiceDesk/Services/';

let timeoutSteps = 1;
let minTimeoutDuration = 1000;
let timeoutStepLength = 5000;
let maxTimeoutSteps = 100;

let filesRequested = 0;

let pendingFiles = [];
let pendingDirectories = [];

mainRequest = function(url, dir) {
    addDirectoryRequest(url,dir);
    nextDirectoryTimeout();
};

reduceTimeout = function() {
  timeoutSteps = Math.max(timeoutSteps-1, 0);
};

increaseTimeout = function() {
    timeoutSteps = Math.min(timeoutSteps+1, maxTimeoutSteps)
};

nextDirectoryTimeout = function() {
    setTimeout(requestPendingDirectory,getTimeoutDuration());
};

nextFileTimeout = function() {
    setTimeout(requestPendingFile,getTimeoutDuration());
};

getTimeoutDuration = function() {
  return   Math.max((timeoutStepLength*timeoutSteps),minTimeoutDuration);
};

addDirectoryRequest = function(url,dir) {
    pendingDirectories[pendingDirectories.length] = {
        url,
        dir
    };
};

addFileRequest = function(url, options) {
    pendingFiles[pendingFiles.length] = {
        file : url,
        options
    };
};

directoryRequest = function(url,dir) {
    console.log('Requesting directory '+url);
    request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
            reduceTimeout();
            const $ = cheerio.load(html);
            $('a').each((i, el) => {
                const item = $(el).text();
                const link = $(el).attr('href');
                console.log('Found an item');
                if (link.endsWith('/')) {
                    console.log('Found directory: ' + item);
                    console.log('Located in url: ' + baseURL + link);
                    const dirURL = baseURL+link;
                    if (url.includes(dirURL)) {
                        console.log('Is parent directory, skipping')
                    } else {
                        addDirectoryRequest(dirURL, dir + item + '/');
                    }
                } else {
                    filesRequested ++;
                    console.log('Found document: ' + item);
                    console.log('Located in url: ' + baseURL + link);
                    addFileRequest(baseURL+link,{directory : dir, filename : item});
                }
            });
        } else {
            console.log('Error requesting directory, adding back to requests');
            addDirectoryRequest(url,dir);
            increaseTimeout();
        }
    });

};

fileRequest = function(file, options) {
    console.log('Downloading file '+file);
    download(file, options,function(e){
        if (e) {
            console.log('Error fetching file, adding back to requests');
            addFileRequest(file,options);

            increaseTimeout();
        } else {
            reduceTimeout();
        }
    });
};

requestPendingDirectory = function() {
    if (pendingDirectories.length > 0) {
        const firstDirectory = pendingDirectories.shift();
        const currentDirectoryURL = firstDirectory.url;
        const currentDirectoryDir = firstDirectory.dir;
        directoryRequest(currentDirectoryURL,currentDirectoryDir);

        nextDirectoryTimeout();
    } else {
        nextFileTimeout();
    }
};

requestPendingFile = function() {
    if (pendingFiles.length > 0) {
        const firstFile = pendingFiles.shift();
        const currentFile = firstFile.file;
        const currentOptions = firstFile.options;
        fileRequest(currentFile,currentOptions);

        nextFileTimeout();
    } else {
        console.log('Forcing recheck');

        setTimeout(checkPending,timeoutStepLength*maxTimeoutSteps/2);
    }
};

checkPending = function() {
    if (pendingDirectories.length > 0) {
        nextDirectoryTimeout();
    } else {
        if (pendingFiles.length > 0) {
            nextFileTimeout();
        } else {
            console.log('Finished')
        }
    }
};



mainRequest(baseURL + mainURL, './scraped-files/');

/*
Cheerio tutorial: [DONE]
https://www.youtube.com/watch?v=LoziivfAAjE
 */