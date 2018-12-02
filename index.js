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
    this.loopState = false
    this.listeners = {}
    this.playing = false

    this.initSource()
  }

  initSource () {
    this.source = this.context.createBufferSource()
    this.source.connect(this.context.destination)

    // Add set event listeners to new source.
    const events = Object.keys(this.listeners)
    if (!events.length) return
    events.map(eventName => {
      this.log(`Re-add event: ${eventName}`)
      this.source.addEventListener(eventName, this.listeners[eventName])
    })
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

    if (!this.loaded) {
      console.log('Waiting for buffer to load...')
      this.fetcher.then(() => this.play())
      return
    }

    if (this.source.buffer) return

    this.source.buffer = this.buffer
    this.source.loopEnd = this.buffer.duration
    this.source.loop = this.loopState
    this.startedAt = this.context.currentTime
    this.source.start(0, offset)
    this.playing = true
    this.source.addEventListener('ended', () => this.stop()) // So we can restart playback.
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
    this.initSource()
  }

  stop () {
    if (!this.playing) return
    this.clearSource()
    this.startedAt = 0
    this.offset = 0
    this.playing = false
    this.log('Stopped.')
  }

  loop (loopState) {
    this.loopState = loopState
    this.log('Loop:', loopState ? 'ON' : 'OFF')
    this.source.loop = loopState
    return this
  }

  toggleLoop () {
    this.loopState = !this.loopState
    this.log('Toggle loop:', this.loopState ? 'ON' : 'OFF')
    this.source.loop = this.loopState
    return this
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

  on (eventName, callback) {
    this.source.addEventListener(eventName, callback)
    this.listeners[eventName] = callback
    return this
  }

  log () {
    if (!this.debug) return
    console.log('Player:', ...arguments)
  }
}
