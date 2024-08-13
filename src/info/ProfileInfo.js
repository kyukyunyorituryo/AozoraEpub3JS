// ProfileInfo.js

import fs from 'fs';
import path from 'path';
import PropertiesReader from 'properties-reader';
import Properties from 'node-properties';

export default class ProfileInfo {
    /**
     * @param {string} fileName - ファイル名
     * @param {string} name - プロファイル名
     * @param {Properties} props - プロパティオブジェクト
     */
    constructor(fileName, name, props) {
        this.fileName = fileName;
        this.name = name;
        this.props = props;
    }

    /**
     * プロファイル情報を更新する
     * @param {string} profilePath - プロファイルパス
     * @throws {Error}
     */
    async update(profilePath) {
        if (this.fileName) {
            const filePath = path.join(profilePath, this.fileName);
            const propsString = Properties.stringify(this.props.getAllProperties(), { separator: '=' });
            await fs.promises.writeFile(filePath, propsString, 'utf8');
        }
    }

    /**
     * オブジェクトの名前を取得する
     * @returns {string}
     */
    toString() {
        return this.name;
    }

    /**
     * ファイル名を取得する
     * @returns {string}
     */
    getFileName() {
        return this.fileName;
    }

    /**
     * ファイル名を設定する
     * @param {string} fileName
     */
    setFileName(fileName) {
        this.fileName = fileName;
    }

    /**
     * 名前を取得する
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * 名前を設定する
     * @param {string} name
     */
    setName(name) {
        this.name = name;
    }

    /**
     * プロパティオブジェクトを取得する
     * @returns {Properties}
     */
    getProperties() {
        return this.props;
    }

    /**
     * プロパティオブジェクトを設定する
     * @param {Properties} props
     */
    setProps(props) {
        this.props = props;
    }
}