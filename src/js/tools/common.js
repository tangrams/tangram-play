//  Check if a variable is a number
export function isNumber(n) {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
}

export function getDevicePixelRatio(ctx) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1;
    return devicePixelRatio / backingStoreRatio;
}
