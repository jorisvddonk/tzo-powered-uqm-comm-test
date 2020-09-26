import r from "raylib";
import { getStackParams, Stack, TzoVMState, VM } from "tzo";
import fs from "fs";

interface Texture {
  tex: any,
  hotspot_x: number,
  hotspot_y: number
}

const base = "./asking-about-flowers/comm/spathi";
const textures: Texture[] = []
const vm = new VM({}, {
  "loadImage": (stack: Stack) => {
    const [imageFileName, hotspot_x, hotspot_y] = getStackParams("loadImage", ["string", "number", "number"], stack) as [string, number, number];
    const tex = r.LoadTexture(`${base}/${imageFileName}`);
    textures.push({
      tex,
      hotspot_x,
      hotspot_y
    });
  },
  "drawFrame": (stack: Stack) => {
    const [frameIndex] = getStackParams("loadImage", ["number"], stack) as [number];
    const t = textures[frameIndex];
    if (t) {
      drawTex(textures[frameIndex]);
    } else {
      console.warn(`frame not found: ${frameIndex}`);
    }
  }
});
vm.loadVMState(JSON.parse(fs.readFileSync("./anim.json").toString()) as TzoVMState);


const screenWidth = 800
const screenHeight = 450
r.InitWindow(screenWidth, screenHeight, "Tzo powered Animation Test")
r.SetTargetFPS(16)

vm.run(); // start initiation process!

function drawTex(t: Texture) {
  r.DrawTexture(t.tex, (screenWidth * 0.5) - t.hotspot_x, (screenHeight * 0.5) - t.hotspot_y, r.WHITE);
}

while (!r.WindowShouldClose()) {
  r.BeginDrawing();
  r.ClearBackground(r.RAYWHITE);
  vm.run(); // resume VM! This will draw the next frame...
  r.DrawText(JSON.stringify(vm.context, null, 2), 20, 20, 20, r.BLACK)
  r.EndDrawing()
}
r.CloseWindow()        // Close window and OpenGL context