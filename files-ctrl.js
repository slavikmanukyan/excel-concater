const { mimes } = require('./excel');
const { dialog } = require('electron').remote;
const path = require('path');

(function (angular) {
    const app = angular.module('app');
    
    app.controller('filesCtrl', function ($scope) {
       const vm = this; 
       vm.files = [];
       vm.filesToProccess = [];
       vm.filesMap = {};
       
       vm.selectFiles = function () {
           dialog.showOpenDialog({
               title: 'Select excel files',
               buttonLabel: 'Select',
               filters: [
                   { name: 'Excel files', extensions: ['xls', 'xlsx'] }
               ],
               properties: ['multiselections']
           }, (files) => {
              if (!files || !files.length) return;
              $scope.$apply(function(){
              files.forEach(file => {
               if (!vm.filesMap[file]) {
                   vm.filesMap[file] = true;
                   vm.filesToProccess = [...vm.filesToProccess, file];
               }
              });
              }); 
           });
       };
       
       vm.select = function () {
           vm.files.forEach(file => {
               if (!vm.filesMap[file.path] && ~mimes.indexOf(file.type)) {
                   vm.filesMap[file.path] = true;
                   vm.filesToProccess = [...vm.filesToProccess, file.pth];
               }
           });
       };

       vm.name = function(file) {
         return path.basename(file);
       };
       
       vm.calcClass = function (e) {
           return   [].some.call(e.dataTransfer.files, (file => ~mimes.indexOf(file.type))) ? 'dragging-accept' : 'dragging-reject';
       };
    });
}(angular));