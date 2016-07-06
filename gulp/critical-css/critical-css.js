var critical = require('critical');

module.exports = function() {

    var options = {
        inline: true,
        base: './',
        src: 'index-origin.html',
        width: 1300,
        height: 900,
        dest: 'index.html',
        minify: true,
        extract: true,
        ignore: ['@font-face']
    };

    return critical.generate(options);
};


