const { proto, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys')
const fs = require('fs')

const downloadMediaMessage = async (m, filename) => {
    const type = Object.keys(m)[0]
    const stream = await downloadContentFromMessage(m[type], type.replace('Message',''))
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

const sms = (conn, m, store) => {
    if (!m) return m

    // 🔥 Ignore LID/system messages
    if (m.message?.senderKeyDistributionMessage) return m

    let M = proto.WebMessageInfo

    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = m.fromMe
            ? conn.user.id.split(':')[0] + '@s.whatsapp.net'
            : (m.isGroup ? (m.key.participantAlt || m.key.participant) : m.chat)
    }

    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = m.mtype === 'viewOnceMessage'
            ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
            : m.message[m.mtype]

        // body
        m.body =
            m.msg?.text ||
            m.msg?.caption ||
            m.message?.conversation ||
            ''

        // 🔥 SAFE context
        let context = m?.msg?.contextInfo || null

        m.mentionedJid = context?.mentionedJid || []

        // -------- QUOTED SAFE ----------
        if (context?.quotedMessage) {
            let quotedMsg = context.quotedMessage
            let type = getContentType(quotedMsg)
            quotedMsg = quotedMsg[type]

            m.quoted = {
                mtype: type,
                id: context.stanzaId,
                chat: context.remoteJid || m.chat,
                sender: conn.decodeJid(context.participant),
                fromMe: false,
                text:
                    quotedMsg?.text ||
                    quotedMsg?.caption ||
                    quotedMsg?.conversation ||
                    ''
            }

            m.getQuotedMessage = async () => {
                if (!m.quoted.id) return null
                let q = await store.loadMessage(m.chat, m.quoted.id, conn)
                return sms(conn, q, store)
            }
        }
    }

    // -------- HELPERS --------
    m.reply = (text) => conn.sendMessage(m.chat, { text }, { quoted: m })
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
    m.copyNForward = (jid = m.chat) => conn.copyNForward(jid, m)

    m.download = async () => {
