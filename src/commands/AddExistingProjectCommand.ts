import * as dialogs from "@extensions/dialogs";
import { ContextValues, TreeItem } from "@tree";
import { Action, AddExistingProject } from "@actions";
import { ActionsCommand } from "@commands";
import { SolutionExplorerProvider } from "@SolutionExplorerProvider";

export class AddExistingProjectCommand extends ActionsCommand {
    constructor(private readonly provider: SolutionExplorerProvider) {
        super('Add existing project');
    }

    public  shouldRun(item: TreeItem): boolean {
        return !item || (item && !!item.path && (item.contextValue === ContextValues.solution || item.contextValue === ContextValues.solution + '-cps'));
    }

    public async getActions(item: TreeItem): Promise<Action[]> {
        const solution = await dialogs.selectOption('Select solution', this.getSolutions(item));
        const projectPath = await dialogs.openProjectFile('Select a project file to add');
        if (!solution || !projectPath) {
            return [];
        }

        return [ new AddExistingProject(solution, projectPath) ];
    }

    private getSolutions(item: TreeItem): dialogs.ItemsOrItemsResolver {
        if (item && item.path) {
            const result: { [id: string]: string } = {};
            result[item.label] = item.path;
            return result;
        }

        return async () => {
            const result: { [id: string]: string } = {};
            var children = await this.provider.getChildren();
            if (!children) { return result; }

            children.forEach(child => {
                if (child && child.path) {
                    result[child.label] = child.path;
                }
            });

            return result;
        };
    }
}
