/*global
  JST,
  api: true,
  OS_BASE,
  settings,
  urlParams,
  osToken,
  localSubtitles,
  getBinary,
  _arrayBufferToString,
  fixEncoding,
  Zlib,
  $window,
  $subSelector,
  $subSpinner,
  $subQuery,
  $subModal,
  $subGo,
  $subSelectBtn,
  $player,
  $translation,
*/
$(function () {
  'use strict';
  $subQuery.bind('keyup', function (e) {
    if (event.which === 13) {
      $subGo.click()
      return false
    }
    return true
  })

  function findSubtitlesClick(e) {
    if (!osToken) {
      return setTimeout(findSubtitlesClick.bind(this), 200)
    }

    function osSearchDone(response, status, jqXHR) {
      var subs = response[0].data
      var langs = {}
      if (subs) {
        for (var i = 0; i < subs.length; i++) {
          var sub = subs[i]
          if (settings.subtitlesBestMatch) {
            if (sub.SubLanguageID in langs) continue
            langs[sub.SubLanguageID] = true
          }
          $subSelector.append(JST['subtitles-item']({ uri: sub.SubDownloadLink, title: sub.SubFileName, lang: sub.SubLanguageID }))
        }
      } else {
        $subSelector.append(JST['subtitles-error']('Nothing found'))
      }
    }

    function osSearchFail(jqXHR, status, error) {
      $subSelector.append(JST['subtitles-error']('Error while searching subtitles: ' + error))
      $.pnotify({ text: 'Error while searching subtitles' })
    }

    function osSearchAlways() {
      $subSpinner.hide()
    }

    $subSpinner.show()
    var text = $subQuery.val()
    var langs = settings.subtitlesLangs.join(',')
    var params =
      { url: OS_BASE
      , methodName: 'SearchSubtitles'
      , params: [osToken, [{sublanguageid: langs, query: text}]]
      }
    $subSelector.html('')
    $.xmlrpc(params).done(osSearchDone).fail(osSearchFail).always(osSearchAlways)
  }

  $subGo.bind('click', findSubtitlesClick)

  function setupPlayer(sub) {
    sub = fixEncoding(sub)
    if (api) {
      api.loadSubtitles(sub)
      return
    }
    $player.html(JST.player({ src: urlParams.src, type: urlParams.type, sub: sub }))
    // There is MUST be non-local swf as local version violates sandbox rules for ExternalInterface
    // on chrome-extensions:// pages
    // Another option (but it's for development only) is to add 'chrome-extension://' address
    // to flash as trusted location at
    // http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html
    // (solution from https://code.google.com/p/chromium/issues/detail?id=42796#c10)
    $player.flowplayer({ swf: 'https://releases.flowplayer.org/5.4.6/flowplayer.swf', tooltip: false })
    api = $player.data('flowplayer')
    $window.resize()
    $player.append($translation)
  }

  // run player on modal hide
  $subSelectBtn.click(function (e) {
    var HTTP_PROTO = 'http'
    var sub = $('input[name=subtitles]:checked').val()
    if (sub === 'local') {
      setupPlayer(localSubtitles)
    } else if (sub && HTTP_PROTO === sub.substr(0, HTTP_PROTO.length)) {
      // fetch subtitles
      var getSubsDone = function (response) {
        var gunzip = new Zlib.Gunzip(response)
        var plain = gunzip.decompress()
        setupPlayer(plain)
      }

      var getSubsFail = function (error) {
        $.pnotify({ text: 'Error retrieving subtitles file' })
      }

      getBinary(sub, getSubsDone, getSubsFail)
    } else {
      setupPlayer()
    }
  })

  $subModal.on('hide.bs.modal', function (e) {
    if (!api) setupPlayer()
  })

  $subModal.on('shown.bs.modal', function (e) {
    $subQuery.focus()
  })
})
