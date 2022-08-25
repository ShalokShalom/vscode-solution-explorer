import { v4 as uuidv4 } from "uuid";
import * as fs from "@extensions/fs";
import { ProjectInSolution, SolutionFile, SolutionProjectType } from "@core/Solutions";
import { Action, ActionContext } from "./base/Action";

export class CreateSolutionFolder implements Action {
    constructor(private readonly solution: SolutionFile, private readonly folderName: string, private readonly projectInSolution?: ProjectInSolution) {
    }

    public toString(): string {
        return `Create solution folder ${this.folderName} in solution ${this.solution.name}`;
    }

    public async execute(context: ActionContext): Promise<void> {
        if (context.cancelled) { return; }

        if (!this.projectInSolution) {
            if (this.solution.projects.findIndex(p => p.projectName === this.folderName && p.projectType === SolutionProjectType.solutionFolder && !p.parentProjectGuid) >= 0) {
                throw new Error('Can not create solution folder, the folder already exists');
            }
        } else {
            if (this.solution.projects.findIndex(p => p.projectName === this.folderName && p.projectType === SolutionProjectType.solutionFolder && p.parentProjectGuid === this.projectInSolution?.projectGuid) >= 0) {
                throw new Error('Can not create solution folder, the folder already exists');
            }
        }

        try {
            let data: string = await fs.readFile(this.solution.fullPath);
            let lines: string[] = data.split('\n');
            let guid: string = uuidv4().toUpperCase();
            let done = lines.some((line, index, arr) => {
                if (line.trim() === 'Global') {
                    lines.splice(index, 0,
                    'Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "' + this.folderName + '", "' + this.folderName + '", "{' + guid + '}"\r',
                    'EndProject\r');
                    return true;
                }

                return false;
            });
            if (this.projectInSolution && done) {
                let endGlobalIndex: number = -1;
                done = lines.some((line, index, arr) => {
                    if (this.projectInSolution && line.trim() === 'GlobalSection(NestedProjects) = preSolution') {
                        lines.splice(index + 1, 0,
                            '		{' + guid + '} = ' + this.projectInSolution.projectGuid + '\r'
                        );
                        return true;
                    }

                    if (line.trim() === 'EndGlobal') {
                        endGlobalIndex = index;
                    }

                    return false;
                });

                if (!done && endGlobalIndex > 0) {
                    lines.splice(endGlobalIndex, 0,
                        '	GlobalSection(NestedProjects) = preSolution\r',
                        '		{' + guid + '} = ' + this.projectInSolution.projectGuid + '\r',
                        '	EndGlobalSection\r');
                    done = true;
                }
            }

            if (done) {
                await fs.writeFile(this.solution.fullPath, lines.join('\n'));
            } else {
                throw new Error('Can not create solution folder');
            }
        } catch(ex) {
            throw new Error('Can not create solution folder: ' + ex);
        }
    }
}

