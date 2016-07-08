var gulp = require('gulp');

// Compile SASS
require('gulp-task-loader')('gulp/compile-scss');

// Compile critical css
require('gulp-task-loader')('gulp/critical-css');

// Create base64 icon variables
require('gulp-task-loader')('gulp/create-data-uri-vars');

// Create SVG sprite
require('gulp-task-loader')('gulp/create-svg-sprite');

// Watch
require('gulp-task-loader')('gulp/watch-tasks');