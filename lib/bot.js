'use strict'

// requirements, globals

const Api = require('./api')
const Stage = require('./stage')
const VkBot = require('node-vk-bot-api')
const { Layout } = require ('./keyboard')
const { Command, MessageEventCommand } = require('./context')

const randomIdRange = 24012005

// classes

class Plugin {
	constructor(module) {
		this.module = require(module)
		this.emit('load')
	}

	emit(event, ...args) {
		if (event in this.module) this.module[event](...args)
	}
}

// methods

var getUserMentions = text => {
    let mentions = text.match(/\[(.*?)\]/gm);
    return mentions ? mentions.map(m => +(m.split(/(\[id|\|)/g)[2])).filter(e => e) : [];
}

var getGroupMentions = text => {
    let mentions = text.match(/\[(.*?)\]/gm);
    return mentions ? mentions.map(m => +(m.split(/(\[club|\|)/g)[2]) * -1).filter(e => e) : [];
}

// main class

class Bot {
    constructor(token) {
        if (!token) throw 'Token required.'
        this._token = token
        this._controller = new VkBot({ token: token })
        this._eventHandlers = {
            'message_new': [response => {
                this.commands.forEach(c => {
                    let match = c.match(response.text);
                    if (match) {
                        if (c.checkRights(response)) {
                            if (c.checkTimeout(response)) {
                                if (c.timeoutTime) {
                                    c.timeoutUser(response.from_id);
                                }
                                c.callback(Object.assign(response, { patterns: match }))
                            }
                        }
                    }
                })
                this.plugins.forEach(p => p.emit(eventName, response))
                this.stages.filter(s => s.user == response.from_id).forEach(s => {
                    s.receive(response)
                })
            }],
            'message_typing_state': [response => {
                let eventName = 'message_typing_state'
                this.plugins.forEach(p => p.emit(eventName, response))
            }],
            'message_event': [response => {
                let eventName = 'message_event'
                this.plugins.forEach(p => p.emit(eventName, response))
                this.eventCommands.forEach(c => c.process(response))
            }]
        }
        this.socket = {
            bots: [],
            external: []
        }
        this._inStage = [/* user ids */]
        this.enabled = false
        this.commands = []
        this.eventCommands = []
        this.stages = []
        this.plugins = []
    }

    socketTo(...handlers) {
        handlers.forEach(h => {
            if (h instanceof Bot) {
                this.socket.bots.push(h)
            } else if (h instanceof Function) {
                this.socket.external.push(h)
            }
        })
    }

    on(tag, callback) {
        if (tag instanceof RegExp) {
            this._eventHandlers['message_new'].push(response => {
                if (response.text.match(tag)) {
                    callback(response)
                }
            })
        } else {
            this._eventHandlers['message_new'].push(response => {
                if (tag[0] == '~') {
                    var regex = new RegExp(`(${tag.slice(1)})`, 'gi')
                } else {
                    var regex = new RegExp(`(${tag})`, 'g')
                }
                if (response.content.match(regex)) {
                    callback(response)
                }
            })
        }
    }

    _wrapResponse(response, local=false, ...localHandlers) {
        let wrap = {}
        Object.assign(wrap, response.message)
        wrap.bot = this
        if (wrap.peer_id) {
            wrap.reply = (text, options) => {
                if (!local) {
                    this.send(wrap.peer_id, text, options)
                    this.socket.bots.forEach(bot => bot.send(wrap.peer_id, text, options))
                    this.socket.external.forEach(external => external(text, options))
                } else {
                    localHandlers.forEach(h => h(text, options))
                }
            }
            wrap.mentions = {
                users: getUserMentions(response.message.text),
                groups: getGroupMentions(response.message.text)
            }
        }
        return wrap
    }

    message(callback) {
        this._eventHandlers['message_new'].push(callback)
    }

    command(expr, callback) {
        this.commands.push(new Command(expr, { callback: callback }))
    }

    localMessage(response, ...handlers) {
        this._eventHandlers['message_new'].forEach(h => h(this._wrapResponse(response, true, ...handlers)))
    }

    start(callback) {
        if (!this.enabled) {
            this.enabled = true
            this._controller.event('message_new', async r => {
                for (let handler of this._eventHandlers['message_new']) {
                    await handler(this._wrapResponse(r));
                }
            })
            this._controller.event('message_event', async r => {
                for (let handler of this._eventHandlers['message_event']) {
                    await handler(this._wrapResponse(r));
                }
            });
            this._controller.event('message_typing_state', r => {
                this._eventHandlers['message_typing_state'].forEach(async h => {
                    await h(this._wrapResponse(r));
                })
            });
            this._controller.startPolling(callback)
        }
    }

    event(event, callback=_=>{}, first=false) {
        if (!this._eventHandlers[event]) {
            this._eventHandlers[event] = [ r => callback(r) ]
            this._controller.event(event, r => {
                this._eventHandlers[event].forEach(async h => {
                    await h(this._wrapResponse(r));
                })
            })
        } else {
            if (first) {
                this._eventHandlers[event] = [ r => callback(r) ].concat(this._eventHandlers[event]);
            } else {
                this._eventHandlers[event].push(r => callback(r));
            }
        }
    }

    addCommands(...commands) {
        commands.forEach(c => {
            if (!(c instanceof Command)) throw 'Invalid command object.'
            this.commands.push(c)
        })
    }

    addMessageEventCommands(...commands) {
        commands.forEach(c => {
            if (!(c instanceof MessageEventCommand)) throw 'Invalid event command object.'
            this.eventCommands.push(c)
        })
    }

    addStages(...stages) {
        stages.forEach(s => {
            if (!(s instanceof Stage)) throw 'Invalid stage object.'
            this.stages.push(s)
            s.setContainer(this.stages)
        })
    }

    addPlugins(...dirs) {
        dirs.forEach(d => {
            try {
                this.plugins.push(new Plugin(d))
            } catch (e) {
                throw 'Invalid plugin module.'
            }
        })
    }

    send(id, msg, options={}) {
        if (options.keyboard) {
            if (options.keyboard instanceof Layout) options.keyboard = options.keyboard.scheme
            options.keyboard = JSON.stringify(options.keyboard)
        }
        try {
            if (id instanceof Array) {
                Object.assign(options, {
                    ...msg && { message: msg },
                    peer_ids: id,
                    random_id: Math.random() * randomIdRange
                })
            } else {
                Object.assign(options, {
                    ...msg && { message: msg },
                    peer_id: id,
                    random_id: Math.random() * randomIdRange
                })
            }
            this.post('messages.send', options)
        } catch(e) {
            console.log(e)
        }
    }

    sendMessageEventAnswer(eventObject, callbackObject) {
        this.post('messages.sendMessageEventAnswer', {
            event_id: eventObject.id,
            user_id: eventObject.user,
            peer_id: eventObject.peer,
            event_data: callbackObject
        })
    }

    async get(method, options) {
        return await Api.get(this._token, method, options)
    }

    async post(method, options) {
        return await Api.post(this._token, method, options)
    }

    async getChat(id, options) {
        return await Api.getChat(this._token, id, options)
    }

    async getUser(id, options) {
        return await Api.getUser(this._token, id, options)
    }

    async getGroup(id, options) {
        return await Api.getGroup(this._token, id, options)
    }

    async getChatMembers(id, options) {
        return await Api.get(this._token, 'messages.getConversationMembers', Object.assign({
            peer_id: id
        }, options));
    }
}

module.exports = { Plugin, Bot }