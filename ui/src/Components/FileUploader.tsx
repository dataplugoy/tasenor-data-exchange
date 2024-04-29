import React, { useState } from 'react'
import axios from 'axios'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { UploadFile } from '@mui/icons-material'
import { useApp } from '../Hooks/useApp'

/**
 * Format of the returned file data from the file uploader component.
 */
export type FileUploadData = {
  name: string,
  type: string,
  data: string
}

export type FileUploaderProps = {
  visible: boolean
  title: string
  text: string
  url: string
  onCancel: () => void
}

/**
 * An file uploader utility.
 */
export const FileUploader = (props: FileUploaderProps): React.ReactElement => {
  const { visible, title, text, url } = props
  const [upload, setUpload] = useState<FileUploadData | null>(null)
  const [uploading, setUploading] = useState(false)
  const { t } = useTranslation()
  const app = useApp()

  /**
   * Helper to read a selected file in.
   * @param file
   * @returns
   */
  const readFileFromInput = async (file: File): Promise<ArrayBuffer> => {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = function () { resolve(reader.result as ArrayBuffer) }
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Convert array buffer to hex.
   * @param buffer
   * @returns
   */
  const buf2hex = (buffer) => [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('')

  /**
   * Helper to post process selected files.
   * @param binary
   * @param file
   */
  const collectUploadedFile = (binary: ArrayBuffer, file: File): void => {
    setUpload({
      name: file.name,
      type: file.type,
      data: buf2hex(binary)
    })
  }

  /**
   * Handler of the file selection event for the file input component.
   * @param event
   */
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpload(null)
    if (event.target.files) {
      for (const file of Array.from(event.target.files)) {
        const binary = await readFileFromInput(file as File).catch(function (reason) {
          console.log(`Error during upload ${reason}`)
          return null
        })
        if (binary) {
          collectUploadedFile(binary, file as File)
        }
        event.target.value = ''
      }
    }
  }

  /**
   * Upload handler.
   */
  const onUpload = async () => {
    setUploading(true)
    await axios.post(url, upload).then(resp => {
      setUploading(false)
    }).catch(err => {
      setUploading(false)
      console.error(err)
      app.addError(t('File uploading failed.'))
    })
  }

  /**
   * Cancel dialog.
   */
  const onCancel = () => {
    props.onCancel()
  }

  return (
    <Dialog open={visible} fullWidth>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>

        <DialogContentText sx={{ mb: 2 }}>
          {text}
        </DialogContentText>
        <input id="file-uploader-input" disabled={!visible} type="file" multiple={false} hidden onChange={(e) => onFileChange(e)}/>
        <label htmlFor="file-uploader-input">
        <Button component="span" startIcon={<UploadFile/>}>
          <Trans>Select a File</Trans>
        </Button>
        </label>
        <Box sx={{ mt: 2, color: upload ? 'white' : 'rgba(0,0,0,0.5)' }}>
          <Trans>File Selected:</Trans> {upload ? upload.name : t('No file seleced.')}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" disabled={uploading} onClick={onCancel}><Trans>Cancel</Trans></Button>
        <Button variant="outlined" disabled={!upload || uploading} onClick={onUpload}><Trans>Upload</Trans></Button>
      </DialogActions>
    </Dialog>
  )
}
