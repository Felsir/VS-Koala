import * as vscode from 'vscode';

export class KoalaEditorProvider implements vscode.CustomReadonlyEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {

        const provider = new KoalaEditorProvider(context);

        return vscode.window.registerCustomEditorProvider(
            'koala.viewer',
            provider
        );
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    async openCustomDocument(
        uri: vscode.Uri
    ): Promise<vscode.CustomDocument> {

        return {
            uri,
            dispose: () => {}
        };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel
    ): Promise<void> {

        webviewPanel.webview.options = {
            enableScripts: true
        };

        const bytes = await vscode.workspace.fs.readFile(document.uri);

        const base64 = this.toBase64(bytes);

        webviewPanel.webview.html = this.getHtml(base64);
    }

    private toBase64(bytes: Uint8Array): string {
        const enc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let base64 = '';

        for (let i = 0; i < bytes.length; i += 3) {
            const a = bytes[i];
            const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
            const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
            const triple = (a << 16) | (b << 8) | c;

            base64 += enc[(triple >> 18) & 0x3f];
            base64 += enc[(triple >> 12) & 0x3f];
            base64 += i + 1 < bytes.length ? enc[(triple >> 6) & 0x3f] : '=';
            base64 += i + 2 < bytes.length ? enc[triple & 0x3f] : '=';
        }

        return base64;
    }

    private getHtml(base64: string): string {

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            background: #202020;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        canvas {
            image-rendering: pixelated;
            width: 960px;
            height: 600px;
            border: 2px solid #666;

            filter:
                blur(1.35px)
                contrast(1.05)
                saturate(1.1)
                brightness(1.02);
        }
        
        .scanlines {
            position: absolute;
            width: 960px;
            height: 600px;
            pointer-events: none;

            background:
                repeating-linear-gradient(
                    to bottom,
                    rgba(0,0,0,0.00) 0px,
                    rgba(0,0,0,0.00) 2px,
                    rgba(0,0,0,0.4) 3px,
                    rgba(0,0,0,0.4) 4px
                );
    }
    </style>
</head>
<body>
    <canvas id="screen" width="320" height="200"></canvas>

    <div class="scanlines"></div>

    <script>
        const base64 = '${base64}';
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        const canvas = document.getElementById('screen');
        const ctx = canvas.getContext('2d');

        const imageData = ctx.createImageData(320, 200);

        const C64_COLORS = [
            [0x00, 0x00, 0x00], // 0 black
            [0xFF, 0xFF, 0xFF], // 1 white
            [0x68, 0x37, 0x2B], // 2 red
            [0x70, 0xA4, 0xB2], // 3 cyan
            [0x6F, 0x3D, 0x86], // 4 purple
            [0x58, 0x8D, 0x43], // 5 green
            [0x35, 0x28, 0x79], // 6 blue
            [0xB8, 0xC7, 0x6F], // 7 yellow
            [0x6F, 0x4F, 0x25], // 8 orange
            [0x43, 0x39, 0x00], // 9 brown
            [0x9A, 0x67, 0x59], // 10 light red
            [0x44, 0x44, 0x44], // 11 dark gray
            [0x6C, 0x6C, 0x6C], // 12 gray
            [0x9A, 0xD2, 0x84], // 13 light green
            [0x6C, 0x5E, 0xB5], // 14 light blue
            [0x95, 0x95, 0x95]  // 15 light gray
        ];

        function setPixel(x, y, colorIndex) {
            const offset = (y * 320 + x) * 4;
            const color = C64_COLORS[colorIndex];

            imageData.data[offset + 0] = color[0];
            imageData.data[offset + 1] = color[1];
            imageData.data[offset + 2] = color[2];
            imageData.data[offset + 3] = 255;
        }

        renderKoala(bytes);

        function renderKoala(data) {

            const bitmapOffset = 2;
            const screenOffset = bitmapOffset + 8000;
            const colorOffset = screenOffset + 1000;
            const backgroundOffset = colorOffset + 1000;

            const background = data[backgroundOffset] & 0x0f;

            for (let charY = 0; charY < 25; charY++) {
                for (let charX = 0; charX < 40; charX++) {

                    const cell = charY * 40 + charX;

                    const screen = data[screenOffset + cell];
                    const colorRam = data[colorOffset + cell] & 0x0f;

                    const color1 = screen >> 4;
                    const color2 = screen & 0x0f;

                    for (let row = 0; row < 8; row++) {

                        const bitmapIndex =
                            bitmapOffset +
                            cell * 8 +
                            row;

                        const value = data[bitmapIndex];

                        for (let pair = 0; pair < 4; pair++) {

                            const bits = (value >> (6 - pair * 2)) & 0x03;

                            let color = background;

                            switch(bits) {
                                case 0:
                                    color = background;
                                    break;
                                case 1:
                                    color = color1;
                                    break;
                                case 2:
                                    color = color2;
                                    break;
                                case 3:
                                    color = colorRam;
                                    break;
                            }

                            const px = charX * 8 + pair * 2;
                            const py = charY * 8 + row;

                            setPixel(px, py, color);
                            setPixel(px + 1, py, color);
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
        }
    </script>
</body>
</html>
        `;
    }
}
