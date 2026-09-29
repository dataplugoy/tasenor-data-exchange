import { RuleVariables, RulesEngine, debug, error } from '@tasenor/common'
import { RuleModel } from '../models/RuleModel'
import { RULE_HELPERS } from './mapping'

/**
 * An error thrown when none of the rules match.
 */
export class NoMatchingRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NoMatchingRuleError'
  }
}

/**
 * Evaluate one rule for the variables.
 * @returns The result if the filter matches, otherwise undefined.
 */
export function evaluateRule<T>(variables: Record<string, unknown>, rule: { filter: unknown, result: unknown }): T | undefined {
  const engine = new RulesEngine({ ...RULE_HELPERS, ...variables } as unknown as RuleVariables)
  if (!engine.eval(rule.filter as string)) {
    return undefined
  }
  return engine.eval(rule.result as string) as T
}

/**
 * Check if the filter of a rule matches the variables.
 */
export function ruleMatches(variables: Record<string, unknown>, filter: unknown): boolean {
  const engine = new RulesEngine({ ...RULE_HELPERS, ...variables } as unknown as RuleVariables)
  return !!engine.eval(filter as string)
}

/**
 * Get a set of variables and apply the first matching rule and get the result.
 * @param variables
 * @param rules
 * @param key
 * @param onMatch Called with the rule that matched.
 * @returns
 */
export function applyRules<T>(variables: Record<string, unknown>, rules: Record<string, RuleModel[]>, key: string | null, onMatch: ((rule: RuleModel) => void) | null = null): T {
  const engine = new RulesEngine({ ...RULE_HELPERS, ...variables } as unknown as RuleVariables)
  const unusedKeys = new Set(Object.keys(rules))

  function evaluate(expr): unknown {
    // Object is supported by Tasenor common but to get failing part, do it in pieces.
    if (typeof expr === 'object' && expr !== null) {
      const ret: Record<string, unknown> = {
      }
      Object.keys(expr).forEach(k => {
        ret[k] = evaluate(expr[k])
      })
      return ret
    }

    try {
      debug('RULES', `Evaluating expr: ${expr}`)
      const out = engine.eval(expr)
      debug('RULES', '=>', out)
      return out
    } catch (err) {
      error(`Evaluation of expression ${JSON.stringify(expr)} failed: ${err}`)
      throw err
    }
  }

  function applyRuleKey(key: string) {
    unusedKeys.delete(key)
    for (const rule of rules[key] || []) {
      if (evaluate(rule.filter)) {
        const result = evaluate(rule.result)
        if (onMatch) {
          onMatch(rule)
        }
        return result
      }
    }
  }

  if (key) {
    const result = applyRuleKey(key)
    if (result !== undefined) {
      return result as T
    }
  }

  if (rules['']) {
    const result = applyRuleKey('')
    if (result !== undefined) {
      return result as T
    }
  }

  for (const k of unusedKeys) {
    const result = applyRuleKey(k)
    if (result !== undefined) {
      return result as T
    }
  }

  throw new NoMatchingRuleError(`No rules matching for variables ${JSON.stringify(variables)}`)
}
