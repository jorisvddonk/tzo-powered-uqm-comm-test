import r from "raylib";
import { getStackParams, Stack, TzoVMState, VM } from "tzo";
import fs from "fs";
import { TextureVM } from "./textureVM";
import { QuestVM } from "questmark";
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
const translations = parseTextLocalizationFile(fs.readFileSync(`${base}/${alien_name}.txt`).toString());
const qvm = new QuestVM((body => {
  let s = `${body}`;
  const t = translations.get(s);
  if (t) {
    s = t.localizedText.toString();
  }
  displayString = `${displayString}${s}`
}), async choices => {
  return new Promise((resolve, reject) => {
    // TODO: implement.
  });
});
qvm.loadVMState(JSON.parse(fs.readFileSync("./speech.json").toString()) as TzoVMState);
qvm.run();

while (!r.WindowShouldClose()) {
  r.BeginDrawing();
  r.ClearBackground(r.RAYWHITE);
  tvm.run(); // resume VM! This will draw the next frame...
  r.DrawText(JSON.stringify(tvm.context, null, 2), 20, 20, 5, r.BLACK)
  r.DrawText(displayString, 300, 10, 10, r.BLUE);
  r.EndDrawing()
}
r.CloseWindow()        // Close window and OpenGL context