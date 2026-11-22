import sharp from 'sharp';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { UploadPictureUseCase } from './upload-picture-use-case.js';

/** JPEG 40x20 con EXIF (incluido GPS) y orientación 6 (girada 90°). */
async function jpegWithExif(): Promise<Buffer> {
  return sharp({
    create: { width: 40, height: 20, channels: 3, background: '#2563eb' },
  })
    .jpeg()
    .withExif({
      IFD0: { Copyright: 'secret-owner', Artist: 'Someone' },
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '10/1 30/1 0/1',
        GPSLongitudeRef: 'W',
        GPSLongitude: '66/1 54/1 0/1',
      },
    })
    .withMetadata({ orientation: 6 })
    .toBuffer();
}

const asMulterFile = (buffer: Buffer) =>
  ({ buffer, originalname: 'photo.jpg' }) as Express.Multer.File;

describe('UploadPictureUseCase (BE-08)', () => {
  const id = '0c6f7a1e-3b2d-4c5e-8f9a-1b2c3d4e5f60';
  let workDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // El use case escribe en ./uploads relativo al cwd.
    originalCwd = process.cwd();
    workDir = mkdtempSync(join(tmpdir(), 'lsv-upload-'));
    process.chdir(workDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(workDir, { recursive: true, force: true });
  });

  it('the fixture really carries EXIF, GPS and orientation', async () => {
    const meta = await sharp(await jpegWithExif()).metadata();
    expect(meta.exif).toBeDefined();
    expect(meta.orientation).toBe(6);
  });

  it('strips EXIF (including GPS) from every stored size', async () => {
    await new UploadPictureUseCase().execute(
      id,
      'user',
      asMulterFile(await jpegWithExif()),
    );

    const dir = join(workDir, 'uploads', 'user');
    const files = readdirSync(dir).sort();
    expect(files).toEqual([
      `${id}-lg.jpeg`,
      `${id}-md.jpeg`,
      `${id}-original.jpeg`,
      `${id}-sm.jpeg`,
    ]);

    for (const file of files) {
      const buffer = readFileSync(join(dir, file));
      const meta = await sharp(buffer).metadata();
      expect({ file, exif: meta.exif }).toEqual({ file, exif: undefined });
      expect(buffer.includes(Buffer.from('secret-owner'))).toBe(false);
    }
  });

  it('applies the EXIF orientation to the original instead of keeping the tag', async () => {
    await new UploadPictureUseCase().execute(
      id,
      'user',
      asMulterFile(await jpegWithExif()),
    );

    const meta = await sharp(
      readFileSync(join(workDir, 'uploads', 'user', `${id}-original.jpeg`)),
    ).metadata();
    // 40x20 girada 90° queda 20x40, sin etiqueta de orientación.
    expect([meta.width, meta.height]).toEqual([20, 40]);
    expect(meta.orientation).toBeUndefined();
  });

  it('applies the EXIF orientation to the resized sizes too', async () => {
    // 40x20: mitad izquierda roja, derecha azul. Con orientación 6 (90° horario)
    // la imagen correcta es 20x40 con el rojo arriba.
    const half = (color: string) =>
      sharp({
        create: { width: 20, height: 20, channels: 3, background: color },
      })
        .png()
        .toBuffer();
    const photo = await sharp({
      create: { width: 40, height: 20, channels: 3, background: '#000' },
    })
      .composite([
        { input: await half('#ff0000'), left: 0, top: 0 },
        { input: await half('#0000ff'), left: 20, top: 0 },
      ])
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    await new UploadPictureUseCase().execute(id, 'user', asMulterFile(photo));

    const { data, info } = await sharp(
      readFileSync(join(workDir, 'uploads', 'user', `${id}-lg.jpeg`)),
    )
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => {
      const i = (y * info.width + x) * info.channels;
      return { r: data[i], b: data[i + 2] };
    };
    // Arriba a la derecha: rojo si se aplicó la orientación, azul si quedó de lado.
    const topRight = pixel(info.width - 20, 20);
    expect(topRight.r).toBeGreaterThan(200);
    expect(topRight.b).toBeLessThan(60);
  });

  it('rejects a non-UUID id before writing anything', async () => {
    await expect(
      new UploadPictureUseCase().execute(
        '../../escape',
        'user',
        asMulterFile(await jpegWithExif()),
      ),
    ).rejects.toThrow();
  });
});
