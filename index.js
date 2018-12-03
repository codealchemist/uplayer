module.exports = class Player {
  constructor (src, debugState = false) {
    this.src = src
    this.context = new (window.AudioContext || window.webkitAudioContext)()
    this.loaded = false
    this.buffer = null
    this.source = null
    this.debugState = debugState
    this.startedAt = 0
    this.offset = 0
    this.loopState = false
    this.listeners = {}
    this.ownListeners = {}
    this.playing = false
    this.ownEvents = ['play', 'stop', 'pause', 'forward', 'rewind', 'load', 'loaded']

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

  clearSource () {
    if (!this.source) return
    if (this.playing) this.source.stop()
    this.source.disconnect()
    this.initSource()
  }

  stop () {
    this.clearSource()
    this.startedAt = 0
    this.offset = 0
    this.playing = false
    this.log('Stopped.')
    if (typeof this.ownListeners.stop === 'function') {
      this.ownListeners.stop()
    }
  }

  load (src) {
    src = src || this.src
    this.log('Loading', src)
    if (typeof this.ownListeners.load === 'function') {
      this.ownListeners.load(src)
    }
    if (this.loaded) {
      this.clearSource()
      this.loaded = false
    }

    if (typeof src !== 'string') {
      this.fetcher = this.context.decodeAudioData(src).then(audioBuffer => {
        this.loaded = true
        this.buffer = audioBuffer
        if (typeof this.ownListeners.loaded === 'function') {
          this.ownListeners.loaded()
        }
      })
      return this
    }

    this.fetcher = window
      .fetch(src, { method: 'GET', mode: 'no-cors' })
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.loaded = true
        this.buffer = audioBuffer
        if (typeof this.ownListeners.loaded === 'function') {
          this.ownListeners.loaded()
        }
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
      this.log('Waiting for buffer to load...')
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
    if (typeof this.ownListeners.play === 'function') {
      this.ownListeners.play()
    }
  }

  pause () {
    this.context.suspend()
    this.playing = false
    this.log('Paused.')
    if (typeof this.ownListeners.pause === 'function') {
      this.ownListeners.pause()
    }
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
    if (typeof this.ownListeners.forward === 'function') {
      this.ownListeners.forward(seconds)
    }
    const playTime = this.getPlayTime()
    this.offset = playTime + seconds
    if (this.offset > this.buffer.duration) this.offset = this.buffer.duration - seconds
    this.log('Play @', this.offset)
    this.clearSource()
    this.play(this.offset)
  }

  rewind (seconds = 5) {
    this.log(`<< Rewind ${seconds} seconds`)
    if (typeof this.ownListeners.rewind === 'function') {
      this.ownListeners.rewind(seconds)
    }
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

  isOwnEvent (eventName) {
    return this.ownEvents.includes(eventName)
  }

  on (eventName, callback) {
    if (this.isOwnEvent(eventName)) {
      this.ownListeners[eventName] = callback
      return this
    }

    this.source.addEventListener(eventName, callback)
    this.listeners[eventName] = callback
    return this
  }

  debug (debugState) {
    this.debugState = debugState
    return this
  }

  log () {
    if (!this.debugState) return
    console.log('Player:', ...arguments)
  }
}
