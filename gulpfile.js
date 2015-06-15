var gulp = require('gulp'),
    fs = require('fs'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
    w3cjs = require('w3cjs'),

    settings = JSON.parse(fs.readFileSync("settings.txt", { encoding: 'Utf-8' })),
    logFile = settings.logFile,
    siteURL = settings.siteURL,
    sitePages = settings.sitePages,
    sitePagesUrls = null,
    htmlTestResults = [];

    function getSitePages() {
        if (sitePagesUrls == null) {
            sitePagesUrls = [];
            sitePages.forEach(
                function (currentValue, index, array) {
                    sitePagesUrls.push(siteURL + currentValue);
                });
        }
        return sitePagesUrls;
    }

gulp.task('speedtest', function () {
    var googleAPIURL = 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?filter_third_party_resources=false&locale=en_GB&screenshot=false&strategy={selected_strategy}&url=',
    strategies = ['desktop', 'mobile'],

    results = { oldresults: { mobile: null, desktop: null }, newresults: {} },
    errorOccured = false;

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
                var url = googleAPIURL.replace('{selected_strategy}', strategies[strategy]) + encodeURIComponent(currentValue);
                var response = httpGet(url);
                if (response.status == 200) {
                    console.log(((100 / (getSitePages().length * strategies.length)) * (strategy * getSitePages().length + index + 1)).toFixed(2) + '% page speed test complete.');
                    var pageSpeedResults = JSON.parse(response.responseText);
                    results.newresults[strategies[strategy]][pageSpeedResults.id] = pageSpeedResults;
                } else {
                    errorOccured = true;
                    console.log('Failed speed test for: ' + currentValue + ' response code: ' + response.status + ' request url: ' + url + ' google response: ' + response.responseText);
                    return false;
                }
            });
    }
    if (!errorOccured) {
        fs.writeFile(logFile, JSON.stringify(results), function (err) {if (err) console.log(err);});
    }

    function httpGet(theUrl) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl, false);
        xmlHttp.send(null);
        return xmlHttp;
    }
});

gulp.task('perf-tool', ['speedtest', 'grunt:customdevperf', 'htmltest'], function(){});

gulp.task('htmltest', function() {
    getSitePages().forEach(
        function (currentValue, index, array) {
            w3cjs.validate({
                file: currentValue,
                proxy: null,//'http://proxy:8080', // Default to null
                callback: function (res) {
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
                        }
                        results.newresults.html = formatedResults;
                        fs.writeFile(logFile, JSON.stringify(results), function (err) {if (err) console.log(err);});
                        console.log('(Html test) Job completed.');
                    }
                }
            });
        });
});

function showError(error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('sass', function() {
    return gulp.src('scss/site-styles.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .on('error', showError)
        .pipe(autoprefixer('last 2 version', 'ios 6', 'android 4'))
        .pipe(gulp.dest('content/styles'));
});

gulp.task('watch', function() {
    gulp.watch('scss/**/*.scss', ['sass']);
});

require('gulp-grunt')(gulp, {
    // bug: when base is set then whole gulp is set to base path
    base: 'grunt/',
    prefix: 'grunt:',
    verbose: false
});

gulp.task('default', ['fullpagespeedtest', 'sass']);
