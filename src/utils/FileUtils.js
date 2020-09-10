'use strict';

const fs = require('fs');
const path = require('path');
const stripJsonComments = require('strip-json-comments');

class FileUtils {
    static readFile(path, encoding = 'utf-8') {
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    console.error('Failed to read file', path);
                    return reject(err);
                }
                const json = stripJsonComments(data.toString(encoding));
                const obj = JSON.parse(json);
                resolve(obj);
            });
        });
    }
    static async readDir(folder, ext = '.json') {
        return new Promise(async (resolve, reject) => {
            const list = [];
            const files = await this.getFiles(folder);
            if (!files) {
                const err = `Failed to get list of files for folder ${folder}`
                console.log(err);
                return reject(err);
            }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (path.extname(file) !== ext) {
                    continue;
                }
                const filePath = path.resolve(folder, file);
                const obj = await this.readFile(filePath);
                list.push(obj);
            }
            resolve(list);
        });
    }
    static getFiles(folder) {
        return new Promise((resolve, reject) => {
            fs.readdir(folder, (err, files) => {
                if (err) {
                    console.error('Failed to read folder', folder);
                    return reject(err);
                }
                resolve(files);
            });
        });
    }
}

module.exports = FileUtils;