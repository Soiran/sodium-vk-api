'use strict'

// requirements, globals

const regexSpecials = '*+?\\.^[]$&/'.split('')

// classes, methods

const includesAny = (string, ...substrs) => substrs.some(substr => string.includes(substr))

const includesOnly = (string, ...substrs) => substrs.every(substr => string.includes(substr))


class Command {
    constructor(expr, options={}) {
        // Interface options {
        //     caseSensitive?: Boolean,
        //     argumentsCount?: Boolean,
        //     access?: Function,
        //     patterns: Array<Object>,
        //     callback: Function
        // }
        this.caseSensitive = true
        this.argumentsCount = false
        this.patterns = []
        Object.assign(this, options)
        this.fromExpression(expr)
    }

    checkAccess(msg) {
        if (this.access instanceof Function) {
            return this.access(msg)
        } else {
            return true
        }
    }

    // 1.1
    match(string) {
        var temp = string
        var stack = []
        var args = false
        for (let i = 0; i < this.patterns.length; i++) {
            let pattern = this.patterns[i]
            if (pattern.type == 'exact') {
                let match = temp.match(pattern.match)
                if (!match) return false
                temp = temp.slice(match[0].length)
                stack.push(match[0].trim())
            } else if (pattern.type == 'optional') {
                let match = temp.match(pattern.match)
                if (!match) continue
                temp = temp.slice(match[0].length)
                stack.push(match[0].trim())
            } else if (pattern.type == 'list') {
                let elements = temp.split(pattern.match)
                if (this.argumentsCount) {
                    if (elements.length != this.argumentsCount) return false
                }
                elements = elements.map(e => e.trim()).filter(e => e)
                temp = false
                args = elements
                stack.push(elements)
                break
            }
        }
        if (temp) {
            args = [ temp.trim() ]
            stack.push(temp.trim())
        }
        return new CommandPatterns(stack, args)
    }

    // 3.1
    fromExpression(expr) {
        var pattern = ''
        var inScope = false
        var scopeType = false
        for (let i = 0; i < expr.length; i++) {
            let char = expr[i]
            let scopeStart = false
            let scopeEnd = false
            if (i == 0 && char == '~') {
                this.caseSensitive = false
                continue
            }
            if (char == '(') {
                if (inScope) throw 'Invalid command expression.'
                scopeType = 'optional'
                scopeStart = true
            } else if (char == '[') {
                if (inScope) throw 'Invalid command expression.'
                scopeType = 'list'
                scopeStart = true
            }
            if (char == ')') {
                if (!inScope || scopeType == 'list') throw 'Invalid command expression.'
                scopeEnd = true
            } else if (char == ']') {
                if (!inScope || scopeType == 'optional') throw 'Invalid command expression.'
                scopeEnd = true
            }
            if (scopeStart) {
                if (pattern && !pattern.match(/^[s\s]+$/g)) {
                    if (this.caseSensitive) {
                        var match = new RegExp(`^${pattern}`)
                    } else {
                        var match = new RegExp(`^${pattern}`, 'i')
                    }
                    this.patterns.push({
                        type: 'exact',
                        match: match
                    })
                }
                pattern = ''
                inScope = true
            } else if (scopeEnd) {
                if (scopeType == 'optional') {
                    if (this.caseSensitive) {
                        var match = new RegExp(`^${pattern}`)
                    } else {
                        var match = new RegExp(`^${pattern}`, 'i')
                    }
                } else {
                    regexSpecials.forEach(s => pattern = pattern.replace(new RegExp('\\' + s, 'g'), '\\' + s))
                    var match = new RegExp(`${pattern}`.replace('\\\\', '\\'))
                }
                this.patterns.push({
                    type: scopeType,
                    match: match
                })
                pattern = ''
                inScope = false
            } else {
                pattern += char
            }
        }
        if (pattern && !pattern.match(/^[s\s]+$/g)) {
            if (inScope) throw 'Invalid command expression.'
            if (this.caseSensitive) {
                var match = new RegExp(`^${pattern}`)
            } else {
                var match = new RegExp(`^${pattern}`, 'i')
            }
            this.patterns.push({
                type: 'exact',
                match: match
            })
        }
    }
}


class CommandPatterns {
    constructor(list=[], args=false) {
        this.list = list
        this.arguments = args
    }

    get length() {
        return this.list.length
    }

    at(index) {
        let len = this.list.length
        while(0 > index || index >= len) {
            if (index >= len) {
                index = index - len
            } else if (index < 0) {
                index += len
            }
        }
        return this.list[index]
    }

    getList() {
        return this.list.filter(p => p instanceof Array)[0]
    }
}


class MessageEventCommand {
    constructor(cmd, callback) {
        if (!(cmd instanceof String) && !(cmd instanceof Function) && !(cmd instanceof Array)) {
            throw 'Invalid "cmd" parameter.'
        }
        this.cmd = cmd
        this.callback = callback
    }

    process(eventObject) {
        if (this.cmd instanceof String) {
            if (eventObject.payload == this.cmd) {
                eventObject.bot.sendMessageEventAnswer(eventObject, JSON.stringify(this.callback))
            }
        } else if (this.cmd instanceof Array) {
            if (this.cmd.includes(eventObject.payload)) {
                eventObject.bot.sendMessageEventAnswer(eventObject, JSON.stringify(this.callback))
            }
        } else if (this.cmd instanceof Function) {
            if (this.cmd(eventObject.payload)) {
                eventObject.bot.sendMessageEventAnswer(eventObject, JSON.stringify(this.callback))
            }
        }
    }
}

// export

module.exports = { includesAny, includesOnly, Command, MessageEventCommand }