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

const productionBuild = process.argv[2] === "build";

const sourceDir = "src";
const distDir = "dist";

const stylesSourceDir = "styles/scss/*.scss";
const scriptsSourceDir = "scripts/ts/*.ts";
const stylesTargetDir = productionBuild ? distDir : `${sourceDir}/styles/css`;
const scriptsTargetDir = productionBuild ? distDir : `${sourceDir}/scripts/js`;

let jsFileName = "";
let cssFileName = "";

const transpileAndMinifyTypeScript = () => {
  const file = tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(
      minify({
        ext: {
          min: ".js",
        },
        noSource: true,
      })
    );

  const hashHandler = productionBuild ? file.pipe(hash()) : file;

  return hashHandler
    .pipe(
      rename((path) => {
        path.basename += ".min";
        jsFileName = `${path.basename}.js`;
      })
    )
    .pipe(gulp.dest(scriptsTargetDir));
};

const transpileAndMinifySASS = () => {
  const file = gulp
    .src(`${sourceDir}/${stylesSourceDir}`)
    .pipe(sass.sync({ outputStyle: "compressed" }));

  const hashHandler = productionBuild ? file.pipe(hash()) : file;

  return hashHandler
    .pipe(
      rename((path) => {
        path.basename += ".min";
        cssFileName = `${path.basename}.css`;
      })
    )
    .pipe(gulp.dest(stylesTargetDir));
};

const watchTypeScript = () =>
  gulp.watch(`${sourceDir}/${scriptsSourceDir}`, transpileAndMinifyTypeScript);

const watchSASS = () =>
  gulp.watch(`${sourceDir}/${stylesSourceDir}`, transpileAndMinifySASS);

const clearBuild = () => del(distDir);

const replaceHTMLImports = () =>
  gulp
    .src(`${sourceDir}/index.html`)
    .pipe(
      htmlreplace({
        css: cssFileName,
        js: {
          src: jsFileName,
          tpl: '<script src="%s" defer></script>'
        }
      })
    )
    .pipe(gulp.dest(distDir));

const startWebServer = () =>
  gulp.src(sourceDir).pipe(
    webserver({
      port: 666,
      livereload: true,
      open: "http://localhost:666/",
    })
  );

exports.serve = gulp.parallel(startWebServer, watchTypeScript, watchSASS);

exports.build = gulp.series(
  clearBuild,
  transpileAndMinifyTypeScript,
  transpileAndMinifySASS,
  replaceHTMLImports
);
