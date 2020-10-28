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
    let chats = res.response.items
    for (let i = 0; i < chats.length; i++) {
        let c = chats[i]
        chats[i] = {
            id: c.peer.id,
            type: c.peer.type,
            localId: c.peer.local_id,
            allowed: c.can_write.allowed,
            ...c.chat_settings && { info: {
                owner: c.chat_settings.owner_id,
                admins: c.chat_settings.admin_ids,
                title: c.chat_settings.title,
                membersCount: c.chat_settings.members_count,
                ...c.chat_settings.photo && { avatars: [
                    c.chat_settings.photo.photo_50,
                    c.chat_settings.photo.photo_100,
                    c.chat_settings.photo.photo_200
                ] }
            } },
            ...c.chat_settings && { perms: {
                changeInfo: c.chat_settings.acl.can_change_info,
                changeInviteLink: c.chat_settings.acl.can_change_invite_link,
                changePin: c.chat_settings.acl.can_change_pin,
                invite: c.chat_settings.acl.can_invite,
                promoteUsers: c.chat_settings.acl.can_promote_users,
                seeInviteLink: c.chat_settings.acl.can_see_invite_link,
                moderate: c.chat_settings.acl.can_moderate,
                copyChat: c.chat_settings.acl.can_copy_chat,
                call: c.chat_settings.acl.can_copy_chat,
                useMassMentions: c.chat_settings.acl.can_use_mass_mentions,
                changeServiceType: c.chat_settings.acl.can_change_service_type
            } }
        }
    }
    return chats
}

async function getUser(token, id, options={}) {
    Object.assign(options, { user_ids: id })
    let res = await get(token, 'users.get', options)
    res = res.response[0]
    return {
        id: res.id,
        name: res.first_name,
        surname: res.last_name,
        fullName: `${res.first_name} ${res.last_name}`,
        closed: res.is_closed,
        canAccess: res.can_access_closed
    }
}

async function getGroup(token, id, options={}) {
    Object.assign(options, { group_ids: id })
    let res = await get(token, 'groups.getById', options)
    res = res.response[0]
    return {
        id: res.id,
        name: res.name,
        alias: res.screen_name,
        closed: res.is_closed,
        type: res.type,
        avatars: [
            res.photo_50,
            res.photo_100,
            res.photo_200
        ]
    }
}

// export

module.exports = { get, post, getChat, getUser, getGroup }