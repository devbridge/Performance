var gulp = require('gulp'),
    config = require('../gulp.config.js')(),

    through = require('through2'),
    path = require("path");

module.exports = task;

function task() {

    var encodedFiles = [],
        firstFile,
        firstFileSet = false;

    return gulp.src(config.dataUri.src)
        .pipe(through.obj(convertFile, saveVariables))
        .pipe(gulp.dest(config.dataUri.dest));

    function parsePath (filePath) {

        var extname = path.extname(filePath);

        return {
            dirname: path.dirname(filePath),
            basename: path.basename(filePath, extname),
            extname: extname.substr(1)
        };
    }

    function convertFile(file, enc, done) {

        if (!firstFileSet) {

            firstFile = file.clone();

            firstFileSet = true;
        }

        try {
            
            var encodedFile = {
                path: config.dataUri.varPrefix + parsePath(file.path).basename,
                contents: file.contents.toString('base64'),
                ext: parsePath(file.path).extname
            };

            encodedFiles.push(encodedFile);

        } catch (e) {
            
        }

        done();
    }

    function saveVariables(done) {

        var files = '';

        encodedFiles.forEach(function (item) {

            var ext = item.ext;

            if(ext === 'svg'){

                ext += '+xml';
            }

            files = files + item.path + ': "data:image/' + ext + ';base64,' + item.contents + '";' + '\n';
        });

        firstFile.path = path.join(firstFile.base, config.dataUri.resultFile);
        firstFile.contents = new Buffer(files);

        this.push(firstFile);

        done();
    }
}
