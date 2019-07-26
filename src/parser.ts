import * as url from 'url'
import * as yargs from 'yargs'
import { YargsObj, ParsedCURL, RequestBodyType, RequestBody } from './interface'
import * as qs from 'querystring'
import * as multipart from 'parse-multipart'

// Based on https://github.com/NickCarneiro/curlconverter/blob/master/util.js


export default class CURLParser {

    private cURLStr: string
    private yargObj: YargsObj

    constructor (cURLStr: string) {
        this.cURLStr = cURLStr
        const yargObj = yargs.parse(this.pretreatment(cURLStr))
        this.yargObj = yargObj
    }

    /** 预处理 */
    private pretreatment (cURLStr: string): string {
        if (!cURLStr.startsWith('curl')) {
            throw new Error ('curl syntax error')
        }
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

        cURLStr = cURLStr.replace(/ --header/g, ' -H')
        cURLStr = cURLStr.replace(/ --user-agent/g, ' -A')
        cURLStr = cURLStr.replace(/ --request/g, ' -X')
        cURLStr = cURLStr.replace(/ --(data|data-binary|data-urlencode)/g, ' -d')
        cURLStr = cURLStr.replace(/ --form/g, ' -F')
        cURLStr = cURLStr.trim()

        cURLStr = cURLStr.replace(/^curl/, '')


        return cURLStr
    }

    /** 如果有误写的两个相同的，取最后一个 */
    private getFirstItem (key: string): string {
        const e = this.yargObj[key]
        if (!Array.isArray(e)) {
            return e as string
        }
        return e[e.length - 1] || ''
    }

    getUrl () {
        const yargObj = this.yargObj
        let uri = ''
        uri = yargObj._[0]
        if (yargObj['url']) {
            uri = yargObj['url'] as string
        }
        if (!uri) {
            Object.values(yargObj).forEach(e => {
                if (typeof e !== 'string') {
                    return
                }
                if (e.startsWith('http') || e.startsWith('www.')) {
                    uri = e
                }
            })
        }
        return uri
    }

    getQuery (uri: string) {
        const obj = url.parse(uri, true)
        return obj.query
    }

    getHeaders (): ParsedCURL['headers'] {
        const yargObj = this.yargObj
        const headers: ParsedCURL['headers'] = {}

        if (!Reflect.has(yargObj, 'H')) {
            return headers
        }

        let yargHeaders = yargObj['H'] as string[]
        if (!Array.isArray(yargHeaders)) {
            yargHeaders = [yargHeaders]
        }

        yargHeaders.forEach(item => {
            const i = item.indexOf(':')
            const name = item.substring(0, i).trim().toLowerCase()
            const val = item.substring(i + 1).trim()
            headers[name] = val
        })

        if (Reflect.has(yargObj, 'A')) {
            headers['user-agent'] = this.getFirstItem('A')
        }


        return headers
    }

    getMethods (): string {
        const yargObj = this.yargObj
        let me = this.getFirstItem('X') || 'GET'
        if (Reflect.has(yargObj, 'd') || Reflect.has(yargObj, 'F')) {
            me = 'POST'
        }

        return me.toUpperCase()
    }

    getBody (headers: ParsedCURL['headers']) {
        const contentType = headers['content-type']
        let type: RequestBodyType = 'text/plain'
        let data = this.yargObj['d'] as string
        if (contentType) {
            if (contentType.indexOf('json') > -1) {
                type = 'application/json'
            }
            if (contentType.indexOf('urlencoded') > -1) {
                type = 'application/x-www-form-urlencoded'
            }

            if (this.cURLStr.indexOf(' --data-urlencoded') > -1) {
                type = 'application/x-www-form-urlencoded'
            }
            if (Array.isArray(data) && type !== 'application/x-www-form-urlencoded') {
                type = 'application/x-www-form-urlencoded'
                data = (data as string[]).join('&')
            }

            if (this.yargObj['F']) {
                type = 'multipart/form-data'
            }

            if (contentType.indexOf('form-data') > -1) {
                type = 'multipart/form-data'
                let boundary = ''
                const match = contentType.match('/boundary=.+/')
                if (!match) {
                    type = 'text/plain'
                } else {
                    boundary = match[0].slice(9)
                    try {
                        const parts = multipart.parse(data, boundary)
                        this.yargObj['F'] = parts.map(item => {
                            return `${item.name}=${item.data}`
                        })
                    } catch (error) {
                        type = 'text/plain'
                    }
                }
            }
        }


        let body: any = ''

        switch (type) {
            case 'application/json':
                try {
                    body = JSON.parse(data)
                } catch (error) {
                    body = data
                }
                break
            case 'application/x-www-form-urlencoded':
                body = qs.parse(data)
                break
            case 'multipart/form-data':
                // 指定 form
                if (this.yargObj['F']) {
                    const multipartUpload = {}
                    let yargFrom = this.yargObj['F'] as string[]
                    if (!Array.isArray(yargFrom)) {
                        yargFrom = [ yargFrom ]
                    }
                    yargFrom.forEach(item => {
                        const arr = item.split('=')
                        multipartUpload[arr[0]] = arr[1]
                    })
                    body = multipartUpload
                } else {
                    // 从 d 中解析
                }
                break
            default:
                body = 'data'
                break
        }

        const requestBody: RequestBody = {
            type,
            data: body
        }

        return requestBody
    }

    parse () {
        const uri = this.getUrl()
        const headers = this.getHeaders()
        const ret: ParsedCURL = {
            url: uri,
            method: this.getMethods(),
            headers,
            query: this.getQuery(uri),
            body: this.getBody(headers)
        }

        return ret
    }
}
