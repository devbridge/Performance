var gulp = require('gulp'),
    grunt = require('grunt'),
    fs = require('fs'),
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
    w3cjs = require('w3cjs'),

    prefix = './node_modules/devbridge-perf-tool',
    // prefix = '.', // uncomment this line if you will run this module straight from this folder
    settings = JSON.parse(fs.readFileSync(prefix+"/defaultSettings.txt", { encoding: 'Utf-8' })),
    logFile = '/speedtest.txt',
    siteURL = settings.siteURL,
    sitePages = settings.sitePages,
    sitePagesUrls = [],
    htmlTestResults = [],
    folders = ['/content', '/content/images', '/content/styles'],
    htmlFiles = ['/content/images/logo-footer.png',
                '/content/styles/site-styles.css',
                '/dialogTemplate.html',
                '/favicon.ico',
                '/htmlValidityTemplate.html',
                '/index.html',
                '/SpeedTestResultsControler.js',
                '/SpeedTestViewApp.js'];

if (!fs.existsSync('./node_modules/grunt-then')) { fs.renameSync(prefix+'/node_modules/grunt-then','./node_modules/grunt-then'); }
if (!fs.existsSync('./node_modules/grunt-devperf')) { fs.renameSync(prefix+'/node_modules/grunt-devperf','./node_modules/grunt-devperf'); }

function getSitePages() {
    if (sitePagesUrls.length == 0) {
        sitePagesUrls = [];
        sitePages.forEach(
            function (currentValue, index, array) {
                sitePagesUrls.push(siteURL + currentValue);
            });
    }
    return sitePagesUrls;
}

function showError(error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('sass', function() {
    return gulp.src('scss/site-styles.scss')
        .pipe(require('gulp-sass')({outputStyle: 'compressed'}))
        .on('error', showError)
        .pipe(require('gulp-autoprefixer')('last 2 version', 'ios 6', 'android 4'))
        .pipe(gulp.dest('content/styles'));
});

gulp.task('watch', function() {
    gulp.watch('scss/**/*.scss', ['sass']);
});

// gulp.task('perf-tool', function(){
//     performance({
//         siteURL:"https://www.google.com",
//         sitePages: ["/", "/voice"],
//         runDevPerf:true,
//         runHtmlTest:true,
//         runGoogleSpeedTest:true
//     });
// });

// gulp.task('default', ['perf-tool']);

function speedtest() {
    console.log('(Google page speed) Job started.');
    var googleAPIURL = 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?filter_third_party_resources=false&locale=en_GB&screenshot=false&strategy={selected_strategy}',
    strategies = ['desktop', 'mobile'],

    results = { oldresults: { mobile: null, desktop: null }, newresults: {} },
    errorOccured = false,
    finishedCount = 0,
    key = settings.googleAPIKey ? '&key='+settings.googleAPIKey+'&url=' : '&url=';
    // Configure with key
    googleAPIURL += key;


    if (fs.existsSync(logFile)) {
        results = JSON.parse(fs.readFileSync(logFile, { encoding: 'Utf-8' }));
        results.oldresults.desktop = results.newresults.desktop;
        results.oldresults.mobile = results.newresults.mobile;
    }

    for (strategy in strategies) {
        results.newresults[strategies[strategy]] = {};
        if (errorOccured) {
            return false;
        }
        getSitePages().forEach(
            function (currentValue, index, array) {
                        var selectedStrategy = strategies[strategy];
                setTimeout(function(){
                    var url = googleAPIURL.replace('{selected_strategy}', selectedStrategy) + '&url=' + encodeURIComponent(currentValue);
                    var response = httpGet(url);
                    if (response.status == 200) {
                        var pageSpeedResults = JSON.parse(response.responseText);
                        results.newresults[selectedStrategy][currentValue] = pageSpeedResults;
                    } else {
                        errorOccured = true;
                        console.log('Failed speed test for: ' + currentValue + ' response code: ' + response.status + ' request url: ' + url + ' google response: ' + response.responseText);
                        return false;
                    }
                    console.log('(Google page speed) Done ' + (++finishedCount) + ' out of ' + array.length*strategies.length);
                    if (!errorOccured &&
                        array.length == Object.keys(results.newresults[strategies[0]]).length &&
                        array.length == Object.keys(results.newresults[strategies[1]]).length) {
                        console.log('(Google page speed) Job finished! Writing results.');
                        fs.writeFile(logFile, JSON.stringify(results), function (err) {if (err) console.log(err); copyResultsToResultsFolder();});
                    }
                }, 1);
            });
    }

    function httpGet(theUrl) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl, false);
        xmlHttp.send(null);
        return xmlHttp;
    }
};

