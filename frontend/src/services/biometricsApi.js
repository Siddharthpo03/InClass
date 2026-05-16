import apiClient from "../utils/apiClient";

const stripDataUrl = (value) =>
  String(value || "").replace(/^data:image\/\w+;base64,/, "");

const normalizeImages = (images = []) =>
  images
    .map((img) => ({
      base64: stripDataUrl(img),
      mimetype: "image/jpeg",
    }))
    .filter((img) => img.base64);

export async function registerFace({
  userId,
  images = [],
  image = null,
  fields = {},
}) {
  const response = await apiClient.post("/biometrics/face/enroll", {
    userId,
    images: normalizeImages(images),
    image: image
      ? { base64: stripDataUrl(image), mimetype: "image/jpeg" }
      : null,
    ...fields,
  });
  return response.data;
}

export async function verifyFace({ userId, image, fields = {} }) {
  const response = await apiClient.post("/biometrics/face/verify", {
    userId,
    image: image
      ? { base64: stripDataUrl(image), mimetype: "image/jpeg" }
      : null,
    ...fields,
  });
  return response.data;
}

export async function recognizeFace({ image }) {
  const response = await apiClient.post("/biometrics/face/recognize", {
    image: image
      ? { base64: stripDataUrl(image), mimetype: "image/jpeg" }
      : null,
  });
  return response.data;
}

export function buildFacePayload(options) {
  return {
    ...options,
    images: normalizeImages(options?.images || []),
    image: options?.image
      ? { base64: stripDataUrl(options.image), mimetype: "image/jpeg" }
      : null,
  };
}
