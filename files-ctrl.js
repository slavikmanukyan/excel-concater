const { mimes } = require('./excel');
const { dialog } = require('electron').remote;
const path = require('path');
const { lstatSync, readFileSync, writeFileSync } = require('fs');
const xlsx = require('xlsx');

(function (angular) {
    const app = angular.module('app');
    
    app.controller('filesCtrl', function ($scope, $timeout) {
       const vm = this; 
       vm.files = [];
       vm.filesToProccess = [];
       vm.filesMap = {};
       vm.fileSelected = false;
       vm.selectedFile = {};
       vm.headerFile = '';
       vm.sheet = {
           hintWord: 'Փողոցը, նրբանցքը'
       };
       vm.status =  '';
       vm.progress = 0;
       
       function processHTML() {
            vm.status = `Proccessing files as html usin hint word as ${vm.sheet.hintWord}`;
            vm.progress = 1;
            let result;
            let mainTable;
            $timeout(() => {
                vm.headerFile = vm.headerFile || vm.filesToProccess[0];
                if (!~vm.filesToProccess.indexOf(vm.headerFile))  {
                    vm.headerFile = vm.filesToProccess[0];
                }
                vm.status = `Proccessing header using file ${vm.name(vm.headerFile)}`;
                
                result = document.implementation.createHTMLDocument('new doc');
                result.write(readFileSync(vm.headerFile).toString());
                mainTable = $(result).find('table').eq(0).find('tbody').eq(0);
                vm.progress = 10;
                $timeout(process, 100);
            }, 500);

            let c = 0;
            const hintReg = new RegExp(vm.sheet.hintWord);
            
            function process() {
                if (c == vm.filesToProccess.length) {
                    vm.status = 'Done';
                    vm.progress = 100;
                    return vm.result(result);
                }
                if (vm.filesToProccess[c] == vm.headerFile) {
                    c++;
                    return $timeout(process, 100);
                }
                vm.status = `Proccessing file ${vm.name(vm.filesToProccess[c])}`
                let isFoundHint = false;
                const fileDoc = document.implementation.createHTMLDocument('doc'+c);
                fileDoc.write(readFileSync(vm.filesToProccess[c]).toString());
                const table = $(fileDoc).find('table').eq(0);
                
                table.find('tr').each(function(){
                    if (!isFoundHint) {
                        $(this).find('td').each(function() {
                           if (hintReg.test($(this).text())) {
                               return isFoundHint = true;
                           }
                        });
                    } else {
                        mainTable.append($(this));
                    }
                });
                vm.progress += 90/(vm.filesToProccess.length - 1)
                c++;
                $timeout(process, 100);
            }
       }
       
       vm.selectFiles = function () {
           dialog.showOpenDialog({
               title: 'Select excel files',
               buttonLabel: 'Select',
               filters: [
                   { name: 'Excel files', extensions: ['xls', 'xlsx'] }
               ],
               properties: ['multiSelections']
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
                   vm.filesToProccess = [...vm.filesToProccess, file.path];
               }
           });
       };
       
       vm.fileToggle = function (file) {
           if (!~vm.filesToProccess.indexOf(file)) return;
           
           if (vm.fileSelected) {
               if (vm.selectedFile.path == file)
                 return vm.fileSelected = false;
           }           
           vm.fileSelected = true;            
           if (vm.fileSelected) {
               vm.selectedFile = file;
               vm.selectedFile = lstatSync(file);
               vm.selectedFile.name = vm.name(file);
               vm.selectedFile.path = file;
           }
       }

       vm.name = function(file) {
         return path.basename(file);
       };
       
       vm.close = function() {
           vm.fileSelected = false;
       };
       
       vm.remove = function(file) {
           const index = vm.filesToProccess.indexOf(file);
           if (~index) {
               vm.filesToProccess.splice(index, 1);
           }
           vm.filesMap[file] = false;
           vm.fileSelected = false;
       };
       
       vm.useHeader = function(file) {
         if (!~vm.filesToProccess.indexOf(file)) return;
         
         vm.headerFile = file;
       };
       
       vm.clearAll = function() {
         vm.filesToProccess = [];
         vm.filesMap = {};
         vm.fileSelected = false;
       };
       
       vm.processAll = function() {
         if (!vm.filesToProccess.length) return;           
         vm.proccessing = true;
         vm.status = 'Creating header';

         if (vm.sheet.isHTML) {
             return processHTML();
         }
         
         return dialog.showMessageBox({
             type: 'error',
             title: 'Error',
             message: 'XLS format not implemented',
             buttons: ['Ok']
         });
         
         let resultWB;
         vm.headerFile = vm.headerFile || vm.filesToProccess[0];
         if (!~vm.filesToProccess.indexOf(vm.headerFile))  {
             vm.headerFile = vm.filesToProccess[0];
         }
         const headerWB = xlsx.readFile(vm.headerFile);
         resultWB = angular.copy(headerWB); 

         let c = 0;
         
         function proc() {
             if (c > vm.filesToProccess.length) {
                 $timeout(() => {
                     vm.proccessing = false;
                 }, 1000);
                 return;
             }
             
             vm.progress = (c * 100)/vm.filesToProccess.length;
             c++;
             $timeout(proc, 2000);
         }
         $timeout(proc);
       };
       
       vm.result = function(result) {
           vm.data = result.documentElement.outerHTML;
           vm.completed = true;
       };
       
       vm.saveFile = function() {
         if (!vm.completed || !vm.data) return;
         
         dialog.showSaveDialog({
             title: 'Save concated xls',
             filters: [
                   { name: 'Excel files', extensions: ['xls'] }
               ]
         }, (file) => {
            if (!file) return;
            
            debugger
             writeFileSync(file, vm.data);
             dialog.showMessageBox({
                 type: 'info',
                 title: 'Saved',
                 message: 'Your file was successfuly saved!',
                 buttons: ['Ok']
             });
         });
       };
       
       vm.calcClass = function (e) {
           return   [].some.call(e.dataTransfer.files, (file => ~mimes.indexOf(file.type))) ? 'dragging-accept' : 'dragging-reject';
       };
    });
    
    app.filter('bytes', function() {
	return function(bytes, precision) {
		if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
		if (typeof precision === 'undefined') precision = 1;
		var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			number = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
	}
});
}(angular));