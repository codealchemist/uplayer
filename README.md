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
  .load()
  .play()
```

## API

Constructor params: `uplayer(src, debug)`:

- `src`: A URL to an audio file.
- `debug`: Enables console log for debugging when true. False by default.

**µ-player** provides the following methods:

- `load()`: Loads set audio source.
- `play(offset)`: Starts playback of loaded audio file at specified offset seconds.
- `pause()`: Pauses playback.
- `stop()`: Stops playback.
- `rewind(seconds)`: Rewinds audio specified amount of seconds, 5 by default.
- `forward(seconds)`: Forwards audio specified amount of seconds, 5 by default.
- `useKeyboard(selector)`: Enables keyboard bindings adding listeners to passed selector. Uses `body` by default.
- `loop(loopState)`: Enables / disables looping based on `loopState`.
- `toggleLoop()`: Toggles looping.

**µ-player** provides the following properties:

- `src`: The audio file URL.
- `context`: WebAudio context.
- `loaded`: True when audio file was loaded, false when not.
- `buffer`: WebAudio buffer data.
- `source`: WebAudio source.

Have fun!
