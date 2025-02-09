//  Expewrimental Type definitions for Hydra Synth

declare module "hydra" {
    export const time: number;
    export const bpm: number;
    export const width: number;
    export const height: number;
    export const mouse: { x: number; y: number };
    export {};
}

// float can be a number or a function returning a number
type float = number | (() => number);

interface HydraStream {
    // Color operations
    /** Adjust brightness
     * @param amount - (default: 0.4) Brightness adjustment
     * @example
     * // Basic brightness
     * osc(20,0,2)
     *   .brightness(0.4)
     *   .out(o0)
     * 
     * // Dynamic brightness with oscillation
     * osc(20,0,2)
     *   .brightness(() => Math.sin(time))
     *   .out(o0)
     * 
     * // Scaling noise with brightness
     * noise()
     *   .brightness(1)
     *   .color(0.5,0.5,0.5)
     *   .out(o0)
     */
    brightness(amount?: float): HydraStream;
    /** Adjust contrast
     * @param amount - (default: 1.6) Contrast adjustment
     * @example
     * // Basic contrast
     * osc(20)
     *   .contrast(1.6)
     *   .out(o0)
     * 
     * // Dynamic contrast
     * osc(20)
     *   .contrast(() => Math.sin(time) * 5)
     *   .out(o0)
     */
    contrast(amount?: float): HydraStream;
    /** Shift RGB and alpha channels
     * @param r - (default: 1) Red channel
     * @param g - (default: 1) Green channel
     * @param b - (default: 1) Blue channel
     * @param a - (default: 1) Alpha channel
     * @example
     * // Basic red color
     * osc()
     *   .color(1, 0, 0, 1)
     *   .out(o0)
     * 
     * // Dynamic rainbow effect
     * osc()
     *   .color(() => Math.sin(time), 
     *          () => Math.sin(time + 2), 
     *          () => Math.sin(time + 4))
     *   .out(o0)
     * 
     * // Complex color composition
     * osc(60,0.1,1.5)
     *   .color(1,0,3)
     *   .layer(gradient().r())
     *   .out(o0)
     */
    color(r?: float, g?: float, b?: float, a?: float): HydraStream;
    /** Shift HSV values
     * @param amount - (default: 0.005) Amount to shift. Can be:
     *   - number: Fixed shift (e.g. 0.005)
     *   - function: Dynamic shift (e.g. () => Math.sin(time) * 0.1)
     * @example
     * // Subtle color shift
     * .colorama(0.005)
     * 
     * // Psychedelic effect
     * .colorama(() => Math.sin(time) * 0.1)
     */
    colorama(amount?: float): HydraStream;
    /** Invert colors
     * @param amount - (default: 1) Inversion amount. Can be:
     *   - number: Fixed inversion (e.g. 1)
     *   - function: Dynamic inversion (e.g. () => Math.sin(time))
     * @example
     * // Full inversion
     * .invert(1)
     * 
     * // Pulsing inversion
     * .invert(() => Math.sin(time))
     */
    invert(amount?: float): HydraStream;
    /** Apply luma threshold with smoothing
     * @param threshold - (default: 0.5) Threshold value. Can be number or function
     * @param tolerance - (default: 0.1) Smoothing tolerance. Can be number or function
     * @example
     * // Basic threshold
     * .luma(0.5, 0.1)
     * 
     * // Dynamic threshold
     * .luma(() => Math.sin(time) * 0.5 + 0.5, 0.1)
     */
    luma(threshold?: float, tolerance?: float): HydraStream;
    /** Posterize colors into bins
     * @param bins - (default: 3) Number of color bins
     * @param gamma - (default: 0.6) Gamma adjustment
     * @example
     * // Basic posterization
     * osc(40)
     *   .posterize(3, 0.6)
     *   .out()
     * 
     * // Dynamic bins
     * osc(40)
     *   .posterize(() => Math.sin(time) * 5 + 6, 0.6)
     *   .out()
     * 
     * // Complex posterization
     * osc(40)
     *   .posterize(3, () => Math.sin(time) * 0.5 + 0.5)
     *   .contrast(1.6)
     *   .out()
     */
    posterize(bins?: float, gamma?: float): HydraStream;
    /** Adjust saturation
     * @param amount - (default: 2) Saturation amount
     * @example
     * // Basic saturation
     * osc(40)
     *   .saturate(2)
     *   .out()
     * 
     * // Dynamic saturation
     * osc(40)
     *   .saturate(() => Math.sin(time) * 10)
     *   .out()
     * 
     * // Complex saturation pattern
     * osc(40)
     *   .saturate(() => Math.sin(time) * 10)
     *   .color(1, 0.5, 0.25)
     *   .out()
     */
    saturate(amount?: float): HydraStream;
    /** Shift RGBA channels
     * @param r - (default: 0.5) Red channel shift
     * @param g - (default: 0) Green channel shift
     * @param b - (default: 0) Blue channel shift
     * @param a - (default: 0) Alpha channel shift
     * @example
     * // Basic channel shift
     * osc(40)
     *   .shift(0.5, 0, 0, 0)
     *   .out()
     * 
     * // Dynamic shift
     * osc(40)
     *   .shift(
     *     () => Math.sin(time) * 0.5,
     *     () => Math.sin(time * 0.5),
     *     () => Math.sin(time * 0.2)
     *   )
     *   .out()
     * 
     * // Complex color shifting
     * osc(40)
     *   .shift(0.5, 0.1, 0.2, () => Math.sin(time))
     *   .saturate(2)
     *   .out()
     */
    shift(r?: float, g?: float, b?: float, a?: float): HydraStream;
    /** Threshold with smoothing
     * @param threshold - (default: 0.5) Threshold value
     * @param tolerance - (default: 0.04) Smoothing tolerance
     * @example
     * // Basic threshold
     * osc(40)
     *   .thresh(0.5, 0.04)
     *   .out()
     * 
     * // Dynamic threshold
     * osc(40)
     *   .thresh(() => Math.sin(time) * 0.5 + 0.5, 0.04)
     *   .out()
     * 
     * // Complex threshold pattern
     * noise(3)
     *   .thresh(0.5, () => Math.sin(time) * 0.1)
     *   .contrast(1.2)
     *   .out()
     */
    thresh(threshold?: float, tolerance?: float): HydraStream;

