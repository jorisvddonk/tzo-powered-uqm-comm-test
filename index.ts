import r from "raylib";
import { getStackParams, Stack, TzoVMState, VM } from "tzo";
import fs from "fs";
import { TextureVM } from "./textureVM";
import { QuestVM, Choice } from "questmark";
import { parseTextLocalizationFile } from "uqm-files-parsers";


const alien_name = "spathi";
const base = `./asking-about-flowers/comm/${alien_name}`;
const screenWidth = 800;
const screenHeight = 450;
r.InitWindow(screenWidth, screenHeight, "Tzo powered Animation Test");
r.SetTargetFPS(16);

const tvm = new TextureVM(r, base);
tvm.loadVMState(JSON.parse(fs.readFileSync("./anim.json").toString()) as TzoVMState);
tvm.run(); // start initiation process!

let displayString = "";
let options: Choice[] = [];
let optionPromiseCallback: (number) => void = null;
let selectedOptionIndex = 0;
const translations = parseTextLocalizationFile(fs.readFileSync(`${base}/${alien_name}.txt`).toString());
const localize = (input: string | number) => {
  let s = `${input}`;
  const t = translations.get(s);
  if (t) {
    s = t.localizedText.toString();
  }
  return s;
}
const qvm = new QuestVM((body => {
  displayString = `${displayString}${localize(body)}`
}), async choices => {
  options = choices;
  selectedOptionIndex = 0;
  return new Promise((resolve) => {
    optionPromiseCallback = resolve;
  });
});
qvm.loadVMState(JSON.parse(fs.readFileSync("./speech.json").toString()) as TzoVMState);
qvm.run();

const interv = setInterval(() => {
  if (!r.WindowShouldClose()) {
    if (r.IsKeyPressed(r.KEY_DOWN)) {
      selectedOptionIndex += 1;
    }
    if (r.IsKeyPressed(r.KEY_UP)) {
      selectedOptionIndex -= 1;
    }
    selectedOptionIndex = Math.max(0, Math.min(selectedOptionIndex, options.length - 1));

    if (r.IsKeyPressed(r.KEY_ENTER)) {
      if (optionPromiseCallback !== null) {
        displayString = "";
        optionPromiseCallback(options[selectedOptionIndex].id);
      }
    }

    r.BeginDrawing();
    r.ClearBackground(r.RAYWHITE);
    tvm.run(); // resume VM! This will draw the next frame...
    r.DrawText(JSON.stringify(tvm.context, null, 2), 20, 20, 5, r.BLACK)
    r.DrawText(displayString, 300, 10, 10, r.BLUE);
    options.forEach((o, i) => {
      r.DrawText(`${i} - ${localize(o.title)}`, 300, 300 + (i * 20), 10, selectedOptionIndex === i ? r.RED : r.BLUE);
    });
    r.EndDrawing();
  } else {
    clearInterval(interv);
    r.CloseWindow()        // Close window and OpenGL context
  }
}, 0);