import { RuleVariables, RulesEngine, debug, error } from '@tasenor/common'
import { RuleModel } from '../models/RuleModel'

/**
 * Get a set of variables and apply the first matching rule and get the result.
 * @param variables
 * @param rules
 * @param key
 * @returns
 */
export function applyRules(variables: Record<string, unknown>, rules: Record<string, RuleModel[]>, key: string | null): undefined | unknown {
  const engine = new RulesEngine(variables as RuleVariables)
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
        return evaluate(rule.result)
      }
    }
  }

  if (key !== null) {
    const result = applyRuleKey(key)
    if (result !== undefined) {
      return result
    }
  }

  for (const k of unusedKeys) {
    const result = applyRuleKey(k)
    if (result !== undefined) {
      return result
    }
  }

  throw new Error(`No rules matching for variables ${JSON.stringify(variables)}`)
}
