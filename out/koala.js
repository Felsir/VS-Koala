"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseKoala = parseKoala;
function parseKoala(data) {
    return {
        bitmap: data.slice(2, 8002),
        screenRam: data.slice(8002, 9002),
        colorRam: data.slice(9002, 10002),
        backgroundColor: data[10002]
    };
}
//# sourceMappingURL=koala.js.map