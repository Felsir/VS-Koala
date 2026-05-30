export interface KoalaImage {
    bitmap: Uint8Array;
    screenRam: Uint8Array;
    colorRam: Uint8Array;
    backgroundColor: number;
}

export function parseKoala(data: Uint8Array): KoalaImage {

    return {
        bitmap: data.slice(2, 8002),
        screenRam: data.slice(8002, 9002),
        colorRam: data.slice(9002, 10002),
        backgroundColor: data[10002]
    };
}