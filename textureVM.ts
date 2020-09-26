import { getStackParams, Stack, VM } from "tzo";


export interface Texture {
  tex: any,
  hotspot_x: number,
  hotspot_y: number
}


export class TextureVM extends VM {
  private r = null;
  textures: Texture[] = [];

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
      }
    });
    this.r = r;
  }

  drawTex(t: Texture) {
    this.r.DrawTexture(t.tex, (this.r.GetScreenWidth() * 0.5) - t.hotspot_x, (this.r.GetScreenHeight() * 0.5) - t.hotspot_y, this.r.WHITE);
  }
}