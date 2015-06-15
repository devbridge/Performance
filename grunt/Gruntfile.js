module.exports = function (grunt) {
    // Configure grunt
    var settings = grunt.file.readJSON('../settings.txt'),
    siteURL = settings.siteURL,
    sitePages = settings.sitePages,
    logFile = settings.logFile,
    sitePagesUrls = null;

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

    grunt.initConfig({
        devperf: {
            options: {
                urls: getSitePages(),
                openResults: false,
                resultsFolder: '../perf-logs/devperf'
            }
        }
    });

    grunt.registerTask('customdevperf', 'devperf runner', function() {
        grunt.task.run('devperf')
        .then('Finishing after devperf.', function(){
            if (this.errorCount == 0) {
                var devperfResultsFile = '../perf-logs/devperf/results.json',
                    results = { oldresults: {}, newresults: {} },
                    devperfResults = {};

                if (grunt.file.exists(logFile)) {
                    results = grunt.file.readJSON(logFile);
                    results.oldresults.devperf = results.newresults.devperf;
                }
                devperfResults = grunt.file.readJSON(devperfResultsFile);
                results.newresults.devperf = {};
                devperfResults.pages.forEach(
                    function (currentValue, index, array) {
                        results.newresults.devperf[currentValue.url] = currentValue;
                    });
                grunt.file.write(logFile, JSON.stringify(results));
            }
        });
    });

    grunt.loadNpmTasks('grunt-devperf');
    grunt.loadNpmTasks("grunt-then");

    grunt.registerTask('default', ['devperf']);
}