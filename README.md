![](data/imgs/screenshot.png)

Style Editor for Tangram Styles

## Query string API

* ```lines=[number]/[number-number]```: you highlight a line or a range of lines. Example ```lines=10-12```.

* ```style=[url.yaml]```: load a specific ```.yaml``` file using a valid url

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

## Local installation / build process

Clone this repository, then, in this repository's root directory, run the following:

```sh
npm install     # Installs Node modules dependencies
gulp js css     # Builds Javascript and CSS files to /build
```

You may also need to install command line dependencies globally if you do not already have it (and you may need to do this with `sudo`):

```sh
npm install -g gulp
```

Typing `gulp` by itself runs the Javascript and CSS build scripts, and additionally starts a watcher that will rebuild each time the source files are changed. If a [LiveReload](http://livereload.com/) server is active, it will also publish stylesheet updates to LiveReload. You may safely kill the gulp process at any time by hitting Ctrl-C.

Tangram Play is a static site, and can be viewed by any static fileserver, such as Python's [SimpleHTTPServer](https://docs.python.org/2/library/simplehttpserver.html) or Node's [http-server module](https://www.npmjs.com/package/http-server).

Compiled files in the `build/` directory are committed and published to GitHub so that [GitHub Pages](https://pages.github.com/) have access to it. Generally, I try not to include the compiled files with every commit until something is ready to go live. Then I make one commit that is just the compiled files. This makes it easier to back out of strange merge conflicts and keeps the history from getting too complicated.

### Code style and linting

This project has not been aggressively linted but we do have a code style. Tangram Play borrows [JSHint](http://jshint.com/docs/) rules from [Tangram](https://github.com/tangrams/tangram) and also attempts to codify Tangram code style into [JSCS](http://jscs.info/) rules, but this is still in need of a review. For Javascript best-practices we refer to the [Airbnb Javascript style guide](https://github.com/airbnb/javascript) but we do not yet have any meaningful opinions on whether we need to differ from it.

To run the linter, there is an npm script that runs both JSHint and JSCS on non-vendor-sourced Javascript files in the `src/` folder. This assumes that the CLI for JSHint and JSCS are also available:

```sh
npm install -g jshint jscs    # if you need to
npm run lint
```

You may also run the linters on individual files if you do not want to see the massive list of warnings the script currently outputs on all of the files we have.