    // Geometry operations
    /** Mirror at n angles
     * @param nSides - (default: 4) Number of sides. Can be:
     *   - number: Fixed number of sides (e.g. 4)
     *   - function: Dynamic sides (e.g. () => Math.sin(time) * 10)
     * @example
     * // Square kaleidoscope
     * .kaleid(4)
     * 
     * // Dynamic kaleidoscope
     * .kaleid(() => Math.sin(time) * 10 + 2)
     */
    kaleid(nSides?: float): HydraStream;
    /** Pixelate at given resolution
     * @param pixelX - (default: 20) Horizontal resolution. Can be number or function
     * @param pixelY - (default: 20) Vertical resolution. Can be number or function
     * @example
     * // Basic pixelation
     * .pixelate(20, 20)
     * 
     * // Dynamic horizontal pixelation
     * .pixelate(() => Math.sin(time) * 50 + 10, 20)
     * 
     * // Dynamic resolution
     * .pixelate(() => Math.sin(time) * 50, () => Math.cos(time) * 50)
     */
    pixelate(pixelX?: float, pixelY?: float): HydraStream;
    /** Repeat texture
     * @param repeatX - (default: 3) X repetitions
     * @param repeatY - (default: 3) Y repetitions
     * @param offsetX - (default: 0) X offset
     * @param offsetY - (default: 0) Y offset
     * @example
     * // Basic repeat
     * osc(10)
     *   .repeat(3, 3)
     *   .out()
     * 
     * // Dynamic repeat
     * osc(10)
     *   .repeat(() => Math.sin(time) * 5 + 6)
     *   .out()
     * 
     * // Complex pattern
     * osc(10)
     *   .repeat(3, 3, () => Math.sin(time) * 0.5)
     *   .rotate(() => time%360)
     *   .out()
     */
    repeat(repeatX?: float, repeatY?: float, offsetX?: float, offsetY?: float): HydraStream;
    /** Repeat texture on X axis
     * @param reps - (default: 3) Number of repetitions
     * @param offset - (default: 0) Offset amount
     * @example
     * // Basic X repeat
     * osc(10)
     *   .repeatX(3)
     *   .out()
     * 
     * // Dynamic X repeat
     * osc(10)
     *   .repeatX(() => Math.sin(time) * 5 + 6)
     *   .out()
     * 
     * // Complex pattern
     * osc(10)
     *   .repeatX(3, () => Math.sin(time) * 0.5)
     *   .rotate(() => time%360)
     *   .out()
     */
    repeatX(reps?: float, offset?: float): HydraStream;
    /** Repeat texture on Y axis
     * @param reps - (default: 3) Number of repetitions
     * @param offset - (default: 0) Offset amount
     * @example
     * // Basic Y repeat
     * osc(10)
     *   .repeatY(3)
     *   .out()
     * 
     * // Dynamic Y repeat
     * osc(10)
     *   .repeatY(() => Math.sin(time) * 5 + 6)
     *   .out()
     * 
     * // Complex pattern
     * osc(10)
     *   .repeatY(3, () => Math.sin(time) * 0.5)
     *   .rotate(() => time%360)
     *   .out()
     */
    repeatY(reps?: float, offset?: float): HydraStream;
    /** Rotate texture
     * @param angle - (default: 10) Angle of rotation in radians
     * @param speed - (default: 0) Speed of constant rotation
     * @example
     * // Basic rotation
     * osc(50)
     *   .rotate(1.57)
     *   .out(o0)
     * 
     * // Continuous rotation
     * osc(50)
     *   .rotate(() => time%360)
     *   .out(o0)
     * 
     * // Complex rotation pattern
     * osc(10,1,1)
     *   .rotate(() => time%360, () => Math.sin(time*0.1)*0.05)
     *   .out(o0)
     * 
     * // Kaleidoscopic rotation
     * voronoi(100,3,5)
     *   .modulateRotate(osc(1,0.5,0).kaleid(50).scale(0.5), 15, 0)
     *   .mult(osc(50,-0.1,8).kaleid(9))
     *   .out(o0)
     */
    rotate(angle?: float, speed?: float): HydraStream;
    /** Scale texture
     * @param amount - (default: 1.5) Scale amount
     * @param xMult - (default: 1) X scale multiplier
     * @param yMult - (default: 1) Y scale multiplier
     * @param offsetX - (default: 0.5) X offset
     * @param offsetY - (default: 0.5) Y offset
     * @example
     * // Basic scaling
     * osc(40)
     *   .scale(1.5, 1, 1)
     *   .out()
     * 
     * // Dynamic scaling
     * shape(4)
     *   .scale(() => Math.sin(time) * 2)
     *   .out()
     * 
     * // Complex scaling pattern
     * osc(40)
     *   .scale(1.5, 
     *          () => Math.sin(time), 
     *          () => Math.cos(time))
     *   .out()
     */
    scale(amount?: float, xMult?: float, yMult?: float, offsetX?: float, offsetY?: float): HydraStream;
    /** Scroll on X axis
     * @param scrollX - (default: 0.5) Scroll amount
     * @param speed - (default: 0) Scroll speed
     * @example
     * // Basic scroll
     * osc(10)
     *   .scrollX(0.5)
     *   .out()
     * 
     * // Continuous scroll
     * osc(10)
     *   .scrollX(0.5, 0.1)
     *   .out()
     * 
     * // Dynamic scroll
     * osc(10)
     *   .scrollX(() => Math.sin(time) * 0.5)
     *   .out()
     */
    scrollX(scrollX?: float, speed?: float): HydraStream;
    /** Scroll on Y axis
     * @param scrollY - (default: 0.5) Scroll amount
     * @param speed - (default: 0) Scroll speed
     * @example
     * // Basic scroll
     * osc(10)
     *   .scrollY(0.5)
     *   .out()
     * 
     * // Continuous scroll
     * osc(10)
     *   .scrollY(0.5, 0.1)
     *   .out()
     * 
     * // Dynamic scroll pattern
     * gradient(0.1)
     *   .scrollY(() => Math.sin(time) * 0.5)
     *   .repeat(2, 2)
     *   .out()
     */
    scrollY(scrollY?: float, speed?: float): HydraStream;

