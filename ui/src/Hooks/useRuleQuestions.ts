import { useEffect, useState } from 'react'
import { useGET } from './useNet'
import { RuleQuestionsResponse } from '../Types/API/projects/RuleQuestionsResponse'

/**
 * Load the rule questions of a project.
 * @returns The questions and a function to load them again.
 */
export function useRuleQuestions(projectId: number | null | undefined): [RuleQuestionsResponse, () => void] {
  const GET = useGET<RuleQuestionsResponse>()
  const [questions, setQuestions] = useState<RuleQuestionsResponse>([])

  const load = () => {
    if (projectId) {
      GET(`/projects/${projectId}/questions`).then(res => res && setQuestions(res))
    }
  }

  useEffect(load, [projectId])

  return [questions, load]
}
