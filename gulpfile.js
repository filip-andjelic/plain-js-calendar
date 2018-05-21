var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var extend = require('util')._extend;
var minifyCss = require('gulp-clean-css');
var sass = require('gulp-sass');
var autoprefix = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var search = require('gulp-search');
var gutil = require('gulp-util');
var replace = require('gulp-replace');
var fs = require("fs");

function recursiveTemplateSearch(templateContent) {
  var nestedTemplates = templateContent.match(/<@=.*=@>/g);

  if (nestedTemplates && nestedTemplates.length) {
    for (var i = 0; i < nestedTemplates.length; i ++) {
      var nestedTemplateTag = nestedTemplates[i];
      var nestedTemplateContent = getContentForTemplate(nestedTemplateTag);

      nestedTemplateContent = recursiveTemplateSearch(nestedTemplateContent);

      templateContent = templateContent.replace(nestedTemplateTag, nestedTemplateContent);
    }
  }

  return templateContent;
}
function getContentForTemplate(templateTag) {
  var templateName = templateTag.replace(/</g, '').replace(/>/g, '').replace(/=/g, '').replace(/@/g, '').replace(/ /g, '');
  var templateContent = fs.readFileSync(config.codeDirectory.root + '/html/' + templateName + '.html', "utf8");

  return templateContent;
}
function handleTemplateBinding(match) {
  var templateContent = getContentForTemplate(match);

  templateContent = recursiveTemplateSearch(templateContent);

  return templateContent;
}

var config = extend({
    codeDirectory: {
        root: './code',
        js: './code/js/*.js',
        scss: './code/style/application.scss',
        css: './code/style/*.css',
        html: './code/html/*.html'
    },
    destDirectory: {
        root: './app',
        htmlRoot: './app/html',
        jsFile: 'application.js',
        cssFile: 'application.css'
    },
    assetDirectory: {
        root: './assets/**/*',
        dir: './app/assets'
    },
    tmpDir: './.tmp',
    browsersCompatibility: ['Firefox 20', 'Safari 8', 'IE 10', 'Chrome 20', 'Edge 12']
});

gulp.task('buildCss', function () {
    return gulp.src([config.codeDirectory.scss])
        .pipe(sass())
        .pipe(autoprefix({
            browsers: config.browsersCompatibility
        }))
        .pipe(minifyCss())
        .pipe(gulp.dest(config.destDirectory.root));
});
gulp.task('watchScss', function() {
    gulp.watch(config.codeDirectory.root + '/style/*.scss', ['buildCss'])
});

gulp.task('js', function () {
  return browserify('./code/main.js')
      .transform(babelify, {
        presets: ['es2015']
      })
      .bundle()
      .pipe(source('application.js'))
      .pipe(gulp.dest(config.destDirectory.root))
});

gulp.task('buildHtml', function () {/*
     gulp.src(config.codeDirectory.html)
      .pipe(replace(/<@=.*=@>/, function(match) {
         return handleTemplateBinding(match);
      }))
      .pipe(gulp.dest(config.destDirectory.root + '/html'));*/

    gulp.src('index.html')
      .pipe(replace(/<@=.*=@>/, function(match) {
         return handleTemplateBinding(match);
      }))
            .pipe(gulp.dest(config.destDirectory.root));
});

gulp.task('default', ['buildHtml', 'js', 'buildCss', 'watchScss']);

/*gulp.task('buildJs', ['bundleAppJsFiles'], function () {
    return gulp.src([
        config.tmpDir + '/third_party_bundle.js',
        config.tmpDir + '/' + config.destDirectory.jsFile
        ])
        .pipe(uglify.minifyJS({
            addSourceMaps: false,
            concat: true,
            concatFilename: config.destDirectory.jsFile,
            concatOutput: config.destDirectory.root,
        }))
        .pipe(concat(config.destDirectory.jsFile))
        .pipe(gulp.dest(config.destDirectory.root));
});*/
