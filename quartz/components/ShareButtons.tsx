import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/share.inline"
import style from "./styles/share.scss"

const ShareButtons: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title ?? fileData.slug ?? ""
  const description = fileData.description?.trim() ?? ""

  return (
    <div
      class={`share-buttons ${displayClass ?? ""}`}
      data-title={title}
      data-description={description}
    >
      <i class="fa-solid fa-share-nodes share-label"></i>
      <div class="share-icons">
        <button class="share-btn share-x" aria-label="Chia sẻ lên X">
          <i class="fa-brands fa-x-twitter"></i>
        </button>
        <button class="share-btn share-threads" aria-label="Chia sẻ lên Threads">
          <i class="fa-brands fa-threads"></i>
        </button>
        <button class="share-btn share-linkedin" aria-label="Chia sẻ lên LinkedIn">
          <i class="fa-brands fa-linkedin"></i>
        </button>
      </div>
    </div>
  )
}

ShareButtons.css = style
ShareButtons.afterDOMLoaded = script

export default (() => ShareButtons) satisfies QuartzComponentConstructor
