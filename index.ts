import r from "raylib";
import { getStackParams, Stack, TzoVMState, VM } from "tzo";
import fs from "fs";
import { TextureVM } from "./textureVM";
import { QuestVM } from "questmark";


const base = "./asking-about-flowers/comm/spathi";
const screenWidth = 800;
const screenHeight = 450;
r.InitWindow(screenWidth, screenHeight, "Tzo powered Animation Test");
r.SetTargetFPS(16);

const tvm = new TextureVM(r, base);
tvm.loadVMState(JSON.parse(fs.readFileSync("./anim.json").toString()) as TzoVMState);
tvm.run(); // start initiation process!

let displayString = "";
const qvm = new QuestVM((body => displayString = `${displayString}${body}`), async choices => {
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