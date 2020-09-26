import { getStackParams, Stack, TzoVMState } from "tzo";
import { QuestVM, Choice } from "questmark";
import { parseTextLocalizationFile, parseTextSynchronizationFile } from "uqm-files-parsers";
import fs from "fs";
import path from "path";
import { LocalizationsMap, SynchronizationsMap } from "uqm-files-parsers/dist/interfaces";

export class ConversationVM extends QuestVM {
  displayString = "";
  options: Choice[] = [];
  optionPromiseCallback: (number) => void = null;
  selectedOptionIndex = 0;
  translations: LocalizationsMap = null;
  texttimings: SynchronizationsMap = null;
  r;

  constructor(r, conversationVMPath: string, translationsFilePath: string, synchronizationFilePath: string) {
    super((body => {
      this.displayString = `${this.displayString}${this.localize(body)}`
    }), async choices => {
      this.options = choices;
      this.selectedOptionIndex = 0;
      return new Promise((resolve) => {
        this.optionPromiseCallback = resolve;
      });
    }, {
      playAudio: (stack: Stack) => {
        const [audioFile] = getStackParams("loadImage", ["string"], stack) as [string];
        const p = path.join(path.dirname(synchronizationFilePath), audioFile);
        const s = r.LoadSound(p);
        r.PlaySound(s);
      }
    });
    this.r = r;
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
      this.displayString = "";
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
}