    // Modulation
    /** Modulate texture
     * @param texture - Source to modulate with
     * @param amount - (default: 0.1) Modulation amount
     * @example
     * // Basic modulation
     * osc(21, 0)
     *   .modulate(noise(3))
     *   .out()
     * 
     * // Dynamic modulation
     * osc(21, 0)
     *   .modulate(
     *     noise(3),
     *     () => Math.sin(time) * 0.5
     *   )
     *   .out()
     * 
     * // Complex modulation
     * osc(40,0.1,1)
     *   .modulate(
     *     osc(30,0.1,0)
     *       .rotate(() => time%360),
     *     0.4
     *   )
     *   .out()
     */
    modulate(texture: HydraStream, amount?: float): HydraStream;
    /** Modulate hue
     * @param texture - Source to modulate with
     * @param amount - (default: 1) Modulation amount
     * @example
     * // Basic hue modulation
     * src(o0)
     *   .modulateHue(src(o0).scale(1.01), 1)
     *   .layer(osc(4, 0.5, 2).mask(shape(4, 0.5, 0.001)))
     *   .out()
     */
    modulateHue(texture: HydraStream, amount?: float): HydraStream;
    /** Modulate kaleidoscope
     * @param texture - Source to modulate with
     * @param nSides - (default: 4) Number of sides
     * @example
     * // Basic kaleid modulation
     * osc(9, -0.1, 0.1)
     *   .modulateKaleid(osc(11, 0.5, 0), 50)
     *   .scale(0.1, 0.3)
     *   .modulate(noise(5, 0.1))
     *   .mult(solid(1, 1, 0.3))
     *   .out()
     * 
     * // Complex kaleid pattern
     * osc(10, 0.1, 2)
     *   .modulateKaleid(
     *     osc(16)
     *       .kaleid(999),
     *     1
     *   )
     *   .out()
     */
    modulateKaleid(texture: HydraStream, nSides?: float): HydraStream;
    /** Modulate pixelation
     * @param texture - Source to modulate with
     * @param multiple - (default: 10) Pixelation multiplier
     * @param offset - (default: 3) Offset amount
     * @example
     * // Basic pixelation modulation
     * osc(40)
     *   .modulatePixelate(noise(3), 10, 3)
     *   .out()
     * 
     * // Dynamic pixelation
     * osc(40)
     *   .modulatePixelate(
     *     noise(3),
     *     () => Math.sin(time) * 20 + 20,
     *     () => Math.sin(time)
     *   )
     *   .out()
     */
    modulatePixelate(texture: HydraStream, multiple?: float, offset?: float): HydraStream;
    /** Modulate repeat
     * @param texture - Source to modulate with
     * @param repeatX - (default: 3) X repetitions
     * @param repeatY - (default: 3) Y repetitions
     * @param offsetX - (default: 0.5) X offset
     * @param offsetY - (default: 0.5) Y offset
     * @example
     * // Basic repeat modulation
     * shape(4, 0.9)
     *   .mult(osc(3, 0.5, 1))
     *   .modulateRepeat(osc(10), 3.0, 3.0, 0.5, 0.5)
     *   .out()
     * 
     * // Dogtooth factory pattern
     * shape(1.25, 0.5, 0.25)
     *   .repeat(3, 3)
     *   .scale(2)
     *   .modulateRepeat(
     *     osc(10),
     *     5, 5,
     *     () => Math.sin(time),
     *     () => Math.sin(time/2)
     *   )
     *   .out()
     */
    modulateRepeat(texture: HydraStream, repeatX?: float, repeatY?: float, offsetX?: float, offsetY?: float): HydraStream;
    /** Modulate repeat on X axis
     * @param texture - Source to modulate with
     * @param reps - (default: 3) Number of repetitions
     * @param offset - (default: 0.5) Offset amount
     * @example
     * // Straight lines illusion
     * shape(4, 0.9)
     *   .mult(osc(4, 0.25, 1))
     *   .modulateRepeatX(
     *     osc(10),
     *     5.0,
     *     () => Math.sin(time) * 5
     *   )
     *   .scale(1, 0.5, 0.05)
     *   .out()
     */
    modulateRepeatX(texture: HydraStream, reps?: float, offset?: float): HydraStream;
    /** Modulate repeat on Y axis
     * @param texture - Source to modulate with
     * @param reps - (default: 3) Number of repetitions
     * @param offset - (default: 0.5) Offset amount
     * @example
     * // Morphing grid
     * shape(4, 0.9)
     *   .mult(osc(4, 0.25, 1))
     *   .modulateRepeatY(
     *     osc(10),
     *     5.0,
     *     () => Math.sin(time) * 5
     *   )
     *   .scale(1, 0.5, 0.05)
     *   .out()
     */
    modulateRepeatY(texture: HydraStream, reps?: float, offset?: float): HydraStream;
    /** Modulate rotation
     * @param texture - Source to modulate with
     * @param multiple - (default: 1) Rotation multiplier
     * @param offset - (default: 0) Rotation offset
     * @example
     * // Basic rotation modulation
     * osc(40)
     *   .modulateRotate(osc(10), 1, 0)
     *   .out()
     * 
     * // Dynamic rotation
     * osc(40)
     *   .modulateRotate(
     *     osc(10),
     *     () => Math.sin(time),
     *     () => time%360
     *   )
     *   .out()
     * 
     * // Complex rotation pattern
     * osc(40)
     *   .modulateRotate(
     *     shape(4)
     *       .rotate(() => time%360),
     *     1.5,
     *     0.2
     *   )
     *   .out()
     */
    modulateRotate(texture: HydraStream, multiple?: float, offset?: float): HydraStream;
    /** Modulate scale
     * @param texture - Source to modulate with
     * @param multiple - (default: 1) Scale multiplier
     * @param offset - (default: 1) Scale offset
     * @example
     * // Basic scale modulation
     * osc(40)
     *   .modulateScale(noise(3), 1, 1)
     *   .out()
     * 
     * // Dynamic scaling
     * osc(40)
     *   .modulateScale(
     *     noise(3),
     *     () => Math.sin(time) + 2,
     *     1
     *   )
     *   .out()
     * 
     * // Complex scaling pattern
     * osc(40)
     *   .modulateScale(
     *     shape(4)
     *       .rotate(() => time%360),
     *     1.5,
     *     () => Math.sin(time) * 0.5 + 1
     *   )
     *   .out()
     */
    modulateScale(texture: HydraStream, multiple?: float, offset?: float): HydraStream;
    /** Modulate scroll on X axis
     * @param texture - Source to modulate with
     * @param scrollX - (default: 0.5) Scroll amount
     * @param speed - (default: 0) Scroll speed
     * @example
     * // Basic scroll modulation
     * voronoi(25, 0, 0)
     *   .modulateScrollX(osc(10), 0.5, 0)
     *   .out()
     * 
     * // Dynamic scroll
     * voronoi(25, 0, 0)
     *   .modulateScrollX(
     *     osc(10),
     *     0.5,
     *     () => Math.sin(time) * 0.05
     *   )
     *   .out()
     */
    modulateScrollX(texture: HydraStream, scrollX?: float, speed?: float): HydraStream;
    /** Modulate scroll on Y axis
     * @param texture - Source to modulate with
     * @param scrollY - (default: 0.5) Scroll amount
     * @param speed - (default: 0) Scroll speed
     * @example
     * // Basic scroll modulation
     * voronoi(25, 0, 0)
     *   .modulateScrollY(osc(10), 0.5, 0)
     *   .out()
     * 
     * // Complex scroll pattern
     * gradient(0.125)
     *   .scrollX(0, () => Math.sin(time*0.05)*0.05)
     *   .scrollY(0, () => Math.sin(time*0.01)*-0.07)
     *   .modulateScrollY(
     *     osc(10),
     *     0.5,
     *     () => Math.sin(time) * 0.05
     *   )
     *   .pixelate([5,2,10], [15,8])
     *   .scale(0.15)
     *   .modulate(noise(1, 0.25))
     *   .out()
     */
    modulateScrollY(texture: HydraStream, scrollY?: float, speed?: float): HydraStream;

