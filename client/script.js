/*
* Welcome to Botcord Public Alpha Testing for Patch 1.0
* Please keep in mind this is still a work in progress,
* many things can be broken, all I'm asking you, is to report
* non-found bugs, to see list of found bugs, check out the
* Team Cernodile server, #bugs channel.
*
* Happy testing,
* Cernodile
*/
var Socket = new WebSocket('wss://gateway.discord.gg/?encoding=json&v=6')
var avatarHashes = [
  "6debd47ed13483642cf09e832ed0bc1b",
  "322c936a8c8be1b803cd94861bdfa868",
  "dd4dbc0016779df1378e7812eabaa04d",
  "0e291f67c9274a1abdddeb3fd919cbaa",
  "1cbd08c76f8af6dddce02c5138971129"
]
var bot = {}
bot.guilds = new Map()
bot.channels = new Map()
bot.privateChannels = new Map()
bot.users = new Map()
var hBeatInterval = 1000
var activeChannel = '0'
var token = ''
var currentGuildMembers
var activeGuild
var converter = new showdown.Converter()
/*
* All of the perm constants and functions taken from abalabahaha/eris
* Slightly modified to fit Botcord
*/
function getPerm(perm) {
    var result = []
    this.perm = perm
    for(var d of Object.keys(perms)) {
      if (!d.startsWith('all')) {
        if (this.perm & perms[d]) {
          result.push({name: d, value: true})
        }
      }
    }
    return result
}
var perms = {
  createInstantInvite: 1,
  kickMembers:         1 << 1,
  banMembers:          1 << 2,
  administrator:       1 << 3,
  manageChannels:      1 << 4,
  manageGuild:         1 << 5,
  readMessages:        1 << 10,
  sendMessages:        1 << 11,
  sendTTSMessages:     1 << 12,
  manageMessages:      1 << 13,
  embedLinks:          1 << 14,
  attachFiles:         1 << 15,
  readMessageHistory:  1 << 16,
  mentionEveryone:     1 << 17,
  externalEmojis:      1 << 18,
  voiceConnect:        1 << 20,
  voiceSpeak:          1 << 21,
  voiceMuteMembers:    1 << 22,
  voiceDeafenMembers:  1 << 23,
  voiceMoveMembers:    1 << 24,
  voiceUseVAD:         1 << 25,
  changeNickname:      1 << 26,
  manageNicknames:     1 << 27,
  manageRoles:         1 << 28,
  manageEmojis:        1 << 30,
  all:      0b1111111111101111111110000111111,
  allGuild: 0b1111100000000000000000000111111,
  allText:  0b0010000000001111111110000010001,
  allVoice: 0b0010011111100000000000000010001
}
converter.setOption('headerLevelStart', '10');
converter.setOption('strikethrough', true);
var data = {
  "token": '',
  "properties": {
    "$os": "windows",
    "$browser": "Botcord",
    "$device": "Botcord",
  },
  "compress": false,
  "large_threshold": 250
}
function startBotcord (formdata) {
  var Socket = new WebSocket('wss://gateway.discord.gg/?encoding=json&v=6')
  token = formdata.trim()
  data.token = token
}
Socket.onopen = function () {
  console.log('%c[Gateway] %cConnection established', 'color:purple; font-weight: bold;', 'color:#000;')
}
function testStatus (status, game) {
  if (!game) game = {name: null}
  console.log(status)
  Socket.send(JSON.stringify({"op": 3, "d": {"game": {"name": game.name}, "afk": "", "since": Date.now(), "status": status}}))
  localStorage.status = status
}
if (!localStorage.status) localStorage.status = 'online' // Reserved for a feature, k.
Socket.onmessage = function (evt) {
  var event = JSON.parse(evt.data).t
  if (event === 'READY') {
    localStorage.token = token
    if (!localStorage.theme) localStorage.theme = 'dark'
    $('body').attr('class', 'theme-' + localStorage.theme)
    $('body').attr('style', '')
    var dom = "<div class='flex-vertical flex-spacer'><section class='flex-horizontal flex-spacer'><div class='guilds'><div class='guild'><a draggable='false' style='background-color: rgb(46, 49, 54);' onclick='goDMs()' class='avatar'>DM</a></div></div><div class='flex-vertical channels-wrap'><div class='flex-vertical flex-spacer'><div class='guild-header'><header><span>Loading...</span></header></div><div class='channels'></div><div class='account'></div></div></div><div class='chat flex-vertical flex-spacer'><div class='title-wrap'><div class='title'><span class='channel'>Loading...</span></div><span class='topic'>Loading...</span></div><div class='messages-container'></div><form id='message'><div class='textarea'><div class='textarea-inner'><div class='channel-textarea-upload'><div class='file-input' style='position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; opacity: 0; cursor: pointer;'></div></div><textarea id='textarea' rows='1' placeholder='Chat using Botcord...' style='height: auto; overflow: hidden;'></textarea></div></div></form></div></section></div><input id='file-input' type='file' style='position:absolute;width:0px;height:0px;visibility:hidden;'/>"
    document.body.innerHTML = dom
    for (var i in JSON.parse(evt.data).d.private_channels) {
      if (JSON.parse(evt.data).d.private_channels[i].recipients[0]) bot.privateChannels.set(JSON.parse(evt.data).d.private_channels[i].id, JSON.parse(evt.data).d.private_channels[i])
    }
    goDMs()
    bot.user = JSON.parse(evt.data).d.user
    if (bot.user.email !== null) {
      for (var d in JSON.parse(evt.data).d.guilds) {
      var guild = JSON.parse(evt.data).d.guilds[d]
      var guildVar
      guildVar = '<div class="guild" data-guild="' + guild.id + '"><a draggable="false" onclick="switchGuild(\'' + guild.id + '\')" style="background-color: rgb(46, 49, 54);" class="avatar">' + guild.name.match(/\b\w/g).join('') + '</a></div>'
      if (guild.icon) guildVar = '<div class="guild" data-guild="' + guild.id + '"><a draggable="false" onclick="switchGuild(\'' + guild.id + '\')" style="background: url(\'https://cdn.discordapp.com/icons/' + guild.id + '/' + guild.icon + '.jpg\');background-size: 50px 50px;" class="avatar-small"></a></div>'
      var guildObj = {}
      guildObj.members = new Map()
      guildObj.channels = new Map()
      guildObj.roles = new Map()
      guildObj.mfa = guild.mfa_level
      guildObj.emojis = guild.emojis
      guildObj.region = guild.region
      guildObj.owner = guild.owner_id
      guildObj.large = guild.large
      guildObj.id = guild.id
      guildObj.name = guild.name
      guildObj.icon = guild.icon
      guildObj.memberCount = guild.member_count
      for (var i in guild.roles) {
        var roleData = {}
        roleData.name = guild.roles[i].name
        roleData.hoist = guild.roles[i].hoist
        roleData.color = guild.roles[i].color.toString(16)
        roleData.id = guild.roles[i].id
        roleData.managed = guild.roles[i].managed
        roleData.mentionable = guild.roles[i].mentionable
        roleData.permissions = guild.roles[i].permissions
        roleData.position = guild.roles[i].position
        guildObj.roles.set(roleData.id, roleData)
      }
      for (var i in guild.members) {
        var memberData = {}
        memberData.user = guild.members[i].user
        memberData.nick = null || guild.members[i].nick
        memberData.joinedAt = guild.members[i].joined_at
        memberData.deaf = guild.members[i].deaf
        memberData.mute = guild.members[i].mute
        memberData.roles = guild.members[i].roles
        memberData.status = 'offline'
        memberData.game = null
        if (guild.presences.indexOf(memberData.id) > -1) {
          memberData.status = guild.presences[guild.presences.indexOf(memberData.id)].status
          memberData.game = guild.presences[guild.presences.indexOf(memberData.id)].game
        }
        guildObj.members.set(guild.members[i].user.id, memberData)
        if (!bot.users.has(memberData.user.id)) {
          var userData = memberData.user
          userData.status = memberData.status
          userData.game = memberData.game
          bot.users.set(memberData.user.id, userData)
        }
        if (activeGuild === 'dm') {
          var users = $('.channels').children()
          for (var a in users) {
            if (users[a].childNodes !== undefined) {
              if (users[a].childNodes[0].dataset.dmuid === memberData.user.id) {
                users[a].childNodes[0].childNodes[0].childNodes[0].className = 'status ' + memberData.status
              }
            }
          }
        }
      }
      for (var i in guild.channels) {
        var channelData = {}
        if (guild.channels[i].type === 0) {
          channelData.name = guild.channels[i].name
          channelData.id = guild.channels[i].id
          channelData.position = guild.channels[i].position
          channelData.lastMessageID = guild.channels[i].last_message_id
          channelData.lastPinDate = guild.channels[i].last_pin_timestamp
          channelData.topic = guild.channels[i].topic
          guildObj.channels.set(guild.channels[i].id, channelData)
        }
      }
      guildObj.channels.forEach((channel) => {
        channel.guild = guildObj
        bot.channels.set(channel.id, channel)
      })
      bot.guilds.set(guild.id, guildObj)
      $('.guilds').append(guildVar)
    }
  }
    var bottag = ''
    var avatar = 'https://cdn.discordapp.com/avatars/' + bot.user.id + '/' + bot.user.avatar + '.jpg'
    if (bot.user.avatar === null) avatar = 'https://discordapp.com/assets/' + avatarHashes[bot.user.discriminator % avatarHashes.length] + '.png'
    if (bot.user) bottag = '<span class="bot-tag">BOT</span>'
    $('.account').append('<div class="avatar-small" style="background: url(\'' + avatar + '\');background-size: 30px 30px;"></div><div class="account-details"><div class="username">' + bot.user.username + bottag + '</div><div class="discriminator">#' + bot.user.discriminator + '</div></div><div class="leave">-></div>')
    $(function () {
      $('.leave').click(function() {
        localStorage.token = ''
        $('body').attr('style', 'background-color:#36393e;color:#737f8d;font-family:Whitney;text-align:center;height:100vh;max-height:100vh;overflow:hidden;')
        document.body.innerHTML = `<h1 style="margin-top: 25%;">Please reload your page!</h1>`
        Socket.onclose = function () {}
        Socket.close()
      })
      $("#textarea").keypress(function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code === 13 && !e.shiftKey) {
          parseCmd($('#textarea').val())
          $('#textarea').val('').blur()
        }
      })
    })
    var textarea = document.querySelector('textarea');

