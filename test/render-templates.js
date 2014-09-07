'use strict';

/*jshint maxlen:false */
/*global jasmine, beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit */

var fs              = require('fs');
var path            = require('path');
var gutil           = require('gulp-util');
var BPromise        = require('bluebird')

var renderTemplates = require('../lib/render-templates.js');
var renderTemplate  = require('../lib/render-templates.js').render;
var htmlOutput      = fs.readFileSync('test/output/template.html').toString();
var jsonOutput      = fs.readFileSync('test/output/template.json').toString();
//

// Use the ios files for that
// Should add a fill: none property
// See https://github.com/Hiswe/gulp-svg-symbols/issues/9
var svgFile         = new gutil.File({
  base: 'test/source',
  cwd: 'test/',
  path: 'test/source/ios.svg',
  contents: fs.readFileSync('test/source/ios.svg')
});
var datas           = [
  {id: 'pouic'},
  {id: 'clapou'}
];
var templates       = [
  path.join(__dirname, './source/template.html'),
  path.join(__dirname, './source/template.json')
];

console.log(templates);

describe('Templates', function () {

  it('should render a random template with random infos', function (done) {
    renderTemplate(templates[0], datas)
    .then(function (file) {
      expect(file.contents.toString()).toEqual(htmlOutput);
      done();
    })
    .catch(function (e){
      console.log(e);
      done();
    });
  });

  it('should render an array of templates', function (done) {
    var files = renderTemplates(templates, datas);
    BPromise.all(files).then(function (files) {
      expect(files.length).toEqual(2);
      expect(files[0].contents.toString()).toEqual(htmlOutput);
      expect(files[1].contents.toString()).toEqual(jsonOutput);
      done();
    });
  });
});
