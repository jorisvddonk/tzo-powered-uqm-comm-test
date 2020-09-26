import { TzoVMState } from "tzo";
import { QuestVM, Choice } from "questmark";
import { parseTextLocalizationFile } from "uqm-files-parsers";
import fs from "fs";

export class ConversationVM extends QuestVM {
  displayString = "";
  options: Choice[] = [];
  optionPromiseCallback: (number) => void = null;
  selectedOptionIndex = 0;
  translations = null;

  constructor(translationsFilePath) {
    super((body => {
      this.displayString = `${this.displayString}${this.localize(body)}`
    }), async choices => {
      this.options = choices;
      this.selectedOptionIndex = 0;
      return new Promise((resolve) => {
        this.optionPromiseCallback = resolve;
      });
    });
    this.translations = parseTextLocalizationFile(fs.readFileSync(translationsFilePath).toString());
    this.loadVMState(JSON.parse(fs.readFileSync("./speech.json").toString()) as TzoVMState);
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

  localize (input: string | number) {
    let s = `${input}`;
    const t = this.translations.get(s);
    if (t) {
      s = t.localizedText.toString();
    }
    return s;
  }
}