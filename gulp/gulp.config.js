
module.exports = function () {
    var config = {
        scss: {
            src: [
                './scss/**/*.scss',
                '!scss/**/*_scsslint_tmp*.scss'
            ],
            cssFolder: 'content/styles/'
        },
        svg: {
            sourceFolder: 'scss/assets/icons/',
            spriteFolder: 'content/styles/images/',
            scssMapFolder: 'scss/core/',
            pngFallback: false
        },
        dataUri: {
            src: ['Scss/assets/base_64/*.{png,jpg,gif,svg}'],
            dest: 'Scss/core',
            resultFile: '_icons.scss',
            varPrefix: '$icon-'
        }
    };

    return config;
};



