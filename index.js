var settings = JSON.parse(fs.readFileSync("settings.txt", { encoding: 'Utf-8' })),
    logFile = settings.logFile,
    siteURL = settings.siteURL,
    sitePages = settings.sitePages,
    sitePagesUrls = null,
    htmlTestResults = [];

function performance(options) {
    console.log(options);
}

var devbridgePerfTool = {
    performance: performance
};

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = devbridgePerfTool;
  }
  exports.devbridgePerfTool = devbridgePerfTool;
} else {
  root['devbridgePerfTool'] = devbridgePerfTool;
}