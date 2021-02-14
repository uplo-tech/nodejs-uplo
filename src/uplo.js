// uplo.js: a lightweight node wrapper for starting, and communicating with
// a Uplo daemon (uplod).
import BigNumber from 'bignumber.js'
import fs from 'fs'
import { spawn } from 'child_process'
import Path from 'path'
import request from 'request'
import http from 'http'

const agent = new http.Agent({
	keepAlive: true,
	maxSockets: 20,
})

// uplo.js error constants
export const errCouldNotConnect = new Error('could not connect to the Uplo daemon')

// Uplocoin -> hastings unit conversion functions
// These make conversion between units of Uplo easy and consistent for developers.
// Never return exponentials from BigNumber.toString, since they confuse the API
BigNumber.config({ EXPONENTIAL_AT: 1e+9 })
BigNumber.config({ DECIMAL_PLACES: 30 })

const hastingsPerUplocoin = new BigNumber('10').toPower(24)
const uplocoinsToHastings = (uplocoins) => new BigNumber(uplocoins).times(hastingsPerUplocoin)
const hastingsToUplocoins = (hastings) => new BigNumber(hastings).dividedBy(hastingsPerUplocoin)

// makeRequest takes an address and opts and returns a valid request.js request
// options object.
export const makeRequest = (address, opts) => {
	let callOptions = opts
	if (typeof opts === 'string') {
		callOptions = { url: opts }
	}
	callOptions.url = 'http://' + address + callOptions.url
	callOptions.json = true
	if (typeof callOptions.timeout === 'undefined') {
		callOptions.timeout = 10000
	}
	callOptions.headers = {
		'User-Agent': 'Uplo-Agent',
	}
	callOptions.pool = agent

	return callOptions
}

// Call makes a call to the Uplo API at `address`, with the request options defined by `opts`.
// returns a promise which resolves with the response if the request completes successfully
// and rejects with the error if the request fails.
const call = (address, opts) => new Promise((resolve, reject) => {
	const callOptions = makeRequest(address, opts)
	request(callOptions, (err, res, body) => {
		if (!err && (res.statusCode < 200 || res.statusCode > 299)) {
			reject(body)
		} else if (!err) {
			resolve(body)
		} else {
			reject(err)
		}
	})
})

// launch launches a new instance of uplod using the flags defined by `settings`.
// this function can `throw`, callers should catch errors.
// callers should also handle the lifecycle of the spawned process.
const launch = (path, settings) => {
	const defaultSettings = {
		'api-addr': 'localhost:8480',
		'host-addr': ':8482',
		'rpc-addr': ':8481',
		'authenticate-api': false,
		'disable-api-security': false,
	}
	const mergedSettings = Object.assign(defaultSettings, settings)
	const filterFlags = (key) => mergedSettings[key] !== false
	const mapFlags = (key) => '--' + key + '=' + mergedSettings[key]
	const flags = Object.keys(mergedSettings).filter(filterFlags).map(mapFlags)

	const uplodOutput = (() => {
		if (typeof mergedSettings['uplo-directory'] !== 'undefined') {
			return fs.createWriteStream(Path.join(mergedSettings['uplo-directory'], 'uplod-output.log'))
		}
		return fs.createWriteStream('uplod-output.log')
	})()

	const opts = { }
	if (process.geteuid) {
		opts.uid = process.geteuid()
	}
	const uplodProcess = spawn(path, flags, opts)
	uplodProcess.stdout.pipe(uplodOutput)
	uplodProcess.stderr.pipe(uplodOutput)
	return uplodProcess
}

// isRunning returns true if a successful call can be to /gateway
// using the address provided in `address`.  Note that this call does not check
// whether the uplod process is still running, it only checks if a Uplo API is
// reachable.
async function isRunning(address) {
	try {
		await call(address, {
			url: '/gateway',
			timeout: 6e5, // 10 minutes
		})
		return true
	} catch (e) {
		return false
	}
}

// uplodWrapper returns an instance of a Uplod API configured with address.
const uplodWrapper = (address) => {
	const uplodAddress = address
	return {
		call: (options)  => call(uplodAddress, options),
		isRunning: () => isRunning(uplodAddress),
	}
}

// connect connects to a running Uplod at `address` and returns a uplodWrapper object.
async function connect(address) {
	const running = await isRunning(address)
	if (!running) {
		throw errCouldNotConnect
	}
	return uplodWrapper(address)
}

export {
	connect,
	launch,
	isRunning,
	call,
	uplocoinsToHastings,
	hastingsToUplocoins,
	agent,
}
