import r from "raylib";
import { getStackParams, Stack, TzoVMState, VM } from "tzo";
import fs from "fs";
import { TextureVM } from "./textureVM";
import { ConversationVM } from "./conversationVM";


const alien_name = "spathi";
const base = `./asking-about-flowers/comm/${alien_name}`;
const screenWidth = 800;
const screenHeight = 450;
r.InitWindow(screenWidth, screenHeight, "Tzo powered Animation Test");
r.SetTargetFPS(16);

const tvm = new TextureVM(r, base);
tvm.loadVMState(JSON.parse(fs.readFileSync("./anim.json").toString()) as TzoVMState);
tvm.run(); // start initiation process!

let debug = false;
const cvm = new ConversationVM(`${base}/${alien_name}.txt`);

const interv = setInterval(() => {
  if (!r.WindowShouldClose()) {
    if (r.IsKeyPressed(r.KEY_D)) {
      debug = !debug;
    }

    if (r.IsKeyPressed(r.KEY_DOWN)) {
      cvm.selectNextOption();
    }
    if (r.IsKeyPressed(r.KEY_UP)) {
      cvm.selectPreviousOption();
    }

    if (r.IsKeyPressed(r.KEY_ENTER) || r.IsKeyPressed(r.KEY_SPACE)) {
      cvm.commitToSelectedOption();
    }

    r.BeginDrawing();
    r.ClearBackground(r.RAYWHITE);

    // Draw alien comm screen:
    tvm.run(); // resume VM! This will draw the next frame...

    // Draw alien conversation and player options:
    r.DrawText(cvm.displayString, 300, 10, 10, r.BLUE);
    cvm.options.forEach((o, i) => {
      r.DrawText(`${i} - ${cvm.localize(o.title)}`, 300, 300 + (i * 20), 10, cvm.selectedOptionIndex === i ? r.RED : r.BLUE);
    });

    // Debug drawing: 
    if (debug) {
      r.DrawText(JSON.stringify(tvm.context, null, 2), 20, 1, 5, r.GRAY);
      r.DrawText(JSON.stringify(cvm.context, null, 2), 400, 1, 5, r.GRAY);
    }

    r.EndDrawing();
  } else {
    clearInterval(interv);
    r.CloseWindow()        // Close window and OpenGL context
  }
}, 0);