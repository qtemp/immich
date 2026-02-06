import { suggestDuplicate } from '$lib/utils/duplicate-utils';
import type { AssetResponseDto } from '@immich/sdk';

describe('suggestDuplicate', () => {
  it('picks the asset with the largest image area', () => {
    const assets = [
      { exifInfo: { exifImageWidth: 400, exifImageHeight: 300 } }, // area: 120000
      { exifInfo: { exifImageWidth: 200, exifImageHeight: 300 } }, // area: 60000
      { exifInfo: { exifImageWidth: 100, exifImageHeight: 100 } }, // area: 10000
    ];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });

  it('prefers raw-like extensions when image area is identical', () => {
    const assets = [
      { originalFileName: 'photo.jpg', exifInfo: { exifImageWidth: 100, exifImageHeight: 100, fileSizeInByte: 500 } },
      { originalFileName: 'photo.raw', exifInfo: { exifImageWidth: 100, exifImageHeight: 100, fileSizeInByte: 400 } },
      { originalFileName: 'photo.heic', exifInfo: { exifImageWidth: 100, exifImageHeight: 100, fileSizeInByte: 300 } },
    ];
    // All have the same area -> raw-like should be preferred over heic/jpg
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[1]);
  });

  it('prefers heic/heif when no raw-like file exists and area is identical', () => {
    const assets = [
      { originalFileName: 'a.jpg', exifInfo: { exifImageWidth: 200, exifImageHeight: 100, fileSizeInByte: 500 } },
      { originalFileName: 'b.heic', exifInfo: { exifImageWidth: 200, exifImageHeight: 100, fileSizeInByte: 400 } },
    ];
    // Same area, no raw-like files -> prefer heic/heif
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[1]);
  });

  it('falls back to largest file size when area and extensions are identical', () => {
    const assets = [
      { exifInfo: { fileSizeInByte: 300 } },
      { exifInfo: { fileSizeInByte: 200 } },
      { exifInfo: { fileSizeInByte: 100 } },
    ];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });

  it('picks the asset with the most exif data if multiple assets have the same file size', () => {
    const assets = [
      { exifInfo: { fileSizeInByte: 200, rating: 5, fNumber: 1 } },
      { exifInfo: { fileSizeInByte: 200, rating: 5 } },
      { exifInfo: { fileSizeInByte: 100, rating: 5 } },
    ];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });

  it('returns undefined for an empty array', () => {
    const assets: AssetResponseDto[] = [];
    expect(suggestDuplicate(assets)).toBeUndefined();
  });

  it('handles assets with no exifInfo', () => {
    const assets = [{ exifInfo: { fileSizeInByte: 200 } }, {}];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });

  it('handles assets with exifInfo but no fileSizeInByte', () => {
    const assets = [{ exifInfo: { rating: 5, fNumber: 1 } }, { exifInfo: { rating: 5 } }];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });
});
