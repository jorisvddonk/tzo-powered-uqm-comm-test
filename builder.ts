import { Context, Instruction, LabelMap, TzoVMState } from "tzo";

export class Builder {
  fakeLabelMap: {
    [key: string]: Instruction
  } = {};
  programList: Instruction[] = [];
  context: Context = {};

  withLabel(instr: Instruction, label: string) {
    this.fakeLabelMap[label] = instr;
    return instr;
  }

  add(instructions: Instruction[]) {
    instructions.forEach(x => this.programList.push(x));
  }

  contextParam(paramName: string, value: string | number) {
    this.context[paramName] = value
  }

  build() {
    const labelMap: LabelMap = Object.entries(this.fakeLabelMap).reduce((memo, entry) => {
      memo[entry[0]] = this.programList.findIndex(x => x === entry[1]);
      return memo;
    }, {} as LabelMap);
    const vmstate: TzoVMState = {
      context: this.context,
      exit: false,
      pause: false,
      labelMap,
      programList: this.programList,
      programCounter: 0,
      stack: []
    }

    return vmstate;
  }
}







