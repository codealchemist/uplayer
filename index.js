module.exports = class Player {
  constructor (src, debug = false) {
    this.src = src
    this.context = new (window.AudioContext || window.webkitAudioContext)()
    this.loaded = false
    this.buffer = null
    this.source = null
    this.debug = debug
    this.startedAt = 0
    this.offset = 0
  }

  load () {
    this.log('Loading', this.src)
    this.fetcher = window
      .fetch(this.src, { method: 'GET', mode: 'no-cors' })
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.loaded = true
        this.buffer = audioBuffer
      })
    return this
  }

  getPlayTime () {
    return this.context.currentTime - this.startedAt + this.offset
  }

  play (offset) {
    if (this.context.state === 'suspended') {
      this.context.resume()
      return
    }

    if (this.source) return

    if (!this.loaded) {
      console.log('Waiting for buffer to load...')
      this.fetcher.then(() => this.play())
      return
    }

    this.source = this.context.createBufferSource()
    this.source.connect(this.context.destination)
    this.source.buffer = this.buffer
    this.source.loopEnd = this.buffer.duration
    this.startedAt = this.context.currentTime
    this.source.start(0, offset)
    this.log('Playing...')
  }

  pause () {
    this.context.suspend()
    this.log('Paused.')
  }

  clearSource () {
    if (!this.source) return
    this.source.disconnect()
    this.source.stop()
    this.source = null
  }

  stop () {
    this.clearSource()
    this.startedAt = 0
    this.offset = 0
    this.log('Stopped.')
  }

  loop (loopState) {
    this.source.loop = loopState
  }

  toggleLoop () {
    this.source.loop = !this.source.loop
  }

  forward (seconds = 5) {
    this.log(`>> Forward ${seconds} seconds`)
    const playTime = this.getPlayTime()
    this.offset = playTime + seconds
    if (this.offset > this.buffer.duration) this.offset = this.buffer.duration - seconds
    this.log('Play @', this.offset)
    this.clearSource()
    this.play(this.offset)
  }

  rewind (seconds = 5) {
    this.log(`<< Rewind ${seconds} seconds`)
    const playTime = this.getPlayTime()
    this.offset = playTime - seconds
    if (this.offset < 0) this.offset = 0
    this.log('Play @', this.offset)
    this.clearSource()
    this.play(this.offset)
  }

  useKeyboard (selector) {
    this.log('Using keyboard.')
    let $el = document.body
    if (selector) $el = document.querySelector(selector)
    $el.addEventListener('keydown', ({ key }) => {
      console.log(key)
      const keyMap = {
        ArrowRight: () => this.forward(),
        ArrowLeft: () => this.rewind(),
        z: () => this.stop(),
        x: () => this.play(),
        c: () => this.pause(),
        l: () => this.toggleLoop()
      }

      const method = keyMap[key]
      if (method) method()
    })
    return this
  }

  log () {
    if (!this.debug) return
    console.log('Player:', ...arguments)
  }
}
