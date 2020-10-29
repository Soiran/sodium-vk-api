'use strict'

// requirements, globals

const axios = require('axios')

// macros

const queryParser = ctx => {
    let query = []
    for (let [k, v] of Object.entries(ctx)) {
        query.push(`${k}=${encodeURIComponent(v)}`)
    }
    return query.join('&')
}

async function get(token, method, options={}) {
    let query = Object.assign(options, { v: '5.103', access_token: token })
    let response = await axios.get(`https://api.vk.com/method/${method}?${queryParser(query)}`)
    return response.data
}

async function post(token, method, options={}) {
    let query = Object.assign(options, { v: '5.103', access_token: token })
    let response = await axios.post(`https://api.vk.com/method/${method}?${queryParser(query)}`)
}

async function getChat(token, id, options={}) {
    Object.assign(options, { peer_ids: id })
    let res = await get(token, 'messages.getConversationsById', options)
    return res.response
}

async function getUser(token, id, options={}) {
    Object.assign(options, { user_ids: id })
    let res = await get(token, 'users.get', options)
    return res.response[0]
}

async function getGroup(token, id, options={}) {
    Object.assign(options, { group_ids: id })
    let res = await get(token, 'groups.getById', options)
    return res.response[0]
}

// export

module.exports = { get, post, getChat, getUser, getGroup }