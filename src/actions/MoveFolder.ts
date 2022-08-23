import * as vscode from "vscode";
import * as path from "@extensions/path";
import { Project } from "@core/Projects";
import { Action, ActionContext } from "./base/Action";

type MoveFolderOptions = 'Skip' | 'Cancel';

export class MoveFolder implements Action {
    constructor(private readonly project: Project, private readonly sourcePath: string, private readonly targetPath: string) {
    }

    public async execute(context: ActionContext): Promise<void> {
        const stat = await this.project.statFile(this.sourcePath, this.targetPath);
        if (!stat.exists) {
            await this.project.moveFolder(this.sourcePath, this.targetPath);
            return;
        }

        if (stat.fullpath === this.sourcePath) {
            // is the same file
            return;
        }

        const option = await this.showOptions(context);
        if (option === 'Cancel') {
            context.cancelled = true;
            return;
        }

        if (option === 'Skip') {
            return;
        }
    }

    private async showOptions(context: ActionContext): Promise<MoveFolderOptions> {
        const foldername = path.basename(this.sourcePath);
        const options = [];

        if (context.skipAll) {
            return 'Skip';
        }

        if (context.multipleActions) {
            options.push('Skip', 'Skip All');
        }

        const option = await vscode.window.showWarningMessage(`There is already a folder named '${foldername}'`, { modal: true }, ...options);

        if (option === 'Skip All') {
            context.skipAll = true;
            return 'Skip';
        }

        if (!option) {
            return 'Cancel';
        }

        return option as MoveFolderOptions;
    }
}
