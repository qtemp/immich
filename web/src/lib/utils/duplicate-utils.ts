import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * Selection priority (highest -> lowest):
 *  1. Largest image area (exifImageWidth * exifImageHeight)
 *  2. Mime Type Priority (image/heic, image/heif, then everything else)
 *  3. Largest file size (exifInfo.fileSizeInByte)
 *  4. Most EXIF/meta data entries (getExifCount)
 *
 * The asset ranked highest according to the above rules is returned as the suggestion.
 *
 * @param assets List of duplicate assets
 * @returns The best asset to keep or undefined
 */
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {

  if (!assets || assets.length === 0) return undefined;

  if (assets.length === 1) return assets[0];

  // MIME type priority list (lower index = higher priority
  const mimeTypePriority = ['image/heic', 'image/heif'];

  const getMimeTypePriority = (asset: AssetResponseDto): number => {
    const mimeType = asset.originalMimeType ?? '';
    const index = mimeTypePriority.indexOf(mimeType.toLowerCase());
    return index === -1 ? mimeTypePriority.length : index;
  };

  const area = (asset: AssetResponseDto): number => {
    const w = asset.exifInfo?.exifImageWidth ?? 0;
    const h = asset.exifInfo?.exifImageHeight ?? 0;
    return (w || 0) * (h || 0);
  };

  const fileSize = (asset: AssetResponseDto): number => asset.exifInfo?.fileSizeInByte ?? 0;

  // Sort in-place by the priority rules descending, so the best candidate will be at index 0
  const sortedAssets = assets.sort((a, b) => {

    // 1) Largest image area
    const areaDiff = area(b) - area(a);
    if (areaDiff !== 0) return areaDiff;

    // 2) Extension Priority
    const mimeDiff = getMimeTypePriority(a) - getMimeTypePriority(b);
    if (mimeDiff !== 0) return mimeDiff;

    // 3) Largest file size
    const sizeDiff = fileSize(b) - fileSize(a);
    if (sizeDiff !== 0) return sizeDiff;

    // 4) Most EXIF/meta entries
    const exifDiff = getExifCount(b) - getExifCount(a);
    if (exifDiff !== 0) return exifDiff;

    return 0;

  });

  // Best candidate is the first element after sorting
  return sortedAssets[0];
};
