# Contributing to Tangram Play

## Local installation / deployment process

Clone this repository to your local machine, and then run the following commands in this repository's root directory:

```sh
npm install     # Installs Node.js / JavaScript dependencies
npm run build   # Compiles JavaScript and CSS files to /build
```

You should only need to do once after cloning, or every once in a while when dependencies change.

### Building and watching with Gulp

For day-to-day development, we build the client-side bundles using [Gulp](http://gulpjs.com/). You may need to install this command line tool globally if you do not already have it (and you may need to do this with `sudo`). Unless other specified, assume this and all other command line instructions in this document are run from the repository's root directory.

```sh
npm install -g gulp
```

To build JavaScript and CSS once, run:

```sh
gulp build
```

The default behavior of `gulp` is to watch for source file changes and rebuild client-side bundles automatically:

```sh
gulp
```

If a [LiveReload](http://livereload.com/) browser plugin is active, Gulp will also publish stylesheet updates to it. You may safely kill the `gulp` process at any time by hitting Ctrl-C.

### Running a local server

Tangram Play is a static site, and can be viewed by any static fileserver, such as Python's [SimpleHTTPServer](https://docs.python.org/2/library/simplehttpserver.html) or Node's [http-server module](https://www.npmjs.com/package/http-server).

### Deployment process

The `build/` directory is not committed to the source code. We use Circle.CI's configuration to compile all the files for deployment.

### Submitting a pull request

Create a new topic branch for the feature or patch you are committing, either on this repository (for contributors) or in a fork of the project. When your code is ready for review, commit and push your changes to your branch, and then submit a new pull request to the `master` branch of this project.

Please wait for Circle.CI to run its tests and report that all tests are passing. Additionally, there may be other comments from other contributors. Contributors should also have access to [Precog](https://github.com/mapzen/precog), which enables previews of the code without needing to build and preview locally. Once approved, the branch will be merged into the codebase, and the topic branch will be deleted if it is in this repository.

Whenever code is committed or merged to the `master` branch, it will immediately kick off a build to the live site, located at https://mapzen.com/tangram/play/. Therefore, it is important that all pull requests must be vetted by at least one of the main contributors before being approved!

## Frameworks

Stylesheets are processed by [PostCSS](https://github.com/postcss/postcss) with the [CSSNext](http://cssnext.io/) plugin.

Like the [Tangram](https://github.com/tangrams/tangram) library itself, JavaScript is written in ES6 (aka ECMAScript 2015). It is transpiled by [Babel](https://babeljs.io/) and modules are bundled with [Browserify](http://browserify.org/).

## Testing

TODO

## Code style and linting

This project has not been aggressively linted but we do have a code style. Tangram Play borrows [JSHint](http://jshint.com/docs/) rules from Tangram, and also attempts to codify Tangram code style into [JSCS](http://jscs.info/) rules, but this is still in need of a review. For Javascript / ES6 best-practices we refer to the [Airbnb Javascript style guide](https://github.com/airbnb/javascript) but we do not yet have any meaningful opinions on whether we need to differ from it.

To run the linter, there is an npm script that runs both JSHint and JSCS on non-vendor-sourced Javascript files in the `src/` folder. This assumes that the CLI for JSHint and JSCS are also available:

```sh
npm install -g jshint jscs    # if you need to
npm run lint
```

You may also run the linters on individual files if you do not want to see the massive list of warnings the script currently outputs on all of the files we have.

### Explanations for certain rules

Since we can't document rationales for rules inside the `.jscsrc` itself, this is where we can record the reasons why certain rules are the way they are.

- **[requireCamelCaseOrUpperCaseIdentifiers](http://jscs.info/rule/requireCamelCaseOrUpperCaseIdentifiers)** -- Set to `"ignoreProperties"` to allow for references to internal properties of Tangram, e.g. `scene.config_path`. Otherwise all identifiers including object properties of Tangram Play should be camelCase and constants can be UPPERCASE_WITH_UNDERSCORES.
