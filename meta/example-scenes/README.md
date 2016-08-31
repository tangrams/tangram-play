# example scenes cache

This directory contains Node scripts for fetching and saving example scene files
displayed in Tangram Play's "Open an example" modal.

Most of the scene files come from https://github.com/tangrams/tangram-sandbox,
but can be located anywhere. Previously, Tangram Play loaded scene files and
image thumbnails from the Sandbox's Rawgit cache, but this created some
noticeable problems: first, Rawgit (and GitHub itself) may occasionally go
down, and secondly, the image files were not optimized, resulting in long
loading times. (We were downloading 18MB of images when the examples modal
we opened, and it could take ten seconds to load fully, even on a good Internet
connection.)

So we want to (a) remove the dependency on third-party, free & unsupported
content delivery services, and (b) optimize the thumbnail images for display
in Tangram Play. We can automate this instead of having to download and optimize
images ourselves. Two scripts are provided here. One downloads scene files
and stores them in Tangram Play, the other downloads screenshot images and
converts them to thumbnails, optimizing for file size. These files become
static resources that will be stored directly in this repository, and deployed
along with Tangram Play

These scripts are designed to run only when needed, (whenever we update the
examples list) so it is not part of the build or deploy process. Project
maintainers are expected to run these scripts manually. When scene files or
thumbnail images are updated or created, commit the changes to the repository.
Be sure to update Tangram Play's `examples.json` so that the correct images
appear in the "Open an example" menu.

An npm script is provided for convenience.

```
npm run examples
```

## sources

One script exports an object whose keys are the filename to save to, and
values are external URLs of the scene file or the screenshot image. Because this
script runs rarely, and when needed, linking to Rawgit caches or GitHub URLs
are acceptable here.

When this script is run, all valid URLs will replace their destination files.
URLs that are not valid for any reason (e.g. 404, 500 errors) are skipped with
a warning. If you remove an entry or rename it, you will also have to remove
the old destination files, scripts will not take care of that for you. This is
because some examples may not have third-party sources so it will not delete
anything that looks unfamiliar.

## scene files

This is pretty simple; it downloads and saves each scene file locally. Not all
scene files need to be saved; if it's hosted on mapzen.com, we can retrieve if
from its canonical source. (We might revisit this if we need offline-first
Tangram Play.)

You can run this script by itself with this npm script:

```
npm run examples:scenes
```

## thumbnail images

To run this script, you will need a native installation of ImageMagick.
On Mac OS X, you can use Homebrew:

```
brew install imagemagick
```

Each screenshot image is downloaded, resized, and cropped to the dimensions that
Tangram Play expects (and at Retina resolution), optimized for file size and
rendering, and saved to the `/data/scenes/thumbnails` path in this repository.

You may edit this script update image dimensions.

You can run this script by itself with this npm script:

```
npm run examples:thumbnails
```
