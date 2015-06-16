perf-tool
===
##What is this:

###In short about:
This is a npm package to display statistics about your web pages, information such as css resources count, Google PageSpeed Insights score, information how to fix performace issues, html errors and many more in one custom web page.

###Tech details:
This package mainly uses three plugins [**w3cjs**](https://www.npmjs.com/package/w3cjs) (html test errors, warnings ect), [**Google PageSpeed Insights**](https://developers.google.com/speed/pagespeed/insights) (a lot information, for example: how to fix main load/performance issues, load times...) and [**dev-perf**](https://github.com/gmetais/grunt-devperf) (number of 404 errors, number of images without dimensions ect). Then colected that information is displayed in angular js based web page.

---
Usage:
---

###Setting up

Firstly install this package locally to your project:
```
npm install devbridge-perf-tool --save-dev
```

Also assure that you have it installed globally:
```
npm install devbridge-perf-tool -g
```

And add it to your gulpfile.js:

```
require('gulp').task('perf-tool', function () {
	return require('devbridge-perf-tool').performance({
	});
});
```

