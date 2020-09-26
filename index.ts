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
r.SetTargetFPS(30);
r.InitAudioDevice();

const tvm = new TextureVM(r, base);
tvm.loadVMState(JSON.parse(fs.readFileSync("./anim.json").toString()) as TzoVMState);
tvm.run(); // start initiation process!

let debug = false;
const cvm = new ConversationVM(r, `./speech.json`, `${base}/${alien_name}.txt`, `${base}/${alien_name}.ts`);
const font = r.LoadFont('./res/good_neighbors_xna_0.png'); // from https://opengameart.org/content/good-neighbors-pixel-font, Public Domain

const music = r.LoadMusicStream(`${base}/${alien_name}.mod`);
r.PlayMusicStream(music);

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
    r.ClearBackground(r.BLACK);

    r.UpdateMusicStream(music)
    // Draw alien comm screen:
    tvm.run(); // resume VM! This will draw the next frame...
    // Draw alien conversation and player options:
    r.DrawTextEx(font, cvm.getDisplayText(), r.Vector2(5, 5), 25, -2, r.WHITE);
    if (cvm.canRespond) {
      cvm.options.forEach((o, i) => {
        r.DrawText(`${o.title}`, 10, r.GetScreenHeight() - (cvm.options.length * 20) + (i * 20), 20, cvm.selectedOptionIndex === i ? r.RED : r.BLUE);
      });
    }

    // Debug drawing: 
    if (debug) {
      r.DrawText(JSON.stringify(tvm.context, null, 2), 20, 1, 5, r.GRAY);
      r.DrawText(JSON.stringify(cvm.context, null, 2), 400, 1, 5, r.GRAY);
    }

    r.EndDrawing();
  } else {
    clearInterval(interv);
    r.CloseWindow();        // Close window and OpenGL context
    r.CloseAudioDevice();
  }
}, 0);