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
    const scale = 3;
    this.r.DrawTextureEx(t.tex, this.r.Vector2(0 - (t.hotspot_x * scale), 0 - (t.hotspot_y * scale)), 0, scale, this.r.WHITE);
  }
}