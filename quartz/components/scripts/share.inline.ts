document.addEventListener("nav", () => {
  const container = document.querySelector(".share-buttons") as HTMLElement | null
  if (!container) return

  const title = container.dataset.title ?? document.title
  const description = container.dataset.description ?? ""
  const url = window.location.href

  // Template: tiêu đề + excerpt + link
  const shareText = description
    ? `${title}\n\n${description}\n\n${url}`
    : `${title}\n\n${url}`

  const xBtn = container.querySelector(".share-x")
  xBtn?.addEventListener("click", () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    )
  })

  const threadsBtn = container.querySelector(".share-threads")
  threadsBtn?.addEventListener("click", () => {
    window.open(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    )
  })

  const linkedinBtn = container.querySelector(".share-linkedin")
  linkedinBtn?.addEventListener("click", () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    )
  })
})