textarea.addEventListener('keydown', autosize);

function autosize(){
  var el = this;
  el.style.cssText = 'height:auto; padding:0;overflow:hidden;';
  if (el.scrollHeight < 145) el.style.cssText = 'height:' + el.scrollHeight + 'px;overflow:hidden;';
  else el.style.cssText = 'height:144px;overflow:hidden;'
}
    $('.account .avatar-small').click(function(){
      if (!$('body').children()[2]) $('body').append('<div class="popout popout-top" style="position: absolute;width: 216px;top: 77vh;left: 11vh; height: auto;"><div class="status-picker popout-menu"><div class="popout-menu-item" onclick="testStatus(\'online\')"><span class="status online" style="margin-right:14px;"></span><div class="status-text">Online</div></div><div class="popout-menu-item" onclick="testStatus(\'idle\')"><span class="status idle" style="margin-right:14px;"></span><div class="status-text">Idle</div></div><div class="popout-menu-item" onclick="testStatus(\'dnd\')"><span class="status dnd" style="margin-right:14px;"></span><div class="status-text">Do Not Disturb</div></div><div class="popout-menu-item" onclick="testStatus(\'invisible\')"><span class="status offline" style="margin-right:14px;"></span><div class="status-text">Offline</div></div></div></div>')
      else $('.popout').remove()
    })
  }
  if (event === 'PRESENCE_UPDATE') {
    var userdata = JSON.parse(evt.data).d
    if (userdata.status) {
      if (!(bot.users.has(userdata.user.id))) {
        bot.users.set(userdata.user.id, userdata.status)
      } else {
        var newdata = bot.users.get(userdata.user.id)
        if (newdata.user) {
          if (userdata.game === newdata.user.game && userdata.status === newdata.user.game) return
          newdata.user.status = userdata.status
          if (userdata.game) newdata.user.game = userdata.game
          bot.users.set(userdata.user.id, newdata)
          if (activeGuild === 'dm') {
            var users = $('.channels').children()
            for (var i in users) {
              if (users[i].childNodes !== undefined) {
                if (users[i].childNodes[0].dataset.dmuid === userdata.user.id) {
                  return users[i].childNodes[0].childNodes[0].childNodes[0].className = 'status ' + userdata.status
                }
              }
            }
          }
        }
      }
    }
  }
  if (event === 'GUILD_CREATE') {
    var guild = JSON.parse(evt.data).d
    var guildVar
    guildVar = '<div class="guild" data-guild="' + guild.id + '"><a draggable="false" onclick="switchGuild(\'' + guild.id + '\')" style="background-color: rgb(46, 49, 54);" class="avatar">' + guild.name.match(/\b\w/g).join('') + '</a></div>'
    if (guild.icon) guildVar = '<div class="guild" data-guild="' + guild.id + '"><a draggable="false" onclick="switchGuild(\'' + guild.id + '\')" style="background: url(\'https://cdn.discordapp.com/icons/' + guild.id + '/' + guild.icon + '.jpg\');background-size: 50px 50px;" class="avatar-small"></a></div>'
    guildCreateMap(guild)
    $('.guilds').append(guildVar)
  }
  if (event === 'MESSAGE_CREATE') {
    if (JSON.parse(evt.data).d.channel_id === activeChannel) {
      var msgObj = {}
      msgObj.content = JSON.parse(evt.data).d.content
      msgObj.author = JSON.parse(evt.data).d.author
      msgObj.id = JSON.parse(evt.data).d.id
      msgObj.edited = null
      msgObj.embeds = JSON.parse(evt.data).d.embeds
      msgObj.attachments = JSON.parse(evt.data).d.attachments
      msgObj.mentions = JSON.parse(evt.data).d.mentions
      msgObj.timestamp = JSON.parse(evt.data).d.timestamp
      msgObj.webhook = JSON.parse(evt.data).d.webhook_id || 0
      if (bot.channels.has(JSON.parse(evt.data).d.channel_id)) {
        msgObj.channel = bot.channels.get(JSON.parse(evt.data).d.channel_id)
        msgObj.member = bot.channels.get(JSON.parse(evt.data).d.channel_id).guild.members.get(msgObj.author.id)
      }
      newMsg(msgObj)
    }
  }
  if (event === 'MESSAGE_UPDATE') {
    if (JSON.parse(evt.data).d.content) {
      var msg = JSON.parse(evt.data).d
      var msgObj = {}
      msgObj.content = JSON.parse(evt.data).d.content
      msgObj.author = JSON.parse(evt.data).d.author
      msgObj.id = JSON.parse(evt.data).d.id
      msgObj.embeds = JSON.parse(evt.data).d.embeds
      msgObj.edited = JSON.parse(evt.data).d.edited_timestamp
      msgObj.attachments = JSON.parse(evt.data).d.attachments
      msgObj.mentions = JSON.parse(evt.data).d.mentions
      msgObj.timestamp = JSON.parse(evt.data).d.timestamp
      msgObj.webhook = JSON.parse(evt.data).d.webhook_id || 0
      if (bot.channels.has(JSON.parse(evt.data).d.channel_id)) {
        msgObj.channel = bot.channels.get(JSON.parse(evt.data).d.channel_id)
        msgObj.member = bot.channels.get(JSON.parse(evt.data).d.channel_id).guild.members.get(msgObj.author.id)
      }
      editMsg(msgObj)
    }
  }
  if (event === 'MESSAGE_DELETE') {
    deleteMsg(JSON.parse(evt.data).d.id)
  }
  if (event === 'MESSAGE_DELETE_BULK') {
    for (var i in JSON.parse(evt.data).d.ids) {
      deleteMsg(JSON.parse(evt.data).d.ids[i])
    }
  }
  if (event === 'GUILD_UPDATE') {
    var dat = JSON.parse(evt.data).d
    if (dat.icon !== bot.guilds.get(dat.id).icon) {
      $('[data-guild="' + dat.id + '"]').children()[0].attr('style', 'background: url(\'https://cdn.discordapp.com/icons/' + dat.id + '/' + dat.icon + '.jpg\');background-size: 50px 50px;')
    }
    guildCreateMap(dat)
  }
  if (event === 'GUILD_DELETE') {
    var dat = JSON.parse(evt.data).d
    if (!dat.unavailable) {
      bot.guilds.get(dat.id).channels.forEach((channel) => {
        bot.channels.delete(channel.id)
      })
      bot.guilds.delete(dat.id)
      $('[data-guild="' + dat.id + '"]').remove()
    } else {
      $('[data-guild="' + dat.id + '"]').children()[0].attr('style', null)
      $('[data-guild="' + dat.id + '"]').children()[0].attr('class', 'gerror')
    }
  }
  if (event === 'GUILD_MEMBER_ADD') {
    var dat = JSON.parse(evt.data).d
    var memberData = {}
    var guildObj = bot.guilds.get(dat.guild_id)
    memberData.user = dat.user
    memberData.nick = null || dat.nick
    memberData.joinedAt = dat.joined_at
    memberData.deaf = dat.deaf
    memberData.mute = dat.mute
    memberData.roles = dat.roles
    var permm = {}
    memberData.permissions = {}
    for (var c in dat.roles) {
      var temp = []
      guildObj.roles.forEach((role) => {
        temp.push({position: role.position, color: role.color, id: role.id})
      })
      temp = temp.sort(function(a,b){return a.position - b.position})
      for (var d in temp) {
        if (memberData.roles.indexOf(temp[d].id) > -1) {
          var fetchPerm = getPerm(guildObj.roles.get(temp[d].id).permissions)
            for (var e in fetchPerm) {
              if (fetchPerm[e]) permm[fetchPerm[e].name] = fetchPerm[e].value
            }
            memberData.permissions = permm
            if ($.isEmptyObject(permm)) memberData.permissions = 'hi'
        }
      }
    }
    memberData.status = 'offline'
    memberData.game = null
    guildObj.members.set(dat.user.id, memberData)
    if (!bot.users.has(memberData.user.id)) {
      var userData = memberData.user
      userData.status = memberData.status
      userData.game = memberData.game
      bot.users.set(memberData.user.id, userData)
    }
  }
  if (event === 'GUILD_MEMBER_REMOVE') {
    var dat = JSON.parse(evt.data).d
    var guild = bot.guilds.get(dat.guild_id)
    guild.members.delete(dat.user.id)
  }
  if (event === 'GUILD_MEMBER_UPDATE') {
    //console.log(JSON.parse(evt.data).d)
  }
  if (event === 'GUILD_ROLE_CREATE' || event === 'GUILD_ROLE_UPDATE') {
    var dat = JSON.parse(evt.data).d
    var guild = bot.guilds.get(dat.guild_id)
    var roleData = {}
    roleData.name = dat.role.name
    roleData.hoist = dat.role.hoist
    roleData.color = dat.role.color.toString(16)
    roleData.id = dat.role.id
    roleData.managed = dat.role.managed
    roleData.mentionable = dat.role.mentionable
    roleData.permissions = dat.role.permissions
    roleData.position = dat.role.position
    guild.roles.set(roleData.id, roleData)
  }
  if (event === 'GUILD_ROLE_DELETE') {
    var dat = JSON.parse(evt.data).d
    var guild = bot.guilds.get(dat.guild_id)
    guild.roles.delete(dat.role.id)
  }
  if (JSON.parse(evt.data).op === 10) {
    console.log('%c[Gateway] %c[Hello] via ' + JSON.parse(evt.data).d._trace + ', heartbeat interval: ' + JSON.parse(evt.data).d['heartbeat_interval'], 'color:purple; font-weight: bold;', 'color:#000;')
    Socket.send(JSON.stringify({"op": 1, "d": 0}))
    console.log('%c[Gateway] %cHeartbeat', 'color:purple; font-weight: bold;', 'color:#000;')
    Socket.send(JSON.stringify({"op": 2, "d": data}))
    console.log('%c[Gateway] %cIndentify', 'color:purple; font-weight: bold;', 'color:#000;')
    hBeatInterval = JSON.parse(evt.data).d['heartbeat_interval']
  }
  if (JSON.parse(evt.data).op === 11) {
    setTimeout(() => {
      Socket.send(JSON.stringify({"op": 1, "d": 0}))
      console.log('%c[Gateway] %cHeartbeat', 'color:purple; font-weight: bold;', 'color:#000;')
    }, hBeatInterval)
  }
}
Socket.onclose = function (evt) {
  console.warn('%c[Gateway] %cDropped connection\n' + evt.code, 'color:purple; font-weight: bold;', 'color:red;')
  if (evt.code === 4004) {
    document.body.innerHTML = `<h1>Invalid token! Please refresh page.</h1>`
    return localStorage.token = ''
  }
}
Socket.onerror = function (e) {
  console.log(e)
}
function switchGuild (id) {
  var guild = bot.guilds.get(id)
  $('.messages-container').empty()
  $('.title-wrap').empty()
  $('.channels').empty()
  $('.guild-header').empty()
  $('.guild-header').append('<header><span>' + guild.name + '</span></header>')
  activeGuild = guild.id
  var guildChannels = []
  guild.channels.forEach((channel) => {
    if (channel.id === guild.id) return guildChannels.push(channel)
    if (guild.members.get(bot.user.id).permissions['administrator']) return guildChannels.push(channel)
    if (channel.permissions.length > 0) {
      for (var i in channel.permissions) {
        if (channel.permissions[i].type === 'role') {
          if (channel.permissions[i].id === guild.id) {
            var channelpermss = getPerm(channel.permissions[i].deny)
            if (channelpermss.length === 0) return guildChannels.push(channel)
            var check = ''
            for (var d in channelpermss) {
              if (channelpermss[d].name === 'readMessages') check = 'readMessages'
            }
            if (check !== 'readMessages') return guildChannels.push(channel)
          }
          if (guild.members.get(bot.user.id).roles.length > 0 && channel.permissions[i].id !== guild.id) {
            if (guild.members.get(bot.user.id).roles.indexOf(channel.permissions[i].id) > -1 || guild.members.get(bot.user.id).permissions['readMessages']) {
              var channelpermss = getPerm(channel.permissions[i].deny)
              if (channel.permissions[i].deny === 0) return guildChannels.push(channel)
              var check = ''
              for (var d in channelpermss) {
                if (channelpermss[d].name === 'readMessages') check = 'readMessages'
              }
              if (check !== 'readMessages') return guildChannels.push(channel)
            } else {
            }
          }
        } else {
          if (channel.permissions[i].id === bot.user.id) {
          //  var channelpermss = getPerm(channel.permissions[i].deny)
          //  if (channelpermss.length === 0) return guildChannels.push(channel)
          }
        }
      }
    } else guildChannels.push(channel)
  })
  guildChannels = guildChannels.sort(function (a, b) {return a.position - b.position})
  for (var i in guildChannels) {
    if (guildChannels[i].id === guild.id) switchChannel(guild.id, guildChannels[i].name)
    if (guildChannels[i].type === 0) $('.channels').append('<div class="channel" data-channel="' + guildChannels[i].id + '"><a draggable="false" onclick="switchChannel(\'' + guildChannels[i].id + '\', \'' + guildChannels[i].name + '\')" class="channel">' + guildChannels[i].name + '</a></div></div>')
  }
}
function goDMs () {
  var dms = bot.privateChannels
  $('.title-wrap').empty()
  $(".messages-container").empty();
  $(".channels").empty();
  $('.guild-header').empty()
  $('.guild-header').append('<header><span>Direct Messages</span></header>')
  activeGuild = 'dm'
  activeChannel = 'dm'
  var d = []
  dms.forEach((dm) => {
    d.push(dm)
  })
  d = d.sort(function (a, b) {return parseInt(a.last_message_id) - parseInt(b.last_message_id)}).reverse()
  for (var i in d) {
    var status = 'offline'
    if (bot.users.has(d[i].recipients[0].id)) status = bot.users.get(d[i].recipients[0].id).status
    if (status === null || status === undefined) status = 'offline'
    $('.channels').append('<div class="channel dm"><a data-dmuid="' + d[i].recipients[0].id + '" onclick="switchChannel(\'' + d[i].id + '\', \'' + d[i].recipients[0].username.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '\')" draggable="false"><div style="background-image: url(\'https://cdn.discordapp.com/avatars/' + d[i].recipients[0].id + '/' + d[i].recipients[0].avatar + '.jpg\')" class="avatar-small-dm"><div class="status ' + status + '"></div></div><div class="dm-user">' + d[i].recipients[0].username + '<div class="channel-activity"></div></div></a></div>')
  }
}
function switchChannel (id, name) {
  apiCall('GET', 'https://discordapp.com/api/v6/channels/' + id + '/messages', true, {authorization: token, body: {limit: 75}}).then((msgs) => {
    if ($(document.querySelector('[data-channel="' + activeChannel + '"]'))[0]) $(document.querySelector('[data-channel="' + activeChannel + '"]'))[0].className = 'channel'
    activeChannel = id
    if ($(document.querySelector('[data-channel="' + id + '"]'))[0]) $(document.querySelector('[data-channel="' + id + '"]'))[0].className = 'channel selected'
    $('.title-wrap').empty()
    $('.title-wrap').append('<div class="title"><span class="channel">' + name + '</span></div>')
    $('.messages-container').empty()
    msgs = msgs.reverse()
    for (var i in msgs) {
        var msgObj = {}
        msgObj.content = msgs[i].content
        msgObj.author = msgs[i].author
        msgObj.id = msgs[i].id
        msgObj.edited = msgs[i].edited_timestamp
        msgObj.embeds = msgs[i].embeds
        msgObj.attachments = msgs[i].attachments
        msgObj.mentions = msgs[i].mentions
        msgObj.timestamp = msgs[i].timestamp
        msgObj.type = msgs[i].type
        msgObj.webhook = msgs[i].webhook_id || 0
        if (bot.channels.has(msgs[i].channel_id)) {
          msgObj.channel = bot.channels.get(msgs[i].channel_id)
          msgObj.member = msgObj.channel.guild.members.get(msgObj.author.id)
        }
      newMsg(msgObj)
    }
  })
}
function deleteMsg (msg) {
  var d = $(document.querySelector('[data-id="' + msg + '"]'))
  if (d[0]) {
    if (d.parents()[0].childNodes.length === 1) {
      d.parents()[3].remove()
    } else d[0].remove()
  }
}
function editMsg (msg) {
  var d = $(document.querySelector('[data-id="' + msg.id + '"]'))
  if (d[0]) {
    d[0].innerHTML = converter.makeHtml(antixss(msg))
  }
}
function newMsg (msg) {
  var avatar = 'https://cdn.discordapp.com/avatars/' + msg.author.id + '/' + msg.author.avatar + '.jpg'
  var bot = ''
  if (msg.author.avatar === null) avatar = 'https://discordapp.com/assets/' + avatarHashes[msg.author.discriminator % avatarHashes.length] + '.png'
  if (msg.author.bot) bot = '<span class="bot-tag">Bot</span>'
  var username = '<span class="username">' + msg.author.username.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '</span>' + bot
  if (msg.member) {
    var name = msg.author.username
    var realName = ''
    if (msg.member.nick) {
      username = '<span class="username">' + msg.member.nick.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '</span>' + bot
      name = msg.member.nick
      realName = '<span class="timestamp">' + msg.author.username.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '#' + msg.author.discriminator + '</span>'
    }
    msg.member.color = ''
    if (msg.member.roles) {
      var temp = []
      msg.channel.guild.roles.forEach((role) => {
        temp.push({position: role.position, color: role.color, id: role.id})
      })
      temp = temp.sort(function(a,b){return a.position - b.position})
      for (var i in temp) {
        if (temp[i].color !== '0') {
          if (temp[i].color.length === 4) temp[i].color = '00' + temp[i].color
          if (temp[i].color.length === 5) temp[i].color = '0' + temp[i].color
          if (msg.member.roles.indexOf(temp[i].id) > -1) {
            username = '<span class="username" style="color:#' + temp[i].color + '">' + name.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '</span>' + bot + realName
            msg.member.color = temp[i].color
          }
        }
      }
    }
  }
  if (msg.type === 6) {
    msg.content = '<p><span class="username" style="color:#' + msg.member.color + '">' + name + '</span> pinned a message to this channel. <strong>See all the pins.</strong> <span data-timestamp="' + msg.timestamp + '" class="timestamp">' + moment(msg.timestamp).calendar() + '</span><p>'
    var parsedMsg = $('<div class="msg-group" style="padding: 15px 0;">').append('<div class="message"><div class="comment" data-uid="' + msg.author.id + '" style="margin-left: 20px;"><div class="message-text"><span data-id="' + msg.id + '" class="markup">' + msg.content + '</span></div></div></div></div>')
    return $('.messages-container').append(parsedMsg)
  }
  if (msg.type !== 6) var parsedMsg = $('<div class="msg-group">').append('<div class="message"><div class="avatar-large" style="background-image: url(\'' + avatar + '\');"></div><div class="comment" data-uid="' + msg.author.id + '"><h2><span class="username-wrap" onclick="openDMchannel(\'' + msg.author.id + '\')">' + username + '</strong></span><span data-timestamp="' + msg.timestamp + '" class="timestamp">' + moment(msg.timestamp).calendar() + '</span></h2><div class="message-text"><span data-id="' + msg.id + '" class="markup">' + converter.makeHtml(antixss(msg)) + '</span></div></div></div></div>')
  var d = $(document.querySelector('[data-uid="' + msg.author.id + '"]')).parents()
    if (d[2] !== undefined) {
      var day = moment(msg.timestamp).format('hh-DDMMYY').split('-')
      var lastTimestamp = moment(d[2].lastChild.firstChild.childNodes[1].firstChild.lastChild.dataset.timestamp).format('hh-DDMMYY').split('-')
      if (d[2].lastChild.firstChild.childNodes[1].dataset.uid === msg.author.id && day[0] === lastTimestamp[0] && day[1] === lastTimestamp[1]) {
        return $(d[2].lastChild.firstChild.childNodes[1].lastChild).append('<span data-id="' + msg.id + '" class="markup">' + converter.makeHtml(antixss(msg)) + '</span>')
      } else return $('.messages-container').append(parsedMsg)
    }
  if (d[2] === undefined) return $('.messages-container').append(parsedMsg)
}
function apiCall(method, url, sync, headers) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest()
    var data = {}
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState == 4) return resolve(JSON.parse(this.responseText))
    })
    xhr.onerror = function (e) {
      return reject(e)
    }
    xhr.open(method, url, sync)
    var botheader = ''
    if (bot.user.email === null) botheader = 'Bot '
    if (headers.authorization) xhr.setRequestHeader('Authorization', botheader + headers.authorization)
    if (headers.body) {
      data = JSON.stringify(headers.body)
    }
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.send(data)
  })
}
function antixss (msg) {
  var edit = ''
  var attachEnd = ''
  if (msg.embeds[0] || msg.attachments[0]) attachEnd = '<div class="accessory">'
  if (msg.editedTimestamp) edit = '<span class="edited">(edited)</span>'
  function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = [maxWidth / srcWidth, maxHeight / srcHeight ];
    ratio = Math.min(ratio[0], ratio[1]);
    return { width:srcWidth*ratio, height:srcHeight*ratio };
  }
  if (msg.edited !== null) edit = '<span class="edited">(edited)</span>'
  if (msg.embeds[0] !== undefined) {
    if (msg.embeds[0].thumbnail) {
      var dimensions = calculateAspectRatioFit(msg.embeds[0].thumbnail.width, msg.embeds[0].thumbnail.height, 400, 600)
      if (msg.embeds[0].thumbnail.width < 400) msg.embeds[0].thumbnail.width = Math.round(msg.embeds[0].thumbnail.width / 1.035)
      else msg.embeds[0].thumbnail.width = dimensions.width
    }
    var provider = ''
    if (msg.embeds[0].provider) provider = '<div class="embed-provider">' + msg.embeds[0].provider.name + '</div>'
    if (msg.embeds[0].type === 'image') attachEnd = attachEnd + '<div class="embed"><img src="' + msg.embeds[0].thumbnail.proxy_url + '" href="' + msg.embeds[0].thumbnail.url + '" width="' + msg.embeds[0].thumbnail.width +  '" height="auto"></div>'
    if (msg.embeds[0].type === 'video') attachEnd = attachEnd + '<div class="embed"><img src="' + msg.embeds[0].thumbnail.proxy_url + '" href="' + msg.embeds[0].thumbnail.url + '" width="' + msg.embeds[0].thumbnail.width +  '" height="auto"></div>'
    if (msg.embeds[0].type === 'link') {
      if (msg.embeds[0].description)attachEnd = attachEnd + '<div class="embed"><div class="embed-description">' + msg.embeds[0].description + '</div></div>'
    }
    if (msg.embeds[0].type === 'article') {
      if (msg.embeds[0].description) attachEnd = attachEnd + '<div class="embed">' + provider + '<div class="embed-description">' + msg.embeds[0].description + '</div></div>'
    }
    if (msg.embeds[0].type === 'rich') {
      console.log(msg.embeds[0])
      var embData = []
      if (msg.embeds[0].author) {
        embData.push('<div>')
        if (msg.embeds[0].author.icon_url) embData.push('<img class="embed-author-icon" src="' + msg.embeds[0].author.icon_url + '"/>')
        if (msg.embeds[0].author.name) embData.push('<a class="embed-author" targer="_blank" rel="noreferrer">' + msg.embeds[0].author.name + '</a>')
        embData.push('</div>')
      }
      if (msg.embeds[0].fields.length > 0) embData.push('<div class="embed-fields">')
      for (var i in msg.embeds[0].fields) {
        var inline = ''
        if (msg.embeds[0].fields[i].inline) inline = '-inline'
        embData.push('<div class="embed-field embed-field' + inline + '"><div class="embed-field-name">' + msg.embeds[0].fields[i].name + '</div><div class="embed-field-value markup">' + msg.embeds[0].fields[i].value.replace(/</, '&lt;').replace(/>/, '&gt;').replace(/\n+/ig, '<br>').replace(/https?:\/\/[\S]*/ig, function (m, r) {return m.replace(m, '<a href="' + m + '">' + m + '</a>')}).replace(/[\s\S]+/, function (m) {return twemoji.parse(m)}) + '</div></div>')
      }
      if (msg.embeds[0].fields.length > 0) embData.push('</div>')
      if (msg.embeds[0].footer) {
        embData.push('<div>')
        if (msg.embeds[0].footer.icon_url) embData.push('<img class="embed-footer-icon" src="' + msg.embeds[0].footer.icon_url + '"/>')
        if (msg.embeds[0].footer.text) embData.push('<span class="embed-footer">' + msg.embeds[0].footer.text.replace(/\n+/ig, '<br>') + '</span>')
        embData.push('</div>')
      }
      attachEnd = attachEnd + '<div class="embed" style="border-left-color: #' + msg.embeds[0].color.toString(16) + '">' + embData.join('') + '</div>'
    }
  }
  if (msg.attachments[0] !== undefined && msg.attachments[0].width) {
    var dimensions = calculateAspectRatioFit(msg.attachments[0].width, msg.attachments[0].height, 400, 600)
    var width = dimensions.width
    if (msg.attachments[0].width < 400) width = Math.round(msg.attachments[0].width / 1.035)
    attachEnd = attachEnd + '<img src="' + msg.attachments[0].proxy_url + '" href="' + msg.attachments[0].url + '" alt="' + msg.attachments[0].filename + '" width="' + width + '" height="auto"/>'
  }
  var regex = new RegExp(/&lt;@!?(\d+)&gt;/ig)
  var channelmention = new RegExp(/&lt;&#35;(\d+)&gt;/ig)
  var ghCodeblock = new RegExp(/```[\s\S]*```/g).exec(msg.content)
  var codeblock = new RegExp(/`[\s\S]*`/g).exec(msg.content)
  var i = 0
  var j = 0
  return msg.content.replace(/#/g, '&#35;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\[/ig, '&#91;').replace(/\(/ig, '&#40;').replace(/\./ig, '&#46;').replace(/-/ig, '&#45;').replace(/\+/ig, '&#43;').replace(regex, function (m, r) {
    m = m.replace(/&gt;/ig, '>').replace(/&lt;/ig, '<')
    if (msg.type !== 6 && msg.mentions[i] === undefined && r !== 0 && m.startsWith('<@')) {
      i++
      if (msg.mentions[i] === undefined) {
        if (bot.users.has(m.substr(2, m.length - 3))) m = m.replace(m, '<span class="mention">@' + bot.users.get(m.substr(2, m.length - 3)).username + '</span>')
        else m = m.replace(m, '<span class="mention">' + m + '</span>')
      }
      if (msg.mentions[i] !== undefined) {
        if (msg.type === 6) m = m.replace(m, msg.mentions[i].username)
        if (msg.type !== 6) m = m.replace(m, '<span class="mention">@' + msg.mentions[i].username + '</span>')
      }
    }
    if (msg.type === 6 && msg.mentions[i] !== undefined) m = m.replace(m, '<span class="username">' + msg.mentions[i].username + '</span>')
    if (msg.type !== 6 && msg.mentions[i] !== undefined) m = m.replace(m, '<span class="mention">@' + msg.mentions[i].username + '</span>')
    return m
  }).replace(/@everyone/ig, '<span class="mention">@everyone</span>').replace(/@here/ig, '<span class="mention">@here</span>').replace(/https?:\/\/[\S]*/ig, function (m, r) {
    return m.replace(m, '<a href="' + m + '">' + m + '</a>')
  }).replace(/(?:\\)?(?:&lt;){1,2}:[0-9a-z--_]+:(\d+)&gt;(?:\d+)?(?:&gt;)?/ig, function (m, r) {
    if (m.includes('\\')) return m.replace(m, m.substr(1))
    return m.replace(m, '<img class="emoji" src="https://cdn.discordapp.com/emojis/' + r + '.png"/>')
  }).replace(/[\s\S]+/ig, function (m, r) {
    return twemoji.parse(m, {
      folder: 'svg',
      ext: '.svg'
    })
  }).replace(/`[\s\S]*`/g, codeblock).replace(/```[\s\S]*```/g, function (m) {
    return ghCodeblock[0].replace(/```([\S]+)/g, '```$1\n').replace(/([\s\S]+)```/g, '$1\n```')
  }) + edit + attachEnd
}
function guildCreateMap (guild) {
  var guildObj = {}
  guildObj.members = new Map()
  guildObj.channels = new Map()
  guildObj.roles = new Map()
  guildObj.mfa = guild.mfa_level
  guildObj.emojis = guild.emojis
  guildObj.region = guild.region
  guildObj.owner = guild.owner_id
  guildObj.large = guild.large
  guildObj.id = guild.id
  guildObj.name = guild.name
  guildObj.icon = guild.icon
  guildObj.memberCount = guild.member_count
  for (var i in guild.roles) {
    var roleData = {}
    roleData.name = guild.roles[i].name
    roleData.hoist = guild.roles[i].hoist
    roleData.color = guild.roles[i].color.toString(16)
    roleData.id = guild.roles[i].id
    roleData.managed = guild.roles[i].managed
    roleData.mentionable = guild.roles[i].mentionable
    roleData.permissions = guild.roles[i].permissions
    roleData.position = guild.roles[i].position
    guildObj.roles.set(roleData.id, roleData)
  }
  for (var i in guild.members) {
    var memberData = {}
    memberData.user = guild.members[i].user
    memberData.nick = null || guild.members[i].nick
    memberData.joinedAt = guild.members[i].joined_at
    memberData.deaf = guild.members[i].deaf
    memberData.mute = guild.members[i].mute
    memberData.roles = guild.members[i].roles
    var permm = {}
    memberData.permissions = {}
    for (var c in guild.members[i].roles) {
      var temp = []
      guildObj.roles.forEach((role) => {
        temp.push({position: role.position, color: role.color, id: role.id})
      })
      temp = temp.sort(function(a,b){return a.position - b.position})
      for (var d in temp) {
        if (memberData.roles.indexOf(temp[d].id) > -1) {
          var fetchPerm = getPerm(guildObj.roles.get(temp[d].id).permissions)
            for (var e in fetchPerm) {
              permm[fetchPerm[e].name] = fetchPerm[e].value
            }
            memberData.permissions = permm
            if ($.isEmptyObject(permm)) memberData.permissions = 'hi'
        }
      }
    }
    memberData.status = 'offline'
    memberData.game = null
    for (var d in guild.presences) {
      if (guild.presences[d].user.id === memberData.user.id) {
        memberData.status = guild.presences[d].status
        memberData.game = guild.presences[d].game
      }
    }
    guildObj.members.set(guild.members[i].user.id, memberData)
    if (!bot.users.has(memberData.user.id)) {
      var userData = memberData.user
      userData.status = memberData.status
      userData.game = memberData.game
      bot.users.set(memberData.user.id, userData)
    }
    if (activeGuild === 'dm') {
      var users = $('.channels').children()
      for (var a in users) {
        if (users[a].childNodes !== undefined) {
          if (users[a].childNodes[0].dataset.dmuid === memberData.user.id) {
            users[a].childNodes[0].childNodes[0].childNodes[0].className = 'status ' + memberData.status
          }
        }
      }
    }
  }
  for (var i in guild.channels) {
    var channelData = {}
    if (guild.channels[i].type === 0) {
      channelData.name = guild.channels[i].name
      channelData.id = guild.channels[i].id
      channelData.position = guild.channels[i].position
      channelData.lastMessageID = guild.channels[i].last_message_id
      channelData.lastPinDate = guild.channels[i].last_pin_timestamp
      channelData.topic = guild.channels[i].topic
      channelData.type = guild.channels[i].type
      channelData.permissions = guild.channels[i].permission_overwrites
      guildObj.channels.set(guild.channels[i].id, channelData)
    }
  }
  guildObj.channels.forEach((channel) => {
    channel.guild = guildObj
    bot.channels.set(channel.id, channel)
  })
  bot.guilds.set(guild.id, guildObj)
}
function sendMessage (channel, content) {
  return apiCall('POST', 'https://discordapp.com/api/channels/' + channel + '/messages', true, {authorization: token, body: {content: content}})
}
function parseCmd (input) {
  if (!input.startsWith('/') && input !== '') return sendMessage(activeChannel, input)
  var command = input.trim().split(' ')[0]
  var suffix = input.trim().substr(command.length + 1)
  if (command === '/ping') {
    var time = Date.now()
    $('.messages-container').append($('<div class="msg-group" style="margin:0;background: rgba(0, 255, 45, 0.11)">').append('<div class="message" style="padding-left:20px;"><div class="avatar-large" style="background-image: url(\'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png\');"></div><div class="comment" data-uid="0"><h2><span class="username-wrap"><strong class="username">System</strong></span><span data-timestamp="' + Date.now() + '" class="timestamp">' + moment(Date.now()).calendar() + '</span></h2><div class="message-text"><span data-id="' + time + '" class="markup"><p>Ping!</p></span></div></div></div></div>'))
    apiCall('GET', 'https://discordapp.com/api/users/@me', true, {authorization: token}).then(() => {
      $(document.querySelector('[data-id="' + time + '"]'))[0].innerHTML = '<p>Ping! Time taken ' + Math.floor(Date.now() - time) + 'ms.<span class="edited">(edited)</span></p>'
    })
  }
  if (command === '/eval') {
    var time = Date.now()
    $('.messages-container').append($('<div class="msg-group" style="margin:0;background: rgba(0, 255, 45, 0.11)">').append('<div class="message" style="padding-left:20px;"><div class="avatar-large" style="background-image: url(\'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png\');"></div><div class="comment" data-uid="0"><h2><span class="username-wrap"><strong class="username">System</strong></span><span data-timestamp="' + Date.now() + '" class="timestamp">' + moment(Date.now()).calendar() + '</span></h2><div class="message-text"><span data-id="' + time + '" class="markup"><p>**Evaluating**</p></span></div></div></div></div>'))
    try {
      var evald = eval(suffix)
      if (typeof evald !== 'object') {
        $(document.querySelector('[data-id="' + time + '"]'))[0].innerHTML = '<p><strong>Result:</strong>\n' + evald + '<span class="edited">(edited)</span></p>'
      }
    } catch (e) {
      $(document.querySelector('[data-id="' + time + '"]'))[0].innerHTML = '<p><strong>Result:</strong>\n' + e + '<span class="edited">(edited)</span></p>'
    }
  }
  if (command === '/tableflip') {
    sendMessage(activeChannel, suffix + ' (╯°□°）╯︵ ┻━┻')
  }
  if (command === '/unflip') {
    sendMessage(activeChannel, suffix + ' ┬─┬﻿ ノ( ゜-゜ノ)')
  }
}
