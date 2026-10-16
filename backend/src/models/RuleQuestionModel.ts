import prisma from '@prisma/client'
import { BaseModel } from './BaseModel'
import { ACCOUNT_PATTERN, MappingError } from '../lib/mapping'
import { SaveRuleQuestionRequest } from '../types/API/projects/SaveRuleQuestionRequest'
import { RuleQuestionOption } from '../types/API/RuleQuestionOption'
import { MappingResultView } from '../types/API/MappingResultView'

export class RuleQuestionModel extends BaseModel<prisma.RuleQuestion> {

  static table = 'ruleQuestion'
  static construct = RuleQuestionModel

  get name(): string {
    return this.data.name
  }

  get kind(): prisma.RuleQuestionKind {
    return this.data.kind
  }

  get options(): RuleQuestionOption[] {
    return this.data.options as unknown as RuleQuestionOption[]
  }

  /**
   * Get the questions of the project ordered by label.
   */
  static async findForProject(projectId: number): Promise<RuleQuestionModel[]> {
    return this.findMany<prisma.RuleQuestion, RuleQuestionModel>({ projectId }, [{ label: 'asc' }, { id: 'asc' }])
  }

  /**
   * Get the questions of the project of the flow plan by ID.
   */
  static async findForFlowPlan(flowPlanId: number): Promise<Record<number, RuleQuestionModel>> {
    const flow = await BaseModel.prismaClient.flowPlan.findUnique({ where: { id: flowPlanId }, select: { projectId: true } })
    const questions = flow ? await this.findForProject(flow.projectId) : []
    return questions.reduce((prev, cur) => ({ ...prev, [cur.id]: cur }), {})
  }

  /**
   * Convert a saving request to question data.
   * @throws MappingError if the question is invalid.
   */
  static fromRequest(body: SaveRuleQuestionRequest): Partial<prisma.RuleQuestion> {
    const options = body.options || []
    if (body.kind === 'TEXT') {
      if (options.length) {
        throw new MappingError('A text question cannot have options.')
      }
    } else {
      if (!options.length) {
        throw new MappingError('The question needs at least one option.')
      }
      for (const option of options) {
        if (body.kind === 'TAGS' && !(option.tags && option.tags.length)) {
          throw new MappingError(`Option '${option.label}' needs at least one tag.`)
        }
        if (body.kind === 'ACCOUNT' && !ACCOUNT_PATTERN.test(option.account || '')) {
          throw new MappingError(`Option '${option.label}' needs an account, got ${JSON.stringify(option.account || '')}.`)
        }
      }
    }
    return {
      name: body.name,
      kind: body.kind,
      label: body.label,
      options: options.map(o => body.kind === 'TAGS' ? { label: o.label, tags: o.tags } : { label: o.label, account: o.account }) as unknown as prisma.Prisma.JsonArray,
    }
  }

  /**
   * Get the names of the rules of the project using each question.
   */
  static async usage(projectId: number): Promise<Record<number, string[]>> {
    const rules = await BaseModel.prismaClient.rule.findMany({ where: { flowPlan: { projectId } }, select: { name: true, resultView: true } })
    const usage: Record<number, string[]> = {}
    for (const rule of rules) {
      for (const id of (rule.resultView as unknown as MappingResultView)?.ask || []) {
        usage[id] = usage[id] || []
        usage[id].push(rule.name)
      }
    }
    return usage
  }

  /**
   * Check that the questions asked by a rule belong to the project of the flow plan.
   * @throws MappingError if not.
   */
  static async checkAsk(flowPlanId: number, view: MappingResultView | undefined): Promise<void> {
    const ask = view?.ask || []
    if (!ask.length) {
      return
    }
    const questions = await this.findForFlowPlan(flowPlanId)
    for (const id of ask) {
      if (!questions[id]) {
        throw new MappingError(`Question #${id} does not exist in the project.`)
      }
    }
    if (new Set(ask).size !== ask.length) {
      throw new MappingError('The same question is asked twice.')
    }
    const accountQuestions = ask.filter(id => questions[id].kind === 'ACCOUNT').length
    if (accountQuestions > 1) {
      throw new MappingError('A rule can ask only one account question.')
    }
    if (!accountQuestions && !view?.account && ['expense', 'income', 'tax'].includes(view?.action || '')) {
      throw new MappingError(`Invalid account "" for action '${view?.action}'.`)
    }
  }
}
