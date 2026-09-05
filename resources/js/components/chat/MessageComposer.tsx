import { isCancel } from "axios"
import type { FilePondFile } from "filepond"
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size"
import { Paperclip, Send } from "lucide-react"
import { useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { FilePond, registerPlugin } from "react-filepond"
import FilePondController from "@/actions/App/Http/Controllers/FilePondController"
import { Button } from "@/components/ui/button"
import Axios from "@/lib/axios"
import toast from "@/lib/toast"
import { useSendMessage } from "@/queries/chat"

import "filepond/dist/filepond.min.css"

registerPlugin(FilePondPluginFileValidateSize)

type Props = {
	conversationId: string
	onTyping?: () => void
}

export default function MessageComposer({ conversationId, onTyping }: Props) {
	const [body, setBody] = useState("")
	const [attachmentIds, setAttachmentIds] = useState<Record<string, number>>({})
	const [pendingUploads, setPendingUploads] = useState(0)
	const [showAttachments, setShowAttachments] = useState(false)
	const pondRef = useRef<FilePond>(null)
	const sendMessage = useSendMessage(conversationId)

	const isUploading = pendingUploads > 0
	const canSend = (body.trim() !== "" || Object.keys(attachmentIds).length > 0) && !isUploading

	function resetForm() {
		setBody("")
		setAttachmentIds({})
		setShowAttachments(false)
		pondRef.current?.removeFiles()
	}

	function handleSend() {
		if (!canSend || sendMessage.isPending) {
			return
		}

		sendMessage.mutate(
			{
				body: body.trim() || undefined,
				temporaryUploadIds: Object.values(attachmentIds),
			},
			{
				onSuccess: resetForm,
				onError: () => toast.error("Couldn't send the message"),
			}
		)
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault()
			handleSend()
		}
	}

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-3 pb-3 md:absolute">
			<div className="bg-card pointer-events-auto flex flex-col gap-2 rounded-4xl border p-1 shadow-lg backdrop-blur supports-backdrop-filter:bg-card/95">
				{showAttachments && (
					<FilePond
						ref={pondRef}
						name="filepond-chat-attachments"
						allowMultiple
						maxFileSize="25MB"
						credits={false}
						labelIdle='<span class="filepond--label-action">Attach files</span> or drag and drop'
						server={{
							process: (
								fieldName,
								file,
								_metadata,
								load,
								error,
								progress,
								abort
							) => {
								const controller = new AbortController()
								const formData = new FormData()
								formData.append(fieldName, file, file.name)

								Axios.post(FilePondController.storeChatAttachment.url(), formData, {
									signal: controller.signal,
									onUploadProgress: (event) => {
										if (event.total) {
											progress(true, event.loaded, event.total)
										}
									},
								})
									.then((response) => load(String(response.data)))
									.catch((requestError) => {
										if (isCancel(requestError)) {
											return
										}
										error("Upload failed")
									})

								return {
									abort: () => {
										controller.abort()
										abort()
									},
								}
							},
							revert: (uniqueFileId, load, error) => {
								Axios.delete(FilePondController.destroyChatAttachment.url(uniqueFileId))
									.then(() => load())
									.catch(() => error("Could not remove attachment"))
							},
						}}
						onprocessfilestart={() => setPendingUploads((count) => count + 1)}
						onprocessfile={(err, file: FilePondFile) => {
							setPendingUploads((count) => Math.max(0, count - 1))
							if (!err) {
								setAttachmentIds((prev) => ({
									...prev,
									[file.id]: Number(file.serverId),
								}))
							}
						}}
						onprocessfileabort={() =>
							setPendingUploads((count) => Math.max(0, count - 1))
						}
						onremovefile={(_err, file: FilePondFile) => {
							setAttachmentIds((prev) => {
								const next = { ...prev }
								delete next[file.id]
								return next
							})
						}}
					/>
				)}

				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label="Attach files"
						title="Attach files"
						onClick={() => setShowAttachments((value) => !value)}>
						<Paperclip className="size-5" />
					</Button>

					<textarea
						value={body}
						onChange={(event) => {
							setBody(event.target.value)
							onTyping?.()
						}}
						onKeyDown={handleKeyDown}
						placeholder="Type a message"
						rows={1}
						className="max-h-32 flex-1 resize-none rounded-full p-1 text-sm outline-none focus:bg-background"
					/>

					<Button
						type="button"
						size="icon"
						aria-label="Send"
						title="Send"
						className="rounded-full"
						disabled={!canSend || sendMessage.isPending}
						onClick={handleSend}>
						<Send className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
