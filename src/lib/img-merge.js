// https://github.com/ragrag/merge-base64

import Jimp from 'jimp';

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

    const processImg = async img => {
        const imgBuffer = await new Buffer.from(img, 'base64');
        return Jimp.read(imgBuffer).then(imgObj => ({ img: imgObj }));
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

        const baseImage = new Jimp(
      totalWidth + marginRightLeft,
      totalHeight + marginTopBottom,
      color
    );

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

            baseImage.composite(img, px + left, py + top);
        }

        return baseImage.getBase64Async(Jimp.MIME_JPEG);
    // return baseImage;
    });
};
