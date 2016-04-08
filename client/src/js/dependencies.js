/**
 * Register global variables.
 * This will reduce build time with browserify.
 */
global.window._ = require('underscore');
global.window.ol = require('openlayers');
global.window.Backbone = require('backbone');
global.window.React = require('react');
global.window.ReactDOM = require('react-dom');
global.window.proj4 = require('proj4');
global.window.marked = require('marked');
global.window.$ = require('jquery');
global.window.jQuery = global.window.$;