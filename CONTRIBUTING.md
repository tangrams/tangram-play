# Contributing to Tangram Play

## Quickstart

To get Tangram Play up and running locally:

1. Clone or download this repository:
    - clone in a terminal window with `git clone https://github.com/tangrams/tangram-play.git`
    - or download a zip directly: https://github.com/tangrams/tangram-play/archive/master.zip
2. Start a webserver in the repository's directory:
    - in a terminal window, enter: `python -m SimpleHTTPServer 8000`
    - if that doesn't work, try: `python -m http.server`
3. View the editor at http://localhost:8000 (or whatever port you started the server on)

### Building

If you'd like to contribute to the project or just make changes to the source code for fun, you'll need to install the development requirements:

```shell
npm install
```

Building the stylesheets:

```shell
gulp css
```

### Testing

TODO

### Lint
We're using jshint to maintain code quality. JavaScript style should track with any changes in style of the [Tangram](http://github.com/tangrams/tangram) library.

```shell
npm run lint
```
