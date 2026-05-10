#!/bin/bash
rm -rf ~/Desktop/filemanager
cp -r /Volumes/Dev/Tools/ExcelOTools/develop/filemanager ~/Desktop
cd ~/Desktop/filemanager
rm -rf node_modules
npm install
npm run build
npm run electron:start
