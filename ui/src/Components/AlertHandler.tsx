import React, { useEffect, useState } from 'react'
import { UIAlert } from '../Types/Classes/UIAlert'
import { FileUploader } from './FileUploader'
import { useTranslation } from 'react-i18next'
import { signalBatchUpdate } from '../Signals/updates'
import { Question } from '../Types/API/Question'
import { QuestionsPanel } from './QuestionsPanel'

interface AlertHandlerProps {
  alert: UIAlert
}

export const AlertHandler = (props: AlertHandlerProps): React.JSX.Element => {
  const { alert } = props
  const { type } = alert
  const [text, setText] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const { t } = useTranslation()

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
  }, [])

  const onUploadCancel = async () => {
    setText('')
    signalBatchUpdate()
  }

  const onUploadSuccess = async () => {
    setText('')
    signalBatchUpdate()
  }

  return (
    <>
      {type === 'UPLOAD_REQUIRED' &&
        <FileUploader onCancel={onUploadCancel} onSuccess={onUploadSuccess} visible={!!text} text={text} url={uploadUrl} title={t('Upload a File')}/>
      }
      {type === 'ANSWERS_REQUIRED' &&
        <QuestionsPanel questions={questions}/>
      }
    </>
  )
}