    // Blend operations
    /** Add textures
     * @param texture - Source to add
     * @param amount - (default: 1) Blend amount
     * @example
     * // Basic addition
     * shape()
     *   .scale(0.5)
     *   .add(shape(4))
     *   .out()
     * 
     * // Oscillator blend
     * osc(9, 0.1, 1)
     *   .add(osc(13, 0.5, 5))
     *   .out()
     */
    add(texture: HydraStream, amount?: float): HydraStream;
    /** Blend textures
     * @param texture - Source to blend
     * @param amount - (default: 0.5) Blend amount
     * @example
     * // Basic blend
     * shape()
     *   .scale(0.5)
     *   .blend(shape(4))
     *   .out()
     * 
     * // Oscillator blend
     * osc(9, 0.1, 1)
     *   .blend(osc(13, 0.5, 5))
     *   .out()
     * 
     * // Motion blur feedback
     * osc()
     *   .thresh()
     *   .blend(o0, 0.9)
     *   .out()
     */
    blend(texture: HydraStream, amount?: float): HydraStream;
    /** Show difference between textures
     * @param texture - Source to compare
     * @example
     * // Basic difference
     * osc(9, 0.1, 1)
     *   .diff(osc(13, 0.5, 5))
     *   .out()
     * 
     * // Complex pattern
     * osc(1, 1, 2)
     *   .diff(
     *     shape(6, 1.1, 0.01)
     *       .scale(() => Math.sin(time)*0.05 + 0.9)
     *       .kaleid(15)
     *       .rotate(() => time%360)
     *   )
     *   .out()
     */
    diff(texture: HydraStream): HydraStream;
    /** Layer textures
     * @param texture - Source to layer
     * @example
     * // Basic layering
     * solid(1, 0, 0, 1)
     *   .layer(
     *     shape(4)
     *       .color(0, 1, 0, () => Math.sin(time*2))
     *   )
     *   .out()
     * 
     * // Oscillator layers
     * osc(30)
     *   .layer(
     *     osc(15)
     *       .rotate(1)
     *       .luma()
     *   )
     *   .out()
     */
    layer(texture: HydraStream): HydraStream;
    /** Mask using texture luminance
     * @param texture - Source to use as mask
     * @example
     * // Basic mask
     * gradient(5)
     *   .mask(voronoi(), 3, 0.5)
     *   .invert([0,1])
     *   .out()
     * 
     * // Transparent mask
     * osc()
     *   .layer(
     *     osc(30, 0.1, 2)
     *       .mask(shape(4))
     *   )
     *   .out()
     * 
     * // Complex masking
     * osc(10, -0.25, 1)
     *   .color(0, 0, 1)
     *   .saturate(2)
     *   .kaleid(50)
     *   .mask(
     *     noise(25, 2)
     *       .modulateScale(noise(0.25, 0.05))
     *   )
     *   .modulateScale(osc(6, -0.5, 2).kaleid(50))
     *   .mult(osc(3, -0.25, 2).kaleid(50))
     *   .scale(0.5, 0.5, 0.75)
     *   .out()
     */
    mask(texture: HydraStream): HydraStream;
    /** Multiply textures
     * @param texture - Source to multiply
     * @param amount - (default: 1) Blend amount
     * @example
     * // Basic multiplication
     * osc(9, 0.1, 2)
     *   .mult(osc(13, 0.5, 5))
     *   .out()
     * 
     * // Layer with multiplication
     * osc()
     *   .layer(
     *     osc(30, 0.1, 2)
     *       .mult(shape(4))
     *   )
     *   .out()
     */
    mult(texture: HydraStream, amount?: float): HydraStream;

