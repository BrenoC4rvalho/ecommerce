import { IsString } from 'class-validator';
import { createAppValidationPipe } from './app-validation.pipe';

class ValidationDto {
  @IsString()
  name!: string;
}

describe('createAppValidationPipe', () => {
  it('rejects unknown properties', async () => {
    await expect(
      createAppValidationPipe().transform(
        { name: 'product', unexpected: true },
        { type: 'body', metatype: ValidationDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('transforms valid payloads to the DTO type', async () => {
    const result = await createAppValidationPipe().transform(
      { name: 'product' },
      { type: 'body', metatype: ValidationDto },
    );

    expect(result).toBeInstanceOf(ValidationDto);
  });
});
