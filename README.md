# Tzo-based Animation Test

This is a simple animation test. [uqm-files-parsers](https://github.com/jorisvddonk/uqm-files-parsers) is being used to parse an animation file from [UQM](http://sc2.sourceforge.net/) annotated with UQMAnimationTool animation annotations, which is then compiled to a [Tzo VM](https://github.com/jorisvddonk/tzo) program, and interpreted by the Tzo VM which in turn instructs [node-raylib's dependencies](https://github.com/RobLoach/node-raylib/) to render relevant sprites when needed.

At the moment, some file paths are hardcoded, so don't expect much practical usage of this at the moment ;)

## Running it!

First, ensure you have all dependencies installed
(you'll need to have [node-raylib's dependencies](https://github.com/RobLoach/node-raylib/) installed before doing this!)

`npm ci`

Next, parse the UQM animation file and build the Tzo VM code:

`npm run build`

Finally, run the interpreter!

`npm start`