    // Source generators
    /** Generate noise (default: scale=10, offset=0.1) */
    noise(scale?: float, offset?: float): HydraStream;
    /** Generate oscillator pattern
     * @param frequency - (default: 60) Frequency of oscillation
     * @param sync - (default: 0.1) Sync rate
     * @param offset - (default: 0) Color offset
     * @example
     * // Basic oscillator
     * osc(60, 0.1, 0.5)
     *   .out(o0)
     * 
     * // Dynamic frequency
     * osc(() => Math.sin(time/10) * 100)
     *   .out(o0)
     * 
     * // Array sequence
     * osc([1,10,50,100,250,500].fast(2))
     *   .out(o0)
     * 
     * // Complex pattern
     * osc(10,-0.25,1)
     *   .color(0,0,1)
     *   .saturate(2)
     *   .kaleid(50)
     *   .mask(noise(25,2)
     *   .modulateScale(noise(0.25,0.05)))
     *   .modulateScale(osc(6,-0.5,2).kaleid(50))
     *   .mult(osc(3,-0.25,2).kaleid(50))
     *   .scale(0.5,0.5,0.75)
     *   .out(o0)
     */
    osc(frequency?: float, sync?: float, offset?: float): HydraStream;
    /** Generate geometric shape (default: sides=3, radius=0.3, smoothing=0.01) */
    shape(sides?: float, radius?: float, smoothing?: float): HydraStream;
    /** Generate gradient (default: speed=0) */
    gradient(speed?: float): HydraStream;
    /** Generate solid color (default: r=0, g=0, b=0, a=1) */
    solid(r?: float, g?: float, b?: float, a?: float): HydraStream;
    /** Generate voronoi pattern
     * @param scale - (default: 5) Scale of cells
     * @param speed - (default: 0.3) Speed of motion
     * @param blending - (default: 0.3) Blending amount
     * @example
     * // Basic voronoi
     * voronoi(5, 0.3, 0.3)
     *   .out()
     * 
     * // Dynamic scale
     * voronoi(() => Math.sin(time) * 10 + 12, 0.3, 0.3)
     *   .out()
     * 
     * // Complex voronoi pattern
     * voronoi(5, 0.3, 0.3)
     *   .color(1, 0, 0)
     *   .rotate(() => time%360)
     *   .kaleid(4)
     *   .out()
     */
    voronoi(scale?: float, speed?: float, blending?: float): HydraStream;

