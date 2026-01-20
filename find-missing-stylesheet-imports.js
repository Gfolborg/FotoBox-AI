const fs = require('fs');
const path = require('path');

const clientDir = 'client';
const filesWithMissingImport = [];

function findFilesInDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFilesInDir(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

const allFiles = findFilesInDir(clientDir);

allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('StyleSheet.create')) {
      if (!content.includes('StyleSheet') || !content.includes('react-native')) {
        filesWithMissingImport.push(file);
      }
    }
  } catch (err) {
    console.error(`Error reading file ${file}:`, err);
  }
});

if (filesWithMissingImport.length > 0) {
  console.log('Files with StyleSheet.create but potentially missing StyleSheet import:');
  filesWithMissingImport.forEach(file => console.log(file));
} else {
  console.log('No files found with missing StyleSheet import.');
}
