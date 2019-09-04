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
    newDirectoryRequest(url, dir,'0');
    callNextRequest();
};

reduceTimeout = function() {
  timeoutSteps = Math.max(timeoutSteps-1, 0);
};

increaseTimeout = function() {
    timeoutSteps = Math.min(timeoutSteps+1, maxTimeoutSteps)
};

addDirectoryRequest = function(requestObject) {
    pendingDirectories[pendingDirectories.length] = requestObject;
};

addFileRequest = function(requestObject) {
    pendingFiles[pendingFiles.length] = requestObject;
};

newDirectoryRequest = function(fileURL, directoryName, uniqueID) {
    pendingDirectories[pendingDirectories.length] = {
        url: fileURL,
        dir: directoryName,
        attempts: 0,
        id: uniqueID
    };
};

newFileRequest = function(url, options, uniqueID) {
    pendingFiles[pendingFiles.length] = {
        file : url,
        options,
        attempts: 0,
        id: uniqueID
    };
};

callNextRequest = function() {
  if (pendingDirectories.length > 0) {
      setTimeout(requestPendingDirectory,getTimeoutDuration());
  }  else {
      if (pendingFiles.length > 0) {
          setTimeout(requestPendingFile,getTimeoutDuration());
      } else {
          console.log('Should be done.');
      }
  }
};

getTimeoutDuration = function() {
  return Math.max((timeoutStepLength*timeoutSteps),minTimeoutDuration);
};

requestPendingDirectory = function() {
    if (pendingDirectories.length > 0) {
        directoryRequest(pendingDirectories.shift());
    } else {
        console.log('Requesting directory failed, no pending directories')
    }
};

requestPendingFile = function() {
    if (pendingFiles.length > 0) {
        fileRequest(pendingFiles.shift());
    } else {
        console.log('Requesting file failed, no pending files')
    }
};

directoryRequest = function(requestObject) {
    const {url,id,dir,attempts} = requestObject;

    console.log('[#'+id+'] - ['+attempts+'] Requesting directory '+url);

    request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
            reduceTimeout();
            console.log('Request successful');

            const $ = cheerio.load(html);

            $('a').each((i, el) => {
                console.log('Found an item');

                const item = $(el).text();
                const link = $(el).attr('href');
                const targetURL = baseURL+link;
                const itemID = id+'-'+i;

                if (link.endsWith('/')) {
                    console.log('Found directory: ' + item);
                    console.log('Located in url: ' + baseURL + link);


                    if (url.includes(targetURL)) {
                        console.log('Is parent directory, skipping')
                    } else {
                        newDirectoryRequest(targetURL, (dir + item + '/'), itemID);
                    }
                } else {
                    console.log('Found document: ' + item);
                    console.log('Located in url: ' + baseURL + link);

                    filesRequested ++;

                    newFileRequest(targetURL,{directory : dir, filename : item}, itemID);
                }
            });
        } else {
            increaseTimeout();
            console.log('Request failed');

            requestObject.attempts = attempts+1;
            addDirectoryRequest(requestObject);
        }

        callNextRequest();
    });

};

fileRequest = function(requestObject) {
    const {file,options,id,attempts} = requestObject;

    console.log('[#'+id+'] - ['+attempts+'] Downloading file '+file);

    download(file, options,function(e){
        if (e) {
            console.log('Error fetching file, adding back to requests');
            requestObject.attempts = attempts+1;
            addFileRequest(requestObject);

            increaseTimeout();
        } else {
            console.log('File fetch successful');

            reduceTimeout();
        }

        callNextRequest();
    });
};

mainRequest(baseURL + mainURL, './scraped-files/');

/*
Cheerio tutorial: [DONE]
https://www.youtube.com/watch?v=LoziivfAAjE
 */