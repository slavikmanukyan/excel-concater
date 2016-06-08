const config = require('./excel');

(function(angular) {
    let app = angular.module('app', ['ngFileUpload']);

    app.controller('mainCtrl', function() {
       let main = this;

       main.version = config.version;
    });
}(angular));