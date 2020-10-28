'use strict'

// requirements, globals

const timeFormat = date => `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
const loggerColors = {
	w: '\x1b[0m',
	d: '\x1b[0m\x1b[2m',
	r: '\x1b[0m\x1b[31m',
	g: '\x1b[0m\x1b[32m',
	y: '\x1b[0m\x1b[1m\x1b[33m',
	b: '\x1b[0m\x1b[36m'
}
const loggerCodes = {
	load: '\x1b[0m\x1b[1m\x1b[33mLOADING\x1b[0m',
	res: '\x1b[0m\x1b[1m\x1b[32mRESULT\x1b[0m',
	err: '\x1b[0m\x1b[1m\x1b[31mERROR\x1b[0m',
	warn: '\x1b[0m\x1b[1m\x1b[33mWARN\x1b[0m',
	debug: '\x1b[0m\x1b[1m\x1b[32mDEBUG\x1b[0m',
	info: '\x1b[0m\x1b[1m\x1b[36mINFO\x1b[0m',
	trace: '\x1b[0mTRACE'
}

// classes

class Logger {
	constructor(alias, color='b') {
		this.alias = alias
		this.color = color
	}

	messageOutput(code, message) {
		if (message === undefined) message = 'undefined'
		if (message === NaN) message = 'NaN'
		if (message instanceof Array) {
			message = message.join(' ')
		}
		let time = timeFormat(new Date())
		let a = this.alias == undefined ? '' : `${loggerColors.d}${loggerColors[this.color]}${this.alias}${loggerColors.w}`
		let c = loggerCodes[code] == undefined ? '' : ' ' + loggerCodes[code]
		if (!message) {
			return `${loggerColors.d}${time} ${a}${c}${loggerColors.w}`
		} else {
			return `${loggerColors.d}${time} ${a}${c}${loggerColors.d}: ${loggerColors.w}${message}${loggerColors.w}`
		}
	}

	msg(...message) { console.log(this.messageOutput('', message)) }
	loading(...message) { console.log(this.messageOutput('load', message)) }
	result(...message) { console.log(this.messageOutput('res', message)) }
	error(...message) { console.log(this.messageOutput('err', message)) }
	warn(...message) { console.log(this.messageOutput('warn', message)) }
	debug(...message) { console.log(this.messageOutput('debug', message)) }
	info(...message) { console.log(this.messageOutput('info', message)) }
	trace(...message) { console.log(this.messageOutput('trace', message)) }
}

// export

module.exports = Logger