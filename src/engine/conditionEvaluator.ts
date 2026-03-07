import type { Condition, ConditionOperand, StoryState } from '../types/story';

function resolveOperand(operand: ConditionOperand, state: StoryState): string | number | boolean {
  if (typeof operand === 'string' && operand.startsWith('$')) {
    const key = operand.slice(1);
    const val = state[key];
    if (val === undefined) {
      console.warn(`[conditionEvaluator] Unknown state variable: "${key}"`);
      return 0;
    }
    return val;
  }
  return operand;
}

export function evaluateCondition(condition: Condition | null, state: StoryState): boolean {
  if (condition === null) return true;

  if ('>' in condition) {
    const [a, b] = condition['>'];
    return (resolveOperand(a, state) as number) > (resolveOperand(b, state) as number);
  }
  if ('>=' in condition) {
    const [a, b] = condition['>='];
    return (resolveOperand(a, state) as number) >= (resolveOperand(b, state) as number);
  }
  if ('<' in condition) {
    const [a, b] = condition['<'];
    return (resolveOperand(a, state) as number) < (resolveOperand(b, state) as number);
  }
  if ('<=' in condition) {
    const [a, b] = condition['<='];
    return (resolveOperand(a, state) as number) <= (resolveOperand(b, state) as number);
  }
  if ('==' in condition) {
    const [a, b] = condition['=='];
    return resolveOperand(a, state) === resolveOperand(b, state);
  }
  if ('!=' in condition) {
    const [a, b] = condition['!='];
    return resolveOperand(a, state) !== resolveOperand(b, state);
  }
  if ('and' in condition) {
    return condition['and'].every((c) => evaluateCondition(c, state));
  }
  if ('or' in condition) {
    return condition['or'].some((c) => evaluateCondition(c, state));
  }
  if ('not' in condition) {
    return !evaluateCondition(condition['not'], state);
  }

  console.warn('[conditionEvaluator] Unknown condition operator:', condition);
  return false;
}
