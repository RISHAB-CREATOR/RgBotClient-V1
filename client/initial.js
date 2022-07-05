$(function() {
  $("#token").keypress(function (e) {
    var code = (e.keyCode ? e.keyCode : e.which)
    if (code === 13) {
      var script = document.createElement('script')
      script.src = './script.js'
      document.head.appendChild(script)
      script.onload = function () {
        startBotcord($('#token').val())
        document.body.innerHTML = '<h1 style="font-size:3em; margin: 0; padding: 0;padding-top: 20%;">That\'s all we need for now! Your bot should now log in!</h1>'
      }
    }
  })
})

if (localStorage.token !== '') {
  var script = document.createElement('script')
  script.src = './script.js'
  document.head.appendChild(script)
  script.onload = function () {
    startBotcord(localStorage.token)
    document.body.innerHTML = '<h1 style="font-size:3em; margin: 0; padding: 0;padding-top: 20%;">Resuming last session...</h1>'
  }
}
function restartInitial () {
  $(function() {
    $("#token").keypress(function (e) {
      var code = (e.keyCode ? e.keyCode : e.which)
      if (code === 13) {
        startBotcord($('#token').val())
        document.body.innerHTML = '<h1 style="font-size:3em; margin: 0; padding: 0;padding-top: 20%;">That\'s all we need for now! Your bot should now log in!</h1>'
      }
    })
  })
}
