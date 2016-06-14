# Contributing to Tangram Play

## Local installation / deployment process

Clone this repository to your local machine, and then run the following command in this repository's root directory:

    npm install

This installs all the required Node.js modules and dependencies, and immediately compiles everything. You should only need to do once after cloning, or every once in a while when dependencies change.

### Building, serving, and watching with Gulp

For day-to-day development, we build the client-side bundles using [Gulp][gulp]. You may need to install this command line tool globally if you do not already have it (and you may need to do this with `sudo`). Unless other specified, assume this and all other command line instructions in this document are run from the repository's root directory.

    npm install -g gulp

To build JavaScript and CSS once, run:

    gulp build

#### Running a local server with Browsersync

The default behavior of `gulp` uses [Browsersync][browsersync] to watch for source file changes, rebuild client-side bundles, and automatically update browser tabs. For convenience, this maps to a standard `npm` run script command:

    npm start

When run, a local server will be opened on `http://localhost:8080/`. You may adjust this port by configuring `gulpfile.js`. In addition, you may access the Browsersync UI (default location is `http://localhost:8081/`). Browsersync will automatically reload when JavaScript or the app's entry `index.html` is edited. CSS files will stream into the application without a reload. Tangram Play will save some elements of application state, such as map position, last scene content, and last editor position even while reloading. You may safely kill the BrowserSync server process at any time by hitting Ctrl-C.

#### Running a local server manually

If you want to build and watch JavaScript and CSS assets _without_ Browsersync, you can do so with this `gulp` task:

    gulp watch

You can then run a local server manually. The app is a static site, and can be viewed by any static fileserver, such as Python's [SimpleHTTPServer][simplehttpserver] or Node's [http-server module][http-server].

#### SimpleHTTPServer

Download this repo, then start a web server in its directory:

    python -m SimpleHTTPServer 8080

If that doesn't work, try:

    python -m http.server 8080

Then navigate to: [http://localhost:8080/][localhost]

#### `http-server`

Download this repo, then install `http-server`:

    npm install -g http-server

Then, from the repository's root directory, run:

    http-server

Then navigate to: [http://localhost:8080/][localhost]

#### Serving scene assets from a local server with `http-server`

You may have Tangram scene files locally and want to load them into a local build of Tangram Play. If you attempt to load them from `http://localhost:xxxx` where `xxxx` is a different port from a local Tangram Play, browsers will block requests unless [CORS][cors] is enabled. The easiest way to run a local server with CORS enabled is with Node's [http-server module][http-server].

    http-server -p xxxx --cors   # Set -p (port) to whatever you like

[gulp]: http://gulpjs.com/
[browsersync]: https://browsersync.io/
[localhost]: http://localhost:8080/
[simplehttpserver]: https://docs.python.org/2/library/simplehttpserver.html
[http-server]: https://www.npmjs.com/package/http-server
[cors]: https://karma-runner.github.io/

### Deployment process

The `build/` directory is not committed to the source code. We use Circle.CI's configuration to compile all the files for deployment.

Circle.CI also runs tests and lints code. If the code fails to lint, or tests fail, Circle.CI will refuse to deploy that code.

### Submitting a pull request

Create a new topic branch for the feature or patch you are committing, either on this repository (for contributors) or in a fork of the project. When your code is ready for review, commit and push your changes to your branch, and then submit a new pull request to the `master` branch of this project.

Please wait for Circle.CI to run its tests and report that all tests are passing. Additionally, there may be other comments from other contributors. Contributors should also have access to [Precog](https://github.com/mapzen/precog), which enables previews of the code without needing to build and preview locally. Once approved, the branch will be merged into the codebase, and the topic branch will be deleted if it is in this repository.

Whenever code is committed or merged to the `master` branch, it will immediately kick off a build to the live site, located at https://mapzen.com/tangram/play/. Therefore, it is important that all pull requests must be vetted by at least one of the main contributors before being approved!

## Frameworks

Stylesheets are processed by [PostCSS](https://github.com/postcss/postcss) with the [CSSNext](http://cssnext.io/) plugin.

Like the [Tangram](https://github.com/tangrams/tangram) library itself, JavaScript is written in ES6 (aka ECMAScript 2015). It is transpiled by [Babel](https://babeljs.io/) and modules are bundled with [Browserify](http://browserify.org/).

## Testing

Tangram Play has low test coverage, but we intend for this to improve dramatically over time. Pull requests that have tests included are more likely to be reviewed and approved quicker. The test stack is very similar to Tangram: it uses the [Karma][karma] test runner, the [Mocha][mocha] test framework, the [Chai][chai] assertion library (with the `assert` assertion style), and [Sinon][sinon] for stubs and mocks. The test environment is also transpiled with Babel and assumes the presence of ES2015 language features.

To run tests:

    npm run karma

[karma]: https://karma-runner.github.io/
[mocha]: https://mochajs.org/
[chai]: http://chaijs.com/
[sinon]: http://sinonjs.org/

## Code style and linting

Tangram Play uses [ESLint][eslint] to lint JavaScript for both syntax errors and code style. Rules were inherited from Tangram's [JSHint][jshint] rules, with gaps filled in by [JavaScript Standard Style][standard]. Generally, please refer to the [Airbnb Javascript style guide][airbnb] for Javascript / ES6 best practices, although we did not necessarily adopt their rules directly. We may document rationales for certain rules as comments within `.eslintrc`.

We use [Stylelint][stylelint] and build on [`stylelint-config-standard`][stylelint-standard] for linting CSS.

To run the linter, there is an `npm` script that runs ESLint and Stylelint on non-vendor-sourced files.

    npm run lint

You may also run commands to lint JavaScript or CSS separately.

    npm run lint-js
    npm run lint-css

[eslint]: http://eslint.org/
[jshint]: http://jshint.com/docs/
[standard]: http://standardjs.com/
[airbnb]: https://github.com/airbnb/javascript
[stylelint]: http://stylelint.io/
[stylelint-standard]: https://github.com/stylelint/stylelint-config-standard
