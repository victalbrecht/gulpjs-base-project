const gulp = require("gulp");
const hash = require("gulp-hash");
const rename = require("gulp-rename");
const webserver = require("gulp-webserver");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const sass = require("gulp-sass")(require("sass"));
const minify = require("gulp-minify");
const htmlreplace = require("gulp-html-replace");
const del = require("del");

const sourceDir = "src";
const distDir = "dist";

const stylesDir = "/styles/*.scss";
const scriptsDir = "/scripts/*.ts";

let hashedJS;
let hashedCSS;

const startWebServer = () =>
  gulp.src(sourceDir).pipe(
    webserver({
      port: 666,
      livereload: true,
      open: "http://localhost:666/",
    })
  );

const watchTypeScript = () =>
  gulp.watch(`${sourceDir}/${scriptsDir}`, transpileTypeScript);

const watchSASS = () =>
  gulp.watch(`${sourceDir}/${stylesDir}`, transpileAndMinifySASS);

exports.serve = gulp.parallel(startWebServer, watchTypeScript, watchSASS);

const clearBuild = () => del(distDir);

const transpileAndMinifyTypeScript = () =>
  tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(
      minify({
        ext: {
          min: ".js",
        },
        noSource: true,
      })
    )
    .pipe(hash())
    .pipe(
      rename((path) => {
        path.basename += ".min";
        hashedJS = `${path.basename}.js`;
      })
    )
    .pipe(gulp.dest(distDir));

const transpileAndMinifySASS = () =>
  gulp
    .src(`${sourceDir}/${stylesDir}`)
    .pipe(sass.sync({ outputStyle: "compressed" }))
    .pipe(hash())
    .pipe(
      rename((path) => {
        path.basename += ".min";
        hashedCSS = `${path.basename}.css`;
      })
    )
    .pipe(gulp.dest(distDir));

const replaceHTMLImports = () =>
  gulp
    .src(`${sourceDir}/index.html`)
    .pipe(
      htmlreplace({
        css: hashedCSS,
        js: hashedJS,
      })
    )
    .pipe(gulp.dest(distDir));

exports.build = gulp.series(
  clearBuild,
  transpileAndMinifyTypeScript,
  transpileAndMinifySASS,
  replaceHTMLImports
);
