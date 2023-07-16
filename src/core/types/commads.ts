import { BasePlugin } from "../modules/_module.js";

export interface ICommand {
  command: string;
  target: { new (...args: any[]): BasePlugin };
  options?: ICommandOptions;
}

export interface ICommandOptions {
  isPublic?: boolean;
  onlyGroups?: boolean;
  excludeFromHelpList?: boolean;
}

export interface IExtractedCommand {
  command: string;
  args?: string;
}
