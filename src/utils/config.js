export const uploadPath = process.env.NODE_ENV === "production" ? process.env.PUBLIC_UPLOAD_PATH : path.resolve(process.env.PUBLIC_UPLOAD_PATH);
