# [![Uplo Logo](http://uplo.tech/img/svg/uplo-green-logo.svg)](http://uplo.tech/) Nodejs Wrapper

[![Build Status](https://travis-ci.org/NebulousLabs/Nodejs-Uplo.svg?branch=master)](https://travis-ci.org/NebulousLabs/Nodejs-Uplo)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![devDependency Status](https://david-dm.org/NebulousLabs/Nodejs-Uplo/dev-status.svg)](https://david-dm.org/NebulousLabs/Nodejs-Uplo#info=devDependencies)
[![dependencies Status](https://david-dm.org/NebulousLabs/Nodejs-Uplo.svg)](https://david-dm.org/NebulousLabs/Nodejs-Uplo#info=dependencies)
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)

# A Highly Efficient Decentralized Storage Network

This is a [Nodejs](https://nodejs.org/) wrapper for
[Uplo](https://github.com/NebulousLabs/Uplo). Use it in your apps to easily
interact with the Uplo storage network via function calls instead of manual http
requests.

## Prerequisites

- [node & npm (version 5.9.0+ recommended)](https://nodejs.org/download/)

## Installation

```
npm install uplo.js
```

## Example Usage

```js
import { connect } from 'uplo.js'

// Using promises...
// connect to an already running Uplo daemon on localhost:8480 and print its version
connect('localhost:8480')
  .then((uplod) => {
    uplod.call('/daemon/version').then((version) => console.log(version))
  })
  .catch((err) => {
    console.error(err)
  })

// Or ES7 async/await
async function getVersion() {
  try {
    const uplod = await connect('localhost:8480')
    const version = await uplod.call('/daemon/version')
    console.log('Uplod has version: ' + version)
  } catch (e) {
    console.error(e)
  }
}

```
You can also forgo using `connect` and use `call` directly by providing an API address as the first parameter:

```js
import { call } from 'uplo.js'

async function getVersion(address) {
  try {
    const version = await call(address, '/daemon/version')
    return version
  } catch (e) {
    console.error('error getting ' + address + ' version: ' + e.toString())
  }
}

console.log(getVersion('10.0.0.1:8480'))
```

`uplo.js` can also launch a uplod instance given a path on disk to the `uplod` binary.  `launch` takes an object defining the flags to use as its second argument, and returns the `child_process` object.  You are responsible for keeping track of the state of this `child_process` object, and catching any errors `launch` may throw.

```js
import { launch } from 'uplo.js'

try {
  // Flags are passed in as an object in the second argument to `launch`.
  // if no flags are passed, the default flags will be used.
  const uplodProcess = launch('/path/to/your/uplod', {
    'modules': 'cghmrtw',
    'profile': true,
  })
  // uplodProcess is a ChildProcess class.  See https://nodejs.org/api/child_process.html#child_process_class_childprocess for more information on what you can do with it.
  uplodProcess.on('error', (err) => console.log('uplod encountered an error ' + err))
} catch (e) {
  console.error('error launching uplod: ' + e.toString())
}
```

The call object passed as the first argument into call() are funneled directly
into the [`request`](https://github.com/request/request) library, so checkout
[their options](https://github.com/request/request#requestoptions-callback) to
see how to access the full functionality of [Uplo's
API](https://github.com/NebulousLabs/Uplo/blob/master/doc/API.md)

```js
Uplod.call({
  url: '/consensus/block',
  method: 'GET',
  qs: {
    height: 0
  }
})
```

Should log something like:

```bash
null { block:
 { parentid: '0000000000000000000000000000000000000000000000000000000000000000',
   nonce: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
   timestamp: 1433600000,
   minerpayouts: null,
   transactions: [ [Object] ] } }
```
