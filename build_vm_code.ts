import { Instruction, invokeFunction, pushNumber, pushString } from "tzo";
import { parseGraphics } from "uqm-files-parsers";
import { Builder } from "./builder";
import fs from "fs";
import { Animation, AnimationFrame, AnimationType } from "uqm-files-parsers/dist/interfaces";
import "array-flat-polyfill";

const base = "./asking-about-flowers/comm/spathi";
const graphics = parseGraphics(fs.readFileSync(`${base}/spathi.ani`).toString());

const b = new Builder();

// load frames
graphics.frames.forEach(frame => {
  b.add([
    pushNumber(frame.hotspot.y),
    pushNumber(frame.hotspot.x),
    pushString(`${frame.filename}`),
    invokeFunction('loadImage')
  ]);
});

// set up animation contexts
graphics.animations.forEach(anim => {
  b.add([
    pushNumber(0),
    pushString(`anim_${anim.name}_index`),
    invokeFunction("setContext"),
    pushNumber(anim.type === AnimationType.BACKGROUND ? 1 : 0),
    pushString(`anim_${anim.name}_active`),
    invokeFunction("setContext")
  ]);
  if (anim.type === AnimationType.YO_YO) {
    b.add([
      pushNumber(1),
      pushString(`anim_${anim.name}_yy_direction`),
      invokeFunction("setContext")
    ])
  }
});

// pause the VM!
b.add([
  invokeFunction("pause")
]);


// main anim loop START:
b.add([
  b.withLabel(invokeFunction("nop"), "mainAnimationLoop")
]);

// main animation loop's CONTROL FUNCTIONS:
graphics.animations.forEach(anim => {
  // Begin by checking the activity of other (exclusive) animations
  b.add([pushNumber(0)]);
  b.add(anim.do_not_play_when_other_anim.map((blockingAnimName, i) => {
    const r: Instruction[] = [
      pushString(`anim_${blockingAnimName}_active`),
      invokeFunction("getContext"),
      pushNumber(1),
      invokeFunction("eq"),
      invokeFunction("or")
    ];
    return r;
  }).flat(1));
  b.add([
    invokeFunction("not"),
    invokeFunction("jgz"),
    invokeFunction("{"),
    // randomly enable the animation
    // TODO: actually use the animation timing and scheduler here!
    pushNumber(2),
    invokeFunction('randInt'),
    pushNumber(1),
    invokeFunction("eq"),
    pushString(`anim_${anim.name}_active`),
    invokeFunction("getContext"),
    invokeFunction("or"),
    invokeFunction("jgz"),
    invokeFunction("{"),
    pushNumber(1), // if we make it here, we got to set the animation active again!
    pushString(`anim_${anim.name}_active`),
    invokeFunction("setContext"),
  ]);


  if (anim.type === AnimationType.CIRCULAR) {
    // add to the index until we reach the end, then loop back to 0!
    b.add([
      pushString(`anim_${anim.name}_index`),
      invokeFunction("getContext"),
      pushNumber(anim.frames.length - 1),
      invokeFunction("eq"), // if 1: we are at last frame!
      invokeFunction("jgz"),
      invokeFunction("{"),
      pushNumber(-1), // reset to -1 (will be incremented to 0 later)
      pushString(`anim_${anim.name}_index`),
      invokeFunction("setContext"),
      pushNumber(0), // disable animation
      pushString(`anim_${anim.name}_active`),
      invokeFunction("setContext"),
      invokeFunction("}"),
      pushNumber(1), // increment by one
      pushString(`anim_${anim.name}_index`),
      invokeFunction("getContext"),
      invokeFunction("+"),
      pushString(`anim_${anim.name}_index`),
      invokeFunction("setContext"),
    ])
  } else if (anim.type === AnimationType.RANDOM) {
    // randomly update the index
    b.add([
      pushNumber(anim.frames.length),
      invokeFunction('randInt'),
      pushString(`anim_${anim.name}_index`),
      invokeFunction("setContext")
    ])
  } else if (anim.type === AnimationType.YO_YO) {
    // add or subtract to the index until we reach the end, then reverse!
    b.add([
      // are we moving forwards and at the last frame?
      pushString(`anim_${anim.name}_yy_direction`),
      invokeFunction("getContext"),
      pushNumber(1),
      invokeFunction("eq"), // if 1: we are moving forward!
      pushString(`anim_${anim.name}_index`),
      invokeFunction("getContext"),
      pushNumber(anim.frames.length - 1),
      invokeFunction("eq"), // if 1: we are at last frame!
      invokeFunction("and"), // if 1: we are moving forward AND at last frame
      invokeFunction("jgz"),
      invokeFunction("{"),
      pushNumber(-1), // reverse
      pushString(`anim_${anim.name}_yy_direction`),
      invokeFunction("setContext"),
      invokeFunction("}"),
      // are we moving backwards and at the first frame?
      pushString(`anim_${anim.name}_yy_direction`),
      invokeFunction("getContext"),
      pushNumber(-1),
      invokeFunction("eq"), // if 1: we are moving backward!
      pushString(`anim_${anim.name}_index`),
      invokeFunction("getContext"),
      pushNumber(0),
      invokeFunction("eq"), // if 1: we are at first frame!
      invokeFunction("and"), // if 1: we are moving backward AND at first frame
      invokeFunction("jgz"),
      invokeFunction("{"),
      pushNumber(1), // reverse
      pushString(`anim_${anim.name}_yy_direction`),
      invokeFunction("setContext"),
      pushNumber(0), // disable animation (only when the yo-yo finished)
      pushString(`anim_${anim.name}_active`),
      invokeFunction("setContext"),
      invokeFunction("}"),
      // add yy direction to index
      pushString(`anim_${anim.name}_yy_direction`),
      invokeFunction("getContext"),
      pushString(`anim_${anim.name}_index`),
      invokeFunction("getContext"),
      invokeFunction("+"),
      pushString(`anim_${anim.name}_index`),
      invokeFunction("setContext"),
    ])
  }

  b.add([
    invokeFunction("}"),
    invokeFunction("}") // end exclusive animation activity check
  ]); 
});

// main animation loop's DISPLAY FUNCTIONS:
function displayImageMaybe(anim: Animation, frame: AnimationFrame) { // convenience function
  b.add([
    pushString(`anim_${anim.name}_index`),
    invokeFunction("getContext"),
    pushNumber(anim.frames.indexOf(frame)),
    invokeFunction("eq"),
    invokeFunction("jgz"),
    invokeFunction("{"),
    pushNumber(frame.frame_index),
    invokeFunction("drawFrame"),
    invokeFunction("}"),
  ]);
}
graphics.animations.forEach(anim => {
  anim.frames.forEach(frame => {
    displayImageMaybe(anim, frame);
  })
});

// main anim loop STOP:
b.add([
  invokeFunction("pause"), // pause at end of loop
  pushString("mainAnimationLoop"), // ensure that when we resume next, we restart the loop...
  invokeFunction("goto") // jump back!
])

fs.writeFileSync("./anim.json", JSON.stringify(b.build(), null, 2));