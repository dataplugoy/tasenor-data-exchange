import dot from 'dot-object'
import React, { useEffect, useState } from 'react'
import { UIAlert } from '../Types/Classes/UIAlert'
import { FileUploader } from './FileUploader'
import { useTranslation } from 'react-i18next'
import { Question } from '../Types/API/Question'
import { QuestionsPanel } from './QuestionsPanel'
import { usePATCH } from '../Hooks/useNet'
import { useApp } from '../Hooks/useApp'
import { FlowPlanRunResponse } from '../Types/API/flow-plans/FlowPlanRunResponse'

interface AlertHandlerProps {
  alert: UIAlert
  onCancel: () => void
  onSuccess: (resp: FlowPlanRunResponse) => void
}

export const AlertHandler = (props: AlertHandlerProps): React.JSX.Element => {
  const { alert, onCancel, onSuccess } = props
  const { type } = alert
  const [text, setText] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const { t } = useTranslation()
  const PATCH = usePATCH<FlowPlanRunResponse>()
  const app = useApp()

  useEffect(() => {
    switch (alert.type) {
      case 'UPLOAD_REQUIRED':
        setText(alert.payload)
        setUploadUrl(alert.url)
        break

      case 'ANSWERS_REQUIRED':
        setQuestions(JSON.parse(alert.payload))
        break

      default:
        throw new Error(`Alert ${alert.type} is not yet handled.`)
    }
  }, [alert])

  const onUploadCancel = async () => {
    setText('')
    onCancel()
  }

  const onUploadSuccess = async (resp) => {
    setText('')
    onSuccess(resp)
  }

  const onEditCancel = () => {
    setQuestions([])
    onCancel()
  }

  const onEditSave = (answers: Record<string, unknown>) => {
    // Merge dotted notations to structure first.
    Object.keys(answers).filter(k => k.indexOf('.') > 0).forEach(k => {
      const newValues = answers[k]
      delete answers[k]
      dot.copy('this', k, { this: newValues }, answers)
    })

    // Block the UI while the run continues so that no other run can be started meanwhile.
    app.setDimming(true)
    PATCH(alert.url, answers as Record<string, unknown>).then((res) => {
      app.setDimming(false)
      if (res) {
        setQuestions([])
        props.onSuccess(res)
      }
    })
  }

  return (
    <>
      {type === 'UPLOAD_REQUIRED' &&
        <FileUploader onCancel={onUploadCancel} onSuccess={onUploadSuccess} visible={!!text} text={text} url={uploadUrl} title={t('Upload a File')}/>
      }
      {type === 'ANSWERS_REQUIRED' &&
        <QuestionsPanel questions={questions} onCancel={onEditCancel} onSave={onEditSave}/>
      }
    </>
  )
}
