export const MIN_STEPS = 32;
export const MAX_STEPS = 64;

export function getStepsOnSampler(sampler: string) {
  //64 is the most optimal and not 50 for the other samplers, reduce to 50 if queue times start to be an issue
  return sampler === "k_euler_a" ||
    sampler === "k_euler" ||
    sampler === "ddim" ||
    sampler === "k_dpm_2" ||
    sampler === "k_dpm_2_a"
    ? MIN_STEPS
    : MAX_STEPS;
}

export function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getCFGOnSampler(sampler: string) {
  return sampler === "k_euler_a" ||
    sampler === "k_euler" ||
    sampler === "ddim" ||
    sampler === "k_dpm_2" ||
    sampler === "k_dpm_2_a"
    ? 15
    : 8;
}
