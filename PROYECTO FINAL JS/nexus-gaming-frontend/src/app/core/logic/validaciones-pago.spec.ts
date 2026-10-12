import {
  celularPeruValido, cumpleLuhn, enmascararCelular, formatearTarjeta, formatearVencimiento,
  numeroOperacion, ultimos4, vencimientoVigente
} from './validaciones-pago';

describe('validaciones de pago', () => {
  it('Luhn acepta números de prueba válidos', () => {
    expect(cumpleLuhn('4242424242424242')).toBeTrue();      // Visa de pruebas
    expect(cumpleLuhn('5555 5555 5555 4444')).toBeTrue();   // Mastercard de pruebas
    expect(cumpleLuhn('378282246310005')).toBeTrue();       // Amex (15 dígitos)
  });

  it('Luhn rechaza un dígito mal tecleado, largos inválidos y texto', () => {
    expect(cumpleLuhn('4242424242424241')).toBeFalse();
    expect(cumpleLuhn('1234567890123456')).toBeFalse();
    expect(cumpleLuhn('4242')).toBeFalse();
    expect(cumpleLuhn('')).toBeFalse();
    expect(cumpleLuhn('abcdabcdabcdabcd')).toBeFalse();
  });

  it('da formato a tarjeta y vencimiento mientras se escribe', () => {
    expect(formatearTarjeta('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatearTarjeta('42424')).toBe('4242 4');
    expect(formatearTarjeta('4242-4242-4242-4242-9999')).toBe('4242 4242 4242 4242');
    expect(formatearVencimiento('1')).toBe('1');
    expect(formatearVencimiento('1229')).toBe('12/29');
  });

  it('el vencimiento vale hasta el último día del mes', () => {
    const hoy = new Date(2026, 9, 15); // 15/oct/2026
    expect(vencimientoVigente('10/26', hoy)).toBeTrue();
    expect(vencimientoVigente('09/26', hoy)).toBeFalse();
    expect(vencimientoVigente('12/29', hoy)).toBeTrue();
    expect(vencimientoVigente('13/29', hoy)).toBeFalse();
    expect(vencimientoVigente('1/29', hoy)).toBeFalse();
  });

  it('valida celulares peruanos', () => {
    expect(celularPeruValido('987654321')).toBeTrue();
    expect(celularPeruValido('887654321')).toBeFalse();
    expect(celularPeruValido('98765432')).toBeFalse();
    expect(celularPeruValido('9876543210')).toBeFalse();
  });

  it('guarda solo referencias enmascaradas', () => {
    expect(ultimos4('4242 4242 4242 4242')).toBe('4242');
    expect(enmascararCelular('987654321')).toBe('9XXXXX321');
  });

  it('genera números de operación de 8 dígitos para Yape y Plin', () => {
    expect(numeroOperacion(() => 0.48215937)).toBe('Op. 48215937');
    expect(numeroOperacion(() => 0.000123)).toBe('Op. 00012300');
    expect(numeroOperacion()).toMatch(/^Op\. \d{8}$/);
  });
});
