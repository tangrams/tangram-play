[![David Dependencies](https://img.shields.io/david/tangrams/tangram-play.svg?style=flat-square)](https://david-dm.org/tangrams/tangram-play)
[![David devDependencies](https://img.shields.io/david/dev/tangrams/tangram-play.svg?style=flat-square)](https://david-dm.org/tangrams/tangram-play#info=devDependencies)

![](data/imgs/screenshot.png)

# Editor for Tangram scene files

Tangram Play is an editor for Mapzen's [Tangram map-rendering library](https://github.com/tangrams/tangram) that makes it easy to build or modify Tangram scene files and see your changes right away. It runs entirely in your browser and can be accessed at https://tangrams.github.io/tangram-play.

Here is [a clip of Patricio's live demo](https://twitter.com/ajturner/status/652186516194762752/video/1) at [JS.Geo](http://www.jsgeo.com/) (October 2015) ([notes are here](https://github.com/mapzen/presentations/tree/master/08-2015-JSGEO)).

This project is currently in active development (think public _beta_) and so functionality may change or break without prior notice. This doesn't mean you can't use it, but please keep this in mind and feel free to send feedback on [the issues tracker](https://github.com/tangrams/tangram-play/issues).

## Query string API

* ```lines=[number]/[number-number]```: you highlight a line or a range of lines. Example ```lines=10-12```.

* ```scene=[url.yaml]```: load a specific ```.yaml``` file using a valid url

## Keys

* ```Ctrl``` + ```[number]```: Fold indentation level ```[number]```
* ```Alt``` + ```F```: fold/unfold line
* ```Alt``` + ```P```: screenshot of the map

Sublime-like hotkeys
* ```Ctrl``` + ```F```: Search
* ```Ctrl``` + ```D```: Select next occurrence
* ```Alt``` + ```ArrowKeys```: move word by word
* ```Shift``` + ```ArrowKeys```: Select character by character
* ```Shift``` + ```Alt``` + ```ArrowKeys```: Select word by word

## Contributing

We welcome contributions from the community. For more information how to run Tangram Play in your local environment and get started, please see [CONTRIBUTING.md](https://github.com/tangrams/tangram-play/blob/gh-pages/CONTRIBUTING.md).
