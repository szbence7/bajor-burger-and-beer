import { createServerFn } from "@tanstack/react-start";
import { getGallery } from "@/server/content";

export const getGalleryContent = createServerFn({ method: "GET" }).handler(() => getGallery());