function htmltest() {
    getSitePages().forEach(
        function (currentValue, index, array) {
            w3cjs.validate({
                file: currentValue,
                proxy: null,//'http://proxy:8080', // Default to null
                callback: function (res) {
                    console.log('(Html test) Done ' + (htmlTestResults.length+1) + ' out of ' + array.length);
                    htmlTestResults.push(res);
                    // if all elements handle results
                    if (htmlTestResults.length == array.length) {
                        console.log('(Html test) Writing results...');
                        var formatedResults = {};
                        htmlTestResults.forEach(
                            function (result, index, array) {
                                if (result.messages) {
                                    result.messages = result.messages.filter(function(message) { delete message.explanation; return message.type == 'error'});
                                    formatedResults[result.url] = result;
                                }
                            });
                        var results = { oldresults: {}, newresults: {} };
                        if (fs.existsSync(logFile)) {
                            results = JSON.parse(fs.readFileSync(logFile, { encoding: 'Utf-8' }));
                            results.oldresults.html = results.newresults.html;
                            results.oldresults.html = results.newresults.html;
                        }
                        results.newresults.html = formatedResults;
                        fs.writeFile(logFile, JSON.stringify(results), function (err) {if (err) console.log(err); copyResultsToResultsFolder();});
                        console.log('(Html test) Job completed.');
                    }
                }
            });
        });
};

function copyResultsToResultsFolder() {
    if (!fs.existsSync(settings.resultsFolder)) { fs.mkdirSync(settings.resultsFolder); }
    folders.forEach(function(folder, index, array){
        if (!fs.existsSync(settings.resultsFolder+folder)) { fs.mkdirSync(settings.resultsFolder+folder); }
    });
    htmlFiles.forEach(function(file, index, array){
        if (fs.existsSync(file)) { fs.unlinkSync(settings.resultsFolder+file); }
        fs.writeFileSync(settings.resultsFolder+file, fs.readFileSync(prefix+file));
    });
}

function performance(options) {
    if (options !== undefined) {
        for (var key in options) {
            if (key != 'translations') {
                settings[key] = options[key];
            }
        }
        for (var key in options.translations) {
            settings.translations[key] = options.translations[key];
        }
    }
    siteURL = settings.siteURL;
    sitePages = settings.sitePages;
    copyResultsToResultsFolder();
    logFile = settings.resultsFolder+'/speedtest.txt';
    fs.writeFile(settings.resultsFolder+'/settings.txt', JSON.stringify(settings), function (err) {if (err) console.log(err);});
    if (settings.runDevPerf) {
        GruntTasks(grunt);
        grunt.task.run('customdevperf');
        // mute all grunt output
        // grunt.log.muted = true;
        if (settings.smallerDevperfOutput) {
            grunt.log.subhead = function (){};
            grunt.log.ok = function (){};
        }
        grunt.task.start({asyncDone: false});
    }
    if (settings.runGoogleSpeedTest) {
        speedtest();
    }
    if (settings.runHtmlTest) {
        htmltest();
    }
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

function GruntTasks (grunt) {
    grunt.initConfig({
        devperf: {
            options: {
                urls: getSitePages(),
                openResults: false,
                resultsFolder: prefix+'/devperf'
            }
        }
    });

    grunt.registerTask('customdevperf', 'devperf runner', function() {
        grunt.task.run('devperf')
        .then('Finishing after devperf.', function(){
            if (this.errorCount == 0) {
                var results = { oldresults: {}, newresults: {} },
                    devperfResults = {};

                if (grunt.file.exists(logFile)) {
                    results = grunt.file.readJSON(logFile);
                    results.oldresults.devperf = results.newresults.devperf;
                }
                devperfResults = grunt.file.readJSON(prefix+'/devperf/results.json');
                results.newresults.devperf = {};
                devperfResults.pages.forEach(
                    function (currentValue, index, array) {
                        results.newresults.devperf[currentValue.url] = currentValue;
                    });
                grunt.file.write(logFile, JSON.stringify(results));
                copyResultsToResultsFolder();
            }
        });
    });

    grunt.loadNpmTasks('grunt-devperf');
    grunt.loadNpmTasks("grunt-then");

    grunt.registerTask('default', ['devperf']);
}