    // Output
    /** Output to buffer
     * @param output - (optional) Output buffer (o0-o3)
     * @example
     * // Basic output
     * osc(10)
     *   .out()
     * 
     * // Output to specific buffer
     * osc(10)
     *   .out(o1)
     * 
     * // Chain multiple outputs
     * osc(10)
     *   .out(o0)
     * noise(3)
     *   .out(o1)
     */
    out(output?: HydraOutput): void;

    /** Render output buffer
     * @param output - (optional) Output buffer to render
     * @example
     * // Render default output
     * osc(10)
     *   .out()
     * render()
     * 
     * // Render specific buffer
     * osc(10)
     *   .out(o1)
     * render(o1)
     */
    render(output?: HydraOutput): void;

    /** Red color channel
     * @example
     * // Basic red channel
     * osc(60, 0.1, 1.5)
     *   .layer(gradient().r())
     *   .out()
     */
    r(): HydraStream;

    /** Green color channel
     * @example
     * // Basic green channel
     * osc(60, 0.1, 1.5)
     *   .layer(gradient().g())
     *   .out()
     */
    g(): HydraStream;

    /** Blue color channel
     * @example
     * // Basic blue channel
     * osc(60, 0.1, 1.5)
     *   .layer(gradient().colorama(1).b())
     *   .out()
     */
    b(): HydraStream;

    /** Subtract textures
     * @param texture - Source to subtract
     * @example
     * // Basic subtraction
     * osc()
     *   .sub(osc(6))
     *   .out()
     * 
     * // Color remapping
     * osc(6, 0, 1.5)
     *   .modulate(
     *     noise(3)
     *       .sub(gradient()),
     *     1
     *   )
     *   .out()
     */
    sub(texture: HydraStream): HydraStream;

    /** Shift hue
     * @example
     * // Basic hue shift
     * osc(30, 0.1, 1)
     *   .hue(() => Math.sin(time))
     *   .out()
     */
    hue(amount?: float): HydraStream;

    /** Initialize webcam as input
     * @example
     * // Basic webcam input
     * s0.initCam()
     * src(s0)
     *   .invert()
     *   .out()
     */
    initCam(): void;

    /** Initialize image as input
     * @param url - URL of the image
     * @example
     * // Load image from URL
     * s0.initImage("https://example.com/image.jpg")
     * src(s0)
     *   .modulate(osc(6), 1)
     *   .out()
     */
    initImage(url: string): void;

    /** Initialize video as input
     * @param url - URL of the video
     * @example
     * // Load video from URL
     * s0.initVideo("https://example.com/video.mp4")
     * src(s0)
     *   .modulate(noise(3))
     *   .out()
     */
    initVideo(url: string): void;

    /** Initialize custom source
     * @param opts - Source options
     * @example
     * // Load canvas
     * canvas = document.createElement("canvas")
     * canvas.width = 200
     * canvas.height = 200
     * ctx = canvas.getContext("2d")
     * ctx.fillStyle = "crimson"
     * ctx.fillRect(100, 50, 100, 100)
     * s0.init({src: canvas})
     * src(s0)
     *   .modulate(osc().kaleid(999))
     *   .out()
     */
    init(opts: any): void;

    /** Initialize screen capture as input
     * @example
     * // Capture screen
     * s0.initScreen()
     * src(s0)
     *   .colorama(0.5)
     *   .out()
     */
    initScreen(): void;
}

