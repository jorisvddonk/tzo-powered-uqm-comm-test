import r from "raylib";
import { getStackParams, Stack, TzoVMState, VM } from "tzo";
import fs from "fs";
import { TextureVM } from "./textureVM";
import { ConversationVM } from "./conversationVM";
import { screenWidth, screenHeight } from "./constants";


const alien_name = "spathi";
const base = `./asking-about-flowers/comm/${alien_name}`;
r.InitWindow(screenWidth, screenHeight, "Tzo powered Animation Test");
r.SetTargetFPS(30);
r.InitAudioDevice();

let err: Error = undefined;
const errHandler = e => {
  console.error(e);
  err = e;
}

const tvm = new TextureVM(r, base);
tvm.loadVMState(JSON.parse(fs.readFileSync("./anim.json").toString()) as TzoVMState);
tvm.run(); // start initiation process!

let debug = false;
const cvm = new ConversationVM(r, `./speech.json`, `${base}/${alien_name}.json`);
cvm.eventBus.on('error', errHandler);
const font = r.LoadFont(`./asking-about-flowers/fonts/${alien_name}.fon.png`);

const music = r.LoadMusicStream(`${base}/${alien_name}.mod`);
r.PlayMusicStream(music);

const interv = setInterval(() => {
  if (!r.WindowShouldClose()) {
    if (r.IsKeyPressed(r.KEY_D)) {
      debug = !debug;
    }

    try {
      if (r.IsKeyPressed(r.KEY_DOWN)) {
        cvm.selectNextOption();
      }
      if (r.IsKeyPressed(r.KEY_UP)) {
        cvm.selectPreviousOption();
      }

      if (r.IsKeyPressed(r.KEY_ENTER) || r.IsKeyPressed(r.KEY_SPACE)) {
        cvm.commitToSelectedOption();
      }
    } catch (e) {
      errHandler(e);
      cvm.quit();
    }

    r.BeginDrawing();
    r.ClearBackground(r.BLACK);

    r.UpdateMusicStream(music);

    // Draw alien comm screen:
    try {
      tvm.run(); // resume VM! This will draw the next frame...
    } catch (e) {
      errHandler(e);
      tvm.quit();
    }

    // Draw alien conversation and player options:
    r.DrawTextRec(font, cvm.getDisplayText(), r.Rectangle(5, 5, r.GetScreenWidth() - 5, r.GetScreenHeight() - 5), 25, -2, true, r.WHITE);
    if (cvm.canRespond) {
      cvm.options.forEach((o, i) => {
        r.DrawText(`${o.title}`, 10, r.GetScreenHeight() - (cvm.options.length * 20) + (i * 20), 20, cvm.selectedOptionIndex === i ? r.RED : r.BLUE);
      });
    }

    // Debug drawing: 
    if (debug) {
      r.DrawText(JSON.stringify(tvm.context, null, 2), 20, 1, 5, r.WHITE);
      r.DrawText(JSON.stringify(cvm.context, null, 2), 400, 1, 5, r.WHITE);

      r.DrawText(JSON.stringify(tvm.stack), 20, 400, 5, r.WHITE);
      r.DrawText(JSON.stringify(cvm.stack), 400, 400, 5, r.WHITE);
    }

    // error drawing:
    if (err !== undefined) {
      r.DrawText(err.toString(), 20, 1, 8, r.RED);
    }

    r.EndDrawing();
  } else {
    clearInterval(interv);
    tvm.destroy();
    r.CloseWindow();        // Close window and OpenGL context
    r.CloseAudioDevice();
  }
}, 0);