var critical = require('critical');

module.exports = function() {

    var options = {
        inline: true,
        base: './',
        src: 'index-origin.html',
        dimensions: [{
            height: 480,
            width: 320
        }, {
            height: 900,
            width: 1200
        }],
        dest: 'index.html',
        minify: true,
        extract: true,
        ignore: ['@font-face']
    };

    return critical.generate(options);
};


