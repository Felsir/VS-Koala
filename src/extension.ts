import * as vscode from 'vscode';
import { KoalaEditorProvider } from './KoalaEditorProvider';

export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(
        KoalaEditorProvider.register(context)
    );
}

export function deactivate() {}