const { Data, Logger } = require('./essentials')
const { Bot } = require('./lib')

const token = new Data('./config.json').data.token
const bot = new Bot(token)
const log = new Logger('Server')

// commands

bot.on(/^\w(?:\s[+*]\s\w)+$/g, msg => {
    let calculate = new Function(`return ${msg.text}`)
    msg.reply(calculate())
})

bot.command(`~сложи |сумма [,| |+]`, msg => {
    let patterns = msg.patterns
    if (patterns.length > 1) {
        let nums = patterns.getList()
        if (nums.every(n => Number(n))) {
            msg.reply(nums.reduce((a, b) => Number(a) + Number(b)))
        }
    }
}, { access: msg => msg.from == 244494455})

// polling

bot.start(err => {
    if (err) {
        console.log(err)
    } else {
        log.info('Connected')
    }
})