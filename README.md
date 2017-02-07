[![CircleCI](https://img.shields.io/circleci/project/tangrams/tangram-play.svg?style=flat-square)](https://circleci.com/gh/tangrams/tangram-play/)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=flat-square)](https://gitter.im/tangrams/tangram-chat)

![](data/imgs/screenshot.png)

# Editor for Tangram scene files

Tangram Play is an interactive text editor for creating maps using Mapzen’s [Tangram](https://mapzen.com/products/tangram/). With Play, you can write and edit map styles in YAML and preview the changes live in the web browser. Start with one of Mapzen’s base maps or create your own style!

Here is [a clip of Patricio's live demo](https://twitter.com/ajturner/status/652186516194762752/video/1) at [JS.Geo](http://www.jsgeo.com/) (October 2015) ([notes are here](https://github.com/mapzen/presentations/tree/master/08-2015-JSGEO)).

## Support

Learn more about using [Tangram](https://mapzen.com/documentation/tangram) and [Mapzen vector tiles](https://mapzen.com/documentation/vector-tiles/) in documentation.

Having a problem with Tangram Play? Do you have feedback to share? Contact Mapzen Support by emailing [tangram@mapzen.com](mailto:tangram@mapzen.com).

Tangram Play is still in active development and you can have a role in it! Add bugs or feature requests as an issue on the project’s [GitHub repository](https://github.com/tangrams/tangram-play/issues).

## Contributing

We welcome contributions from the community. For more information how to run Tangram Play in your local environment and get started, please see [CONTRIBUTING.md](https://github.com/tangrams/tangram-play/blob/master/CONTRIBUTING.md).

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
