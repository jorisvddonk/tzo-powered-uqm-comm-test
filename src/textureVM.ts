import { getStackParams, Stack, VM } from "tzo";
import { screenWidth, screenHeight } from "./constants";


export interface Texture {
  tex: any,
  hotspot_x: number,
  hotspot_y: number
}


export class TextureVM extends VM {
  private r = null;
  textures: Texture[] = [];
  texture = undefined;

  constructor(r, base) {
    super({}, {
      "loadImage": (stack: Stack) => {
        const [imageFileName, hotspot_x, hotspot_y] = getStackParams("loadImage", ["string", "number", "number"], stack) as [string, number, number];
        const tex = r.LoadTexture(`${base}/${imageFileName}`);
        this.textures.push({
          tex,
          hotspot_x,
          hotspot_y
        });
      },
      "drawFrame": (stack: Stack) => {
        const [frameIndex] = getStackParams("loadImage", ["number"], stack) as [number];
        const t = this.textures[frameIndex];
        if (t) {
          this.drawTex(this.textures[frameIndex]);
        } else {
          console.warn(`frame not found: ${frameIndex}`);
        }
      },
      "beginDraw": () => {
        this.r.BeginTextureMode(this.texture);
      },
      "endDraw": () => {
        this.r.EndTextureMode();
        this.r.DrawTextureRec(this.texture.texture, this.r.Rectangle(0, 0, this.texture.texture.width, -this.texture.texture.height), this.r.Vector2(0, 0), this.r.WHITE);
      }
    });
    this.r = r;
    this.texture = r.LoadRenderTexture(screenWidth, screenHeight);
  }

  drawTex(t: Texture) {
    const scale = 3;
    this.r.DrawTextureEx(t.tex, this.r.Vector2(0 - (t.hotspot_x * scale), 0 - (t.hotspot_y * scale)), 0, scale, this.r.WHITE);
  }

  destroy() {
    this.r.UnloadRenderTexture(this.texture);
  }
}