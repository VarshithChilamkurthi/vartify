const FALLBACK_COLOR = "rgba(34, 197, 94, 0.3)";

export async function getAverageColor(imageUrl: string): Promise<string> {
  if (!imageUrl) {
    return FALLBACK_COLOR;
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(FALLBACK_COLOR);
          return;
        }

        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          red += data[i];
          green += data[i + 1];
          blue += data[i + 2];
          count += 1;
        }

        if (!count) {
          resolve(FALLBACK_COLOR);
          return;
        }

        resolve(
          `rgba(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(
            blue / count
          )}, 0.35)`
        );
      } catch {
        resolve(FALLBACK_COLOR);
      }
    };

    image.onerror = () => resolve(FALLBACK_COLOR);
    image.src = imageUrl;
  });
}
