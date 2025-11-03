const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");
const {
  cmd,
  commands
} = require("../command");
const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson,
  jsonformat
} = require("../lib/functions");
cmd({
  'pattern': "zoom",
  'react': '📑',
  'category': "movie",
  'desc': "Zooom subtitle downloader",
  'filename': __filename
}, async (_0x4d004d, _0x4dc551, _0x26fb46, {
  from: _0x1a29ee,
  q: _0x35e4b5,
  isDev: _0x1d13f8,
  prefix: _0x5f0774,
  reply: _0x3c835c
}) => {
  try {
    if (!_0x35e4b5) {
      return await _0x3c835c("*please give me text !..*");
    }
    const _0x1a85e6 = 'https://zoom.lk/?s=' + _0x35e4b5;
    const _0x281a21 = await axios.get(_0x1a85e6);
    const _0x47a9a6 = cheerio.load(_0x281a21.data);
    let _0x31c71c = [];
    _0x47a9a6("div.td-pb-span8.td-main-content > div > div.td_module_16.td_module_wrap.td-animation-stack").each((_0x3d5627, _0x167c7a) => {
      _0x31c71c.push({
        'time': _0x47a9a6(_0x167c7a).find("div.item-details > div > span > time").text(),
        'title': _0x47a9a6(_0x167c7a).find("div.item-details > h3 > a").text(),
        'author': _0x47a9a6(_0x167c7a).find("div.item-details > div > span > a").text(),
        'desc': _0x47a9a6(_0x167c7a).find("div.item-details > div.td-excerpt").text(),
        'comments': _0x47a9a6(_0x167c7a).find("div.item-details > div > span.td-module-comments a").text(),
        'image': _0x47a9a6(_0x167c7a).find("div.td-module-thumb > img").attr("src"),
        'link': _0x47a9a6(_0x167c7a).find("div.item-details > h3 > a").attr("href")
      });
    });
    if (_0x31c71c.length < 0x1) {
      return await _0x4d004d.sendMessage(_0x1a29ee, {
        'text': "erro !"
      }, {
        'quoted': _0x26fb46
      });
    }
    var _0x4dfa91 = [];
    _0x31c71c.map(_0x399cf3 => {
      _0x4dfa91.push({
        'buttonId': _0x5f0774 + ("zoomdl " + _0x399cf3.link),
        'buttonText': {
          'displayText': '' + _0x399cf3.title
        },
        'type': 0x1
      });
    });
    const _0x4a1a55 = {
      'image': {
        'url': config.LOGO
      },
      'caption': "*🎞️ ZOOM SUBDL SEARCH 🎞️*",
      'footer': config.FOOTER,
      'buttons': _0x4dfa91,
      'headerType': 0x4
    };
    return await _0x4d004d.buttonMessage(_0x1a29ee, _0x4a1a55, _0x26fb46);
  } catch (_0x1f3847) {
    console.log(_0x1f3847);
    await _0x4d004d.sendMessage(_0x1a29ee, {
      'text': "🚩 *Error !!*"
    }, {
      'quoted': _0x26fb46
    });
  }
});
cmd({
  'pattern': "zoomdl",
  'desc': "sinhalasub moive downloader",
  'filename': __filename
}, async (_0x1df758, _0x1c8b81, _0x120997, {
  reply: _0x566a57,
  q: _0x5c93f4,
  isDev: _0xef2323,
  l: _0x288c7c,
  prefix: _0xa33aab,
  from: _0x4a4292
}) => {
  try {
    if (!_0x5c93f4) {
      return await _0x566a57("please give me text !..");
    }
    const _0x512c1f = await axios.get(_0x5c93f4);
    const _0x7cebfd = cheerio.load(_0x512c1f.data);
    const _0x3c3ffc = _0x7cebfd("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.td_block_wrap.tdb_title.tdi_60.tdb-single-title.td-pb-border-top.td_block_template_17 > div > h1").text();
    const _0x175c6e = _0x7cebfd("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.vc_row_inner.tdi_62.vc_row.vc_inner.wpb_row.td-pb-row > div.vc_column_inner.tdi_67.wpb_column.vc_column_container.tdc-inner-column.td-pb-span4 > div > div > div > div > span").text();
    const _0x5d8542 = _0x7cebfd("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.vc_row_inner.tdi_62.vc_row.vc_inner.wpb_row.td-pb-row > div.vc_column_inner.tdi_70.wpb_column.vc_column_container.tdc-inner-column.td-pb-span4 > div > div > div > div > time").text();
    const _0x3f30c7 = _0x7cebfd("#tdi_81 > div > div.vc_column.tdi_84.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.td_block_wrap.tdb_single_content.tdi_86.td-pb-border-top.td_block_template_17.td-post-content.tagdiv-type > div > p > a > small").text();
    const _0x2352b9 = _0x7cebfd("div.tdb-block-inner.td-fix-index > p > a").attr("href");
    const _0x5a5da5 = "*🎞️ ZOOM SUBDL DOWNLOADER 🎞️*\n\n\n📃 *Title:* " + _0x3c3ffc + "\n\n🔗 *Link:* " + _0x2352b9 + "\n\n📅 *Year:* " + _0x5d8542 + "\n\n💫 *Size:* " + _0x3f30c7 + "\n\n⏳ *Views:* " + _0x175c6e + "\n";
    const _0x362a5f = [{
      'buttonId': _0xa33aab + "zdl " + _0x2352b9 + '±' + _0x3c3ffc,
      'buttonText': {
        'displayText': 'DOWNLOAD'
      },
      'type': 0x1
    }];
    const _0x237dc0 = {
      'image': {
        'url': config.LOGO
      },
      'caption': _0x5a5da5,
      'footer': config.FOOTER,
      'buttons': _0x362a5f,
      'headerType': 0x1
    };
    await _0x1df758.buttonMessage(_0x4a4292, _0x237dc0, _0x1c8b81);
  } catch (_0x3f7c0b) {
    console.log(_0x3f7c0b);
    _0x566a57("*Error !!*");
  }
});
cmd({
  'pattern': "zdl",
  'react': '📥',
  'dontAddCommandList': true,
  'filename': __filename
}, async (_0x211ad3, _0x30dd05, _0x47c09f, {
  from: _0x2c303c,
  q: _0x8338ac,
  isMe: _0x124322,
  reply: _0x27df88
}) => {
  if (!_0x8338ac) {
    return await _0x27df88("*Please provide a direct URL!*");
  }
  try {
    const _0x2c3d01 = _0x8338ac.split('±')[0x0];
    const _0x302a4e = _0x8338ac.split('±')[0x1];
    const _0x502529 = _0x2c3d01.trim();
    const _0x50d35c = await axios.get(_0x502529, {
      'responseType': "arraybuffer"
    });
    const _0x30d906 = Buffer.from(_0x50d35c.data, "binary");
    const _0x2b81cb = {
      'document': _0x30d906,
      'caption': _0x302a4e + "\n     \n    DR KAMRAN*",
      'mimetype': "application/rar",
      'fileName': "🎬DR KAMRAN🎬.rar"
    };
    await _0x211ad3.sendMessage(config.JID, _0x2b81cb);
    await _0x211ad3.sendMessage(_0x2c303c, {
      'react': {
        'text': '✔️',
        'key': _0x30dd05.key
      }
    });
  } catch (_0x5d546b) {
    console.error("Error fetching or sending", _0x5d546b);
    await _0x211ad3.sendMessage(_0x2c303c, "*Error fetching or sending *", {
      'quoted': _0x30dd05
    });
  }
});
cmd({
  'pattern': "mp4dl",
  'react': '📥',
  'category': "movie",
  'desc': "Direct mp4 downloader",
  'filename': __filename
}, async (_0xfce601, _0x25955e, _0x59be2b, {
  from: _0x1b5557,
  q: _0x5802d1,
  isMe: _0x3a5132,
  reply: _0x507897
}) => {
  if (!_0x5802d1) {
    return await _0x507897("*ex : .mp4dl direct link ± Sadas ");
  }
  try {
    const _0x10049c = _0x5802d1.split('±')[0x0];
    const _0x4e11f5 = _0x5802d1.split('±')[0x1];
    const _0x5d2cd9 = _0x10049c.trim();
    const _0xd558b3 = await axios.get(_0x5d2cd9, {
      'responseType': "arraybuffer"
    });
    const _0x211eef = Buffer.from(_0xd558b3.data, "binary");
    const _0x5a8c91 = {
      'document': _0x211eef,
      'caption': _0x4e11f5 + "\n     \n   *ＤＡＲＫ ＳＨＵＴＥＲ ＭＤ Ｖ2*",
      'mimetype': "video/mp4",
      'fileName': "DR KAMRAN.mp4"
    };
    await _0xfce601.sendMessage(config.JID, _0x5a8c91);
    await _0xfce601.sendMessage(_0x1b5557, {
      'react': {
        'text': '✔️',
        'key': _0x25955e.key
      }
    });
  } catch (_0x34f4f7) {
    console.error("Error fetching or sending", _0x34f4f7);
    await _0xfce601.sendMessage(_0x1b5557, "*Error fetching or sending *", {
      'quoted': _0x25955e
    });
  }
});
cmd({
  'pattern': "mkvdl",
  'react': '📥',
  'category': "movie",
  'desc': "Direct mkv downloader",
  'filename': __filename
}, async (_0x335bf6, _0x51512c, _0x546506, {
  from: _0x404cbf,
  q: _0x585c65,
  isMe: _0x16290a,
  reply: _0x5d71f6
}) => {
  if (!_0x585c65) {
    return await _0x5d71f6("**ex : .mp4dl direct link ± Sadas *");
  }
  try {
    const _0x509de8 = _0x585c65.split('±')[0x0];
    const _0x23a82d = _0x585c65.split('±')[0x1];
    const _0xa8c590 = _0x509de8.trim();
    const _0x1c9f00 = await axios.get(_0xa8c590, {
      'responseType': "arraybuffer"
    });
    const _0xb16e57 = Buffer.from(_0x1c9f00.data, "binary");
    const _0x83375 = {
      'document': _0xb16e57,
      'caption': _0x23a82d + "\n     \n   *K A M R A N M D*",
      'mimetype': "video/mp4",
      'fileName': "🎬DR KAMRAN 🎬.mkv"
    };
    await _0x335bf6.sendMessage(config.JID, _0x83375);
    await _0x335bf6.sendMessage(_0x404cbf, {
      'react': {
        'text': '✔️',
        'key': _0x51512c.key
      }
    });
  } catch (_0x245e85) {
    console.error("Error fetching or sending", _0x245e85);
    await _0x335bf6.sendMessage(_0x404cbf, "*Error fetching or sending *", {
      'quoted': _0x51512c
    });
  }
});
