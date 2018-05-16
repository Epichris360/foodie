 // including plugins
var gulp = require('gulp')
var minifyCSS = require('gulp-clean-css')
var autoprefixer = require('gulp-autoprefixer')
var gp_concat = require('gulp-concat')
var gp_rename = require('gulp-rename')
var gp_uglify = require('gulp-uglify')
// var less = require('gulp-less')
var to5 = require('gulp-6to5')
var path = require('path')

gulp.task('css-dashboard', function(){
    return gulp.src(
            [
                './public/dashboard/css/bootstrap.min.css',
                './public/dashboard/css/animate.min.css',
                './public/dashboard/css/paper-dashboard.css',
                './public/dashboard/css/demo.css',
                './public/dashboard/css/slider.css',
                './public/dashboard/css/font-awesome.min.css',
                './public/dashboard/css/themify-icons.css',
                './public//dashboard/css/flatpickr.min.css'
            ]
        )
        .pipe(minifyCSS())
        //.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
        .pipe(gp_concat('style.min.css'))
        .pipe(gulp.dest('./public/dist/dashboard/css/'))
})

gulp.task('css-client', function(){
    return gulp.src(
            [
                './public/css/core.min.css',
                './public/css/thesaas.min.css',
                './public/css/style.css',
                './public/css/pagination.css',
                './public/css/stripe.css',
                './public/css/app.css',

            ]
        )
        .pipe(minifyCSS())
        //.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
        .pipe(gp_concat('style.min.css'))
        .pipe(gulp.dest('./public/dist/client/css/'))
})

gulp.task('css',['css-client','css-dashboard'], function(){})

gulp.task('copy-fonts-dashboard', function(){
    return gulp.src(
            ['./public/dashboard/fonts/**']
        )
        .pipe(gulp.dest('./public/dist/dashboard/fonts/'))
})

gulp.task('copy-fonts-client', function(){
    return gulp.src(
            ['./public/fonts/**']
        )
        .pipe(gulp.dest('./public/dist/client/fonts/'))
})

gulp.task('copy-fonts',['copy-fonts-dashboard','copy-fonts-client'], function(){})

gulp.task('imgs', function(){
    return gulp.src(
            ['./public/img/**']
        )
        .pipe(gulp.dest('./public/dist/img/'))
})

gulp.task('style', ['css', 'copy-fonts', 'imgs'], function(){})


gulp.task('js-client', function(){ 
    return gulp.src(
            [   
                './public/js/jquery.js',
                './public/js/app.js',
                './public/js/core.min.js',
                './public/js/thesaas.min.js',
                './public/js/script.js',
                './public/js/dropzone.js', 
                './public/js/dist/sweetalert2.all.js',

            ]
        )
        .pipe(gp_concat('vendor.min.js'))
        .pipe(gulp.dest('./public/dist/client/js/'))
        .pipe(gp_rename('vendor.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/client/js/')) 
});

gulp.task('js-dashboard', function(){
    return gulp.src(
            [   
                './public/dashboard/js/jquery-1.10.2.js',
                './public/js/dropzone.js', 
                './public/dashboard/js/bootstrap.min.js',
                './public/dashboard/js/bootstrap-checkbox-radio.js',
                './public/dashboard/js/chartist.min.js',
                './public/dashboard/js/bootstrap-notify.js',
                './public/dashboard/js/paper-dashboard.js',
                './public/dashboard/js/demo.js',
                './public/js/dist/sweetalert2.all.js',

            ]
        )
        .pipe(gp_concat('vendor.min.js'))
        .pipe(gulp.dest('./public/dist/dashboard/js/'))
        .pipe(gp_rename('vendor.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/dashboard/js/')) 
});

gulp.task('js', ['js-dashboard', 'js-client'], function(){})

gulp.task('watch', function() {
    gulp.watch(['./src/*/**.js', './src/*/*/**.js', './public/js/**.js'], ['es6-es5'])
})

gulp.task('prod', ['style', 'es6-es5'], function(){})

gulp.task('default', ['es6-es5', 'watch'], function(){})
