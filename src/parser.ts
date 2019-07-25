import * as url from 'url'
import * as yargs from 'yargs'

// Based on https://github.com/NickCarneiro/curlconverter/blob/master/util.js

class CURLParser {
    parse (cURLStr: string) {
        // 删除换行
        const newLineFound = /\r|\n/.exec(cURLStr)
        if (newLineFound) {
            cURLStr = cURLStr.replace(/\\\r|\\\n/g, '')
        }

        // 改成通用写法
        cURLStr = cURLStr.replace(/ -XPOST/, ' -X POST')
        cURLStr = cURLStr.replace(/ -XGET/, ' -X GET')
        cURLStr = cURLStr.replace(/ -XPUT/, ' -X PUT')
        cURLStr = cURLStr.replace(/ -XPATCH/, ' -X PATCH')
        cURLStr = cURLStr.replace(/ -XDELETE/, ' -X DELETE')
        cURLStr = cURLStr.trim()

        const yargObj = yargs.argv
    }
}
