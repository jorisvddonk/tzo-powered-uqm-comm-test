import { getStackParams, Stack, TzoVMState } from "tzo";
import { QuestVM, Choice } from "questmark";
import fs from "fs";
import path from "path";
import { LocalizationsMap, SynchronizationsMap } from "uqm-files-parsers/dist/interfaces";

export interface ResponseItem {
  text: string,
  start?: number,
  end?: number,
}

export class ConversationVM extends QuestVM {
  private displayStringBuffer = [];
  options: Choice[] = [];
  optionPromiseCallback: (number) => void = null;
  selectedOptionIndex = 0;
  canRespond: boolean = false;
  private displayQueue: ResponseItem[] = [];
  private sound;
  private dspStartTime: number = 0;
  private basedir;
  private dialogueStrings = {};
  r;

  constructor(r, conversationVMPath: string, dialogueStringsFilePath: string) {
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
    this.basedir = path.dirname(dialogueStringsFilePath);
    this.dialogueStrings = JSON.parse(fs.readFileSync(dialogueStringsFilePath).toString());
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
    const t = this.dialogueStrings[s.trim()];
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
      const t = this.dialogueStrings[text];
      if (t) {
        audio = t.audioFile;
        let o = 0;
        return t.lineTimings.map(lt => ({text: lt.line, start: lt.start, end: lt.end}))
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
      const offset = (this.r.GetTime() - this.dspStartTime) * 1000;
      return this.displayQueue.find(qI => offset >= qI.start && offset <= qI.end);
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