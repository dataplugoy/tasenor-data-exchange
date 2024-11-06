import React, { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'

interface ConfirmProps {
  open: boolean
  areYouSure?: boolean
  title: string
  children: React.ReactNode
  cancelText?: string
  okText?: string
  onClose: () => void
  onSubmit: () => Promise<void>
}

/**
 * A dialog for running async function after confirmation.
 * @param props
 * @returns
 */
export const Confirm = (props: ConfirmProps): React.JSX.Element => {
  const { children, title, open, areYouSure, onClose, onSubmit } = props
  const { t } = useTranslation()
  const [disabled, setDisabled] = useState(false)

  const cancelText = props.cancelText || t('Cancel')
  const okText = props.okText || t('OK')

  const onOk = async () => {
    try {
      await onSubmit()
      onClose()
    } catch(err) {
      onClose()
      throw err
    }
  }

  return (
    <Dialog open={open} fullWidth>

      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {children}
          {areYouSure && <Box component="span" sx={{ display: 'block', fontWeight: 'bold', fontSize: '110%' }}>
              <Trans>Are You sure?</Trans>
            </Box>
          }
        </DialogContentText>
      </DialogContent>

      <DialogActions>
          <Button disabled={disabled} data-cy="DialogButton-Cancel" variant="outlined" onClick={() => onClose()}>{cancelText}</Button>
          <Button disabled={disabled} data-cy="DialogButton-OK" onClick={onOk}>{okText}</Button>
        </DialogActions>
    </Dialog>
  )
}
