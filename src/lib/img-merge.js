// https://github.com/ragrag/merge-base64

// JPEG quality (0..1) of the merged image
const JPEG_QUALITY = 0.9;
// the biggest width/height a canvas can have
const MAX_CANVAS_SIZE = 32767;

let canvasModule;
let canvasLoadError;

// canvas is a native module, so it is loaded only when needed and a failure to load it must not break the test run
function getCanvas() {
    if (!canvasModule && !canvasLoadError) {
        try {
            canvasModule = require('canvas');
        } catch (e) {
            canvasLoadError = e;
        }
    }
    return canvasModule;
}

// Jimp-style 0xRRGGBBAA number to a CSS color
function toCssColor(color) {
    const r = (color >>> 24) & 255;
    const g = (color >>> 16) & 255;
    const b = (color >>> 8) & 255;
    const a = (color & 255) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// used when images cannot be merged (e.g. canvas is not available): returns the last image, which is the screenshot of the last window
function lastImage(images) {
    return `data:image/jpeg;base64,${images[images.length - 1]}`;
}

function alignImage(total, size, align) {
    if (align === 'center') {
        return (total - size) / 2;
    }

    if (align === 'end') {
        return total - size;
    }

    return 0;
}

function calcMargin(obj = {}) {
    if (Number.isInteger(obj)) {
        return {
            top: obj,
            right: obj,
            bottom: obj,
            left: obj
        };
    }

    if (typeof obj === 'string') {
        const [top, right = top, bottom = top, left = right] = obj.split(' ');

        return {
            top: Number(top),
            right: Number(right),
            bottom: Number(bottom),
            left: Number(left)
        };
    }

    const { top = 0, right = 0, bottom = 0, left = 0 } = obj;

    return {
        top,
        right,
        bottom,
        left
    };
}

module.exports = function mergeImages(
  images,
  {
    direction = false,
    color = 0x00000000,
    align = 'start',
    offset = 0,
    margin
  } = {}
) {
    if (!Array.isArray(images)) {
        throw new TypeError('`images` must be an array that contains images');
    }

    if (images.length < 1) {
        throw new Error('At least `images` must contain more than one image');
    }

    const canvasLib = getCanvas();
    if (!canvasLib) {
        console.warn('Cannot merge screenshots, canvas is not available:', canvasLoadError && canvasLoadError.message);
        return Promise.resolve(lastImage(images));
    }
    const { createCanvas, loadImage } = canvasLib;

    const processImg = async img => {
        const image = await loadImage(Buffer.from(img, 'base64'));
        return { img: { image, bitmap: { width: image.width, height: image.height } } };
    };

    return Promise.all(images.map(processImg)).then(imgs => {
        let totalX = 0;
        let totalY = 0;

        const imgData = imgs.reduce((res, { img, offsetX = 0, offsetY = 0 }) => {
            const {
        bitmap: { width, height }
      } = img;

            res.push({
                img,
                x: totalX + offsetX,
                y: totalY + offsetY,
                offsetX,
                offsetY
            });

            totalX += width + offsetX;
            totalY += height + offsetY;

            return res;
        }, []);

        const { top, right, bottom, left } = calcMargin(margin);
        const marginTopBottom = top + bottom;
        const marginRightLeft = right + left;

        const totalWidth = direction
      ? Math.max(
          ...imgData.map(
            ({
              img: {
                bitmap: { width }
              },
              offsetX
            }) => width + offsetX
          )
        )
      : imgData.reduce(
          (
            res,
            {
              img: {
                bitmap: { width }
              },
              offsetX
            },
            index
          ) => res + width + offsetX + Number(index > 0) * offset,
          0
        );

        const totalHeight = direction
      ? imgData.reduce(
          (
            res,
            {
              img: {
                bitmap: { height }
              },
              offsetY
            },
            index
          ) => res + height + offsetY + Number(index > 0) * offset,
          0
        )
      : Math.max(
          ...imgData.map(
            ({
              img: {
                bitmap: { height }
              },
              offsetY
            }) => height + offsetY
          )
        );

        const canvasWidth = totalWidth + marginRightLeft;
        const canvasHeight = totalHeight + marginTopBottom;
        if (canvasWidth > MAX_CANVAS_SIZE || canvasHeight > MAX_CANVAS_SIZE) {
            console.warn(`Cannot merge screenshots, the result (${canvasWidth}x${canvasHeight}) is too big`);
            return lastImage(images);
        }

        const baseImage = createCanvas(canvasWidth, canvasHeight);
        const ctx = baseImage.getContext('2d');
        ctx.fillStyle = toCssColor(color);
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Fallback for `Array#entries()`
        const imgDataEntries = imgData.map((data, index) => [index, data]);

        for (const [index, { img, x, y, offsetX, offsetY }] of imgDataEntries) {
            const {
        bitmap: { width, height }
      } = img;
            const [px, py] = direction
        ? [alignImage(totalWidth, width, align) + offsetX, y + index * offset]
        : [
            x + index * offset,
            alignImage(totalHeight, height, align) + offsetY
        ];

            ctx.drawImage(img.image, px + left, py + top);
        }

        return baseImage.toDataURL('image/jpeg', JPEG_QUALITY);
    });
};
