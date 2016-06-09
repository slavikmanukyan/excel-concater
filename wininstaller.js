const electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: './excel-concat-win32-x64',
    outputDirectory: '~/Desktop/ec',
    authors: 'Slavik Manukyan',
    exe: 'excel-concat.exe',
    setupExe: 'ECSetup.exe'
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));