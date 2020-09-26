import { getStackParams, Stack, TzoVMState } from "tzo";
import { QuestVM, Choice } from "questmark";
import { parseTextLocalizationFile, parseTextSynchronizationFile } from "uqm-files-parsers";
import fs from "fs";
import path from "path";
import { LocalizationsMap, SynchronizationsMap } from "uqm-files-parsers/dist/interfaces";

export interface ResponseItem {
  text: string,
  lineEndsAt?: number,
}

export class ConversationVM extends QuestVM {
  private displayStringBuffer = [];
  options: Choice[] = [];
  optionPromiseCallback: (number) => void = null;
  selectedOptionIndex = 0;
  translations: LocalizationsMap = null;
  texttimings: SynchronizationsMap = null;
  canRespond: boolean = false;
  private displayQueue: ResponseItem[] = [];
  private sound;
  private dspStartTime: number = 0;
  private basedir;
  r;

  constructor(r, conversationVMPath: string, translationsFilePath: string, synchronizationFilePath: string) {
    super((body => {
      this.displayStringBuffer.push(`${body}`.trim());
    }), async choices => {
      this.buildDisplayQueue(choices);
      return new Promise((resolve) => {
        this.optionPromiseCallback = resolve;
      });
    }, {
      playAudio: (stack: Stack) => {
        const [audioFile] = getStackParams("playAudio", ["string"], stack) as [string];
        const p = path.join(this.basedir, audioFile);
        const s = this.r.LoadSound(p);
        this.r.PlaySound(s);
      }
    });
    this.r = r;
    this.basedir = path.dirname(synchronizationFilePath);
    this.translations = parseTextLocalizationFile(fs.readFileSync(translationsFilePath).toString());
    this.texttimings = parseTextSynchronizationFile(fs.readFileSync(synchronizationFilePath).toString());
    this.loadVMState(JSON.parse(fs.readFileSync(conversationVMPath).toString()) as TzoVMState);
    this.run();
  }

  selectNextOption() {
    this.selectedOptionIndex += 1;
    this.selectedOptionIndex = Math.max(0, Math.min(this.selectedOptionIndex, this.options.length - 1));
  }

  selectPreviousOption() {
    this.selectedOptionIndex -= 1;
    this.selectedOptionIndex = Math.max(0, Math.min(this.selectedOptionIndex, this.options.length - 1));
  }

  commitToSelectedOption() {
    if (this.optionPromiseCallback !== null) {
      this.displayStringBuffer = [];
      this.displayQueue = [];
      this.optionPromiseCallback(this.options[this.selectedOptionIndex].id);
    }
  }

  localize(input: string | number) {
    let s = `${input}`;
    const t = this.translations.get(s.trim());
    if (t) {
      s = t.localizedText.toString();
    }
    return s;
  }

  buildDisplayQueue(choices: Choice[]) {
    this.options = choices.map(c => {
      c.title = this.localize(c.title);
      return c;
    });
    this.canRespond = false;
    this.selectedOptionIndex = 0;
    let audio;
    this.displayQueue = this.displayStringBuffer.map((text, index) => {
      const t = this.translations.get(text);
      const sync = this.texttimings.get(text);
      if (t) {
        audio = t.audioFile;
        let o = 0;
        const lines = t.localizedText.trim().split(/\n/);
        return lines.map((line, i) => {
          o += sync.timings[i];
          return {
            text: line,
            lineEndsAt: i < lines.length - 1 ? o : undefined
          }
        });
      } else {
        return {
          text
        }
      }
    }).flat(1);
    if (audio) {
      const p = path.join(this.basedir, audio);
      if (this.sound) {
        this.r.UnloadSound(this.sound);
      }
      this.sound = this.r.LoadSound(p);
      this.r.PlaySound(this.sound);
    }
    this.dspStartTime = this.r.GetTime();
  }

  private getDisplayItem() {
    if (this.displayQueue.length === 0) {
      return;
    } else {
      // check if we have passed dspq[0]
      const offset = (this.r.GetTime() - this.dspStartTime) * 1000;
      if (offset > this.displayQueue[0].lineEndsAt) {
        // we have; remove it!
        this.displayQueue.shift();
      }
      // deal with the last line in a displayQueue, that has no lineEndsAt, or any items without a lineEndsAt..
      if (this.displayQueue[0].lineEndsAt === undefined) {
        if (this.sound) { // if there is a sound for this item, then we stop when the sound stops playing.
          if (!this.r.IsSoundPlaying(this.sound)) {
            // sound is no longer playing, so remove the first item!
            this.displayQueue.shift();
          }
        } else {
          // ??? this.... really needs some kind of fix :P
        }
      }

      return this.displayQueue[0];
    }
  }

  getDisplayText() {
    const t = this.getDisplayItem();
    if (t) {
      return t.text;
    }
    this.canRespond = true;
    return " ";
  }

}