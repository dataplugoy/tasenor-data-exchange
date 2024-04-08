import { RuleVariables, RulesEngine } from '@tasenor/common'
import { RuleModel } from '../models/RuleModel'

// TODO: Debug mode to print every step.

export function applyRules(variables: Record<string, unknown>, rules: Record<string, RuleModel[]>, key: string | null): undefined | unknown {
  const engine = new RulesEngine(variables as RuleVariables)
  const unusedKeys = new Set(Object.keys(rules))

  let output = undefined

  function applyRuleKey(key: string) {
    unusedKeys.delete(key)
    for (const rule of rules[key] || []) {
      if (engine.eval(rule.filter)) {
        return engine.eval(rule.result)
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
