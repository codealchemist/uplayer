# µ-player

A programatic audio player written in JavaScript.

## About

**µ-player** is a minimal audio player for web browsers with no dependencies that directly uses WebAudio API.

It's meant to be used programatically, so it provides no UI, just a basic API and access to WebAudio objects, really useful if you want to modify or analyze the audio source.

It also provides keyboard bindings that can be enabled if required.

## Install

`npm i uplayer`

## Usage

```
const Player = require('uplayer')
const player = new Player('http://server/some.mp3')
player
  .on('ended', () => console.log('Ended.'))
  .load()
  .play()
```

## API

Constructor params: `uplayer(src, debugState)`:

- `src`: A URL to an audio file.
- `debugState`: Enables console log for debugging when true. False by default.

`src` can be a URL to be resolved by `fetch` or an `ArrayBuffer`.

**µ-player** provides the following methods:

- `load(src)`: Loads passed audio source or the one set on `constructor`.
- `play(offset)`: Starts playback of loaded audio file at specified offset seconds.
- `pause()`: Pauses playback.
- `stop()`: Stops playback.
- `rewind(seconds)`: Rewinds audio specified amount of seconds, 5 by default.
- `forward(seconds)`: Forwards audio specified amount of seconds, 5 by default.
- `useKeyboard(selector)`: Enables keyboard bindings adding listeners to passed selector. Uses `body` by default.
- `loop(loopState)`: Enables / disables looping based on `loopState`.
- `toggleLoop()`: Toggles looping.
- `on(eventName, callback)`: Adds event listener on WebAudio source.
- `debug(debugState)`: Enables / disables debug mode based on `debugState`.

**µ-player** provides the following properties:

- `src`: The audio file URL.
- `context`: WebAudio context.
- `loaded`: True when audio file was loaded, false when not.
- `buffer`: WebAudio buffer data.
- `source`: WebAudio source.

## Events

Use the method `on(eventName, callback)` to set event listeners on the WebAudio source.

For more info about events check [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).

## Key bindings

- `z`: Stop.
- `x`: Play.
- `c`: Pause.
- `l`: Toggle looping.
- `ArrowRight`: Forward.
- `ArrowLeft`: Rewind.

## Using with file reader

Since `src` can be an `ArrayBuffer` you can easily drop audio files in the browser
and play them with **µ-player**.

Here's an example using the excellent [drag-drop](https://github.com/feross/drag-drop) module from [Feross](https://github.com/feross):

```
const dragDrop = require('drag-drop')

dragDrop('body', function (files) {
  const file = files[0]
  console.log('GOT FILE:', file)

  const reader = new window.FileReader()
  reader.addEventListener('load', e => {
    const data = e.target.result
    const player = new Player(data, true)
    player.load().play()
  })
  reader.addEventListener('error', err => {
    console.error('FileReader error' + err)
  })
  reader.readAsArrayBuffer(file)
})
```

Have fun!
