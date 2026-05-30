"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const KoalaEditorProvider_1 = require("./KoalaEditorProvider");
function activate(context) {
    context.subscriptions.push(KoalaEditorProvider_1.KoalaEditorProvider.register(context));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map