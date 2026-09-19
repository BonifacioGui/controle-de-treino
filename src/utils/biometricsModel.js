import { parseDecimalInput } from './numberUtils';

export const calculateBmi = (weight, heightCentimeters) => {
  const parsedWeight = parseDecimalInput(weight);
  const parsedHeight = parseDecimalInput(heightCentimeters);
  if (parsedWeight === null || parsedWeight <= 0 || parsedHeight === null || parsedHeight <= 0) return null;

  const heightMeters = parsedHeight / 100;
  return parsedWeight / (heightMeters * heightMeters);
};

export const calculateWaistHipRatio = (waist, hip) => {
  const parsedWaist = parseDecimalInput(waist);
  const parsedHip = parseDecimalInput(hip);
  if (parsedWaist === null || parsedWaist <= 0 || parsedHip === null || parsedHip <= 0) return null;
  return parsedWaist / parsedHip;
};

export const formatBiometricValue = (value, fractionDigits) => {
  const parsedValue = parseDecimalInput(value);
  if (parsedValue === null) return '--';
  return parsedValue.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};
