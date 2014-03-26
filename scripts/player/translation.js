
$(function () {
  // pause on mouse over subtitles
  var subSel = '.flowplayer .fp-subtitle.fp-active'
  var wordSel = '.flowplayer .fp-subtitle.fp-active p span'
  var timer = null
  var paused = 0
  var PNONE = 0
  var PPAUSED = 1
  var PUNPAUSED = 2

  function hideTranslation() {
    if (paused === PUNPAUSED) {
      api.play()
    }
    paused = PNONE
    $translation.hide()
  }

  function scheduleHide(onlyClear) {
    clearTimeout(timer)
    if (onlyClear) return
    timer = setTimeout(hideTranslation, 100)
  }

  // split replica by words
  $document.on('mouseenter', '.flowplayer .fp-subtitle.fp-active p', function (e) {
    var t = $(this)
    if (!t.data('splitted')) {
      var html = t.html().replace(/([^<\/>\s."][a-zа-яё0-9'-]+)/ig, '<span>$1</span>')
      t.html(html)
      t.data('splitted', true)
    }
  })

  // play/pause on hover subtitles are
  $document.on('mouseenter', subSel, function (e) {
    if (paused === PNONE) {
      paused = api.paused ? PPAUSED : PUNPAUSED
    }
    scheduleHide(true)
    api.pause()
  })
  $document.on('mouseleave', subSel, function (e) {
    scheduleHide(false)
  })

  // highlight hover word and show translation
  function translationAdjustPosition() {
    $translation.css('top', $(subSel).offset().top - $translation.height() - 15)
    $translation.css('left', ($document.width() - $translation.width()) / 2)
  }
  function translationShow(text, translations) {
    $translationContent.html(JST['translation']({ original: text, translations: translations.def }))
    $translationSpinner.hide()
    translationAdjustPosition()
  }
  function translationShowLoading() {
    $translationContent.html('')
    $translation.show()
    $translationSpinner.show()
    translationAdjustPosition()
  }
  $document.on('mouseenter', wordSel, function (e) {
    var t = $(this)
    t.addClass('word-over')
    translationShowLoading()
    var text = t.html()
    if (text in transCache) {
      translationShow(text, transCache[text])
      return
    }
    var args =
      { key: YANDEX_TRANSLATOR_KEY
      , lang: settings.translationLang
      , text: text
      }
    var url = buildUrl(YANDEX_TRANSLATOR_BASE + 'lookup', args)
    $.get(url, function (res) {
      transCache[text] = res
      translationShow(text, res)
    })
  })
  $document.on('mouseleave', wordSel, function (e) {
    var t = $(this)
    t.removeClass('word-over')
  })
  // translation block
  $translation.on('mouseenter', function (e) {
    scheduleHide(true)
  })
  $translation.on('mouseleave', function (e) {
    scheduleHide(false)
  })
})
