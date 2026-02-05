import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * Selection priority (highest -> lowest):
 *  1. Largest image area (exifImageWidth * exifImageHeight)
 *  2. Prefer .raw or .rw2 file extensions
 *  3. Prefer .heic or .heif file extensions
 *  4. Largest file size (exifInfo.fileSizeInByte)
 *  5. Most EXIF/meta data entries (getExifCount)
 *
 * The asset ranked highest according to the above rules is returned as the suggestion.
 *
 * @param assets List of duplicate assets
 * @returns The best asset to keep or undefined
 */
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  if (!assets || assets.length === 0) return undefined;

  const isHeicLike = (asset: AssetResponseDto): number => {
    const name = asset.originalFileName ?? '';
    return /\.(heic|heif)$/i.test(name) ? 1 : 0;
  };

  const isRawLike = (asset: AssetResponseDto): number => {
    const name = asset.originalFileName ?? '';
    return /\.(raw|rw2)$/i.test(name) ? 1 : 0;
  };

  const area = (asset: AssetResponseDto): number => {
    const w = asset.exifInfo?.exifImageWidth ?? 0;
    const h = asset.exifInfo?.exifImageHeight ?? 0;
    return (w || 0) * (h || 0);
  };

  const fileSize = (asset: AssetResponseDto): number => asset.exifInfo?.fileSizeInByte ?? 0;

  // Sort in-place by the priority rules descending, so the best candidate will be at index 0
  assets.sort((a, b) => {
    // 1) Largest image area
    const areaDiff = area(b) - area(a);
    if (areaDiff !== 0) return areaDiff;

    // 2) Prefer .raw/.rw2
    const rawDiff = isRawLike(b) - isRawLike(a);
    if (rawDiff !== 0) return rawDiff;

    // 3) Prefer HEIC/HEIF
    const heicDiff = isHeicLike(b) - isHeicLike(a);
    if (heicDiff !== 0) return heicDiff;

    // 4) Largest file size
    const sizeDiff = fileSize(b) - fileSize(a);
    if (sizeDiff !== 0) return sizeDiff;

    // 5) Most EXIF/meta entries
    const exifDiff = getExifCount(b) - getExifCount(a);
    if (exifDiff !== 0) return exifDiff;

    return 0;
  });

  // Best candidate is the first element after sorting
  return assets[0];
};
