## parse-curl-js

An better cURL string parser

Based on [curlconverter](https://github.com/NickCarneiro/curlconverter)

## Usage

```js
const { CURLParser } = require('parse-curl-js')
// or es6
import { CURLParser } from 'parse-curl-js'


const cURLParser = new CURLParser(`curl 'http://127.0.0.1:8080' -X POST -H "content-type: application/json" -d '{"data": true}'`)

console.log(cURLParser.parse())

```

Result

```ts
type RequestBodyType = 'text/plain' | 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data'

interface RequestBody {
    type: RequestBodyType
    data: any
}


interface ParsedCURL {
    /** url */
    url: string
    /** query */
    query: ParsedUrlQuery
    /** request method uppercase */
    method: string
    /** request header ...... includes cookies */
    headers: {
        [props: string]: string
    }
    /** request body ...... parsed */
    body: RequestBody
}

```

## LICENSE
[MIT](./LICENSE)
