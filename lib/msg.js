const { proto, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys')

async function downloadMediaMessage(message) {
    const type = Object.keys(message)[0]
    const stream = await downloadContentFromMessage(message[type], type.replace('Message', ''))
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

function sms(conn, m, store) {
    if (!m) return m

    // Ignore system messages (LID fix)
    if (m.message?.senderKeyDistributionMessage) return m

    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = m.fromMe
            ? conn.user.id.split(':')[0] + '@s.whatsapp.net'
            : (m.key.participantAlt || m.key.participant || m.chat)
    }

    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = m.message[m.mtype]

        if (m.mtype === 'viewOnceMessage') {
            const inner = getContentType(m.msg.message)
            m.msg = m.msg.message[inner]
        }

        m.body = m.msg?.text || m.msg?.caption || m.message?.conversation || ''

        const context = m.msg?.contextInfo || null

        m.mentionedJid = context?.mentionedJid || []

        if (context?.quotedMessage) {
            const qType = getContentType(context.quotedMessage)
            const qMsg = context.quotedMessage[qType]

            m.quoted = {
                id: context.stanzaId,
                chat: context.remoteJid || m.chat,
                sender: context.participant,
                text: qMsg?.text || qMsg?.caption || qMsg?.conversation || ''
            }

            m.getQuotedMessage = async () => {
                if (!m.quoted.id) return null
                const q = await store.loadMessage(m.chat, m.quoted.id, conn)
                return sms(conn, q, store)
            }
        }
    }

    // helpers
    m.reply = (text) => conn.sendMessage(m.chat, { text }, { quoted: m })
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
    m.copyNForward = (jid = m.chat) => conn.copyNForward(jid, m)
    m.download = () => m.msg ? downloadMediaMessage({ [m.mtype]: m.msg }) : null

    return m
}

module.exports = { sms, downloadMediaMessage }
