import { invokeFunction, pushNumber, pushString } from "tzo";
import { parseGraphics } from "uqm-files-parsers";
import { Builder } from "./builder";
import fs from "fs";
import { Animation, AnimationFrame, AnimationType } from "uqm-files-parsers/dist/interfaces";

const base = "./asking-about-flowers/comm/chmmr";
const graphics = parseGraphics(fs.readFileSync(`${base}/chmmr.ani`).toString());

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
    invokeFunction("setContext")
  ])
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
  }
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