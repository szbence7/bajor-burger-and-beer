// Type for vite-imagetools imports such as "@/assets/x.png?w=400;800&format=avif;webp&as=picture".
declare module "*&as=picture" {
  const picture: import("@/components/Picture").PictureData;
  export default picture;
}
