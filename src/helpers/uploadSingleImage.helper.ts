import type { Locator, Page } from "@playwright/test";
import * as path from "path";

interface IUploadSingleImage {
  button: Locator;
  page: Page;
}

export const uploadSingleImage = async ({ button, page }: IUploadSingleImage) => {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await button.click();
  const fileChooser = await fileChooserPromise;
  // const response = page.waitForResponse(`${process.env.URL_API_MASTER}/upload/single`);
  await fileChooser.setFiles(
    path.join("D:/lavoi/kuliah/Magang/KP/Testing/paketur-frontend-e2e/a.jpg"),
  );
  // return response;
};