interface HydraOutput {
    render(output?: HydraOutput): void;
}

declare global {
    /** Current time in seconds */
    const time: number;
    /** Current BPM (default: 30) */
    const bpm: number;
    /** Canvas width */
    const width: number;
    /** Canvas height */
    const height: number;
    /** Mouse position {x, y} */
    const mouse: { x: number; y: number };

    /** Output buffers for rendering */
    const o0: HydraOutput;
    const o1: HydraOutput;
    const o2: HydraOutput;
    const o3: HydraOutput;

    /** Source buffers for input */
    const s0: HydraStream;
    const s1: HydraStream;
    const s2: HydraStream;
    const s3: HydraStream;

    /** Render the current buffer to screen */
    function render(output?: HydraOutput): void;
    
    // Source generators
    /** Create an oscillator
     * @param frequency Frequency of oscillation (default: 60)
     * @param sync Sync rate (default: 0.1)
     * @param offset Color offset (default: 0)
     */
    function osc(frequency?: float, sync?: float, offset?: float): HydraStream;

    /** Generate noise
     * @param scale - (default: 10) Scale of noise
     * @param offset - (default: 0.1) Time offset
     * @example
     * // Basic noise
     * noise(10, 0.1)
     *   .out(o0)
     * 
     * // Dynamic noise scale
     * noise(() => Math.sin(time/10)*50, () => Math.sin(time/2)/500)
     *   .out(o0)
     * 
     * // Complex noise pattern
     * noise(3)
     *   .modulatePixelate(noise(3).pixelate(8,8), 1024, 8)
     *   .out(o0)
     */
    function noise(scale?: float, offset?: float): HydraStream;

    /** Generate voronoi cells
     * @param scale Scale of cells (default: 5)
     * @param speed Speed of motion (default: 0.3)
     * @param blending Blending amount (default: 0.3)
     */
    function voronoi(scale?: float, speed?: float, blending?: float): HydraStream;

    /** Create a geometric shape
     * @param sides - (default: 3) Number of sides
     * @param radius - (default: 0.3) Radius of shape
     * @param smoothing - (default: 0.01) Edge smoothing
     * @example
     * // Triangle
     * shape(3, 0.5, 0.001)
     *   .out(o0)
     * 
     * // Circle (many sides)
     * shape(100, 0.5, 0.001)
     *   .out(o0)
     * 
     * // Animated shape
     * shape(100, 0.01, 1)
     *   .invert(() => Math.sin(time)*2)
     *   .out(o0)
     * 
     * // Complex pattern
     * shape(5, 0.5, 0.1)
     *   .repeat(19, 19)
     *   .mult(osc(10, 1, 2))
     *   .rotate(() => time%360)
     *   .scrollX(1, -0.25)
     *   .mult(shape(15, 0.3, 0.01)
     *   .rotate(() => time%360)
     *   .scrollX(1, -0.25))
     *   .out(o0)
     */
    function shape(sides?: float, radius?: float, smoothing?: float): HydraStream;

    /** Create a gradient
     * @param speed - (default: 0) Animation speed
     * @example
     * // Gradient sequence
     * gradient([1,2,4])
     *   .out(o0)
     * 
     * // Saw oscillator effect
     * gradient(0)
     *   .r()
     *   .repeat(16, 1)
     *   .scrollX(0, 0.1)
     *   .out(o0)
     */
    function gradient(speed?: float): HydraStream;

    /** Create a solid color
     * @param r - (default: 0) Red component
     * @param g - (default: 0) Green component
     * @param b - (default: 0) Blue component
     * @param a - (default: 1) Alpha component
     * @example
     * // Solid red
     * solid(1, 0, 0, 1)
     *   .out(o0)
     * 
     * // Color cycling
     * solid([1,0,0], [0,1,0], [0,0,1], 1)
     *   .out(o0)
     */
    function solid(r?: float, g?: float, b?: float, a?: float): HydraStream;

    // Audio functions
    const fft: number[];
    function setBins(numBins?: number /* = 4 */): void;
    function setSmooth(smooth?: number /* = 0.4 */): void;
    function setCutoff(cutoff?: number /* = 2 */): void;
    function setScale(scale?: number /* = 10 */): void;
    function hide(): void;
    function show(): void;

    // Array modifiers
    /** Array speed modifier
     * @param speed - (default: 1) Speed multiplier
     * @example
     * // Basic speed change
     * osc([10,30,60].fast(2))
     *   .out()
     * 
     * // Slower transition
     * osc([10,30,60].fast(0.5))
     *   .out()
     */
    function fast(speed?: number): number[];
    /** Array smooth modifier
     * @param smooth - (default: 1) Smoothing amount
     * @example
     * // Smooth shape scrolling
     * shape(999)
     *   .scrollX([-0.2,0.2].smooth())
     *   .out()
     */
    function smooth(smooth?: number): number[];
    /** Array easing modifier
     * @param ease - (default: 'linear') Easing function
     * @example
     * // Smooth rotation
     * shape(4)
     *   .rotate([-3.14,3.14].ease('easeInOutCubic'))
     *   .out()
     */
    function ease(ease?: string): number[];
    /** Array offset modifier
     * @param offset - (default: 0.5) Offset amount
     * @example
     * // Basic array offset
     * osc([1,2,3].offset(0.5))
     *   .out()
     * 
     * // Dynamic offset with shape rotation
     * shape(4)
     *   .rotate([0,1,2].offset(() => Math.sin(time)))
     *   .out()
     * 
     * // Complex pattern with offset
     * osc([1,2,3,4].offset(0.5))
     *   .kaleid([3,4,5,6].offset(0.5))
     *   .out()
     */
    function offset(offset?: number): number[];
    /** Array fit modifier
     * @param low - (default: 0) Lower bound
     * @param high - (default: 1) Upper bound
     * @example
     * // Scale array to range
     * osc([100,200,300].fit(0, 1))
     *   .out()
     * 
     * // Dynamic range with oscillation
     * shape(4)
     *   .scale([1,2,3].fit(0, () => Math.sin(time) + 1))
     *   .out()
     * 
     * // Complex pattern with fit
     * osc([10,20,30,40].fit(0.1, 0.9))
     *   .kaleid([3,4,5,6].fit(3, 6))
     *   .out()
     */
    function fit(low?: number, high?: number): number[];

    /** Set number of FFT bins for audio analysis
     * @param numBins - (default: 4) Number of frequency bins
     * @example
     * // Basic FFT setup
     * setBins(8)
     * osc(10,0.1,1)
     *   .modulate(noise(3), () => fft[0])
     *   .out()
     * 
     * // Complex audio visualization
     * setBins(16)
     * shape(4)
     *   .scale(() => fft[0]*2)
     *   .color(() => fft[1], () => fft[2], () => fft[3])
     *   .out()
     */
    function setBins(numBins?: number): void;

    /** Set FFT smoothing factor
     * @param smooth - (default: 0.4) Smoothing amount between 0 and 1
     * @example
     * // Smoother audio response
     * setSmooth(0.8)
     * osc(10)
     *   .scale(() => fft[0])
     *   .out()
     * 
     * // Quick audio response
     * setSmooth(0.1)
     * shape(4)
     *   .scale(() => fft[0]*2)
     *   .out()
     */
    function setSmooth(smooth?: number): void;

    /** Set FFT cutoff frequency
     * @param cutoff - (default: 2) Frequency cutoff threshold
     * @example
     * // Lower frequency emphasis
     * setCutoff(1)
     * osc(10)
     *   .modulate(noise(3), () => fft[0])
     *   .out()
     * 
     * // Higher frequency emphasis
     * setCutoff(4)
     * shape(4)
     *   .scale(() => fft[0])
     *   .out()
     */
    function setCutoff(cutoff?: number): void;

    /** Set FFT scale factor
     * @param scale - (default: 10) Amplitude scaling
     * @example
     * // More sensitive audio response
     * setScale(20)
     * osc(10)
     *   .scale(() => fft[0])
     *   .out()
     * 
     * // Subtle audio response
     * setScale(5)
     * shape(4)
     *   .rotate(() => fft[0])
     *   .out()
     */
    function setScale(scale?: number): void;

    /** Hide the canvas display
     * @example
     * // Hide canvas after 5 seconds
     * setTimeout(hide, 5000)
     */
    function hide(): void;

    /** Show the canvas display
     * @example
     * // Show canvas after 5 seconds of being hidden
     * setTimeout(() => {
     *   hide()
     *   setTimeout(show, 5000)
     * }, 5000)
     */
    function show(): void;

    /** Set canvas resolution
     * @param width - Canvas width in pixels
     * @param height - Canvas height in pixels
     * @example
     * // Set small canvas size
     * setResolution(100, 100)
     * osc()
     *   .out()
     */
    function setResolution(width: number, height: number): void;

    /** Clear all buffers
     * @example
     * // Clear everything
     * osc()
     *   .out()
     * hush()
     */
    function hush(): void;

    /** Define a custom function
     * @param opts - Function options including name, type, inputs, and GLSL code
     * @example
     * // Create chroma function
     * setFunction({
     *   name: 'chroma',
     *   type: 'color',
     *   inputs: [],
     *   glsl: `
     *     float maxrb = max(_c0.r, _c0.b);
     *     float k = clamp((_c0.g-maxrb)*5.0, 0.0, 1.0);
     *     float dg = _c0.g;
     *     _c0.g = min(_c0.g, maxrb*0.8);
     *     _c0 += vec4(dg - _c0.g);
     *     return vec4(_c0.rgb, 1.0 - k);
     *   `
     * })
     */
    function setFunction(opts: any): void;

    /** Global speed control
     * @example
     * // Change overall speed
     * speed = 3
     * osc(60, 0.1, [0, 1.5])
     *   .out()
     */
    let speed: number;
}

export {}; 